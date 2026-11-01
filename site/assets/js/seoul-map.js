/* 상자 장면 마지막, 우물 바닥에 놓인 서울 지도 (data/seoul-map.js, tools/build-map.py로 생성)
   window.SeoulMap.draw(t): t 0 = 서울 전체(여의도를 가운데에), .55 = 여의도, 1 = 사무실 자리에 초점.
   글자·회사 이름은 넣지 않고, 사무실 건물만 주황으로 채워 시선이 모이게 함. 호출은 assets/js/journey.js */
(function () {
  const M = window.SEOUL_MAP;
  const cv = document.querySelector(".j-map");
  if (!M || !cv) return;
  const ctx = cv.getContext("2d"), host = cv.parentElement;

  const P = {};
  for (const k of ["seoul", "blocks", "core", "parks", "han", "streams", "officeShape"]) P[k] = new Path2D(M[k]);

  let col = {};
  function readColors() {
    const s = getComputedStyle(host), g = n => s.getPropertyValue(n).trim();
    col = { bg: g("--map-bg"), block: g("--map-block"), core: g("--map-core"), water: g("--map-water"),
            park: g("--map-park"), parkBg: g("--map-park-bg"), line: g("--map-line"), point: g("--map-point") };
  }

  let W = 0, H = 0, dpr = 1, cams = null, last = 0;
  const yeoC = [(M.yeouido[0] + M.yeouido[2]) / 2, (M.yeouido[1] + M.yeouido[3]) / 2];
  function fit(b, fx, fy) { return Math.min(W * fx / (b[2] - b[0]), H * fy / (b[3] - b[1])); }
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const narrow = W < 700;
    cams = [
      { x: yeoC[0], y: yeoC[1], s: fit(M.bounds, narrow ? 1.6 : 1.15, narrow ? 1.2 : 1.15) },   // 서울 전체, 여의도가 화면 가운데
      { x: yeoC[0], y: yeoC[1], s: fit(M.yeouido, narrow ? .96 : .7, narrow ? .55 : .72) },     // 여의도
      { x: M.office[0], y: M.office[1], s: Math.min(W / (narrow ? 1100 : 2300), H / 1500) },     // 사무실 자리
    ];
    readColors();
  }

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const seg = (p, a, b) => ease(clamp((p - a) / (b - a)));
  function between(a, b, t) {   // 배율은 비율로, 중심은 1/배율에 맞춰 움직여 미끄러지지 않게
    const s = a.s * Math.pow(b.s / a.s, t);
    const u = a.s === b.s ? t : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, s };
  }

  function draw(t) {
    last = t;
    if (!cams || cv.clientWidth !== W || cv.clientHeight !== H) layout();
    if (!cams) return;
    const c = t < .55 ? between(cams[0], cams[1], seg(t, 0, .55)) : between(cams[1], cams[2], seg(t, .55, .92));
    const k = c.s * dpr, tx = W * dpr / 2 - c.x * k, ty = H * dpr / 2 - c.y * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = col.bg; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(k, 0, 0, k, tx, ty);
    ctx.globalAlpha = 1 - .5 * seg(t, .15, .55);          // 여의도로 들어갈수록 주변이 연해짐
    ctx.fillStyle = col.block; ctx.fill(P.blocks);
    ctx.globalAlpha = 1;
    ctx.fillStyle = col.water; ctx.fill(P.han); ctx.fill(P.streams);
    ctx.fillStyle = col.core; ctx.fill(P.core);
    ctx.save();                                           // 공원: 화면 기준 사선(확대해도 간격 그대로)
    ctx.fillStyle = col.parkBg; ctx.fill(P.parks); ctx.clip(P.parks);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = col.park; ctx.lineWidth = 1.1 * dpr;
    ctx.beginPath();
    for (let x = -cv.height; x < cv.width; x += 7 * dpr) { ctx.moveTo(x, cv.height); ctx.lineTo(x + cv.height, 0); }
    ctx.stroke(); ctx.restore();
    ctx.setTransform(k, 0, 0, k, tx, ty);
    const f = seg(t, .6, .88);                            // 사무실 건물만 주황으로
    if (f > 0) { ctx.globalAlpha = f; ctx.fillStyle = col.point; ctx.fill(P.officeShape); ctx.globalAlpha = 1; }
    ctx.lineWidth = dpr / k; ctx.strokeStyle = col.line; ctx.stroke(P.seoul);
  }

  window.SeoulMap = { draw };
  addEventListener("resize", () => { cams = null; draw(last); });
  new MutationObserver(() => { readColors(); draw(last); }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
})();
