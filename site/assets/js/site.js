/* =========================================================
   다원 도시디자인 홈페이지 공통 설정
   회사 정보, 메뉴, 머리말/꼬리말은 모두 이 파일에서 바꿉니다.
   값이 null 이면 화면에 표시되지 않습니다.
   ========================================================= */
const SITE = {
  naverMapKey: "a9txtd7472", // 네이버 클라우드 Maps 인증 키(Client ID)를 넣으면 네이버 지도가 바로 열립니다
  name: "다원 도시디자인",
  nameEn: "DAWON URBAN DESIGN",
  fields: ["경관", "공공디자인", "색채디자인", "유니버설디자인"],
  fieldsEn: { "경관": "Landscape", "공공디자인": "Public Design", "색채디자인": "Color Design", "유니버설디자인": "Universal Design" },
  ceo: "김현호",
  ceoTitle: "소장",
  address: "서울시 영등포구 여의나루로 67, 신송빌딩 1205호",
  addressShort: "여의나루로 67 신송빌딩 1205호",
  email: "dawon@dawonud.com",
  phone: null,      // 예: "02-000-0000"
  fax: null,
  bizNo: null,      // 사업자등록번호
  founded: null,    // 설립 연도, 예: 2015

  // 문의 양식이 보내질 곳 (FormSubmit 무료 서비스. 첫 문의 때 위 메일로 확인 메일이 한 번 옵니다)
  formEndpoint: "https://formsubmit.co/dawon@dawonud.com",

  // true 이면 위쪽에 "미리보기" 안내 띠가 보입니다. 자료를 모두 넣은 뒤 false 로 바꾸세요.
  preview: false,

  // true 이면 하위 페이지 머리말의 메뉴(About, Business 등)를 숨기고 로고(홈으로)만 보임. 하위 페이지를 다 손본 뒤 false 로
  hideSubNav: true,

  logo: "assets/img/logo.svg",
  logoWhite: "assets/img/logo-white.svg",
};

const NAV = [
  { href: "about.html", label: "About" },
  { href: "business.html", label: "Business" },
  { href: "projects.html", label: "Projects" },
  { href: "contact.html", label: "Contact" },
];

(function renderChrome() {
  // 영문 로고 글자(DAWON 두껍게, Urban Design 가늘게)용 서체
  if (!document.querySelector('link[href*="Inter+Tight"]')) {
    const f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;800&display=swap";
    document.head.appendChild(f);
  }
  const here = location.pathname.split("/").pop() || "index.html";
  const page = document.body.dataset.page || here;

  if (SITE.preview) {
    const bar = document.createElement("div");
    bar.className = "preview-bar";
    bar.innerHTML = '미리보기 사이트입니다. <span class="ph-tag">예시</span> 표시가 있는 내용은 실제 자료를 받으면 바뀝니다.';
    document.body.prepend(bar);
  }

  const header = document.querySelector("[data-site-header]");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="wrap header-inner">
        <a class="brand" href="index.html" aria-label="${SITE.name} 홈">
          <span class="wordmark"><b>DAWON</b> <span>Urban Design</span></span>
        </a>
        ${SITE.hideSubNav ? "" : `<button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">
          <span></span><span></span><span></span><span class="sr-only">메뉴 열기</span>
        </button>
        <nav id="site-nav" class="site-nav" aria-label="주 메뉴">
          ${NAV.map(n => `<a href="${n.href}"${page === n.href ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
        </nav>`}
      </div>`;
    const btn = header.querySelector(".nav-toggle");
    if (btn) btn.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", open);
    });
  }

  const footer = document.querySelector("[data-site-footer]");
  if (footer) {
    const info = [
      ["Address", SITE.address],
      ["E-mail", SITE.email && `<a href="mailto:${SITE.email}">${SITE.email}</a>`],
      ["Tel", SITE.phone],
      ["Fax", SITE.fax],
      ["Business No.", SITE.bizNo],
    ].filter(([, v]) => v);
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="wrap footer-inner">
        <div>
          <span class="wordmark"><b>DAWON</b> <span>Urban Design</span></span>
          <p class="footer-fields">${SITE.fields.map(f => SITE.fieldsEn[f]).join(" · ")}</p>
        </div>
        <dl class="footer-info">
          ${info.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
        </dl>
      </div>
      <div class="wrap"><div class="footer-mark" aria-hidden="true">${SITE.nameEn}</div></div>
      <div class="wrap footer-bottom">
        <span>© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</span>
        <a href="privacy.html">Privacy Policy</a>
      </div>`;
  }

  document.querySelectorAll("[data-site]").forEach(el => {
    const v = SITE[el.dataset.site];
    if (v) el.textContent = v;
  });
  document.querySelectorAll("[data-site-email]").forEach(el => {
    el.href = "mailto:" + SITE.email;
    if (!el.textContent.trim()) el.textContent = SITE.email;
  });

  // PC(마우스 화면)에서는 메일 프로그램 대신 주소를 복사하고 안내. 휴대폰은 메일 앱이 열림
  const isPC = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const toast = msg => {
    let t = document.getElementById("copy-toast");
    if (!t) {
      t = document.createElement("div"); t.id = "copy-toast"; t.setAttribute("role", "status");
      t.style.cssText = "position:fixed;left:50%;bottom:48px;z-index:10000;transform:translate(-50%,12px);opacity:0;padding:14px 22px;border-radius:999px;background:#F4F2ED;color:#0E0E0E;font:500 15px/1 'SUIT',sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);pointer-events:none;transition:opacity .25s,transform .35s cubic-bezier(.23,1,.32,1)";
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = "1"; t.style.transform = "translate(-50%,0)";
    clearTimeout(t._h); t._h = setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translate(-50%,12px)"; }, 2200);
  };
  const copy = text => {
    const old = () => { const a = document.createElement("textarea"); a.value = text; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e) {} a.remove(); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(old); else old();
  };
  if (isPC) document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="mailto:"]'); if (!a) return;
    e.preventDefault(); copy(a.href.replace(/^mailto:/, "").split("?")[0]); toast("메일 주소가 복사되었습니다");
  });
})();

/* ---------------------------------------------------------
   펜선 픽토그램. data-icon="landscape" 처럼 쓰면 그 자리에 그려집니다.
   --------------------------------------------------------- */
const ICONS = {
  // 경관: 산과 건물 스카이라인
  landscape: '<path d="M3 40l12-16 8 9 7-11 15 18"/><path d="M8 44V30h7v14M30 44V26h8v18M18 44V36h6v8"/><path d="M2 44h44"/><circle cx="37" cy="9" r="4"/>',
  // 공공디자인: 가로등과 벤치
  public: '<path d="M12 44V8h10"/><path d="M18 8v4h8V8"/><path d="M26 34h18M28 34v10M42 34v10M26 28h18"/><path d="M2 44h44"/>',
  // 색채디자인: 겹친 색 견본
  color: '<rect x="4" y="16" width="18" height="24"/><rect x="15" y="10" width="18" height="24"/><rect x="26" y="4" width="18" height="24"/><path d="M26 16h18M15 22h11"/>',
  // 유니버설디자인: 휠체어 이용자와 경사로
  universal: '<circle cx="17" cy="7" r="3.5"/><path d="M17 12v13h11l5 11"/><path d="M17 18h9"/><circle cx="18" cy="33" r="9"/><path d="M30 44l16-10"/><path d="M2 44h44"/>',
  // 실적 목록
  list: '<path d="M6 4h28l8 8v32H6z"/><path d="M34 4v8h8"/><path d="M13 20h22M13 28h22M13 36h14"/>',
  // 자문 위원회
  advisory: '<circle cx="12" cy="14" r="5"/><circle cx="36" cy="14" r="5"/><circle cx="24" cy="10" r="5"/><path d="M3 38c1-8 5-12 9-12s6 2 7 4M45 38c-1-8-5-12-9-12s-6 2-7 4M14 42c1-9 5-14 10-14s9 5 10 14"/>',
  // 지도 핀(진행 중)
  pin: '<path d="M24 44S10 29 10 19a14 14 0 0 1 28 0c0 10-14 25-14 25z"/><circle cx="24" cy="19" r="5"/>',
  // 달력(연도)
  calendar: '<rect x="4" y="8" width="40" height="36"/><path d="M4 18h40M14 4v8M34 4v8M12 26h6M21 26h6M30 26h6M12 34h6M21 34h6"/>',
};
document.querySelectorAll("[data-icon]").forEach(el => {
  const d = ICONS[el.dataset.icon];
  if (d) el.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${d}</svg>`;
});

/* ---------------------------------------------------------
   스크롤 효과: 섹션 배경색 바꾸기, 천천히 떠오르기, 숫자 올라가기.
   움직임 줄이기 설정을 켠 사람에게는 배경색만 바꿉니다.
   --------------------------------------------------------- */
(function scrollEffects() {
  if (!("IntersectionObserver" in window)) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  const toned = document.querySelectorAll("main [data-tone]");
  if (toned.length) {
    root.classList.add("js-tone");
    const seen = new Map();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => seen.set(e.target, e.isIntersecting));
      let tone = "paper";
      toned.forEach(el => { if (seen.get(el) && el.dataset.tone !== "dark") tone = el.dataset.tone; });
      document.body.dataset.tone = tone;
    }, { rootMargin: "-45% 0px -45% 0px" });
    toned.forEach(el => io.observe(el));
  }

  if (calm) return;

  const reveal = document.querySelectorAll("[data-reveal]");
  if (reveal.length) {
    root.classList.add("js-reveal");
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    reveal.forEach(el => io.observe(el));
  }

  const counters = document.querySelectorAll("[data-count]");
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  counters.forEach(el => io.observe(el));
})();

// 휴대폰 하위 페이지: 오른쪽 아래 뒤로가기 버튼 (메뉴가 잠겨 있어 돌아갈 길이 필요). 보이고 숨기는 것은 style.css에서 화면 폭으로
(function backButton() {
  const page = document.body.dataset.page || location.pathname.split("/").pop() || "index.html";
  if (page === "index.html") return;
  const b = document.createElement("button");
  b.type = "button"; b.className = "back-fab"; b.setAttribute("aria-label", "뒤로가기");
  b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
  b.addEventListener("click", () => {
    let same = false;
    try { same = document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (same && history.length > 1) history.back(); else location.href = "index.html";
  });
  document.body.appendChild(b);
})();

/* ---------------------------------------------------------
   오늘 방문자 수 (꼬리말 맨 아래에 작게). 서버는 api/visit.js
   - 같은 브라우저는 하루(한국 시간)에 한 번만 셈. 새로고침·다른 페이지 이동은 안 셈
   - 내 기기 빼기: 주소 뒤에 ?me 를 붙여 한 번 열면(예: dawonud.com/?me) 그 브라우저는 앞으로 안 셈
     다시 세려면 ?me=off
   - manage.html은 세지도, 보이지도 않음. 저장소 연결 전이면 아무것도 안 보임
   --------------------------------------------------------- */
(function visitCounter() {
  const page = document.body.dataset.page || location.pathname.split("/").pop() || "index.html";
  if (page === "manage.html") return;
  // © 문구 바로 옆에 붙임 (꼬리말 칸 수가 그대로라 PC·휴대폰 배치가 바뀌지 않음)
  const sub = document.querySelector("footer.foot .foot-sub");   // 메인: 둘째 줄 맨 왼쪽
  const slot = sub || document.querySelector("footer.foot > span, .footer-bottom > span");
  const store = {
    get(k) {
      try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
      const m = document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : null;
    },
    set(k, v, days) {
      try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {}
      document.cookie = k + "=" + (v === null ? "" : encodeURIComponent(v)) + "; path=/; SameSite=Lax; max-age=" + (v === null ? 0 : Math.round(days * 86400));
    },
  };

  const q = new URLSearchParams(location.search);
  if (q.has("me")) {
    const off = q.get("me") === "off";
    store.set("dawonMe", off ? null : "1", 400);
    const t = document.createElement("div");
    t.setAttribute("role", "status");
    t.textContent = off ? "이 브라우저의 방문을 다시 셉니다" : "이 브라우저의 방문은 이제 방문자 수에 들어가지 않습니다";
    t.style.cssText = "position:fixed;left:50%;bottom:48px;z-index:10000;transform:translateX(-50%);max-width:calc(100% - 32px);padding:14px 22px;border-radius:999px;background:#F4F2ED;color:#0E0E0E;font:500 15px/1.4 'SUIT',sans-serif;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.25);transition:opacity .4s";
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 500); }, 3500);
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
  }

  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const me = store.get("dawonMe") === "1";
  const counted = store.get("dawonVisit") === today;
  const count = !me && !counted && !navigator.webdriver;
  if (count) store.set("dawonVisit", today, 2);

  fetch("/api/visit", { method: count ? "POST" : "GET", cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!slot || !d || typeof d.today !== "number") return;
      const el = document.createElement("span");
      el.className = "visit-today";
      el.textContent = "Today " + d.today.toLocaleString("en-US");
      el.title = "오늘 방문자 수";
      el.style.cssText = "margin-left:14px;white-space:nowrap;opacity:.75";
      sub ? sub.prepend(el) : slot.appendChild(el);
    })
    .catch(() => {});
})();
