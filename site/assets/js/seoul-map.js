/* 서울 → 여의도 → 사무실 스크롤 지도 (작업지시서 5장)
   데이터: data/seoul-map.js (tools/build-map.py로 생성)
   0~30% 서울 전체, 30~70% 한강 따라 여의도로, 70~90% 사무실 초점, 90~100% 멈춤. 스크롤에 1:1로 연동, 위로 올리면 되돌아감. */
(function () {
  const sec = document.getElementById("location");
  const M = window.SEOUL_MAP;
  if (!sec || !M) return;
  const cv = sec.querySelector("canvas"), ctx = cv.getContext("2d");
  const tags = { han: sec.querySelector(".smap-han"), yeo: sec.querySelector(".smap-yeo"), office: sec.querySelector(".smap-office") };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm) sec.classList.add("calm");

  const P = {};
  for (const k of ["seoul", "blocks", "core", "parks", "han", "streams", "officeShape"]) P[k] = new Path2D(M[k]);

  let col = {};
  function readColors() {
    const s = getComputedStyle(sec), g = n => s.getPropertyValue(n).trim();
    col = { bg: g("--map-bg"), block: g("--map-block"), core: g("--map-core"), water: g("--map-water"),
            park: g("--map-park"), parkBg: g("--map-park-bg"), line: g("--map-line"), point: g("--map-point") };
  }
  readColors();
  new MutationObserver(() => { readColors(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  let W = 0, H = 0, dpr = 1, cams = null;
  function bboxCam(b, fx, fy, cx, cy) {
    const bw = b[2] - b[0], bh = b[3] - b[1];
    return { x: cx ?? (b[0] + b[2]) / 2, y: cy ?? (b[1] + b[3]) / 2, s: Math.min(W * fx / bw, H * fy / bh) };
  }
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const narrow = W < 700;
    const seoul = bboxCam(M.bounds, narrow ? .94 : .8, narrow ? .6 : .8);
    seoul.y += (M.bounds[3] - M.bounds[1]) * .02;
    const yeo = bboxCam(M.yeouido, narrow ? .96 : .7, narrow ? .55 : .72);
    const office = { x: M.office[0], y: M.office[1], s: Math.min(W / (narrow ? 1100 : 2300), H / 1500) };
    cams = [seoul, yeo, office];
  }

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const seg = (p, a, b) => ease(clamp((p - a) / (b - a)));
  // 확대는 비율로(로그) 보간하고, 중심은 1/배율에 맞춰 움직여 화면이 미끄러지지 않게 함
  function between(a, b, t) {
    const s = a.s * Math.pow(b.s / a.s, t);
    const u = a.s === b.s ? t : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, s };
  }
  function camAt(p) {
    if (p < .3) { const c = cams[0]; return { x: c.x, y: c.y, s: c.s * (1 + .04 * seg(p, 0, .3)) }; }
    const c0 = { ...cams[0], s: cams[0].s * 1.04 };
    if (p < .7) return between(c0, cams[1], seg(p, .3, .7));
    return between(cams[1], cams[2], seg(p, .7, .9));
  }

  let prog = calm ? 1 : 0;
  function draw() {
    if (!cams) return;
    const p = prog, c = camAt(p);
    const k = c.s * dpr, tx = W * dpr / 2 - c.x * k, ty = H * dpr / 2 - c.y * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = col.bg; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(k, 0, 0, k, tx, ty);

    // 서울 일반 블록: 여의도로 들어갈수록 연해짐
    ctx.globalAlpha = 1 - .5 * seg(p, .3, .7);
    ctx.fillStyle = col.block; ctx.fill(P.blocks);
    ctx.globalAlpha = 1;
    ctx.fillStyle = col.water; ctx.fill(P.han); ctx.fill(P.streams);
    ctx.fillStyle = col.core; ctx.fill(P.core);

    // 공원: 바탕 + 화면 기준 사선(확대해도 선 간격 그대로)
    ctx.save();
    ctx.fillStyle = col.parkBg; ctx.fill(P.parks);
    ctx.clip(P.parks);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = col.park; ctx.lineWidth = 1.1 * dpr;
    const gap = 7 * dpr; ctx.beginPath();
    for (let x = -cv.height; x < cv.width; x += gap) { ctx.moveTo(x, cv.height); ctx.lineTo(x + cv.height, 0); }
    ctx.stroke(); ctx.restore();

    // 사무실 건물: 70~90%에 주황으로 채워짐
    const f = seg(p, .7, .86);
    ctx.setTransform(k, 0, 0, k, tx, ty);
    ctx.fillStyle = col.core; ctx.fill(P.officeShape);
    if (f > 0) { ctx.globalAlpha = f; ctx.fillStyle = col.point; ctx.fill(P.officeShape); ctx.globalAlpha = 1; }

    // 서울 경계: 1px 그대로
    ctx.lineWidth = dpr / k; ctx.strokeStyle = col.line; ctx.stroke(P.seoul);

    // 사무실 점 (지름 8px)
    const ox = M.office[0] * k + tx, oy = M.office[1] * k + ty;
    if (f > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = f; ctx.fillStyle = col.point;
      ctx.beginPath(); ctx.arc(ox, oy, 4 * dpr, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }

    // 글자: 지도 위치를 따라가고 단계별로 나타남
    place(tags.han, M.river, c, 1 - seg(p, .45, .6));
    place(tags.yeo, M.yeoLabel, c, seg(p, .32, .5) * (1 - seg(p, .72, .8)));
    place(tags.office, M.office, c, seg(p, .8, .9));
  }
  function place(el, pt, c, o) {
    if (!el) return;
    el.style.opacity = o.toFixed(3);
    el.style.transform = `translate(${(W / 2 + (pt[0] - c.x) * c.s).toFixed(1)}px, ${(H / 2 + (pt[1] - c.y) * c.s).toFixed(1)}px)`;
  }

  function progress() {
    const r = sec.getBoundingClientRect(), len = r.height - innerHeight;
    return len > 0 ? clamp(-r.top / len) : 1;
  }
  let ticking = false;
  function onScroll() {
    if (calm || ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; const q = progress(); if (q !== prog) { prog = q; draw(); } });
  }
  layout(); prog = calm ? 1 : progress(); draw();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { layout(); draw(); });
  document.fonts && document.fonts.ready.then(draw);
})();
