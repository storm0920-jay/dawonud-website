/* 메인 스크롤 장면: 세 줄 문장 → 셔터 → 두 번째 문장 → 단어 평면(3D) → 선 → 어두운 격자 → 감각 단어 카드 → 조감 이미지
   스크롤 위치에 1:1로 묶여 있어서(scrub) 멈추면 멈추고, 올리면 거꾸로 돕니다.
   단어·구간(%)·수치는 모두 아래 CONFIG 에서 고칩니다. 구간 값은 이 섹션 스크롤 진행도(0~1)입니다. */
const CONFIG = {
  words: {
    first: ["Design", "Shapes", "Place"],              // 1단계 세 줄. 마지막 줄이 피벗 단어
    second: ["Defines", "Life"],                       // 3단계: 피벗 단어 아래 두 줄 (Place / Defines / Life)
    field: ["Landscape", "Streetscape", "Community", "Shapes", "Connects", "Defines"],
    sense: ["Walk", "Pause", "Gather"],                // 감각 단어 3종 (작은 레이어, 8단계 카드)
  },
  scroll: { scrub: 1, length: 800 },                   // 관성(초), 이 섹션을 고정(pin)한 채 스크롤하는 길이(vh, 700~900)
  upTo: 9,                                             // 확인 단계: 4면 1~4단계까지만 보여 줌. 확인 후 9로 바꾸면 5~9단계까지
  type: { tracking: "-0.02em", leading: .98, white2: .75 },  // 두 번째 문장 2·3행 밝기
  levels: [1, .55, .25, .1],                           // 단어 밝기 4단계(흰색 불투명도)

  s1: { from: 0, to: .10, rise: .4, right: .62, centerY: .45, barW: .09 },     // 아래 40vh에서 올라옴, 블록 오른쪽 끝 62vw, 피벗 줄 높이 45vh
  s2: { close: [.10, .13], narrow: [.13, .158], end: .16 },                    // 검은 면이 닫힘 → 띠가 1px로 좁아짐 → 사라짐
  s3: { l2: [.16, .20], l3: [.18, .22], indent: 2 },                           // 마스크가 걷히며 올라옴, 2행 들여쓰기(em)
  s4: { merge: [.22, .29], field: [.22, .30], handOff: .30 },                  // 두 줄이 피벗 줄로 모임 + 단어 평면 등장
  field: { rows: 17, rowsMobile: 8, perRow: 15, rowGap: 1.6, wordGap: 1.2, senseCount: 140, senseScale: .55, senseAlpha: .15, gridAlpha: .07 },
  s5: { range: [.30, .45], rotZ: 90, rotX: 25, zoomZ: 130 },                   // Z 0→90°, X 0→25°, 약 15% 다가감
  s6: { range: [.45, .55], rotY: 85, roll: 40, pushBack: 1500, senseRotY: 68, senseRotZ: 22, gridRotY: 48 },
  s7: { range: [.55, .75], wordsOut: [.56, .66], senseOut: [.55, .64], shorten: .75, gridBack: [.55, .70], drift: [140, -70], gridZ: 90 },
  s8: { start: .755, stagger: .013, each: .07, mid: [.76, .79], slit: [.80, .88], slitW: 4, inset: .12 },
  s9: { open: [.88, .905], zoom: [.90, 1], scale: 1.25, gridOut: [.86, .90] },
  calm: { second: [.16, .22], field: [.22, .30], wordsOut: [.45, .55], cards: [.75, .88], image: [.88, .93] },  // 동작 줄이기: 3~9단계를 페이드로
};

(function () {
  const C = CONFIG, Wd = C.words;
  const journey = document.getElementById("journey");
  if (!journey) return;
  const stage = journey.querySelector(".j-stage");
  const $ = s => stage.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, [a, b]) => clamp((p - a) / (b - a));
  const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const mix = (a, b, t) => a + (b - a) * t;
  let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;   // 매번 같은 배치
  const mobile = matchMedia("(max-width: 768px)").matches;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 화면 요소 만들기 ----------
  stage.style.letterSpacing = C.type.tracking;
  stage.style.lineHeight = C.type.leading;
  const l1 = $(".j-l1"), l2 = $(".j-l2"), pivot = $(".j-pivot"), l4 = $(".j-l4"), l5 = $(".j-l5");
  l1.textContent = Wd.first[0]; l2.textContent = Wd.first[1]; pivot.textContent = Wd.first[2];
  l4.firstElementChild.textContent = Wd.second[0]; l5.firstElementChild.textContent = Wd.second[1];
  l4.style.color = l5.style.color = `rgba(255,255,255,${C.type.white2})`;
  journey.setAttribute("aria-label", `${Wd.first.join(" ")}. ${[Wd.first[2], ...Wd.second].join(" ")}.`);
  const shutT = $(".j-shut-t"), shutB = $(".j-shut-b"), bar = $(".j-bar");
  const cam = $(".j-cam"), grid = $(".j-grid"), words = $(".j-words"), sense = $(".j-sense");
  const cards = [...stage.querySelectorAll(".j-card")], reveal = $(".j-reveal"), img = reveal.firstElementChild;
  cards.filter(c => !c.classList.contains("mid")).forEach((c, i) => { c.firstElementChild.textContent = Wd.sense[i % 3]; });

  // 단어 평면: 가로 줄마다 키워드를 돌려 쓰고, 줄마다 시작 단어를 엇갈리게. 가운데일수록 밝게
  let centreWord = null;
  (function buildWords() {
    const R = mobile ? C.field.rowsMobile : C.field.rows, N = C.field.perRow, mid = Math.floor(N / 2), F = Wd.field;
    let html = "";
    for (let row = -R; row <= R; row++) {
      let line = "";
      const start = ((row * 4) % F.length + F.length) % F.length;
      for (let c = 0; c < N; c++) {
        const centre = row === 0 && c === mid;
        const d = Math.hypot(row / 3, (c - mid) / 2.2);
        const v = rnd() + d * .12;
        const lv = centre ? 0 : v < .35 ? 0 : v < .65 ? 1 : v < .95 ? 2 : 3;
        line += `<span style="opacity:${C.levels[lv]}"${centre ? ' class="c"' : ""}>${centre ? Wd.first[2] : F[(start + c) % F.length]}</span>`;
      }
      html += `<p class="j-row" data-row="${row}" style="gap:${C.field.wordGap}em">${line}</p>`;
    }
    words.innerHTML = html;
    centreWord = words.querySelector(".c");
  })();

  // 감각 단어: 작은 크기로 흩뿌림
  (function buildSense() {
    let html = "";
    for (let i = 0; i < C.field.senseCount; i++) {
      const x = (rnd() - .5) * 4200, y = (rnd() - .5) * 3600;
      html += `<span style="transform:translate3d(${x.toFixed(0)}px,${y.toFixed(0)}px,0)">${Wd.sense[i % 3]}</span>`;
    }
    sense.innerHTML = html;
    sense.style.fontSize = C.field.senseScale + "em";
    sense.style.color = `rgba(255,255,255,${C.field.senseAlpha})`;
  })();

  // 격자: 크기가 다른 사각형이 모인 평면도·포장 패턴
  (function buildGrid() {
    const S = 4400, rects = [];
    (function split(x, y, w, h, depth) {
      if (depth > 5 || (w < 260 && h < 260) || (depth > 2 && rnd() < .22)) { rects.push([x, y, w, h]); return; }
      if (w > h ? rnd() < .8 : rnd() < .2) { const k = w * (.3 + rnd() * .4); split(x, y, k, h, depth + 1); split(x + k, y, w - k, h, depth + 1); }
      else { const k = h * (.3 + rnd() * .4); split(x, y, w, k, depth + 1); split(x, y + k, w, h - k, depth + 1); }
    })(0, 0, S, S, 0);
    grid.innerHTML = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" style="left:${-S / 2}px;top:${-S / 2}px;stroke:rgba(255,255,255,${C.field.gridAlpha})">` +
      rects.map(([x, y, w, h]) => `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`).join("") + "</svg>";
  })();

  // ---------- 자리 잡기 (창 크기가 바뀌면 다시) ----------
  let W, H, fs, lh, pv;   // pv: 피벗 단어의 위치
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    fs = parseFloat(getComputedStyle(stage).fontSize);
    lh = fs * C.type.leading;
    const pw = pivot.offsetWidth, right = W * C.s1.right, cy = H * C.s1.centerY;
    pv = { left: right - pw, top: cy - lh / 2, cx: right - pw / 2, cy };
    [l1, l2, pivot].forEach((el, i) => { el.style.right = (W - right) + "px"; el.style.top = (pv.top + (i - 2) * lh) + "px"; });
    l4.style.left = (pv.left + C.s3.indent * fs) + "px"; l4.style.top = (pv.top + lh) + "px";
    l5.style.left = pv.left + "px"; l5.style.top = (pv.top + 2 * lh) + "px";
    bar.style.width = (W * C.s1.barW) + "px";
    bar.style.left = (pv.left - W * C.s1.barW - fs * .4) + "px"; bar.style.top = (pv.top + lh * 1.25) + "px";
    cam.style.left = pv.cx + "px"; cam.style.top = cy + "px";
    stage.style.perspectiveOrigin = `${pv.cx}px ${cy}px`;
    // 단어 평면의 가운데 단어가 정확히 피벗 단어 자리에 오도록 줄을 옮김
    words.querySelectorAll(".j-row").forEach(row => {
      const n = +row.dataset.row;
      const shift = n === 0 ? row.offsetWidth / 2 - centreWord.offsetLeft - centreWord.offsetWidth / 2 : ((n * 137) % 300) - 150;
      row.style.transform = `translate3d(${shift}px, ${n * C.field.rowGap * fs}px, 0)`;
    });
  }

  // ---------- 장면 ----------
  const set = (el, k, v) => { if (el._s?.[k] !== v) { (el._s ||= {})[k] = v; el.style[k] = v; } };

  // 1~2단계는 동작 줄이기에서도 같음
  function opening(p) {
    // 1단계: 세 줄이 아래에서 올라옴
    const up = (1 - io(seg(p, [C.s1.from, C.s1.to]))) * H * C.s1.rise;
    [l1, l2, pivot, bar].forEach(el => set(el, "translate", `0 ${up.toFixed(1)}px`));
    // 2단계: 위아래 검은 면이 닫혀 피벗 단어 높이의 띠만 남고, 띠가 1px 선이 된 뒤 사라짐 (피벗 단어는 difference로 흰 글자가 됨)
    const a = io(seg(p, C.s2.close)), b = io(seg(p, C.s2.narrow));
    const bandTop = mix(pv.top, pv.cy - .5, b), bandBot = mix(pv.top + lh, pv.cy + .5, b);
    const closed = p >= C.s2.end;   // 다 닫힌 뒤에는 바탕 자체가 검정이 되므로 면은 걷어 냄
    set(shutT, "height", (closed ? 0 : bandTop * a) + "px");
    set(shutB, "height", (closed ? 0 : (H - bandBot) * a) + "px");
    stage.classList.toggle("dark", closed);
  }

  function render(p) {
    opening(p);
    // 3단계: 아래 두 줄이 마스크 아래에서 올라옴
    set(l4.firstElementChild, "transform", `translateY(${(1 - io(seg(p, C.s3.l2))) * 105}%)`);
    set(l5.firstElementChild, "transform", `translateY(${(1 - io(seg(p, C.s3.l3))) * 105}%)`);

    // 4단계: 두 줄이 피벗 줄로 모여 겹치고, 단어 평면이 서서히 나타남
    const g = io(seg(p, C.s4.merge));
    set(l4, "translate", `0 ${(-g * lh).toFixed(1)}px`);
    set(l5, "translate", `0 ${(-g * 2 * lh).toFixed(1)}px`);
    set(cam, "opacity", String(seg(p, C.s4.field)));
    const handOff = p >= C.s4.handOff;   // 이 뒤로는 평면 속 가운데 단어가 이어받음
    [pivot, l4, l5].forEach(el => set(el, "visibility", handOff ? "hidden" : "visible"));
    set(centreWord, "visibility", handOff ? "visible" : "hidden");

    // 5단계: 평면 전체가 Z축으로 돌고 X축으로 기울며 조금 다가감
    const t5 = seg(p, C.s5.range);
    const rz = C.s5.rotZ * t5, rx = C.s5.rotX * io(t5), z = C.s5.zoomZ * io(t5);
    // 6단계: 평면이 Y축으로 돌아 옆면만 보임 → 글자가 얇은 사선이 됨. 격자·감각 단어는 다른 각도로
    const t6 = io(seg(p, C.s6.range));
    // 7단계: 선이 짧아지며 사라지고, 격자만 남아 아주 느리게 움직임
    const t7 = seg(p, C.s7.range), fadeW = seg(p, C.s7.wordsOut);
    const roll = C.s6.roll * t6, zb = z - C.s6.pushBack * t6;
    set(words, "transform", `translateZ(${zb}px) rotateZ(${roll}deg) rotateY(${C.s6.rotY * t6}deg) rotateX(${rx}deg) rotateZ(${rz}deg) scaleX(${1 - C.s7.shorten * io(fadeW)})`);
    set(words, "opacity", String(1 - fadeW));
    set(sense, "transform", `translateZ(${zb}px) rotateZ(${roll * .5}deg) rotateY(${C.s6.senseRotY * t6}deg) rotateX(${rx}deg) rotateZ(${rz + C.s6.senseRotZ * t6}deg)`);
    set(sense, "opacity", String(1 - seg(p, C.s7.senseOut)));
    const back = 1 - io(seg(p, C.s7.gridBack));
    set(grid, "transform", `translateZ(${z + C.s7.gridZ * t7}px) rotateZ(${roll * .3 * back}deg) rotateY(${C.s6.gridRotY * t6 * back}deg) rotateX(${rx * back}deg) rotateZ(${rz - 12 * t6 * back}deg) translate3d(${(t7 * C.s7.drift[0]).toFixed(1)}px, ${(t7 * C.s7.drift[1]).toFixed(1)}px, 0)`);
    set(grid, "opacity", String(1 - seg(p, C.s9.gridOut)));

    // 8단계: 세로 패널이 3D로 뒤집히며 감각 단어가 나타났다 사라짐, 가운데 패널 틈으로 이미지가 비침
    cards.forEach((c, i) => {
      if (c.classList.contains("mid")) { set(c, "opacity", String(seg(p, C.s8.mid) * (1 - seg(p, C.s9.gridOut)))); return; }
      const s0 = C.s8.start + ((i * 3) % cards.length) * C.s8.stagger, t = seg(p, [s0, s0 + C.s8.each]);
      set(c, "transform", `rotateY(${mix(-95, c.dataset.flip ? 265 : 95, t).toFixed(1)}deg)`);
      set(c, "opacity", String(t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0));
    });

    // 9단계: 가운데 틈이 화면 전체로 열리고, 이미지가 천천히 확대됨
    const slit = seg(p, C.s8.slit) * C.s8.slitW, open = io(seg(p, C.s9.open));
    const sideIn = mix(W / 2 - slit, 0, open), vIn = mix(H * C.s8.inset, 0, open);
    set(reveal, "clipPath", p < C.s8.slit[0] ? "inset(50% 50% 50% 50%)" : `inset(${vIn.toFixed(1)}px ${sideIn.toFixed(1)}px ${vIn.toFixed(1)}px ${sideIn.toFixed(1)}px)`);
    set(img, "transform", `scale(${1 + (C.s9.scale - 1) * seg(p, C.s9.zoom)})`);
  }

  // 동작 줄이기: 3~9단계는 회전·이동 없이 페이드로만 바뀜
  function renderCalm(p) {
    opening(p);
    const K = C.calm;
    [l4, l5].forEach(el => { set(el.firstElementChild, "transform", "none"); set(el, "opacity", String(seg(p, K.second))); });
    const f = seg(p, K.field);
    set(cam, "opacity", String(f));
    [pivot, l4, l5].forEach(el => set(el, "visibility", f >= 1 ? "hidden" : "visible"));
    set(centreWord, "visibility", f >= 1 ? "visible" : "hidden");
    set(words, "opacity", String(1 - seg(p, K.wordsOut)));
    set(sense, "opacity", String(1 - seg(p, K.wordsOut)));
    const cd = seg(p, K.cards);
    cards.forEach(c => { set(c, "transform", "none"); set(c, "opacity", String(Math.sin(Math.PI * cd))); });
    set(reveal, "clipPath", "none");
    set(reveal, "opacity", String(seg(p, K.image)));
  }

  // ---------- 스크롤 연결 (GSAP ScrollTrigger scrub + Lenis) ----------
  if (!window.gsap || !window.ScrollTrigger) { journey.classList.add("static"); return; }
  const draw = calm ? renderCalm : render;
  layout();
  const state = { p: 0 };
  draw(0);
  gsap.registerPlugin(ScrollTrigger);
  // 1~4단계만 확인할 때는 4단계 끝(단어 평면이 다 깔린 상태)에서 멈추고 스크롤 길이도 그만큼만
  const last = C.upTo >= 9 ? 1 : C.s4.field[1];
  journey.style.height = `calc(100vh + ${C.scroll.length * last}vh)`;
  gsap.to(state, {
    p: last, ease: "none",
    // 고정은 CSS sticky가 맡고(미리보기 창 같은 iframe 안에서도 안정적), ScrollTrigger는 진행도만 읽음
    scrollTrigger: { trigger: journey, start: "top top", end: "bottom bottom", scrub: calm ? true : C.scroll.scrub, invalidateOnRefresh: true },
    onUpdate: () => draw(edge(state.p)),
  });
  // 섹션 밖에서는 관성 때문에 지난 장면이 남아 보이지 않도록 처음·끝 장면으로 바로 맞춤 (스크롤바를 빠르게 끌 때)
  function edge(p) {
    const rc = journey.getBoundingClientRect();
    return rc.top > 0 ? 0 : rc.bottom < innerHeight ? last : p;
  }
  addEventListener("scroll", () => { const rc = journey.getBoundingClientRect(); if (rc.top > 0 || rc.bottom < innerHeight) draw(edge(state.p)); }, { passive: true });
  // 부드러운 스크롤(Lenis)은 단독 페이지에서만. 미리보기처럼 다른 화면 안에 들어가 있으면 스크롤을 막을 수 있어서 끔
  let framed = true; try { framed = window.self !== window.top; } catch (e) {}
  if (window.Lenis && !calm && !framed) {
    const lenis = new Lenis();
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  addEventListener("resize", () => { layout(); draw(state.p); });
  document.fonts && document.fonts.ready.then(() => { layout(); draw(state.p); ScrollTrigger.refresh(); });
})();
