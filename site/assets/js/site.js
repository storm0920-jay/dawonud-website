/* =========================================================
   다원 도시디자인 홈페이지 공통 설정
   회사 정보, 메뉴, 머리말/꼬리말은 모두 이 파일에서 바꿉니다.
   값이 null 이면 화면에 표시되지 않습니다.
   ========================================================= */
const SITE = {
  name: "다원 도시디자인",
  nameEn: "DAWON URBAN DESIGN",
  fields: ["경관", "공공디자인", "색채디자인", "유니버설디자인"],
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
  preview: true,

  logo: "assets/img/logo.svg",
  logoWhite: "assets/img/logo-white.svg",
};

const NAV = [
  { href: "about.html", label: "회사소개" },
  { href: "business.html", label: "사업분야" },
  { href: "projects.html", label: "사업실적" },
  { href: "news.html", label: "소식" },
  { href: "careers.html", label: "채용" },
  { href: "contact.html", label: "Contact us" },
];

(function renderChrome() {
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
          <img src="${SITE.logo}" alt="${SITE.name}" width="148" height="48">
        </a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">
          <span></span><span></span><span></span><span class="sr-only">메뉴 열기</span>
        </button>
        <nav id="site-nav" class="site-nav" aria-label="주 메뉴">
          ${NAV.map(n => `<a href="${n.href}"${page === n.href ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
        </nav>
      </div>`;
    const btn = header.querySelector(".nav-toggle");
    btn.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", open);
    });
  }

  const footer = document.querySelector("[data-site-footer]");
  if (footer) {
    const info = [
      ["대표", `${SITE.ceo}`],
      ["주소", SITE.address],
      ["이메일", SITE.email && `<a href="mailto:${SITE.email}">${SITE.email}</a>`],
      ["전화", SITE.phone],
      ["팩스", SITE.fax],
      ["사업자등록번호", SITE.bizNo],
    ].filter(([, v]) => v);
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="wrap footer-inner">
        <div>
          <img src="${SITE.logoWhite}" alt="${SITE.name}" width="148" height="48">
          <p class="footer-fields">${SITE.fields.join(" · ")}</p>
        </div>
        <dl class="footer-info">
          ${info.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
        </dl>
      </div>
      <div class="wrap footer-bottom">
        <span>© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</span>
        <a href="privacy.html">개인정보처리방침</a>
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
})();
