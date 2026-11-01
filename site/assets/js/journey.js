/* 메인 스크롤 장면
   1~4단계: 작업지시서대로 (세 줄 문장 → 셔터 → 두 번째 문장 → 단어 공간 등장)
   5단계부터: SANTAL 구조분석(3장)의 수치로 만든 3D 상자 공간. 한 변 1인 상자가 층마다 격자로 쌓인 피라미드이고,
   상자 앞면에 큰 단어, 왼쪽 옆면에 작은 동사가 붙어 있음. 망원 카메라(화면 세로에 상자 약 2개)가 정면에서 위로 반원을 그리며
   시계 방향으로 돌고 → 가운데 층들이 흐르다 사라지고 엇갈린 열이 반듯해짐 → 위에서 본 상자 격자 → 가운데 상자 안으로 내려가 이미지가 열림.
   스크롤 위치에 1:1로 묶여 있어서(scrub) 멈추면 멈추고, 올리면 거꾸로 돕니다.
   단어·구간(%)·수치는 모두 아래 CONFIG 에서 고칩니다. 구간 값은 이 섹션 스크롤 진행도(0~1)입니다. */
import * as THREE from "../vendor/three.module.min.js";

const CONFIG = {
  words: {
    first: ["Design", "Shapes", "Place"],              // 1단계 세 줄. 마지막 줄이 피벗 단어
    second: ["Defines", "Life"],                       // 3단계: 피벗 단어 아래 두 줄 (Place / Defines / Life)
    mid: ["Landscape", "Color", "Place", "Universal", "Public"],      // 정면 가운데 줄 (업종 키워드)
    top: ["Context", "Path", "Elevation", "Grid", "Layer"],           // 정면 윗줄
    bot: ["Identity", "Heritage", "People", "Balance", "Life"],       // 정면 아랫줄
    back: ["Civil", "Architecture", "Urban", "City", "Park", "Plaza", "Boulevard", "Terrain", "Skyline", "Facade", "Pavement", "Garden", "Street", "Bridge", "Waterfront", "Lighting", "Signage", "Square", "Axis", "Section", "Plan", "Network", "Flow", "Link", "Commons", "Fabric", "Edge", "Order", "Rhythm", "Memory", "Culture", "Welcome", "Access", "Shared", "Threshold", "Unity", "Harmony", "Belonging", "Together", "Community", "Connects", "Shapes", "Defines"],   // 회전하며 뒤에 보이는 단어(겹치지 않게 돌아가며)
    sense: ["Walk", "Pause", "Gather"],                // 상자 왼쪽 옆면 동사 3개 순환
  },
  // 구간 비율은 밝은 녹화(Video Project_색반전, 0~33초)의 스크롤바 위치를 0.5초마다 재서 맞춤. 일정한 속도로 내리면 녹화와 같은 속도로 바뀜
  scroll: { scrub: 1, length: 900 },                   // 관성(초), 장면을 붙잡아 둔 채 스크롤하는 길이(vh)
  upTo: 9,                                             // 4면 1~4단계까지만 보여 줌
  type: { tracking: "-0.02em", leading: .98, white2: .75 },

  s1: { from: 0, to: .04, rise: .4, right: .62, centerY: .45, barW: .09 },     // 녹화 1~2초
  s2: { close: [.04, .06], narrow: [.06, .075], end: .08 },                    // 녹화 2초
  s3: { l2: [.08, .10], l3: [.09, .11], indent: 2 },                           // 녹화 3초
  s4: { merge: [.11, .15], reveal: [.135, .17], handOff: .11 },                 // 녹화 4~5초. 세 줄이 모두 3D 상자 앞면으로 넘어가 3D 안에서 모이고, 모인 뒤 주변이 가까운 순서로 나타남

  // 상자 공간 (단위: 상자 한 변 = 1). 층: [층 번호(높이), 열, 깊이, 불투명도]
  cubes: {
    layers: [[6, 7, 7, 1], [5, 9, 9, 1], [4, 11, 3, 1], [3, 11, 3, 1], [2, 11, 3, 1], [1, 11, 3, 1], [0, 11, 3, 1], [-1, 11, 3, .2],
             [-2, 1, 1, .12], [-3, 3, 3, .1], [-4, 5, 5, 0]],
    middle: [-1, 4],                                   // 흐르다 사라지는 가운데 층(11×3)
    faces: { front: .7, left: .4, right: .2, top: .6 }, // 면 불투명도
    line: .2,                                          // 모서리 선 불투명도 (1px)
    word: .175, side: .175,                            // 글자 크기 (상자 높이 대비). 옆면 동사도 앞면 명사와 같은 크기·재질
    shift: { layer: 5, col: 2, depth: 1 },             // 단어 순환: 층마다 5칸, 열마다 2칸, 깊이마다 1칸 밀기
    stagger: { col: .25, colMax: 1 },                  // 가운데에서 먼 열일수록 뒤로 밀림 (층 엇갈림은 셰이더의 lstag)
    well: true,                                        // 꼭대기 층 가운데 상자를 비워 우물처럼 (바닥에 이미지)
  },
  // 카메라: tilt 정면→위(도), roll 화면 시계 방향 회전(도). 녹화 기준
  camera: [
    { p: .17, tilt: 0, roll: 0 },            // 5초: 정면 (주변 단어가 다 나타난 뒤 회전 시작)
    { p: .20, tilt: 12, roll: 25 },          // 6초
    { p: .23, tilt: 25, roll: 45 },          // 7~8초
    { p: .26, tilt: 40, roll: 62 },          // 9~10초
    { p: .29, tilt: 55, roll: 80 },          // 11초: 거의 세로
    { p: .34, tilt: 75, roll: 115 },         // 12~13초: 앞면 단어가 누워 얇은 선
    { p: .39, tilt: 88, roll: 150 },         // 15초
    { p: .55, tilt: 90, roll: 176 },         // 16~21초: 위에서 본 상자 격자
    { p: .78, tilt: 90, roll: 180 },         // 27초
  ],
  orbit: { range: [.17, .39], dist: [8, 18.5], zoomOut: .6 },   // 반원 궤도: 거리 8 → 18.5(높이 약 25), 줌 1 → 0.6
  cycle: { range: [.18, .25], steps: 3 },              // 가운데 층이 한 칸씩 3번 흐름
  middleOut: [.25, .39],                               // 가운데 층·윗면 대각선이 사라지고 엇갈린 열이 반듯해짐
  centre: [.17, .40],                                  // 피벗 단어 자리에서 화면 정중앙으로
  front: { range: [.17, .215], rows: [1, .6, .35, .2] },   // 정면에서는 같은 자리에 겹친 단어 중 맨 앞 하나만 보이고, 줄(위아래)이 멀수록 옅음. 시점이 돌며 뒤 단어들이 드러남
  hold: { range: [.39, .76], push: .85 },              // 상자만 남아 천천히 다가감
  dive: { range: [.76, .95], fov: 30, view: .9 },      // 가운데 상자로 내려감 (화각 30°로 넓어지며 벽이 보임)
  image: { in: [.76, .82], fill: [.90, .95], zoom: [.95, 1], scale: 1.25 },
  tilt: { x: 6, y: 3, damp: 4, minWidth: 1024 },       // 마우스 기울임 (좌우·상하 최대 각도)
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
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const D = Math.PI / 180;

  // ---------- 화면 요소 ----------
  stage.style.letterSpacing = C.type.tracking;
  stage.style.lineHeight = C.type.leading;
  const l1 = $(".j-l1"), l2 = $(".j-l2"), pivot = $(".j-pivot"), l4 = $(".j-l4"), l5 = $(".j-l5");
  l1.textContent = Wd.first[0]; l2.textContent = Wd.first[1]; pivot.textContent = Wd.first[2];
  l4.firstElementChild.textContent = Wd.second[0]; l5.firstElementChild.textContent = Wd.second[1];
  l4.style.color = l5.style.color = `rgba(255,255,255,${C.type.white2})`;
  journey.setAttribute("aria-label", `${Wd.first.join(" ")}. ${[Wd.first[2], ...Wd.second].join(" ")}.`);
  const shutT = $(".j-shut-t"), shutB = $(".j-shut-b"), bar = $(".j-bar");
  const canvas = $(".j-gl");
  const reveal = $(".j-reveal"), img = reveal.firstElementChild;

  // ---------- 3D 상자 공간 (three.js) ----------
  let gl = null, sorter = null, lineSecond = null;
  try { gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { gl = null; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(15, 1, .1, 1000);
  const U = { uCycle: { value: 0 }, uAlign: { value: 0 }, uMid: { value: 1 }, uAlpha: { value: 0 }, uDiag: { value: 1 },
              uWords: { value: 1 }, uMap: { value: null }, uReveal: { value: 0 }, uSeq: { value: 1 }, uD: { value: 8 },
              uO2: { value: new THREE.Vector2() }, uO3: { value: new THREE.Vector2() }, uFront: { value: 1 } };
  const common = `
    attribute vec4 aBox;   // x, 층 높이, z, 층 불투명도
    attribute float aRow;  // 같은 자리에 겹친 상자 중 뒤쪽이면 1 (정면에서 숨김)
    attribute vec4 aInfo;  // 열 엇갈림, 가운데 층 여부, 세 줄 상자 번호(1 Place, 2 Defines, 3 Life), 가운데에서의 거리(0~1)
    uniform float uCycle, uAlign, uMid, uAlpha, uReveal;
    varying float vOp;
    float rev;
    float lstag(float y) { return y <= 0. ? 0. : y <= 1. ? .25 * y : y <= 2. ? .25 + .5 * (y - 1.) : .75 + (y - 2.); }
    float midOp(float y) { return y < -1. ? .4 * (y + 1.5) : y < 0. ? mix(.2, 1., y + 1.) : y <= 4. ? 1. : max(0., 1. - (y - 4.) * 2.); }
    vec3 boxAt() {
      float y = aBox.y; vOp = aBox.w;
      if (aInfo.y > .5) { y = mod(aBox.y - uCycle + 1.5, 6.) - 1.5; vOp = midOp(y) * uMid; }
      rev = clamp(uReveal * 1.8 - aInfo.w * .8, 0., 1.);
      vOp *= uAlpha * rev;
      return vec3(aBox.x, y, aBox.z - (aInfo.x + lstag(y)) * (1. - uAlign));
    }`;
  const proj = `gl_Position = projectionMatrix * modelViewMatrix * vec4(bp + local, 1.);`;
  const mat = (vs, fs, depthWrite, order) => {
    const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: common + vs, fragmentShader: fs, transparent: true, depthWrite, side: THREE.DoubleSide });
    m._order = order; return m;
  };
  const faceMat = mat(`attribute float aFace; varying float vFace; void main(){ vec3 bp = boxAt(); vec3 local = position; vFace = aFace; if (abs(bp.y) < .5 && abs(aFace - ${C.cubes.faces.top}) < .001) vFace = 0.; ${proj} }`,   // 층 0은 위판 없음
    `varying float vOp; varying float vFace; void main(){ gl_FragColor = vec4(vec3(.067), vFace * vOp); }`, false, 2);
  const lineShift = new THREE.Vector2();   // 고해상도 화면에서 선을 CSS 1px 두께로 만들기 위해 한 번 더 그리는 어긋남(장치 픽셀 1칸)
  const lineMat = mat(`attribute float aDiag; uniform float uDiag; void main(){ vec3 bp = boxAt(); vec3 local = position; vOp *= mix(1., uDiag, aDiag); ${proj} }`,
    `varying float vOp; void main(){ gl_FragColor = vec4(.949, .941, .941, ${C.cubes.line} * vOp); if (gl_FragColor.a < .003) discard; }`, false, 0);   // 선·면은 깊이를 기록하지 않음 (뒤의 선이 비쳐 보임)
  const wordFS = `uniform sampler2D uMap; uniform float uWords; varying float vOp; varying vec2 vUv;
    void main(){
      // 글자 그림은 작게 줄여 쓰므로 가장자리가 번져 있음. 번진 가장자리(알파 0.5가 글자 윤곽)를 SDF처럼 한 픽셀 폭으로 또렷하게 다듬음
      float a0 = texture2D(uMap, vUv).a, w = max(fwidth(a0) * .75, .03);
      float a = smoothstep(.5 - w, .5 + w, a0) * vOp * uWords;
      if (a < .01) discard;
      gl_FragColor = vec4(.941, .941, .941, a); }`;
  // 세 줄 상자(Place·Defines·Life)의 단어는 주변보다 먼저 보이고, Defines·Life는 처음엔 HTML 때와 같은 자리·크기(깊이 보정)에서 시작해 Place 자리로 모임
  const wordVS = (place, front) => `attribute vec4 aUV; attribute vec2 aSize; uniform float uWords, uSeq, uD, uFront; uniform vec2 uO2, uO3; varying vec2 vUv;
    void main(){ vec3 bp = boxAt(); vUv = mix(aUV.xy, aUV.zw, uv);
      float z = ${front ? "aInfo.z" : "0."}, k = max(z - 1., 0.), comp = mix(1., (uD + k) / uD, uSeq);
      vec2 off = z > 2.5 ? uO3 : z > 1.5 ? uO2 : vec2(0.);
      off = vec2(off.x, off.y * uSeq) * comp;
      float ay = abs(bp.y), pos = ay < .5 ? ${C.front.rows[0].toFixed(2)} : ay < 1.5 ? ${C.front.rows[1].toFixed(2)} : ay < 2.5 ? ${C.front.rows[2].toFixed(2)} : ${C.front.rows[3].toFixed(2)};
      vOp *= mix(1., pos, uFront) * (1. - uFront * aRow);
      ${place}
      local.xy = local.xy * (z > 1.5 ? comp : 1.) + (z > 1.5 ? off : vec2(0.));
      if (z > .5) vOp = uAlpha * (z > 1.5 ? mix(1., .75, uSeq) * (1. - uFront * (1. - uSeq)) : 1.);
      ${proj} }`;
  const frontMat = mat(wordVS(`vec3 local = vec3(position.xy * aSize, .501);`, true), wordFS, true, 1);
  // 옆면 단어: 왼쪽 면에 90° 돌려 붙임 (아래에서 위로 읽힘)
  const sideMat = mat(wordVS(`vec3 local = vec3(-.501, position.y * aSize.y, -position.x * aSize.x);`), wordFS, true, 1);

  // 상자 하나의 면 4개(앞, 왼쪽, 오른쪽, 위)와 모서리 12개 + 윗면 대각선
  function boxGeometries() {
    const F = C.cubes.faces, P = [], A = [], I = [];
    const quad = (pts, a) => { const n = P.length / 3; pts.forEach(p => P.push(...p)); A.push(a, a, a, a); I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
    const h = .5;
    quad([[-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]], F.front);
    quad([[-h, -h, -h], [-h, -h, h], [-h, h, h], [-h, h, -h]], F.left);
    quad([[h, -h, h], [h, -h, -h], [h, h, -h], [h, h, h]], F.right);
    quad([[-h, h, h], [h, h, h], [h, h, -h], [-h, h, -h]], F.top);
    const faces = new THREE.BufferGeometry();
    faces.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    faces.setAttribute("aFace", new THREE.Float32BufferAttribute(A, 1));
    faces.setIndex(I);
    const c = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [7, 2]];   // 마지막: 윗면 대각선
    const LP = [], LD = [];
    E.forEach(([a, b], k) => { LP.push(...c[a], ...c[b]); LD.push(k === 12 ? 1 : 0, k === 12 ? 1 : 0); });
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(LP, 3));
    lines.setAttribute("aDiag", new THREE.Float32BufferAttribute(LD, 1));
    return { faces, lines };
  }

  // 단어 그림판: 글자를 한 장의 텍스처에 모아 그림 (HTML 글자와 같은 서체·자간·줄 높이)
  function buildAtlas() {
    const words = [...Wd.mid, ...Wd.top, ...Wd.bot, ...Wd.back, ...Wd.sense, Wd.first[2], ...Wd.second];
    const F = 160, lead = C.type.leading, pad = 12, fam = getComputedStyle(stage).fontFamily;
    const cv = document.createElement("canvas"), cx = cv.getContext("2d");
    const font = () => { cx.font = `400 ${F}px ${fam}`; cx.letterSpacing = (-.02 * F) + "px"; cx.fillStyle = "#fff"; };
    font();
    const ms = words.map(w => cx.measureText(w));
    const asc = ms[0].fontBoundingBoxAscent || F * .8, desc = ms[0].fontBoundingBoxDescent || F * .2;
    const rowH = Math.ceil(F * lead) + pad * 2, Wt = 2048;
    let x = 0, y = 0; const pos = [];
    ms.forEach(m => { const w = Math.ceil(m.width) + pad * 2; if (x + w > Wt) { x = 0; y += rowH; } pos.push([x, y, w]); x += w; });
    cv.width = Wt; cv.height = y + rowH;
    font();
    const base = pad + (F * lead - (asc + desc)) / 2 + asc;
    const rects = words.map((w, i) => {
      const [px, py, pw] = pos[i];
      cx.fillText(w, px + pad, py + base);
      return { uv: [px / Wt, 1 - (py + rowH) / cv.height, (px + pw) / Wt, 1 - py / cv.height], w: pw / F, h: rowH / F };
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4; tex.colorSpace = THREE.NoColorSpace;
    U.uMap.value?.dispose(); U.uMap.value = tex;
    return rects;
  }

  const plane = new THREE.PlaneGeometry(1, 1);
  const inst = (base, attrs, n) => {
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
    for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k].a), attrs[k].n));
    g.instanceCount = n;
    return g;
  };
  function buildWorld() {
    scene.clear();
    const K = C.cubes, rects = buildAtlas(), nb = Wd.back.length, nf = 15 + nb, ns = Wd.sense.length;
    const box = [], info = [], rows = [], fUV = [], fSize = [], sUV = [], sSize = [];
    const mod = (a, n) => ((a % n) + n) % n; let wi = 0;
    for (const [L, cols, depth, op] of K.layers) {
      const mid = L >= C.cubes.middle[0] && L <= C.cubes.middle[1];
      for (let c = -(cols - 1) / 2; c <= (cols - 1) / 2; c++) for (let d = -(depth - 1) / 2; d <= (depth - 1) / 2; d++) {
        if (K.well && L === K.layers[0][0] && c === 0 && d === 0) continue;
        // 가운데 줄 세 상자(앞에서부터 Place, Defines, Life)가 화면에서 겹쳐 서 있음. 망원 카메라라 한 점에 모여 보임
        const stack = L === 0 && c === 0 ? 1 + ((depth - 1) / 2 - d) : 0;
        box.push(c, L, d, op); wi++; rows.push(d < (depth - 1) / 2 - .001 ? 1 : 0);
        info.push(Math.min(K.stagger.colMax, Math.abs(c) * K.stagger.col), mid ? 1 : 0, stack, Math.min(1, Math.hypot(c, L * .5, d - (depth - 1) / 2) / 7));
        const sh = K.shift, k = L * sh.layer + c * sh.col - d * sh.depth;
        const front = d >= (depth - 1) / 2 - .001, row = L === 0 ? 0 : L === 1 ? 1 : L === -1 ? 2 : -1;
        const fr = stack ? rects[nf + ns + stack - 1] : front && row >= 0 ? rects[row * 5 + mod(c + 2, 5)] : rects[15 + mod(wi, nb)], sr = rects[nf + mod(k, ns)];
        fUV.push(...fr.uv); fSize.push(fr.w * K.word, fr.h * K.word);
        sUV.push(...sr.uv); sSize.push(sr.w * K.side, sr.h * K.side);
      }
    }
    const n = box.length / 4, B = { aBox: { a: box, n: 4 }, aInfo: { a: info, n: 4 }, aRow: { a: rows, n: 1 } };
    const { faces, lines } = boxGeometries();
    const add = (o, m) => { o.frustumCulled = false; o.renderOrder = m._order; scene.add(o); };
    const lg = inst(lines, B, n);
    add(new THREE.LineSegments(lg, lineMat), lineMat);
    const lineMat2 = new THREE.ShaderMaterial({ uniforms: { ...U, uShift: { value: lineShift } }, vertexShader: lineMat.vertexShader.replace(/\}\s*$/, " gl_Position.xy += uShift * gl_Position.w; }").replace("uniform float uDiag;", "uniform float uDiag; uniform vec2 uShift;"), fragmentShader: lineMat.fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    lineMat2._order = 0; lineMat2.userData.second = true;
    lineSecond = new THREE.LineSegments(lg, lineMat2); add(lineSecond, lineMat2);
    const fg = inst(plane, { ...B, aUV: { a: fUV, n: 4 }, aSize: { a: fSize, n: 2 } }, n), sg = inst(plane, { ...B, aUV: { a: sUV, n: 4 }, aSize: { a: sSize, n: 2 } }, n);
    add(new THREE.Mesh(fg, frontMat), frontMat);
    add(new THREE.Mesh(sg, sideMat), sideMat);
    // 단어는 깊이를 기록하므로 먼 것부터 그려야 겹친 글자가 깨지지 않음 (three.js가 조각마다 정렬하는 것과 같은 효과)
    sorter = { n, box, info, sets: [[fg, { aBox: box, aInfo: info, aRow: rows, aUV: fUV, aSize: fSize }], [sg, { aBox: box, aInfo: info, aRow: rows, aUV: sUV, aSize: sSize }]], key: "" };
    add(new THREE.Mesh(inst(faces, B, n), faceMat), faceMat);
  }
  if (gl) buildWorld();

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
    // 3D로 넘어갈 때 Defines·Life가 HTML과 같은 자리에서 시작하도록 (1단위 = 글자 크기 / word)
    const u = fs / C.cubes.word;
    U.uO2.value.set((pv.left + C.s3.indent * fs + l4.offsetWidth / 2 - pv.cx) / u, -lh / u);
    U.uO3.value.set((pv.left + l5.offsetWidth / 2 - pv.cx) / u, -2 * lh / u);
    if (gl) {
      const dpr = Math.min(devicePixelRatio, 2); gl.setPixelRatio(dpr); gl.setSize(W, H, false);
      lineShift.set(2 / (W * dpr), -2 / (H * dpr));   // 장치 픽셀 1칸
      if (lineSecond) lineSecond.visible = dpr >= 1.5;
    }
  }

  // ---------- 카메라 ----------
  const tilt = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), ex = new THREE.Euler(), off = new THREE.Vector3();
  function keyAt(p) {
    const K = C.camera;
    if (p <= K[0].p) return K[0];
    for (let i = 0; i < K.length - 1; i++) {
      const a = K[i], b = K[i + 1];
      if (p <= b.p) { const t = io((p - a.p) / (b.p - a.p)); return { tilt: mix(a.tilt, b.tilt, t), roll: mix(a.roll, b.roll, t) }; }
    }
    return K[K.length - 1];
  }
  // 화면 세로에 보이는 높이(단위) V를, 바라보는 점까지 거리 d에서 맞추는 망원 카메라
  function placeCamera(p) {
    const V0 = C.cubes.word * H / fs;                   // 3D 글자 크기 = HTML 글자 크기 (피벗 단어가 그대로 이어짐)
    const o = io(seg(p, C.orbit.range)), k = keyAt(p);
    const top = C.cubes.layers[1][0] + .5;              // 우물 바닥(가운데 상자 윗면) 높이
    const target = new THREE.Vector3(0, mix(0, top, o), mix(1.5, 0, o));
    let V = mix(V0, V0 / C.orbit.zoomOut, o) * mix(1, C.hold.push, io(seg(p, C.hold.range)));
    let d = mix(C.orbit.dist[0], C.orbit.dist[1], o);
    let fov = 2 * Math.atan(V / 2 / d) / D;
    const dv = io(seg(p, C.dive.range));
    if (dv > 0) { V = mix(V, C.dive.view, dv); fov = mix(fov, C.dive.fov, dv); d = V / 2 / Math.tan(fov * D / 2); }
    camera.fov = fov; U.uD.value = d;
    qA.setFromEuler(ex.set(-k.tilt * D, 0, 0));
    qB.setFromEuler(ex.set(0, 0, k.roll * D)); qA.multiply(qB);
    qB.setFromEuler(ex.set(tilt.y * C.tilt.y * D, -tilt.x * C.tilt.x * D, 0, "YXZ")); qA.multiply(qB);
    camera.quaternion.copy(qA);
    camera.position.copy(target).add(off.set(0, 0, d).applyQuaternion(qA));
    // 피벗 단어 자리에서 화면 가운데로
    const ct = io(seg(p, C.centre));
    camera.setViewOffset(W, H, (W / 2 - pv.cx) * (1 - ct), (H / 2 - pv.cy) * (1 - ct), W, H);
    camera.updateProjectionMatrix();
  }
  // 우물 바닥(가운데 상자 윗면)이 화면에서 차지하는 사각형
  const corner = new THREE.Vector3();
  function floorRect() {
    const y = C.cubes.layers[1][0] + .5; let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (const [x, z] of [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]]) {
      corner.set(x, y, z).project(camera);
      const sx = (corner.x + 1) / 2 * W, sy = (1 - corner.y) / 2 * H;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    return [y0, W - x1, H - y1, x0];   // inset: 위, 오른쪽, 아래, 왼쪽
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

  let lastP = 0;
  const lstag = y => y <= 0 ? 0 : y <= 1 ? .25 * y : y <= 2 ? .25 + .5 * (y - 1) : .75 + (y - 2);
  function sortWords() {
    const S = sorter; if (!S) return;
    camera.updateMatrixWorld();
    const e = camera.matrixWorldInverse.elements, key = [...e, U.uAlign.value].map(v => v.toFixed(3)).join();
    if (key === S.key) return; S.key = key;
    const vz = new Float32Array(S.n);
    for (let i = 0; i < S.n; i++) {
      const x = S.box[i * 4], y = S.box[i * 4 + 1], z = S.box[i * 4 + 2] - (S.info[i * 4] + lstag(y)) * (1 - U.uAlign.value);
      vz[i] = e[2] * x + e[6] * y + e[10] * z + e[14];     // 카메라 기준 깊이 (작을수록 멂)
    }
    const order = Array.from(vz.keys()).sort((a, b) => vz[a] - vz[b]);
    for (const [g, src] of S.sets) for (const k in src) {
      const at = g.attributes[k], sz = at.itemSize, a = at.array, s = src[k];
      order.forEach((o, j) => { for (let m = 0; m < sz; m++) a[j * sz + m] = s[o * sz + m]; });
      at.needsUpdate = true;
    }
  }
  function paint() { if (gl && U.uAlpha.value > 0) { sortWords(); gl.render(scene, camera); } }

  function render(p) {
    lastP = p;
    opening(p);
    // 3단계: 아래 두 줄이 마스크 아래에서 올라옴
    set(l4.firstElementChild, "transform", `translateY(${(1 - io(seg(p, C.s3.l2))) * 105}%)`);
    set(l5.firstElementChild, "transform", `translateY(${(1 - io(seg(p, C.s3.l3))) * 105}%)`);

    // 4단계: 두 줄이 피벗 줄로 모여 겹치고, 상자 공간이 서서히 나타남
    const g = io(seg(p, C.s4.merge));
    set(l4, "translate", `0 ${(-g * lh).toFixed(1)}px`);
    set(l5, "translate", `0 ${(-g * 2 * lh).toFixed(1)}px`);
    const handOff = p >= C.s4.handOff;   // 이 뒤로는 맨 앞 가운데 상자의 앞면 단어가 이어받음
    [pivot, l4, l5].forEach(el => set(el, "visibility", handOff ? "hidden" : "visible"));

    // 5~9단계: 상자 공간
    tilt.on = !calm && p > C.s4.handOff && p < C.dive.range[0];
    U.uAlpha.value = handOff ? 1 : 0;
    U.uSeq.value = 1 - io(seg(p, C.s4.merge));          // 1: 세 줄이 HTML 때처럼 벌어진 상태, 0: 한 점으로 모인 상태
    U.uReveal.value = seg(p, C.s4.reveal);
    U.uFront.value = 1 - io(seg(p, C.front.range));
    U.uCycle.value = C.cycle.steps * seg(p, C.cycle.range);
    const m = io(seg(p, C.middleOut));
    U.uMid.value = 1 - m; U.uDiag.value = 1 - m; U.uAlign.value = m;
    set(canvas, "opacity", U.uAlpha.value > 0 ? "1" : "0");
    placeCamera(p);
    paint();

    // 우물 바닥의 이미지: 작게 나타나 화면을 채운 뒤 천천히 확대
    const show = seg(p, C.image.in);
    if (show > 0) {
      const f = io(seg(p, C.image.fill)), r = floorRect().map(v => Math.max(0, v) * (1 - f));
      set(reveal, "clipPath", `inset(${r.map(v => v.toFixed(1) + "px").join(" ")})`);
    } else set(reveal, "clipPath", "inset(50% 50% 50% 50%)");
    set(reveal, "opacity", show.toFixed(3));
    set(img, "transform", `scale(${1 + (C.image.scale - 1) * seg(p, C.image.zoom)})`);
  }

  // 동작 줄이기: 3단계부터는 회전·이동 없이 페이드로만 바뀜
  function renderCalm(p) {
    lastP = p;
    opening(p);
    const K = C.calm;
    [l4, l5].forEach(el => { set(el.firstElementChild, "transform", "none"); set(el, "opacity", String(seg(p, K.second))); });
    const f = seg(p, K.field);
    [pivot, l4, l5].forEach(el => set(el, "visibility", f >= 1 ? "hidden" : "visible"));
    U.uAlpha.value = f * (1 - seg(p, K.image)); U.uSeq.value = 0; U.uReveal.value = 1; U.uFront.value = 1;
    U.uWords.value = 1 - seg(p, K.wordsOut);
    set(canvas, "opacity", U.uAlpha.value > 0 ? "1" : "0");
    placeCamera(C.s4.handOff);
    paint();
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
  const last = C.upTo >= 9 ? 1 : C.s4.reveal[1];
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

  // 마우스 기울임: 넓은 화면·마우스에서만, 부드럽게 따라옴
  if (!calm && matchMedia(`(min-width: ${C.tilt.minWidth}px) and (hover: hover) and (pointer: fine)`).matches) {
    addEventListener("pointermove", e => { tilt.tx = e.clientX / innerWidth * 2 - 1; tilt.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    gsap.ticker.add((t, dt) => {
      const gx = tilt.on ? tilt.tx : 0, gy = tilt.on ? tilt.ty : 0, k = 1 - Math.exp(-C.tilt.damp * dt / 1000);
      if (Math.abs(gx - tilt.x) + Math.abs(gy - tilt.y) < 1e-4) return;
      tilt.x += (gx - tilt.x) * k; tilt.y += (gy - tilt.y) * k;
      const rc = journey.getBoundingClientRect();
      if (rc.top <= 0 && rc.bottom >= innerHeight) { placeCamera(lastP); paint(); }
    });
  }

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
  // 글꼴이 다 받아진 뒤 단어 그림판을 그 글꼴로 다시 그림
  document.fonts && document.fonts.ready.then(() => { if (gl) buildWorld(); layout(); draw(state.p); ScrollTrigger.refresh(); });
})();
