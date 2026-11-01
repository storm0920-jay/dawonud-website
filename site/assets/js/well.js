/* 상자 장면 마지막, 우물 바닥의 도시 전경 (jay 시안 3, 2026-11-01)
   사진: assets/img/well-city.jpg (공주 항공사진, 기존 문구 지움)
   window.Well.draw(t): 장면이 화면을 채운 뒤 추가 스크롤 0~1. 전경만 → 카피 3줄 → 원형 6개가 위에서부터 하나씩.
   좌표는 사진 폭을 1920으로 본 값. 호출은 assets/js/journey.js */
(function () {
  const box = document.querySelector(".j-well");
  if (!box) return;
  const img = box.querySelector(".w-img"), pinsEl = box.querySelector(".w-pins");
  const copy = [...box.querySelectorAll(".w-copy [data-step]")], bar = box.querySelector(".w-bar");
  const IW = 1920, IH = 1358;
  const S = 1920 / 900;   // 시안 좌표(900폭) → 사진 좌표
  const PINS = [          // [x, y(가리키는 점), 국문, 영문, 띠지, 인출선 길이, 띠지 방향]
    [390, 300, "경관", "Landscape", "산과 강이 만든 도시의 윤곽을 지킵니다", 24, "r"],
    [720, 368, "역사", "Heritage", "오래된 성곽과 길이 도시의 기억이 됩니다", 70, "l"],
    [520, 430, "장소", "Place", "사람이 모이는 골목에서 디자인을 시작합니다", 80, "r"],
    [290, 468, "색채", "Color", "지붕과 벽의 색을 지역의 기준으로 정합니다", 110, "r"],
    [604, 522, "유니버설", "Universal", "누구나 불편 없이 오르는 길을 만듭니다", 70, "r"],
    [420, 566, "공공디자인", "Public Design", "매일 걷는 거리와 광장을 정돈합니다", 60, "r"],
  ].map(([x, y, ko, en, cap, ln, side]) => ({ x: x * S, y: y * S, ko, en, cap, ln, side }));

  pinsEl.innerHTML = PINS.map(p =>
    `<div class="w-pin${p.side === "l" ? " l" : ""}"><span class="w-c"><b>${p.ko}</b><small>${p.en}</small></span><i class="w-ln"></i><i class="w-dot"></i><span class="w-cap">${p.cap}</span></div>`).join("");
  const pinEls = [...pinsEl.children];

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  // 순서(추가 스크롤 비율): 전경만 0~.08, 카피 세 줄, 원형 6개
  const COPY = [[.08, .14], [.13, .2], [.19, .28]];
  const PIN0 = .32, PSTEP = .1, PLEN = .08;

  function draw(t) {
    const W = box.clientWidth, H = box.clientHeight;
    if (!W) return;
    const narrow = W < 700;
    const k = narrow ? Math.max(W / IW, H / IH) : Math.max(W / 1920, H / 1080);   // 화면을 채움 (PC는 시안 1920×1080 구도)
    // 휴대폰: 원 6개가 다 들어오도록 사진 폭을 줄이고 아래에 붙임 (위 빈 곳은 하늘색 바탕)
    let ox, oy;
    if (narrow) {
      const kk = W / 1100;
      ox = W / 2 - 1085 * kk; oy = H - IH * kk;
      return place(t, kk, ox, oy, narrow);
    }
    const cx = 960, cy = Math.min(IH - H / 2 / k, 740);
    ox = W / 2 - cx * k; oy = H / 2 - cy * k;
    place(t, k, ox, oy, narrow);
  }
  function place(t, k, ox, oy, narrow) {
    img.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${k.toFixed(4)})`;

    bar.style.borderLeftColor = `rgba(14,14,14,${(.45 * ease(seg(t, ...COPY[1]))).toFixed(3)})`;
    copy.forEach((el, i) => { const u = ease(seg(t, ...COPY[i])); el.style.opacity = u.toFixed(3); el.style.transform = `translateY(${((1 - u) * 18).toFixed(1)}px)`; });

    PINS.forEach((p, i) => {
      const el = pinEls[i], a = PIN0 + i * PSTEP;
      const c = seg(t, a, a + PLEN * .45), l = seg(t, a + PLEN * .3, a + PLEN * .75), cap = seg(t, a + PLEN * .6, a + PLEN);
      el.style.visibility = c > 0 ? "visible" : "hidden";
      el.style.transform = `translate(${(ox + p.x * k).toFixed(1)}px, ${(oy + p.y * k).toFixed(1)}px)`;
      el.style.setProperty("--ln", (p.ln * Math.min(1, k * 1.2)).toFixed(1) + "px");
      el.style.setProperty("--c", ease(c).toFixed(3));
      el.style.setProperty("--l", ease(l).toFixed(3));
      const next = PIN0 + (i + 1) * PSTEP;
      // 휴대폰은 화면이 좁아 띠지는 방금 나온 원 하나만 보여 줌
      const capV = narrow && i < PINS.length - 1 ? ease(cap) * (1 - ease(seg(t, next, next + PLEN * .4))) : ease(cap);
      el.style.setProperty("--cap", capV.toFixed(3));
      el.classList.toggle("l", narrow ? p.x > 1085 : p.side === "l");
    });
  }
  window.Well = { draw };
  let last = 0;
  const orig = draw;
  window.Well.draw = t => { last = t; orig(t); };
  addEventListener("resize", () => orig(last));
})();
