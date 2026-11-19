/* i18n.js — 한/영 전환
 * HTML 요소에 data-i18n="키" 를 달면 현재 언어의 텍스트가 들어간다.
 * 선택한 언어는 localStorage 에 저장해 다음 방문 때도 유지한다.
 */

const I18N = {
  ko: {
    langBtn: "English",
    navStudies: "리서치 목록",
    heroEyebrow: "Global UX Research",
    heroTitle: "전 세계 사용자의 목소리를\n가장 빠르게 만나는 방법",
    heroDesc: "참여할 리서치를 고르고, 간단한 사전 설문에 답한 뒤, 내 시간대에 맞는 인터뷰 시간을 예약하세요.",
    heroCta: "참여 가능한 리서치 보기",
    stepsTitle: "참여 방법",
    step1T: "리서치 선택",
    step1D: "관심 있는 리서치를 골라 안내를 확인해요.",
    step2T: "사전 설문",
    step2D: "몇 가지 질문으로 참여 조건을 확인해요.",
    step3T: "인터뷰 예약",
    step3D: "내 시간대 기준으로 편한 시간을 골라요.",
    listTitle: "모집 중인 리서치",
    countFmt: "{n}건",
    filterAll: "전체",
    method: "방식",
    duration: "소요 시간",
    reward: "보상",
    durationFmt: "{n}분",
    remainFmt: "남은 자리 {r}명 / 총 {q}명",
    statusOpen: "모집 중",
    statusClosed: "마감",
    viewDetail: "자세히 보기",
    empty: "조건에 맞는 리서치가 없어요.",
    footer: "Recruit Desk · 웹프로그래밍 1인 프로젝트",

    back: "← 목록으로",
    aboutTitle: "리서치 안내",
    target: "참여 대상",
    process: "진행 방식",
    tzLabel: "감지된 내 시간대",
    tzHint: "인터뷰 시간은 이 시간대 기준으로 안내돼요.",
    consentTitle: "개인정보 수집·이용 동의",
    consentBody: "수집 항목: 사전 설문 응답, 국가, 시간대, 연락용 이메일. 이용 목적: 리서치 참여자 선정 및 인터뷰 일정 안내. 보관 기간: 리서치 종료 후 30일 이내 파기.",
    consentCheck: "위 내용을 확인했으며 동의합니다.",
    screenerTitle: "사전 설문",
    screenerDesc: "모든 문항에 답해 주세요.",
    textPlaceholder: "자유롭게 적어 주세요 (300자 이내)",
    submit: "응답 제출",
    errConsent: "개인정보 수집·이용에 동의해 주세요.",
    errRequired: "답하지 않은 문항이 {n}개 있어요.",
    submitted: "응답이 확인되었어요. 참여 대상 안내와 인터뷰 예약 화면은 준비 중이에요.",
    closedMsg: "모집이 마감된 리서치예요.",
    notFound: "리서치를 찾을 수 없어요."
  },
  en: {
    langBtn: "한국어",
    navStudies: "Studies",
    heroEyebrow: "Global UX Research",
    heroTitle: "The fastest way to hear\nfrom users around the world",
    heroDesc: "Pick a study, answer a short screener, and book an interview at a time that works in your time zone.",
    heroCta: "See open studies",
    stepsTitle: "How it works",
    step1T: "Choose a study",
    step1D: "Pick a study and read what it's about.",
    step2T: "Screener",
    step2D: "A few questions check whether it's a fit.",
    step3T: "Book an interview",
    step3D: "Choose a time shown in your own time zone.",
    listTitle: "Open studies",
    countFmt: "{n} studies",
    filterAll: "All",
    method: "Format",
    duration: "Length",
    reward: "Reward",
    durationFmt: "{n} min",
    remainFmt: "{r} of {q} spots left",
    statusOpen: "Open",
    statusClosed: "Closed",
    viewDetail: "View details",
    empty: "No studies match this filter.",
    footer: "Recruit Desk · Web Programming solo project",

    back: "← Back to studies",
    aboutTitle: "About this study",
    target: "Who can join",
    process: "How it runs",
    tzLabel: "Your detected time zone",
    tzHint: "Interview times will be shown in this time zone.",
    consentTitle: "Consent to collect and use personal data",
    consentBody: "Data collected: screener answers, country, time zone, contact email. Purpose: selecting participants and scheduling interviews. Retention: deleted within 30 days after the study ends.",
    consentCheck: "I have read the above and agree.",
    screenerTitle: "Screener",
    screenerDesc: "Please answer every question.",
    textPlaceholder: "Write freely (max 300 characters)",
    submit: "Submit answers",
    errConsent: "Please agree to the personal data consent.",
    errRequired: "{n} question(s) still need an answer.",
    submitted: "Thanks, your answers were received. Eligibility results and interview booking are coming soon.",
    closedMsg: "This study is no longer recruiting.",
    notFound: "Study not found."
  }
};

const LANG_KEY = "recruitdesk-lang";

function getLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ko" || saved === "en") return saved;
  } catch (e) { /* 저장소를 쓸 수 없는 환경 */ }
  return (navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en";
}

let currentLang = getLang();

/* 키에 해당하는 문장 */
function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) ?? I18N.ko[key] ?? key;
}

/* "{n}건" 같은 문장에 값 채우기 */
function fmt(key, vars) {
  return t(key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}

/* 데이터 안의 { ko: "...", en: "..." } 에서 현재 언어 꺼내기 */
function loc(obj) {
  if (!obj) return "";
  return obj[currentLang] ?? obj.ko;
}

function applyI18n(root = document) {
  document.documentElement.lang = currentLang;
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

function setLang(lang) {
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* 무시 */ }
  applyI18n();
  document.dispatchEvent(new CustomEvent("langchange"));
}

function initLangToggle() {
  const btn = document.getElementById("langBtn");
  if (!btn) return;
  btn.addEventListener("click", () => setLang(currentLang === "ko" ? "en" : "ko"));
}

/* 화면에 넣는 문자열의 특수문자 처리 */
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
