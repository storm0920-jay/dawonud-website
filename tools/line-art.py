"""메인 화면 배경의 펜선 도시 그림(site/assets/img/line-city.svg)을 만듭니다.
사진이 없어도 디자인 회사답게 보이도록, 선만으로 경관·가로·사람을 그립니다.
실행: python3 tools/line-art.py
"""
import random
from pathlib import Path

W, H, BASE = 1600, 640, 520
rnd = random.Random(7)
paths = []


def add(d, cls="l"):
    paths.append(f'<path class="{cls}" d="{d}"/>')


# 먼 산 두 겹
for amp, off, step in ((70, 300, 160), (46, 360, 120)):
    pts = [f"M0 {off}"]
    x = 0
    while x < W:
        x2 = x + step
        pts.append(f"Q{x + step / 2} {off - rnd.uniform(.4, 1) * amp} {x2} {off + rnd.uniform(-12, 12):.0f}")
        x = x2
    add(" ".join(pts), "l far")

# 건물: 사각 외곽선 + 층 선 + 창 몇 개
x = 40
while x < W - 60:
    w = rnd.choice((60, 80, 90, 110, 130))
    h = rnd.choice((90, 130, 170, 210, 260, 320))
    if 520 < x < 860:          # 가운데는 광장으로 비워 둠
        x = 860
        continue
    top = BASE - h
    add(f"M{x} {BASE}V{top}H{x + w}V{BASE}")
    for fy in range(top + 24, BASE - 10, 26):
        if rnd.random() < .55:
            add(f"M{x + 8} {fy}H{x + w - 8}", "l thin")
    x += w + rnd.choice((8, 14, 24))

# 광장: 가로등, 벤치, 나무, 사람
for lx in (560, 820):
    add(f"M{lx} {BASE}V{BASE - 120}H{lx + 26}M{lx + 18} {BASE - 120}v10h16v-10")
add(f"M620 {BASE - 26}h70M626 {BASE - 26}v26M684 {BASE - 26}v26M620 {BASE - 40}h70")
for tx, r in ((740, 30), (785, 22)):
    add(f"M{tx} {BASE}V{BASE - 60}")
    add(f"M{tx - r} {BASE - 60 - r}a{r} {r} 0 1 0 {2 * r} 0a{r} {r} 0 1 0 {-2 * r} 0")
for px in (600, 712, 846):
    add(f"M{px} {BASE - 46}a6 6 0 1 0 0.1 0M{px} {BASE - 34}v20M{px} {BASE - 14}l-7 14M{px} {BASE - 14}l7 14M{px - 9} {BASE - 28}h18")

# 지평선과 보도 줄눈
add(f"M0 {BASE}H{W}")
for gx in range(0, W, 48):
    add(f"M{gx} {BASE + 10}l-18 {H - BASE - 10}", "l thin")
add(f"M0 {BASE + 46}H{W}", "l thin")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" fill="none">
<style>
.l{{stroke:#F2EFE8;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;
   stroke-dasharray:1400;stroke-dashoffset:0;animation:draw 2.8s cubic-bezier(.6,0,.2,1) both}}
.thin{{stroke-width:.8;opacity:.55;animation-delay:.6s}}
.far{{opacity:.45;animation-duration:3.6s}}
@keyframes draw{{from{{stroke-dashoffset:1400}}to{{stroke-dashoffset:0}}}}
@media (prefers-reduced-motion:reduce){{.l{{animation:none}}}}
</style>
{chr(10).join(paths)}
</svg>
'''
out = Path(__file__).resolve().parent.parent / "site/assets/img/line-city.svg"
out.write_text(svg, encoding="utf-8")
print(out, len(svg), "bytes,", len(paths), "paths")
