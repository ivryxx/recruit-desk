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
| 적격 판정, 응답 임시저장 | 3주차 |
| Firestore 연동, 인터뷰 예약 | 4주차 |
| 리서처 대시보드, AI 노트 요약 | 5주차 |

## 폴더 구조
```
index.html        초기 화면
study.html        리서치 상세 + 사전 설문
css/style.css     공통 스타일 (모바일 우선 반응형)
css/study.css     상세 화면 스타일
js/i18n.js        한/영 문구, 언어 전환
js/data.js        샘플 리서치·설문 데이터
js/main.js        목록 렌더링, 필터
js/study.js       상세 렌더링, 분기 설문, 제출 검사
```

## 실행
별도 빌드 없이 `index.html`을 열거나 VS Code Live Server로 실행한다.
