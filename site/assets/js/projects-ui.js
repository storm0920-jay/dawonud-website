/* 사업실적 화면 공통 (data/projects.js 가 먼저 불러와져 있어야 합니다) */
const FIELD_SLUG = { "경관": "landscape", "공공디자인": "public", "색채디자인": "color", "유니버설디자인": "universal" };

function projectYears(p) {
  if (p.ongoing) return `${p.y0}~진행 중`;
  return p.y1 && p.y1 !== p.y0 ? `${p.y0}~${p.y1}` : String(p.y0);
}

function projectRow(p) {
  return `
    <li class="proj-row">
      <span class="proj-year">${projectYears(p)}</span>
      <span class="proj-name">${p.name}<small>${p.type}</small></span>
      <span class="chip field-${FIELD_SLUG[p.field]}" title="${p.field}">${SITE.fieldsEn[p.field]}</span>
    </li>`;
}

// 카드형 보기: 사진 대신 분야 파스텔 바탕(픽토그램은 jay 요청으로 뺌)
function projectCard(p) {
  const slug = FIELD_SLUG[p.field];
  return `
    <li class="proj-card fc-${slug}">
      <span class="pc-art"></span>
      <span class="proj-year">${projectYears(p)}</span>
      <span class="proj-name">${p.name}<small>${p.type}</small></span>
      <span class="chip field-${slug}" title="${p.field}">${SITE.fieldsEn[p.field]}</span>
    </li>`;
}
