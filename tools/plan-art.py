"""스크롤 장면 마지막에 열리는 조감 평면도 그림(site/assets/img/plan-top.svg)을 만듭니다.
실제 조감 렌더링 이미지를 받기 전까지 쓰는 흑백 자리 그림입니다.
실행: python3 tools/plan-art.py
"""
import math
import random
from pathlib import Path

W, H = 2400, 1500
rnd = random.Random(11)
out = []


def rect(x, y, w, h, fill, stroke="#8C8A85", sw=1.2):
    out.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')


out.append(f'<rect width="{W}" height="{H}" fill="#E4E2DC"/>')
# 가로·세로 도로로 나뉜 가구
xs = [0, 420, 760, 1180, 1560, 1960, W]
ys = [0, 360, 700, 1080, H]
road = 46
for i in range(len(xs) - 1):
    for j in range(len(ys) - 1):
        x0, x1 = xs[i] + road / 2, xs[i + 1] - road / 2
        y0, y1 = ys[j] + road / 2, ys[j + 1] - road / 2
        if i == 2 and j == 1:
            # 가운데 광장: 바닥 포장 줄눈 + 나무
            rect(x0, y0, x1 - x0, y1 - y0, "#EFEEEA")
            for gx in range(int(x0) + 24, int(x1), 24):
                out.append(f'<path d="M{gx} {y0:.0f}V{y1:.0f}" stroke="#D3D1CB" stroke-width="1"/>')
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            out.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="70" fill="#D9D8D3" stroke="#8C8A85" stroke-width="1.2"/>')
            for a in range(10):
                t = a / 10 * math.tau
                out.append(f'<circle cx="{cx + math.cos(t) * 150:.0f}" cy="{cy + math.sin(t) * 120:.0f}" r="22" fill="#B9B8B2" stroke="#7E7C77" stroke-width="1"/>')
            continue
        rect(x0, y0, x1 - x0, y1 - y0, "#ECEBE6")
        # 가구 안 건물들
        y = y0 + 20
        while y < y1 - 60:
            h = rnd.choice((70, 90, 120))
            x = x0 + 20
            while x < x1 - 60:
                w = rnd.choice((80, 110, 140, 170))
                w = min(w, x1 - 20 - x)
                hh = min(h, y1 - 20 - y)
                if w > 40 and hh > 40:
                    tone = rnd.choice(("#D2D0CA", "#C8C6BF", "#DCDAD4", "#F2F1ED"))
                    rect(x, y, w, hh, tone, "#77756F", 1.2)
                x += w + 14
            y += h + 14
        # 가로수
        for tx in range(int(x0) + 30, int(x1) - 10, 60):
            out.append(f'<circle cx="{tx}" cy="{y1 + road / 2:.0f}" r="13" fill="#B2B1AB" stroke="#7E7C77" stroke-width="1"/>')
# 강변 녹지
out.append(f'<path d="M0 {H - 120} C 600 {H - 200}, 1200 {H - 40}, {W} {H - 150} V{H} H0 Z" fill="#CFCEC8" stroke="#8C8A85" stroke-width="1.2"/>')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">\n' + "\n".join(out) + "\n</svg>\n"
p = Path(__file__).resolve().parent.parent / "site/assets/img/plan-top.svg"
p.write_text(svg, encoding="utf-8")
print(p, len(svg), "bytes")
