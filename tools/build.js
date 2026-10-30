/* 사업실적 데이터에서 홈페이지용 파일과 제출용 PDF를 만듭니다.
 *
 *   DAWON_PASS="비밀번호" node tools/build.js
 *
 * 원본(날짜 포함):   private/projects.json   ← 홈페이지에 올라가지 않음(.vercelignore)
 * 홈페이지용(연도만): data/projects.js
 * 제출용 PDF(암호화): data/records.pdf.enc  ← manage.html 에서 비밀번호를 넣고 내려받음
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const src = JSON.parse(fs.readFileSync(path.join(ROOT, "private/projects.json"), "utf8"));
const P = src.projects;
const pass = (process.env.DAWON_PASS || "").replace(/[\s-]/g, "");
if (!pass) { console.error("DAWON_PASS 환경변수가 필요합니다."); process.exit(1); }

const year = d => Number(d.slice(0, 4));
const dot = d => d.replace(/-0?(\d+)-0?(\d+)/, ".$1.$2.").replace(/^(\d{4})\./, "$1.");
const fmt = d => { const [y, m, dd] = d.split("-").map(Number); return `${y}.${m}.${dd}.`; };

/* ---------- 1. 홈페이지용 data/projects.js (연도만) ---------- */
const pub = P.map(p => {
  const y0 = year(p.start);
  const y1 = p.ongoing ? null : Math.max(year(p.end), y0);
  return { no: p.no, name: p.name, type: p.type, field: p.field, y0, y1, ongoing: p.ongoing };
}).sort((a, b) => b.y0 - a.y0 || b.no - a.no);

fs.writeFileSync(path.join(ROOT, "site/data/projects.js"),
`/* 이 파일은 tools/build.js 가 만듭니다. 직접 고치지 마세요.
   원본은 private/projects.json 이고, 홈페이지에는 연도까지만 나옵니다. */
const PROJECTS_ASOF = ${JSON.stringify(src.asof)};
const PROJECTS = ${JSON.stringify(pub)};
`);

/* ---------- 2. 제출용 A4 세로 PDF ---------- */
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const rowsHtml = P.slice().sort((a, b) => a.no - b.no).map(p => `
  <tr><td class="c">${p.no}</td><td>${esc(p.name)}</td><td class="c">${esc(p.type)}</td>
  <td class="c">${fmt(p.start)}~<br>${p.ongoing ? "현재진행중" : fmt(p.end)}</td></tr>`).join("");
const asof = src.asof.replace(/-/g, ".");
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>
@page { size: A4 portrait; margin: 16mm 14mm 16mm; }
* { box-sizing: border-box; }
body { font-family: Pretendard, "Noto Sans CJK KR", "WenQuanYi Zen Hei", sans-serif; font-size: 9.5pt; color: #111; margin: 0; }
h1 { font-size: 18pt; text-align: center; margin: 0 0 4mm; letter-spacing: .08em; }
.meta { display: flex; justify-content: space-between; font-size: 9pt; color: #333; margin-bottom: 3mm; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { display: table-header-group; }
th { background: #EFEFEF; border: .6pt solid #555; padding: 2mm 1mm; font-weight: 700; }
td { border: .6pt solid #888; padding: 1.8mm 2mm; vertical-align: middle; line-height: 1.4; }
tr { page-break-inside: avoid; }
.c { text-align: center; }
col.n { width: 11mm; } col.t { width: 32mm; } col.d { width: 29mm; }
</style></head><body>
<h1>주요사업 수행실적</h1>
<div class="meta"><span>다원 도시디자인 (대표 김현호)</span><span>기준일 ${asof}</span></div>
<table><colgroup><col class="n"><col><col class="t"><col class="d"></colgroup>
<thead><tr><th>번호</th><th>용역명</th><th>용역개요</th><th>용역기간</th></tr></thead>
<tbody>${rowsHtml}</tbody></table></body></html>`;

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  await pg.setContent(html, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  const pdf = await pg.pdf({
    format: "A4", printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: "<span></span>",
    footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#555"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
  });
  await b.close();
  fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "out/사업수행실적_다원.pdf"), pdf); // out/ 은 git 에 올리지 않음

  /* ---------- 3. 암호화(AES-256-GCM, 키는 PBKDF2) ---------- */
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), iter = 310000;
  const key = crypto.pbkdf2Sync(pass, salt, iter, 32, "sha256");
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(pdf), c.final(), c.getAuthTag()]); // WebCrypto 형식: 암호문 뒤에 태그
  fs.writeFileSync(path.join(ROOT, "site/data/records.pdf.enc"), JSON.stringify({
    v: 1, iter, asof: src.asof, count: P.length,
    salt: salt.toString("base64"), iv: iv.toString("base64"), data: enc.toString("base64"),
  }));
  console.log("완료:", P.length, "건, PDF", (pdf.length / 1024).toFixed(0), "KB");
})();
