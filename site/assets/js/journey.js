/* 메인 스크롤 장면
   1~4단계: 작업지시서대로 (세 줄 문장 → 셔터 → 두 번째 문장 → 단어 공간 등장)
   5단계부터: 참고 녹화(29~45초)를 1초 단위로 잰 움직임. 높이가 다른 상자들이 격자로 서 있고 상자 윗면마다 단어가 놓인 공간이
   시계 방향으로 돌며 기울고 → 단어가 누워 얇은 선이 되고 → 상자 사이를 내려다보다 → 가운데 상자 안으로 들어가 이미지가 열림.
   스크롤 위치에 1:1로 묶여 있어서(scrub) 멈추면 멈추고, 올리면 거꾸로 돕니다.
   단어·구간(%)·수치는 모두 아래 CONFIG 에서 고칩니다. 구간 값은 이 섹션 스크롤 진행도(0~1)입니다. */
const CONFIG = {
  words: {
    first: ["Design", "Shapes", "Place"],              // 1단계 세 줄. 마지막 줄이 피벗 단어
    second: ["Defines", "Life"],                       // 3단계: 피벗 단어 아래 두 줄 (Place / Defines / Life)
    field: ["Landscape", "Streetscape", "Community", "Shapes", "Connects", "Defines"],
    sense: ["Walk", "Pause", "Gather"],                // 감각 단어 3종 (작은 기울임 글자, 상자 옆면)
  },
  // 구간 비율은 밝은 녹화(Video Project_색반전, 0~33초)의 스크롤바 위치를 0.5초마다 재서 맞춤. 일정한 속도로 내리면 녹화와 같은 속도로 바뀜
  scroll: { scrub: 1, length: 900 },                   // 관성(초), 장면을 붙잡아 둔 채 스크롤하는 길이(vh)
  upTo: 9,                                             // 4면 1~4단계까지만 보여 줌
  type: { tracking: "-0.02em", leading: .98, white2: .75 },
  levels: [1, .55, .25, .1],                           // 단어 밝기 4단계(흰색 불투명도)

  s1: { from: 0, to: .04, rise: .4, right: .62, centerY: .45, barW: .09 },     // 녹화 1~2초
  s2: { close: [.04, .06], narrow: [.06, .075], end: .08 },                    // 녹화 2초
  s3: { l2: [.08, .10], l3: [.09, .11], indent: 2 },                           // 녹화 3초
  s4: { merge: [.11, .15], field: [.11, .16], handOff: .16 },                  // 녹화 4~5초
  // 상자 공간: 격자 칸 크기(글자 크기의 배수), 칸 수, 윗면 높이 [최저, 최고, 간격](px), 깊이, 윗면마다 단어 줄 수
  boxes: { pitch: 5.6, gap: 18, range: 6, rangeMobile: 4, tops: [-100, 150, 50], depth: [700, 1300], coreDepth: 1500, floor: 600, lines: 5, senseShare: .28, sideWords: .5 },
  // 카메라 (rx: 앞뒤 기울기, rz: 시계 방향 회전, z: 다가감)
  camera: [
    { p: .16, rx: 0, rz: 0, z: 0 },          // 5초: 정면
    { p: .20, rx: 10, rz: 25, z: 0 },        // 6초: 비스듬히
    { p: .23, rx: 20, rz: 45, z: 20 },       // 7~8초
    { p: .26, rx: 28, rz: 62, z: 30 },       // 9~10초
    { p: .29, rx: 34, rz: 80, z: 40 },       // 11초: 거의 세로
    { p: .34, rx: 30, rz: 115, z: 60 },      // 12~13초: 단어가 누우며 사선
    { p: .39, rx: 18, rz: 150, z: 100 },     // 15초: 얇은 선
    { p: .55, rx: 4, rz: 176, z: 160 },      // 16~21초: 상자만 남아 천천히 정렬
    { p: .78, rx: 0, rz: 180, z: 320 },      // 27초: 위에서 내려다본 격자, 가운데 상자 바닥의 이미지가 작게 보임
    { p: .95, rx: 0, rz: 180, z: 1380 },     // 28~32초: 가운데 상자 안으로 내려가 바닥 이미지가 화면을 채움
  ],
  lieDown: [.30, .37],                                 // 단어가 상자 윗면에 누워 얇은 선이 됨
  wordsOut: [.37, .45],                                // 선이 사라짐 → 상자와 옆면 단어만 남음
  centre: [.40, .78],                                  // 상자만 남는 동안 가운데 상자를 화면 정중앙으로 천천히 옮김
  floorIn: [.76, .82],                                 // 녹화 28초: 가운데 상자 바닥의 이미지가 작게 나타남
  reveal: { at: .95, zoom: [.95, 1], scale: 1.25 },   // 바닥 이미지가 화면을 채운 뒤 화면 전체 이미지로 바뀌어 천천히 확대
  calm: { second: [.08, .11], field: [.11, .16], wordsOut: [.37, .45], image: [.85, .95] },  // 동작 줄이기: 3단계부터 페이드로
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
  const cam = $(".j-cam"), world = $(".j-world");
  const reveal = $(".j-reveal"), img = reveal.firstElementChild;

  // 상자 공간: 높이가 다른 상자들이 격자로 서 있고, 윗면마다 단어가 몇 줄씩 놓임 (높이 차이 때문에 단어가 앞뒤로 겹쳐 보임)
  let centreWord = null, floor = null, builtFor = 0;
  function buildWorld(fs) {
    r = 7;
    const B = C.boxes, G = B.pitch * fs, S = G - B.gap, k = fs / 54, N = mobile ? B.rangeMobile : B.range;
    const steps = Math.round((B.tops[1] - B.tops[0]) / B.tops[2]);
    let html = "", n = 0;
    for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
      const core = i === 0 && j === 0;
      const top = core ? 0 : (B.tops[0] + Math.round(rnd() * steps) * B.tops[2]) * k;
      const depth = core ? B.coreDepth : B.depth[0] + Math.round(rnd() * 4) * (B.depth[1] - B.depth[0]) / 4;
      const side = () => rnd() < B.sideWords ? `<em>${Wd.sense[Math.floor(rnd() * 3)]}</em>` : "";
      html += `<b class="cube${core ? " core" : ""}" style="--s:${S.toFixed(0)}px;--h:${depth}px;transform:translate3d(${(i * G).toFixed(0)}px,${(j * G).toFixed(0)}px,${(top - depth).toFixed(0)}px)">` +
        `<i class="t"></i><i class="n">${side()}</i><i class="s">${side()}</i><i class="w">${side()}</i><i class="e">${side()}</i></b>`;
      const lines = core ? [0] : Array.from({ length: B.lines }, (_, m) => (m - (B.lines - 1) / 2) * 1.05);
      for (const dy of lines) {
        let word, cls = "", op = 1;
        if (core) { word = Wd.first[2]; cls = "c"; }
        else if (rnd() < B.senseShare) { word = Wd.sense[n % 3]; cls = "sn"; }
        else {
          word = Wd.field[n % Wd.field.length];
          const v = rnd() + Math.hypot(i, j) * .06;               // 가운데일수록 밝게
          op = C.levels[v < .3 ? 0 : v < .62 ? 1 : v < .95 ? 2 : 3];
        }
        n++;
        const x = i * G + (core ? 0 : Math.round((rnd() - .5) * G * .5)), y = j * G + dy * fs;
        html += `<span class="wd ${cls}" style="--o:${op};transform:translate3d(${x.toFixed(0)}px,${y.toFixed(0)}px,${(top + 2).toFixed(0)}px) rotateX(var(--wr,0deg))">${word}</span>`;
      }
    }
    // 가운데 상자 바닥의 이미지: 카메라가 상자 안으로 내려가면 이 이미지가 화면을 채움
    html += `<img class="floor" src="${img.getAttribute("src")}" alt="" style="width:${S.toFixed(0)}px;height:${S.toFixed(0)}px;transform:translate3d(-50%,-50%,${-B.floor}px)">`;
    world.innerHTML = html;
    centreWord = world.querySelector(".wd.c");
    floor = world.querySelector(".floor");
    builtFor = fs;
  }

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
    // 공간의 가운데(가운데 상자 윗면의 피벗 단어)가 정확히 피벗 단어 자리에 오도록
    if (builtFor !== fs) buildWorld(fs);
  }

  // ---------- 장면 ----------
  const set = (el, k, v) => { if (el._s?.[k] !== v) { (el._s ||= {})[k] = v; k.startsWith("--") ? el.style.setProperty(k, v) : (el.style[k] = v); } };

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
    [l1, l2, bar].forEach(el => set(el, "visibility", closed ? "hidden" : "visible"));   // 검은 면 뒤로 사라진 1·2행
  }

  function camAt(p) {
    const K = C.camera;
    if (p <= K[0].p) return K[0];
    for (let i = 0; i < K.length - 1; i++) {
      const a = K[i], b = K[i + 1];
      if (p <= b.p) { const t = io((p - a.p) / (b.p - a.p)); return { rx: mix(a.rx, b.rx, t), rz: mix(a.rz, b.rz, t), z: mix(a.z, b.z, t) }; }
    }
    return K[K.length - 1];
  }

  function render(p) {
    opening(p);
    // 3단계: 아래 두 줄이 마스크 아래에서 올라옴
    set(l4.firstElementChild, "transform", `translateY(${(1 - io(seg(p, C.s3.l2))) * 105}%)`);
    set(l5.firstElementChild, "transform", `translateY(${(1 - io(seg(p, C.s3.l3))) * 105}%)`);

    // 4단계: 두 줄이 피벗 줄로 모여 겹치고, 상자와 단어 공간이 서서히 나타남
    const g = io(seg(p, C.s4.merge));
    set(l4, "translate", `0 ${(-g * lh).toFixed(1)}px`);
    set(l5, "translate", `0 ${(-g * 2 * lh).toFixed(1)}px`);
    set(cam, "opacity", String(seg(p, C.s4.field)));
    const handOff = p >= C.s4.handOff;   // 이 뒤로는 공간 속 가운데 단어가 이어받음
    [pivot, l4, l5].forEach(el => set(el, "visibility", handOff ? "hidden" : "visible"));
    set(centreWord, "visibility", handOff ? "visible" : "hidden");

    // 5~7단계: 카메라가 녹화처럼 움직임 (시계 방향으로 돌며 기울고 → 단어가 누움 → 상자 사이로 다가감)
    const c = camAt(p);
    set(world, "transform", `translateZ(${c.z.toFixed(1)}px) rotateX(${c.rx.toFixed(2)}deg) rotateZ(${c.rz.toFixed(2)}deg)`);
    set(world, "--wr", (io(seg(p, C.lieDown)) * 90).toFixed(1) + "deg");
    set(world, "--wo", (1 - seg(p, C.wordsOut)).toFixed(3));
    const ct = io(seg(p, C.centre)), cx = mix(pv.cx, W / 2, ct), cy = mix(pv.cy, H / 2, ct);
    set(cam, "left", cx.toFixed(1) + "px"); set(cam, "top", cy.toFixed(1) + "px");
    set(stage, "perspectiveOrigin", `${cx.toFixed(1)}px ${cy.toFixed(1)}px`);
    if (floor) set(floor, "opacity", seg(p, C.floorIn).toFixed(3));

    // 8~9단계: 가운데 상자 바닥의 이미지가 화면을 채우면 화면 전체 이미지로 이어받아 천천히 확대됨
    set(reveal, "clipPath", p >= C.reveal.at ? "none" : "inset(50% 50% 50% 50%)");
    set(img, "transform", `scale(${1 + (C.reveal.scale - 1) * seg(p, C.reveal.zoom)})`);
  }

  // 동작 줄이기: 3단계부터는 회전·이동 없이 페이드로만 바뀜
  function renderCalm(p) {
    opening(p);
    const K = C.calm;
    set(cam, "left", pv.cx + "px"); set(cam, "top", pv.cy + "px");
    set(stage, "perspectiveOrigin", `${pv.cx}px ${pv.cy}px`);
    if (floor) set(floor, "opacity", "0");
    [l4, l5].forEach(el => { set(el.firstElementChild, "transform", "none"); set(el, "opacity", String(seg(p, K.second))); });
    const f = seg(p, K.field);
    set(cam, "opacity", String(f));
    [pivot, l4, l5].forEach(el => set(el, "visibility", f >= 1 ? "hidden" : "visible"));
    set(centreWord, "visibility", f >= 1 ? "visible" : "hidden");
    set(world, "--wo", (1 - seg(p, K.wordsOut)).toFixed(3));
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
  // 1~4단계만 확인할 때는 4단계 끝(단어 공간이 다 깔린 상태)에서 멈추고 스크롤 길이도 그만큼만
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
