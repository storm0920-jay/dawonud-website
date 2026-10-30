/* =========================================================
   사업실적 목록
   - 한 건 = 중괄호 { } 하나. 복사해서 늘리면 됩니다.
   - field 는 "경관", "공공디자인", "색채디자인", "유니버설디자인" 중 하나
   - featured: true 이면 메인 화면 "대표 실적"에 나옵니다 (6건 권장)
   - image 는 assets/img/projects/ 폴더의 사진 경로. 없으면 회색 상자로 보입니다.
   - placeholder: true 는 "예시" 표시. 실제 실적에는 빼세요.
   지금 들어 있는 항목은 모두 자리를 잡기 위한 예시이며 실제 실적이 아닙니다.
   ========================================================= */
const PROJECTS = [
  { id: "sample-1", placeholder: true, featured: true, field: "경관", year: 2026,
    title: "예시 실적 1 (경관계획)", client: "발주처 입력 예정", location: "위치 입력 예정",
    period: "기간 입력 예정", scope: "업무 범위 입력 예정",
    summary: "사업실적 자료를 받으면 이 자리에 사업 개요가 들어갑니다." },
  { id: "sample-2", placeholder: true, featured: true, field: "공공디자인", year: 2025,
    title: "예시 실적 2 (공공디자인)", client: "발주처 입력 예정", location: "위치 입력 예정",
    period: "기간 입력 예정", scope: "업무 범위 입력 예정",
    summary: "사업실적 자료를 받으면 이 자리에 사업 개요가 들어갑니다." },
  { id: "sample-3", placeholder: true, featured: true, field: "색채디자인", year: 2025,
    title: "예시 실적 3 (색채디자인)", client: "발주처 입력 예정", location: "위치 입력 예정",
    period: "기간 입력 예정", scope: "업무 범위 입력 예정",
    summary: "사업실적 자료를 받으면 이 자리에 사업 개요가 들어갑니다." },
  { id: "sample-4", placeholder: true, featured: true, field: "유니버설디자인", year: 2024,
    title: "예시 실적 4 (유니버설디자인)", client: "발주처 입력 예정", location: "위치 입력 예정",
    period: "기간 입력 예정", scope: "업무 범위 입력 예정",
    summary: "사업실적 자료를 받으면 이 자리에 사업 개요가 들어갑니다." },
  { id: "sample-5", placeholder: true, featured: true, field: "경관", year: 2024,
    title: "예시 실적 5 (야간경관)", client: "발주처 입력 예정", location: "위치 입력 예정",
    period: "기간 입력 예정", scope: "업무 범위 입력 예정",
    summary: "사업실적 자료를 받으면 이 자리에 사업 개요가 들어갑니다." },
  { id: "sample-6", placeholder: true, featured: true, field: "공공디자인", year: 2023,
    title: "예시 실적 6 (공공시설물)", client: "발주처 입력 예정", location: "위치 입력 예정",
    period: "기간 입력 예정", scope: "업무 범위 입력 예정",
    summary: "사업실적 자료를 받으면 이 자리에 사업 개요가 들어갑니다." },
  { id: "sample-7", placeholder: true, field: "색채디자인", year: 2023,
    title: "예시 실적 7 (색채 가이드라인)", client: "발주처 입력 예정" },
  { id: "sample-8", placeholder: true, field: "경관", year: 2022,
    title: "예시 실적 8 (경관심의)", client: "발주처 입력 예정" },
];

const FIELD_SLUG = { "경관": "landscape", "공공디자인": "public", "색채디자인": "color", "유니버설디자인": "universal" };

function phTag(p) { return p.placeholder ? '<span class="ph-tag">예시</span>' : ""; }

function projectThumb(p) {
  return p.image
    ? `<img src="${p.image}" alt="${p.title}" loading="lazy">`
    : `<div class="thumb-empty field-${FIELD_SLUG[p.field]}"><span>사진 준비 중</span></div>`;
}

function projectCard(p) {
  return `
    <a class="project-card" href="project.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb">${projectThumb(p)}</div>
      <div class="project-meta">
        <span class="chip field-${FIELD_SLUG[p.field]}">${p.field}</span>
        <span class="year">${p.year}</span>${phTag(p)}
      </div>
      <h3>${p.title}</h3>
      <p class="client">${p.client || ""}</p>
    </a>`;
}
