/* study.js — 리서치 상세 + 분기형 사전 설문
 * 주소 예: study.html?id=jp-remit
 * 질문은 data.js 의 screener 배열로 만들고, showIf 조건에 맞는 질문만 보여준다.
 * 3주차: 응답 임시저장(localStorage), 적격 판정(eligibility.js), 결과 화면
 */

const params = new URLSearchParams(location.search);
const study = findStudy(params.get("id"));
const answers = {};   // { q1: "yes", q3: ["bank", "wise"], q4: "..." }
let result = null;    // 제출 후 판정 결과 { eligible, failed }

const DRAFT_KEY = study ? `recruitdesk-draft-${study.id}` : "";
const APPLICANTS_KEY = "recruitdesk-applicants";

/* ---------- localStorage 도우미 (사용할 수 없는 환경에서도 화면은 동작) ---------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { return false; }
}
function removeKey(key) {
  try { localStorage.removeItem(key); } catch (e) { /* 무시 */ }
}

/* ---------- 시간대 감지 (Intl API) ---------- */
function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
function timeText(date, withZone) {
  return new Intl.DateTimeFormat(currentLang === "ko" ? "ko-KR" : "en-US", {
    timeZone: getTimeZone(), hour: "2-digit", minute: "2-digit",
    ...(withZone ? { timeZoneName: "short" } : {})
  }).format(date);
}

/* ---------- 상단·안내 ---------- */
function renderHead() {
  const remain = Math.max(0, study.quota - study.filled);
  document.title = `Recruit Desk · ${loc(study.title)}`;
  document.getElementById("studyHead").innerHTML = `
    <span class="badge badge-country">${flagImg(study.flag)} ${esc(loc(study.countryName))}</span>
    <h1 class="study-title">${esc(loc(study.title))}</h1>
    <p class="study-summary">${esc(loc(study.summary))}</p>
    <p class="quota-text">${fmt("remainFmt", { r: remain, q: study.quota })}</p>`;

  const rows = [
    [t("target"), loc(study.targetDesc)],
    [t("process"), loc(study.processDesc)],
    [t("method"), loc(study.method)],
    [t("duration"), fmt("durationFmt", { n: study.durationMin })],
    [t("reward"), loc(study.reward)]
  ];
  document.getElementById("studyInfo").innerHTML =
    rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

  document.getElementById("tzValue").textContent = `${getTimeZone()} (${timeText(new Date(), true)})`;
  renderStepper();
}

/* 적격 판정을 받으면 3단계(예약)로 넘어간 것으로 표시 */
function renderStepper() {
  document.getElementById("stepper").innerHTML = stepperHTML(result && result.eligible ? 3 : 2);
}

/* ---------- 분기 판단 ---------- */
function isVisible(q) {
  if (!q.showIf) return true;
  return q.showIf.in.includes(answers[q.showIf.q]);
}

function visibleQuestions() {
  // 앞에서부터 차례로 판단해야 '숨겨진 질문에 달린 질문'도 함께 숨겨진다
  const shown = [];
  for (const q of study.screener) {
    if (isVisible(q)) shown.push(q);
    else delete answers[q.id];      // 숨겨진 질문의 이전 응답은 지운다
  }
  return shown;
}

/* ---------- 질문 화면 생성 (DOM) ---------- */
function questionHTML(q, idx) {
  const name = `ans-${q.id}`;
  let body = "";

  if (q.type === "single" || q.type === "multi") {
    const inputType = q.type === "single" ? "radio" : "checkbox";
    body = q.options.map((o) => {
      const checked = q.type === "single"
        ? answers[q.id] === o.value
        : (answers[q.id] || []).includes(o.value);
      return `
        <label class="option">
          <input type="${inputType}" name="${name}" value="${esc(o.value)}"
                 data-qid="${q.id}" ${checked ? "checked" : ""}>
          <span>${esc(loc(o.label))}</span>
        </label>`;
    }).join("");
  } else {
    body = `<textarea name="${name}" data-qid="${q.id}" maxlength="300" rows="3"
              placeholder="${esc(t("textPlaceholder"))}">${esc(answers[q.id] || "")}</textarea>`;
  }

  return `
    <fieldset class="question" id="field-${q.id}">
      <legend><span class="q-num">Q${idx + 1}</span>${esc(loc(q.label))}</legend>
      <div class="options">${body}</div>
    </fieldset>`;
}

function renderQuestions() {
  document.getElementById("questions").innerHTML = visibleQuestions().map(questionHTML).join("");
}

/* ---------- 임시저장 ---------- */
let saveTimer = null;

function saveDraft() {
  const ok = writeJSON(DRAFT_KEY, {
    answers,
    consent: document.getElementById("consent").checked,
    savedAt: Date.now()
  });
  if (ok) showSaved(Date.now());
}

function saveDraftLater() {           // 글자 입력은 0.5초 동안 멈췄을 때 저장
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
}

function showSaved(ts) {
  const el = document.getElementById("saveStatus");
  el.textContent = fmt("savedAt", { time: timeText(new Date(ts), false) });
  el.dataset.ts = ts;
  el.hidden = false;
}

function restoreDraft() {
  const draft = readJSON(DRAFT_KEY, null);
  if (!draft || !draft.answers || !Object.keys(draft.answers).length) return;
  Object.assign(answers, draft.answers);
  document.getElementById("consent").checked = !!draft.consent;
  document.getElementById("restoreBar").hidden = false;
  showSaved(draft.savedAt);
}

function resetForm() {
  clearTimeout(saveTimer);
  removeKey(DRAFT_KEY);
  Object.keys(answers).forEach((k) => delete answers[k]);
  result = null;
  document.getElementById("consent").checked = false;
  document.getElementById("restoreBar").hidden = true;
  document.getElementById("saveStatus").hidden = true;
  document.getElementById("formMsg").hidden = true;
  document.getElementById("resultBox").hidden = true;
  document.getElementById("screenerForm").hidden = false;
  renderQuestions();
  renderStepper();
}

/* ---------- 응답 저장 ---------- */
function onAnswer(e) {
  const el = e.target;
  if (el.id === "consent") return saveDraft();
  const qid = el.dataset.qid;
  if (!qid) return;

  if (el.type === "radio") {
    answers[qid] = el.value;
    renderQuestions();               // 분기가 바뀔 수 있으니 다시 그린다
    saveDraft();
  } else if (el.type === "checkbox") {
    const set = new Set(answers[qid] || []);
    el.checked ? set.add(el.value) : set.delete(el.value);
    answers[qid] = [...set];
    saveDraft();
  } else {
    answers[qid] = el.value;         // 글자 입력은 다시 그리지 않음 (커서 유지)
    saveDraftLater();
  }
  document.getElementById(`field-${qid}`)?.classList.remove("has-error");
}

/* ---------- 제출 검사 ---------- */
function isAnswered(v) {
  return Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== "";
}

function showMsg(text, type) {
  const msg = document.getElementById("formMsg");
  msg.textContent = text;
  msg.className = `form-msg ${type}`;
  msg.hidden = false;
}

function onSubmit(e) {
  e.preventDefault();

  if (!document.getElementById("consent").checked) {
    showMsg(t("errConsent"), "error");
    return;
  }

  const shown = visibleQuestions();
  const missing = shown.filter((q) => !isAnswered(answers[q.id]));
  document.querySelectorAll(".question").forEach((f) => f.classList.remove("has-error"));
  missing.forEach((q) => document.getElementById(`field-${q.id}`).classList.add("has-error"));

  if (missing.length) {
    showMsg(fmt("errRequired", { n: missing.length }), "error");
    document.getElementById(`field-${missing[0].id}`).scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // 적격 판정
  result = checkEligibility(study.id, answers);

  // 신청 기록 저장: 4주차에 Firestore applicants 컬렉션으로 옮길 구조와 같게 맞춘다
  const applicants = readJSON(APPLICANTS_KEY, []);
  applicants.push({
    id: `${study.id}-${Date.now()}`,
    studyId: study.id,
    answers: { ...answers },
    eligible: result.eligible,
    timeZone: getTimeZone(),
    lang: currentLang,
    consent: true,
    createdAt: new Date().toISOString()
  });
  writeJSON(APPLICANTS_KEY, applicants);

  clearTimeout(saveTimer);
  removeKey(DRAFT_KEY);              // 제출이 끝나면 임시저장은 지운다
  renderResult();
}

/* ---------- 결과 화면 ---------- */
function renderResult() {
  if (!result) return;
  const box = document.getElementById("resultBox");
  document.getElementById("screenerForm").hidden = true;

  box.className = `result-box ${result.eligible ? "is-eligible" : "is-ineligible"}`;
  box.innerHTML = result.eligible
    ? `${checkIconSVG()}
       <h2 class="result-title">${t("eligibleTitle")}</h2>
       <p class="result-desc">${t("eligibleDesc")}</p>
       <a class="btn btn-primary btn-block" href="./booking.html?id=${encodeURIComponent(study.id)}">${t("bookNow")}</a>
       <button type="button" class="btn-link" data-action="reset">${t("retry")}</button>`
    : `<div class="result-icon" aria-hidden="true">!</div>
       <h2 class="result-title">${t("ineligibleTitle")}</h2>
       <p class="result-desc">${t("ineligibleDesc")}</p>
       <a class="btn btn-primary btn-block" href="./index.html#studies">${t("otherStudies")}</a>
       <button type="button" class="btn-link" data-action="reset">${t("retry")}</button>`;
  box.hidden = false;
  renderStepper();
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- 예외 화면 ---------- */
function renderNotice(key) {
  document.querySelector(".study-layout")?.remove();
  document.getElementById("studyHead").innerHTML = `<p class="notice">${esc(t(key))}</p>`;
}

/* ---------- 시작 ---------- */
function renderAll() {
  applyI18n();
  if (!study) return renderNotice("notFound");
  if (study.status === "closed") return renderNotice("closedMsg");
  renderHead();
  renderQuestions();
}

document.addEventListener("DOMContentLoaded", () => {
  initLangToggle();
  if (study && study.status !== "closed") restoreDraft();
  renderAll();
  if (!study || study.status === "closed") return;

  const form = document.getElementById("screenerForm");
  form.addEventListener("change", onAnswer);
  form.addEventListener("input", (e) => { if (e.target.tagName === "TEXTAREA") onAnswer(e); });
  form.addEventListener("submit", onSubmit);

  document.getElementById("restartBtn").addEventListener("click", resetForm);
  document.getElementById("resultBox").addEventListener("click", (e) => {
    if (e.target.closest("[data-action=reset]")) resetForm();
  });
});

document.addEventListener("langchange", () => {
  if (!study || study.status === "closed") {
    return renderNotice(study ? "closedMsg" : "notFound");
  }
  renderHead();
  renderQuestions();
  const status = document.getElementById("saveStatus");
  if (!status.hidden) showSaved(Number(status.dataset.ts));
  renderResult();
});
