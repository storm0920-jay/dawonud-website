/* 마우스 반응 효과 (마우스가 있는 컴퓨터에서만, 움직임 줄이기 설정이면 끔)
   1) 따라다니는 커서: 링크 위에서 커지고 글자(data-cursor)가 보임
   2) 첫 화면 그림과 제목이 마우스 방향으로 살짝 움직임
   3) 실적 그림이 마우스 쪽으로 기울어짐
   4) data-magnet 이 붙은 글자·버튼이 마우스에 끌려옴 */
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const lerp = (a, b, t) => a + (b - a) * t;
  let mx = innerWidth / 2, my = innerHeight / 2;

  // 1) 커서
  const cur = document.createElement("div");
  cur.className = "cursor";
  cur.innerHTML = '<span class="cursor-label"></span>';
  document.body.append(cur);
  document.documentElement.classList.add("has-cursor");
  const label = cur.firstChild;
  let cx = mx, cy = my;

  addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; cur.classList.add("on"); }, { passive: true });
  document.addEventListener("mouseleave", () => cur.classList.remove("on"));
  document.addEventListener("mouseover", e => {
    const t = e.target.closest("a, button, summary, [data-cursor]");
    cur.classList.toggle("big", !!t);
    label.textContent = t ? (t.dataset.cursor || "") : "";
    cur.classList.toggle("has-label", !!(t && t.dataset.cursor));
  });
  addEventListener("mousedown", () => cur.classList.add("press"));
  addEventListener("mouseup", () => cur.classList.remove("press"));

  // 2) 첫 화면
  const hero = document.querySelector("[data-parallax]");
  const art = hero && hero.querySelector(".hero-art");
  const title = hero && hero.querySelector("h1");
  let hx = 0, hy = 0;

  // 4) 끌려오는 요소
  const magnets = [...document.querySelectorAll("[data-magnet]")].map(el => ({ el, x: 0, y: 0 }));

  function frame() {
    cx = lerp(cx, mx, .2); cy = lerp(cy, my, .2);
    cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;

    if (hero) {
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0) {
        const tx = (mx / innerWidth - .5), ty = (my / innerHeight - .5);
        hx = lerp(hx, tx, .06); hy = lerp(hy, ty, .06);
        if (art) art.style.transform = `translate3d(${hx * -40}px, ${hy * -18}px, 0) scale(1.06)`;
        if (title) title.style.transform = `translate3d(${hx * 14}px, ${hy * 8}px, 0)`;
      }
    }

    magnets.forEach(m => {
      const r = m.el.getBoundingClientRect();
      const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * .75 + 60;
      const k = +(m.el.dataset.magnet || .25);
      m.x = lerp(m.x, near ? dx * k : 0, .12); m.y = lerp(m.y, near ? dy * k : 0, .12);
      m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 3) 실적 그림 기울기 (나중에 추가되는 카드도 적용)
  document.addEventListener("mousemove", e => {
    const art = e.target.closest(".work .art");
    document.querySelectorAll(".work .art.tilt").forEach(a => { if (a !== art) { a.classList.remove("tilt"); a.style.transform = ""; a.querySelector("svg").style.transform = ""; } });
    if (!art) return;
    const r = art.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    art.classList.add("tilt");
    art.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${py * -8}deg)`;
    art.querySelector("svg").style.transform = `translate3d(${px * 24}px, ${py * 24}px, 0) scale(1.12)`;
  }, { passive: true });
})();
