# Recruit Desk

글로벌 유저 인터뷰 리크루팅·스케줄링 웹 서비스 (웹프로그래밍 1인 프로젝트)

- 배포 주소: https://아이디.github.io/recruit-desk/

## 주요 기능
| 기능 | 상태 |
|---|---|
| 초기 화면: 리서치 목록, 국가 필터 | 완료 (2주차) |
| 한/영 전환 (localStorage 저장) | 완료 (2주차) |
| 리서치 상세, 개인정보 동의 | 완료 (2주차) |
| 분기형 사전 설문, 필수 응답 검사 | 완료 (2주차) |
| 시간대 자동 감지 (Intl API) | 완료 (2주차) |
| 적격 판정, 응답 임시저장, 결과 화면 | 완료 (3주차) |
| GitHub Pages 배포 | 완료 (3주차) |
| 세계 시계, 카드 애니메이션, 진행 단계 표시 | 완료 (3주차) |
| 점 세계지도, 핵심 지표, 차트 (Chart.js) | 완료 (3주차) |
| 시간대 타임라인 인터뷰 예약, 예약 완료·복사 | 완료 (3주차, localStorage) |
| Firestore 연동 | 4주차 |
| 리서처 대시보드, AI 노트 요약 | 5주차 |

## 폴더 구조
```
index.html        초기 화면
study.html        리서치 상세 + 사전 설문
booking.html      인터뷰 예약 (시간대 타임라인)
css/style.css     공통 스타일 (모바일 우선 반응형)
css/study.css     상세 화면 스타일
css/booking.css   예약 화면 스타일
js/i18n.js        한/영 문구, 언어 전환
js/data.js        샘플 리서치·설문 데이터
js/main.js        목록 렌더링, 필터
js/study.js       상세 렌더링, 분기 설문, 제출 검사, 임시저장, 결과 화면
js/eligibility.js 리서치별 적격 판정 규칙
js/ui.js          국기, 진행 단계, 토스트, 체크 아이콘, 복사
js/booking.js     슬롯 생성, 시간대 변환, 타임라인, 예약
js/insights.js    세계지도, 핵심 지표, 차트
js/worldmap-data.js 세계지도 점 데이터 (Natural Earth 기반 자동 생성)
```

## 실행
별도 빌드 없이 `index.html`을 열거나 VS Code Live Server로 실행한다.

## 사용한 외부 자원
- [Chart.js](https://www.chartjs.org/) 4.4.1 (CDN): 차트. 불러오지 못하면 표로 대신 보여준다.
- [Natural Earth](https://www.naturalearthdata.com/) / world-atlas: 세계지도 육지 모양 (점 격자로 변환해 포함)
- [flagcdn.com](https://flagcdn.com/): 국기 이미지
