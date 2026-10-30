# 다원 도시디자인 홈페이지

빌드 과정이 없는 정적 사이트입니다. HTML, CSS, JS 파일을 그대로 올리면 됩니다.

## 자주 바꾸는 곳

| 바꿀 내용 | 파일 |
| --- | --- |
| 회사 정보(전화, 팩스, 사업자번호, 설립 연도), 메뉴, 미리보기 띠 끄기 | `assets/js/site.js` 맨 위 `SITE` |
| 사업실적 목록과 메인 대표 실적 | `data/projects.js` |
| 실적 사진 | `assets/img/projects/` 폴더에 넣고 `projects.js`의 `image`에 경로 입력 |
| 로고 | `assets/img/logo.svg`(흰 배경용), `assets/img/logo-white.svg`(어두운 배경용) 파일만 바꾸면 전체 적용 |
| 색상 | `assets/css/style.css` 맨 위 `--orange` 등 |
| 인사말, 비전, 연혁 | `about.html` |
| 소식 | `news.html`, 메인의 최근 소식은 `index.html` |
| 채용 | `careers.html` |

`예시` 표시(`ph-tag`)가 붙은 내용은 모두 자리 잡기용입니다. 실제 자료로 바꾼 뒤 표시를 지우고,
모두 끝나면 `site.js`에서 `preview: false`로 바꾸면 위쪽 안내 띠가 사라집니다.

## 문의 양식

[FormSubmit](https://formsubmit.co) 무료 서비스로 `dawon@dawonud.com`에 메일이 갑니다.
사이트를 올린 뒤 **첫 문의를 보내면 dawon@dawonud.com으로 확인 메일이 한 번 오고, 그 안의 버튼을 눌러야** 이후 문의가 전달됩니다.

## 로컬에서 보기

```
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 엽니다.

## 배포

Vercel 또는 Netlify에서 이 저장소를 연결하면 설정 없이 바로 배포됩니다(빌드 명령 없음, 출력 폴더는 루트).
