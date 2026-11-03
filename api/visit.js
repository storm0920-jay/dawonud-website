// 오늘 방문자 수 (한국 시간 기준 하루 단위)
// - POST /api/visit : 오늘 숫자를 1 올리고 돌려줌 (같은 브라우저의 하루 중복은 site.js가 막음)
// - GET  /api/visit : 숫자만 읽음 (jay 기기, 이미 센 방문)
// 저장하는 것은 날짜별 숫자 하나뿐. IP, 기기 정보 등 개인정보는 저장하지 않음.
// 저장소: Vercel Storage의 Upstash Redis(무료). 연결 전에는 숫자 대신 null을 돌려주고, 화면에는 아무것도 안 보임.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// 검색엔진 로봇, 링크 미리보기, 자동 점검 도구 등은 세지 않음
const BOT = /bot|crawl|spider|slurp|scrap|fetch|preview|facebookexternalhit|kakaotalk-scrap|yeti|daumoa|headless|lighthouse|pagespeed|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|vercel/i;

function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

async function redis(commands) {
  const r = await fetch(URL_ + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return r.json();
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!URL_ || !TOKEN) return res.status(200).end(JSON.stringify({ today: null }));

  // 미리보기 주소(Vercel Preview)에서의 방문은 실제 숫자와 섞이지 않게 따로 셈
  const env = process.env.VERCEL_ENV === "production" ? "prod" : "test";
  const key = `visits:${env}:${todayKST()}`;
  const ua = String(req.headers["user-agent"] || "");
  const count = req.method === "POST" && ua.length > 0 && !BOT.test(ua);

  try {
    const out = count
      ? await redis([["INCR", key], ["EXPIRE", key, 60 * 60 * 24 * 40]])
      : await redis([["GET", key]]);
    const n = parseInt(out[0] && out[0].result, 10) || 0;
    res.status(200).end(JSON.stringify({ today: n }));
  } catch (e) {
    res.status(200).end(JSON.stringify({ today: null }));
  }
};
