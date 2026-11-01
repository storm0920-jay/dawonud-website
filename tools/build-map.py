# 서울·여의도 스크롤 지도 데이터 만들기
# 원본: 서울 25개 구 경계(southkorea/seoul-maps, KOSTAT 2013),
#       한강·공원·도로·건물(Overture Maps 2026-10-21, OpenStreetMap 기반)
# 받는 법은 tools/fetch-overture.py 참고. 결과: site/data/seoul-map.js
import json, math, sys
import pyarrow.parquet as pq, shapely
from shapely.geometry import shape, Point, box
from shapely.ops import unary_union, nearest_points

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/geo"
OUT = sys.argv[2] if len(sys.argv) > 2 else "site/data/seoul-map.js"

LON0, LAT0 = 126.76, 37.71                    # 지도 왼쪽 위
KX = 111320 * math.cos(math.radians(37.56))   # 경도 1도 = m
KY = 110574                                   # 위도 1도 = m
OFFICE = (126.92658, 37.52344)
RIVER_LABEL = (126.995, 37.516)                # 한강 글자 자리(반포 앞 강 위)                # 여의나루로 67 신송빌딩 (Overture places 2곳 일치)

def proj(g):
    return shapely.transform(g, lambda a: (a - [[LON0, LAT0]]) * [[KX, -KY]])

def load(name):
    rows = pq.read_table(f"{SRC}/ov/{name}.parquet").to_pylist()
    for r in rows: r["g"] = proj(shapely.from_wkb(r["geometry"]))
    return rows

def polys(g):
    if g.is_empty: return []
    if g.geom_type == "Polygon": return [g]
    if g.geom_type == "MultiPolygon": return list(g.geoms)
    if g.geom_type == "GeometryCollection": return [p for x in g.geoms for p in polys(x)]
    return []

def path(g, tol, minarea=0):
    out = []
    for p in polys(g.simplify(tol, preserve_topology=True)):
        if p.area < minarea: continue
        for ring in [p.exterior, *p.interiors]:
            pts = [(round(x), round(y)) for x, y in ring.coords[:-1]]
            ded = [pts[0]] + [q for i, q in enumerate(pts[1:]) if q != pts[i]]
            if len(ded) < 3: continue
            s = f"M{ded[0][0]} {ded[0][1]}l"
            s += " ".join(f"{b[0]-a[0]} {b[1]-a[1]}" for a, b in zip(ded, ded[1:]))
            out.append(s + "z")
    return "".join(out)

# 서울 경계
gu = [shape(f["geometry"]) for f in json.load(open(f"{SRC}/kostat_2013_json_seoul_municipalities_geo.json"))["features"]]
seoul = proj(unary_union(gu)).buffer(0)

# 물: 면적 있는 것만, 서울 안으로 자름
water = unary_union([r["g"] for r in load("water") if r["g"].geom_type in ("Polygon", "MultiPolygon") and r["g"].area > 3000]).buffer(0)
water = water.intersection(seoul)
han = unary_union([p for p in polys(water) if p.area > 2e6])            # 한강 본류
streams = unary_union([p for p in polys(water) if p.area <= 2e6 and p.area > 2e4])

land = seoul.difference(water)

# 여의도 섬: 한강 사이에서 가장 큰 땅 조각 중 사무실을 품은 것
# 법정동 여의도동 경계(JUSO 2015) 안의 땅 = 섬 (경계가 한강 가운데와 샛강을 따라감)
yd = [shape(f["geometry"]) for f in json.load(open(f"{SRC}/juso_2015_json_seoul_neighborhoods_geo.json"))["features"] if f["properties"]["EMD_KOR_NM"] == "여의도동"]
yeo = sorted(polys(proj(unary_union(yd)).buffer(0).intersection(land)), key=lambda p: -p.area)[:1]   # 밤섬 제외, 본섬만
# 샛강(가는 물길)은 섬과 영등포 본토를 나누므로, 위 결과가 본토까지 이어지면 사각 범위로 제한
island = unary_union(yeo) if yeo else None
ox, oy = proj(Point(*OFFICE)).x, proj(Point(*OFFICE)).y
core_zone = box(ox - 2600, oy - 1700, ox + 1900, oy + 1500)
core = land.intersection(island if island is not None and island.area < 1.2e7 else core_zone).intersection(core_zone)

roads = load("roads")
W = {"motorway": 34, "trunk": 28, "primary": 22, "secondary": 16, "tertiary": 12,
     "residential": 7, "living_street": 6, "unclassified": 7}
def gaps(classes, scale=1):
    return unary_union([r["g"].buffer(W[r["class"]] * scale / 2, cap_style="flat", resolution=2)
                        for r in roads if r["subtype"] == "road" and r["class"] in classes and r["g"].geom_type.endswith("LineString")])

major = gaps({"motorway", "trunk", "primary", "secondary"})
blocks_all = land.difference(major).difference(core.buffer(1))
fine = gaps({"motorway", "trunk", "primary", "secondary", "tertiary", "residential", "living_street", "unclassified"})
core_blocks = core.difference(fine)

lu = load("landuse")
parks_all = unary_union([r["g"] for r in lu if r["subtype"] == "park" and r["g"].geom_type.endswith("Polygon") and r["g"].area > 6e4]).buffer(0)
parks_core = unary_union([r["g"] for r in lu if r["subtype"] == "park" and r["g"].geom_type.endswith("Polygon")]).buffer(0).intersection(core)
parks = unary_union([parks_all.intersection(land), parks_core]).buffer(0)

bl = load("bldg")
op = proj(Point(*OFFICE))
office = min((r["g"] for r in bl if r["g"].geom_type.endswith("Polygon")), key=lambda g: g.distance(op))

minx, miny, maxx, maxy = seoul.bounds
data = {
    "src": "Seoul districts: KOSTAT 2013 via southkorea/seoul-maps. Water, parks, roads, buildings: Overture Maps 2026-10-21 (© OpenStreetMap contributors).",
    "bounds": [round(minx), round(miny), round(maxx), round(maxy)],
    "yeouido": [round(v) for v in core.bounds],
    "yeoLabel": [round(v) for v in core.representative_point().coords[0]] if core.is_empty else [round(v) for v in core.centroid.coords[0]],
    "office": [round(office.centroid.x), round(office.centroid.y)],
    "river": [round(v) for v in nearest_points(han, proj(Point(*RIVER_LABEL)))[0].coords[0]],
    "seoul": path(seoul, 25),
    "blocks": path(blocks_all, 12, 1500),
    "core": path(core_blocks, 2, 60),
    "parks": path(parks, 6, 800),
    "han": path(han, 8),
    "streams": path(streams, 6, 3000),
    "officeShape": path(office, 0.5),
}
js = "/* 자동 생성: tools/build-map.py. 직접 고치지 말 것 */\nwindow.SEOUL_MAP=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(OUT, "w").write(js)
print("island", island.area if island is not None else None)
print("bytes", len(js), {k: len(v) for k, v in data.items() if isinstance(v, str)})
