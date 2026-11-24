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
    closedMsg: "모집이 마감된 리서치예요.",
    notFound: "리서치를 찾을 수 없어요.",

    savedAt: "{time}에 임시저장됨",
    restored: "이전에 작성하던 응답을 불러왔어요.",
    restart: "처음부터 다시",
    eligibleTitle: "참여 대상이에요!",
    eligibleDesc: "다음 단계에서 내 시간대에 맞는 인터뷰 시간을 예약해요.",
    bookNow: "인터뷰 시간 예약하기",
    ineligibleTitle: "이번 리서치와는 조건이 맞지 않아요",
    ineligibleDesc: "응답해 주셔서 감사해요. 다른 리서치에는 참여하실 수 있을지도 몰라요.",
    otherStudies: "다른 리서치 보기",
    retry: "응답 다시 하기",

    clockTitle: "지금 리서치 국가는 몇 시?",
    globalTitle: "전 세계 리서치 현황",
    globalDesc: "서울의 리서치팀이 지금 어느 나라 사용자를 만나고 있는지 보여줘요. 지도의 점을 눌러 보세요.",
    mapAria: "서울에서 일본, 베트남, 미국, 대만으로 이어지는 리서치 현황 세계지도",
    mapLegendHub: "서울 리서치팀",
    mapLegendOpen: "모집 중",
    mapLegendClosed: "모집 마감",
    hubName: "서울 리서치팀",
    tipLocal: "현지 {time}",
    tipOpen: "모집 중 리서치 {n}건",
    tipClosed: "모집 마감",
    tipCta: "눌러서 리서치 보기 →",
    kpiOpen: "모집 중 리서치",
    kpiCountries: "참여 국가",
    kpiSeats: "남은 자리",
    kpiOverlap: "평균 겹치는 시간",
    unitStudies: "건",
    unitCountries: "개국",
    unitPeople: "명",
    unitHours: "시간",
    chartQuotaTitle: "리서치별 모집 현황",
    chartQuotaDesc: "파란색은 확정 인원, 회색은 남은 자리예요.",
    chartOverlapTitle: "서울 근무시간과 겹치는 현지 활동 시간",
    chartOverlapDesc: "서울 평일 9–18시 가운데 현지 8–22시에 해당하는 시간이에요. 길수록 인터뷰 잡기가 쉬워요.",
    tipFilled: "확정 {n}명",
    tipQuota: "모집 {n}명",
    hoursFmt: "{n}시간",
    localRangeFmt: "현지 {a}–{b}",
    colStudy: "리서치",
    colFilled: "확정",
    colQuota: "모집",
    colCountry: "국가",
    colHours: "겹치는 시간",
    colRange: "현지 시간대",
    backToScreener: "← 설문으로",
    bookTitle: "인터뷰 시간 예약",
    bookDesc: "모든 시간은 내 시간대 기준이에요. 두 사람의 시간이 겹치는 초록색 시간을 골라 주세요.",
    tzMine: "표시 기준 시간대",
    tzChange: "다른 시간대로 보기",
    tzAuto: "자동 감지",
    rowAwake: "내 활동 시간",
    rowAwakeSub: "현지 08–22시",
    rowWork: "리서처 근무",
    rowWorkSub: "서울 기준",
    rowSlots: "예약 슬롯",
    legendOk: "예약 가능",
    legendNight: "현지 이른 아침·밤",
    legendFull: "마감",
    legendOverlap: "두 시간대가 겹치는 구간",
    slotsTitle: "예약 가능한 시간",
    leftFmt: "{n}개 남음",
    seoulFmt: "서울 {time}",
    nightTag: "현지 밤",
    earlyTag: "현지 이른 아침",
    full: "마감",
    noSlots: "이 날은 예약 가능한 시간이 없어요.",
    pickHint: "시간을 고르면 여기에 표시돼요.",
    confirmTitle: "선택한 시간",
    confirmBtn: "이 시간으로 예약하기",
    myTime: "내 시간",
    seoulTime: "서울 시간 (리서처)",
    doneTitle: "예약이 완료되었어요",
    doneDesc: "인터뷰 접속 링크는 예약 하루 전에 안내해 드려요.",
    copyInfo: "예약 정보 복사",
    copied: "예약 정보를 복사했어요",
    cancelBooking: "예약 취소",
    cancelled: "예약을 취소했어요",
    notEligibleYet: "사전 설문에서 참여 대상으로 확인된 뒤 예약할 수 있어요.",
    goScreener: "사전 설문 하러 가기"
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
    closedMsg: "This study is no longer recruiting.",
    notFound: "Study not found.",

    savedAt: "Draft saved at {time}",
    restored: "We restored the answers you were working on.",
    restart: "Start over",
    eligibleTitle: "You're eligible!",
    eligibleDesc: "Next, you'll book an interview time in your own time zone.",
    bookNow: "Book an interview time",
    ineligibleTitle: "This study isn't a match",
    ineligibleDesc: "Thanks for answering. You may still be a fit for other studies.",
    otherStudies: "See other studies",
    retry: "Answer again",

    clockTitle: "What time is it in our study countries?",
    globalTitle: "Research around the world",
    globalDesc: "See which countries our Seoul research team is talking to right now. Tap a dot on the map.",
    mapAria: "World map of research from Seoul to Japan, Vietnam, the United States and Taiwan",
    mapLegendHub: "Seoul research team",
    mapLegendOpen: "Recruiting",
    mapLegendClosed: "Closed",
    hubName: "Seoul research team",
    tipLocal: "Local time {time}",
    tipOpen: "{n} open study(ies)",
    tipClosed: "Recruitment closed",
    tipCta: "Click to see studies →",
    kpiOpen: "Open studies",
    kpiCountries: "Countries",
    kpiSeats: "Spots left",
    kpiOverlap: "Avg. overlap",
    unitStudies: "",
    unitCountries: "",
    unitPeople: "",
    unitHours: "h",
    chartQuotaTitle: "Recruitment by study",
    chartQuotaDesc: "Blue is confirmed participants, grey is spots left.",
    chartOverlapTitle: "Local daytime overlapping Seoul working hours",
    chartOverlapDesc: "Hours of Seoul's 9am–6pm weekday that fall within 8am–10pm local time. Longer means easier scheduling.",
    tipFilled: "{n} confirmed",
    tipQuota: "{n} needed",
    hoursFmt: "{n} h",
    localRangeFmt: "Local {a}–{b}",
    colStudy: "Study",
    colFilled: "Confirmed",
    colQuota: "Needed",
    colCountry: "Country",
    colHours: "Overlap",
    colRange: "Local window",
    backToScreener: "← Back to screener",
    bookTitle: "Book your interview",
    bookDesc: "All times are shown in your time zone. Pick a green slot where both schedules overlap.",
    tzMine: "Showing times in",
    tzChange: "View in another time zone",
    tzAuto: "Auto-detected",
    rowAwake: "Your day",
    rowAwakeSub: "8am–10pm local",
    rowWork: "Researcher hours",
    rowWorkSub: "Seoul time",
    rowSlots: "Slots",
    legendOk: "Available",
    legendNight: "Early morning / night for you",
    legendFull: "Taken",
    legendOverlap: "Where both schedules overlap",
    slotsTitle: "Available times",
    leftFmt: "{n} left",
    seoulFmt: "Seoul {time}",
    nightTag: "Night",
    earlyTag: "Early morning",
    full: "Taken",
    noSlots: "No times available on this day.",
    pickHint: "Your selected time will appear here.",
    confirmTitle: "Selected time",
    confirmBtn: "Book this time",
    myTime: "Your time",
    seoulTime: "Seoul time (researcher)",
    doneTitle: "You're booked",
    doneDesc: "We'll send the interview link one day before your session.",
    copyInfo: "Copy booking details",
    copied: "Booking details copied",
    cancelBooking: "Cancel booking",
    cancelled: "Booking cancelled",
    notEligibleYet: "You can book once the screener confirms you're eligible.",
    goScreener: "Go to the screener"
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
