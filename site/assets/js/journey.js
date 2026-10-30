/* 메인 스크롤 장면: 세 줄 문장 → 셔터 → 두 번째 문장 → 단어 평면(3D) → 선 → 어두운 격자 → 감각 단어 카드 → 조감 이미지
   스크롤 위치에 1:1로 묶여 있어서(scrub) 멈추면 멈추고, 올리면 거꾸로 돕니다.
   단어는 아래 WORDS 에서만 바꾸면 됩니다. */
(function () {
  const WORDS = {
    first: ["Landscape", "Shapes", "Cities"],          // 1단계 세 줄, 마지막 줄이 이어지는 단어
    second: ["Shape", "Everyday Life"],                // 3단계: 이어지는 단어 아래 두 줄
    field: ["Cities", "Landscape", "Shapes", "Street", "Color", "Place", "Public", "People", "Everyday"],
    sense: ["Walk", "Feel", "Rest"],                   // 감각 단어 3종
  };

  const journey = document.getElementById("journey");
  if (!journey) return;
  const stage = journey.querySelector(".j-stage");
  const $ = s => stage.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const mix = (a, b, t) => a + (b - a) * t;
  let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;   // 매번 같은 배치

  // ---------- 화면 요소 만들기 ----------
  const l1 = $(".j-l1"), l2 = $(".j-l2"), pivot = $(".j-pivot"), l4 = $(".j-l4"), l5 = $(".j-l5");
  l1.textContent = WORDS.first[0]; l2.textContent = WORDS.first[1]; pivot.textContent = WORDS.first[2];
  l4.firstElementChild.textContent = WORDS.second[0]; l5.firstElementChild.textContent = WORDS.second[1];
  const shutT = $(".j-shut-t"), shutB = $(".j-shut-b"), bar = $(".j-bar");
  const cam = $(".j-cam"), grid = $(".j-grid"), words = $(".j-words"), sense = $(".j-sense");
  const cards = [...stage.querySelectorAll(".j-card")], reveal = $(".j-reveal"), img = reveal.firstElementChild;

  // 단어 평면: 가로 줄마다 키워드를 돌려 쓰고, 줄마다 시작 단어를 엇갈리게
  const LEVELS = [1, .55, .25, .1];
  let centreWord = null;
  (function buildWords() {
    const R = 17, N = 15, mid = 7;
    let html = "";
    for (let row = -R; row <= R; row++) {
      let line = "";
      const start = ((row * 4) % WORDS.field.length + WORDS.field.length) % WORDS.field.length;
      for (let c = 0; c < N; c++) {
        const word = row === 0 && c === mid ? WORDS.first[2] : WORDS.field[(start + c) % WORDS.field.length];
        const d = Math.hypot(row / 3, (c - mid) / 2.2);                 // 가운데일수록 밝게
        const v = rnd() + d * .12;
        const lv = row === 0 && c === mid ? 0 : v < .35 ? 0 : v < .65 ? 1 : v < .95 ? 2 : 3;
        line += `<span style="opacity:${LEVELS[lv]}"${row === 0 && c === mid ? ' class="c"' : ""}>${word}</span>`;
      }
      html += `<p class="j-row" data-row="${row}">${line}</p>`;
    }
    words.innerHTML = html;
    centreWord = words.querySelector(".c");
  })();

  // 감각 단어: 작은 크기로 흩뿌림
  (function buildSense() {
    let html = "";
    for (let i = 0; i < 140; i++) {
      const x = (rnd() - .5) * 4200, y = (rnd() - .5) * 3600;
      html += `<span style="transform:translate3d(${x.toFixed(0)}px,${y.toFixed(0)}px,0)">${WORDS.sense[i % 3]}</span>`;
    }
    sense.innerHTML = html;
  })();

  // 격자: 크기가 다른 사각형이 모인 평면도·포장 패턴 (사각형을 반복해서 나눔)
  (function buildGrid() {
    const S = 4400, rects = [];
    (function split(x, y, w, h, depth) {
      if (depth > 5 || (w < 260 && h < 260) || (depth > 2 && rnd() < .22)) { rects.push([x, y, w, h]); return; }
      if (w > h ? rnd() < .8 : rnd() < .2) { const k = w * (.3 + rnd() * .4); split(x, y, k, h, depth + 1); split(x + k, y, w - k, h, depth + 1); }
      else { const k = h * (.3 + rnd() * .4); split(x, y, w, k, depth + 1); split(x, y + k, w, h - k, depth + 1); }
    })(0, 0, S, S, 0);
    grid.innerHTML = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" style="left:${-S / 2}px;top:${-S / 2}px">` +
      rects.map(([x, y, w, h]) => `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`).join("") + "</svg>";
  })();

  // ---------- 자리 잡기 (창 크기가 바뀌면 다시) ----------
  let W, H, lh, pv;   // pv: 이어지는 단어의 위치
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    const fs = parseFloat(getComputedStyle(stage).fontSize);
    lh = fs * .98;
    const pw = pivot.offsetWidth;
    const right = W * .62, cy = H * .45;
    pv = { left: right - pw, top: cy - lh / 2, w: pw, cx: right - pw / 2, cy };
    [l1, l2, pivot].forEach((el, i) => { el.style.left = "auto"; el.style.right = (W - right) + "px"; el.style.top = (pv.top + (i - 2) * lh) + "px"; });
    l4.style.left = (pv.left + 2 * fs) + "px"; l4.style.top = (pv.top + lh) + "px";
    l5.style.left = pv.left + "px"; l5.style.top = (pv.top + 2 * lh) + "px";
    bar.style.left = (pv.left - W * .09 - fs * .4) + "px"; bar.style.top = (pv.top + lh * 1.25) + "px";
    cam.style.left = pv.cx + "px"; cam.style.top = cy + "px";
    stage.style.perspectiveOrigin = `${pv.cx}px ${cy}px`;
    // 단어 평면의 가운데 단어가 정확히 이어지는 단어 자리에 오도록 줄을 옮김
    words.querySelectorAll(".j-row").forEach(row => {
      const n = +row.dataset.row;
      const shift = n === 0 ? row.offsetWidth / 2 - centreWord.offsetLeft - centreWord.offsetWidth / 2 : ((n * 137) % 300) - 150;
      row.style.transform = `translate3d(${shift}px, ${n * 1.6 * fs}px, 0)`;
    });
  }

  // ---------- 장면 ----------
  const set = (el, k, v) => { if (el._s?.[k] !== v) { (el._s ||= {})[k] = v; el.style[k] = v; } };
  function render(p) {
    // 1단계 (0~10%): 세 줄이 아래에서 올라옴
    const up = (1 - io(seg(p, 0, .1))) * H * .4;
    [l1, l2, pivot, bar].forEach(el => set(el, "translate", `0 ${up.toFixed(1)}px`));

    // 2단계 (10~16%): 위아래 검은 면이 닫혀 이어지는 단어 높이의 띠만 남고, 띠가 1px 선이 된 뒤 사라짐
    const a = io(seg(p, .1, .13)), b = io(seg(p, .13, .158));
    const bandTop = mix(pv.top, pv.cy - .5, b), bandBot = mix(pv.top + lh, pv.cy + .5, b);
    const closed = p >= .16;
    // 다 닫힌 뒤에는 바탕 자체가 검정이 되므로 면은 걷어 냄
    set(shutT, "height", (closed ? 0 : bandTop * a) + "px");
    set(shutB, "height", (closed ? 0 : (H - bandBot) * a) + "px");
    stage.classList.toggle("dark", closed);

    // 3단계 (16~22%): 아래 두 줄이 마스크 아래에서 올라옴
    set(l4.firstElementChild, "transform", `translateY(${(1 - io(seg(p, .16, .2))) * 105}%)`);
    set(l5.firstElementChild, "transform", `translateY(${(1 - io(seg(p, .18, .22))) * 105}%)`);

    // 4단계 (22~30%): 두 줄이 이어지는 단어 줄로 모여 겹치고, 단어 평면이 서서히 나타남
    const g = io(seg(p, .22, .29));
    set(l4, "translate", `0 ${(-g * lh).toFixed(1)}px`);
    set(l5, "translate", `0 ${(-g * 2 * lh).toFixed(1)}px`);
    const field = seg(p, .22, .3);
    set(cam, "opacity", String(field));
    const handOff = p >= .3;   // 이 뒤로는 평면 속 가운데 단어가 이어받음
    [pivot, l4, l5].forEach(el => set(el, "visibility", handOff ? "hidden" : "visible"));
    set(centreWord, "visibility", handOff ? "visible" : "hidden");

    // 5단계 (30~45%): 평면 전체가 Z축으로 0→90°, X축으로 0→25° 기울고 15% 다가감
    const t5 = seg(p, .3, .45);
    const rz = 90 * t5, rx = 25 * io(t5), z = 130 * io(t5);
    // 6단계 (45~55%): 평면이 Y축으로 돌아 옆면만 보임 → 글자가 얇은 사선이 됨. 격자·감각 단어는 다른 각도로
    const t6 = io(seg(p, .45, .55));
    // 7단계 (55~75%): 선이 짧아지며 사라지고, 격자만 남아 아주 느리게 움직임
    const t7 = seg(p, .55, .75), fadeW = seg(p, .56, .66);
    const roll = 40 * t6, zb = z - 1500 * t6;
    set(words, "transform", `translateZ(${zb}px) rotateZ(${roll}deg) rotateY(${85 * t6}deg) rotateX(${rx}deg) rotateZ(${rz}deg) scaleX(${1 - .75 * io(fadeW)})`);
    set(words, "opacity", String(1 - fadeW));
    set(sense, "transform", `translateZ(${zb}px) rotateZ(${roll * .5}deg) rotateY(${68 * t6}deg) rotateX(${rx}deg) rotateZ(${rz + 22 * t6}deg)`);
    set(sense, "opacity", String(1 - seg(p, .55, .64)));
    const back = io(seg(p, .55, .7));
    set(grid, "transform", `translateZ(${z + 90 * t7}px) rotateZ(${roll * .3 * (1 - back)}deg) rotateY(${48 * t6 * (1 - back)}deg) rotateX(${rx * (1 - back)}deg) rotateZ(${rz - 12 * t6 * (1 - back)}deg) translate3d(${(t7 * 140).toFixed(1)}px, ${(t7 * -70).toFixed(1)}px, 0)`);
    set(grid, "opacity", String(1 - seg(p, .86, .9)));

    // 8단계 (75~88%): 세로 패널이 3D로 뒤집히며 감각 단어가 나타났다 사라짐, 가운데 패널 틈으로 이미지가 비침
    cards.forEach((c, i) => {
      if (c.classList.contains("mid")) { set(c, "opacity", String(seg(p, .76, .79) * (1 - seg(p, .88, .9)))); return; }
      const s0 = .755 + ((i * 3) % cards.length) * .013, t = seg(p, s0, s0 + .07);
      const ry = mix(-95, c.dataset.flip ? 265 : 95, t);
      set(c, "transform", `rotateY(${ry.toFixed(1)}deg)`);
      set(c, "opacity", String(t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0));
    });

    // 9단계 (88~100%): 가운데 틈이 화면 전체로 열리고, 이미지가 천천히 확대됨
    const slit = seg(p, .8, .88) * 4, open = io(seg(p, .88, .905));
    const sideIn = mix(W / 2 - slit, 0, open), vIn = mix(H * .12, 0, open);
    set(reveal, "clipPath", p < .8 ? "inset(50% 50% 50% 50%)" : `inset(${vIn.toFixed(1)}px ${sideIn.toFixed(1)}px ${vIn.toFixed(1)}px ${sideIn.toFixed(1)}px)`);
    set(img, "transform", `scale(${1 + .25 * seg(p, .9, 1)})`);
  }

  // ---------- 스크롤 연결 (GSAP ScrollTrigger scrub:1 + Lenis) ----------
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm || !window.gsap || !window.ScrollTrigger) { journey.classList.add("calm"); return; }
  layout();
  const state = { p: 0 };
  render(0);
  gsap.registerPlugin(ScrollTrigger);
  gsap.to(state, {
    p: 1, ease: "none",
    scrollTrigger: { trigger: journey, start: "top top", end: "bottom bottom", scrub: 1 },
    onUpdate: () => render(state.p),
  });
  if (window.Lenis) {
    const lenis = new Lenis();
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  addEventListener("resize", () => { layout(); render(state.p); });
  document.fonts && document.fonts.ready.then(() => { layout(); render(state.p); ScrollTrigger.refresh(); });
})();
