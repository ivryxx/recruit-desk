/* data.js — 샘플 리서치 데이터
 * 2주차에는 화면 구성을 위해 고정 데이터를 쓰고, 4주차에 Firestore 로 옮긴다.
 * 스크리너 질문은 JSON 형태로 정의하고 화면은 JS 가 만든다 (1주차 설계).
 *   type      : "single" | "multi" | "text"
 *   showIf    : { q: 질문 id, in: [값...] }  → 앞 질문 응답이 이 값일 때만 보임 (분기)
 */

const STUDIES = [
  {
    id: "jp-remit",
    status: "open",
    country: "JP",
    flag: "jp",
    tz: "Asia/Tokyo",
    countryName: { ko: "일본", en: "Japan" },
    title: { ko: "일본 거주자의 해외 송금 경험 인터뷰", en: "Cross-border money transfers: interviews in Japan" },
    summary: {
      ko: "해외로 돈을 보낼 때 어떤 앱을 쓰고, 어디서 불편함을 느끼는지 이야기를 나눠요.",
      en: "Tell us which apps you use to send money abroad and where it gets frustrating."
    },
    method: { ko: "화상 심층 인터뷰", en: "Remote in-depth interview" },
    durationMin: 45,
    reward: { ko: "5,000엔 상당 기프트카드", en: "¥5,000 gift card" },
    quota: 8,
    filled: 3,
    targetDesc: {
      ko: "일본에 거주 중이며 최근 6개월 안에 해외 송금을 해 본 만 20세 이상",
      en: "Adults living in Japan who sent money abroad in the last 6 months"
    },
    processDesc: {
      ko: "Zoom 으로 진행하며, 화면 공유로 평소 쓰는 송금 앱을 함께 살펴봐요.",
      en: "Held on Zoom. We'll look at the transfer app you usually use via screen share."
    },
    screener: [
      {
        id: "q1", type: "single",
        label: { ko: "현재 일본에 거주하고 계신가요?", en: "Do you currently live in Japan?" },
        options: [
          { value: "yes", label: { ko: "예", en: "Yes" } },
          { value: "no", label: { ko: "아니요", en: "No" } }
        ]
      },
      {
        id: "q2", type: "single", showIf: { q: "q1", in: ["yes"] },
        label: { ko: "최근 6개월 안에 해외로 송금한 적이 있나요?", en: "Have you sent money abroad in the last 6 months?" },
        options: [
          { value: "yes", label: { ko: "예", en: "Yes" } },
          { value: "no", label: { ko: "아니요", en: "No" } }
        ]
      },
      {
        id: "q3", type: "multi", showIf: { q: "q2", in: ["yes"] },
        label: { ko: "사용한 송금 수단을 모두 골라 주세요.", en: "Which services did you use? Select all that apply." },
        options: [
          { value: "bank", label: { ko: "은행 창구·앱", en: "Bank branch or app" } },
          { value: "wise", label: { ko: "해외송금 전문 앱", en: "Dedicated transfer app" } },
          { value: "card", label: { ko: "카드사 서비스", en: "Card company service" } },
          { value: "other", label: { ko: "기타", en: "Other" } }
        ]
      },
      {
        id: "q4", type: "text", showIf: { q: "q2", in: ["yes"] },
        label: { ko: "송금하면서 가장 불편했던 점은 무엇이었나요?", en: "What was the most frustrating part?" }
      }
    ]
  },
  {
    id: "vn-onboarding",
    status: "open",
    country: "VN",
    flag: "vn",
    tz: "Asia/Ho_Chi_Minh",
    countryName: { ko: "베트남", en: "Vietnam" },
    title: { ko: "베트남 신규 가입자 온보딩 사용성 테스트", en: "Onboarding usability test in Vietnam" },
    summary: {
      ko: "새 금융 앱 가입 화면을 직접 써 보며 막히는 부분을 찾아요.",
      en: "Try a new finance app's sign-up flow and show us where you get stuck."
    },
    method: { ko: "원격 사용성 테스트", en: "Remote usability test" },
    durationMin: 30,
    reward: { ko: "200,000동 상당 모바일 쿠폰", en: "₫200,000 mobile voucher" },
    quota: 10,
    filled: 9,
    targetDesc: {
      ko: "베트남에 거주하며 스마트폰으로 금융 앱을 1개 이상 쓰는 사람",
      en: "People in Vietnam who use at least one finance app on their phone"
    },
    processDesc: {
      ko: "프로토타입 링크로 접속해 과제를 수행하며 생각을 소리 내어 말해 주세요.",
      en: "Open a prototype link, complete a few tasks, and think aloud as you go."
    },
    screener: [
      {
        id: "q1", type: "single",
        label: { ko: "주로 쓰는 휴대폰 운영체제는?", en: "Which phone OS do you mainly use?" },
        options: [
          { value: "android", label: { ko: "Android", en: "Android" } },
          { value: "ios", label: { ko: "iOS", en: "iOS" } }
        ]
      },
      {
        id: "q2", type: "single",
        label: { ko: "금융 앱을 얼마나 자주 쓰나요?", en: "How often do you use finance apps?" },
        options: [
          { value: "daily", label: { ko: "거의 매일", en: "Almost daily" } },
          { value: "weekly", label: { ko: "주 1~2회", en: "1–2 times a week" } },
          { value: "rarely", label: { ko: "거의 안 씀", en: "Rarely" } }
        ]
      },
      {
        id: "q3", type: "text", showIf: { q: "q2", in: ["rarely"] },
        label: { ko: "금융 앱을 잘 쓰지 않는 이유가 있다면?", en: "Why don't you use finance apps much?" }
      }
    ]
  },
  {
    id: "us-cards",
    status: "open",
    country: "US",
    flag: "us",
    tz: "America/New_York",
    countryName: { ko: "미국", en: "United States" },
    title: { ko: "미국 대학생의 카드·간편결제 사용 설문", en: "Card and mobile payment habits of US students" },
    summary: {
      ko: "카드와 간편결제를 어떤 상황에서 쓰는지 짧은 설문과 후속 인터뷰로 알아봐요.",
      en: "A short survey and follow-up call about when you use cards versus mobile pay."
    },
    method: { ko: "설문 + 후속 인터뷰", en: "Survey + follow-up call" },
    durationMin: 20,
    reward: { ko: "$20 상당 기프트카드", en: "$20 gift card" },
    quota: 15,
    filled: 4,
    targetDesc: { ko: "미국 대학 재학생", en: "Students enrolled at a US college" },
    processDesc: {
      ko: "설문 응답자 중 일부에게 15분 화상 통화를 요청드려요.",
      en: "Some respondents will be invited to a 15-minute video call."
    },
    screener: [
      {
        id: "q1", type: "single",
        label: { ko: "현재 대학에 재학 중인가요?", en: "Are you currently enrolled in college?" },
        options: [
          { value: "yes", label: { ko: "예", en: "Yes" } },
          { value: "no", label: { ko: "아니요", en: "No" } }
        ]
      },
      {
        id: "q2", type: "multi", showIf: { q: "q1", in: ["yes"] },
        label: { ko: "자주 쓰는 결제 수단을 모두 골라 주세요.", en: "Which payment methods do you use often?" },
        options: [
          { value: "debit", label: { ko: "체크카드", en: "Debit card" } },
          { value: "credit", label: { ko: "신용카드", en: "Credit card" } },
          { value: "mobile", label: { ko: "휴대폰 간편결제", en: "Mobile wallet" } },
          { value: "p2p", label: { ko: "개인 간 송금 앱", en: "P2P payment app" } }
        ]
      }
    ]
  },
  {
    id: "tw-merchant",
    status: "closed",
    country: "TW",
    flag: "tw",
    tz: "Asia/Taipei",
    countryName: { ko: "대만", en: "Taiwan" },
    title: { ko: "대만 소상공인 결제 단말 사용 경험", en: "Payment terminals for small merchants in Taiwan" },
    summary: {
      ko: "가게에서 결제 단말을 고르고 쓰는 과정을 들어봐요.",
      en: "How small shop owners pick and use payment terminals."
    },
    method: { ko: "화상 심층 인터뷰", en: "Remote in-depth interview" },
    durationMin: 60,
    reward: { ko: "NT$1,000 상당 기프트카드", en: "NT$1,000 gift card" },
    quota: 6,
    filled: 6,
    targetDesc: { ko: "대만에서 매장을 운영하는 사업자", en: "Business owners running a shop in Taiwan" },
    processDesc: { ko: "1:1 화상 인터뷰로 진행해요.", en: "One-on-one video interview." },
    screener: []
  }
];

function findStudy(id) {
  return STUDIES.find((s) => s.id === id);
}
