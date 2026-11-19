/* study.js — 리서치 상세 + 분기형 사전 설문
 * 주소 예: study.html?id=jp-remit
 * 질문은 data.js 의 screener 배열로 만들고, showIf 조건에 맞는 질문만 보여준다.
 */

const params = new URLSearchParams(location.search);
const study = findStudy(params.get("id"));
const answers = {};   // { q1: "yes", q3: ["bank", "wise"], q4: "..." }

/* ---------- 시간대 감지 (Intl API) ---------- */
function detectTimeZone() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const now = new Intl.DateTimeFormat(currentLang === "ko" ? "ko-KR" : "en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", timeZoneName: "short"
  }).format(new Date());
  return `${tz} (${now})`;
}

/* ---------- 상단·안내 ---------- */
function renderHead() {
  const remain = Math.max(0, study.quota - study.filled);
  document.title = `Recruit Desk · ${loc(study.title)}`;
  document.getElementById("studyHead").innerHTML = `
    <span class="badge badge-country">${esc(study.country)} · ${esc(loc(study.countryName))}</span>
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

  document.getElementById("tzValue").textContent = detectTimeZone();
}

/* ---------- 분기 판단 ---------- */
function isVisible(q) {
  if (!q.showIf) return true;
  const prev = answers[q.showIf.q];
  return q.showIf.in.includes(prev);
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
  const box = document.getElementById("questions");
  box.innerHTML = visibleQuestions().map(questionHTML).join("");
}

/* ---------- 응답 저장 ---------- */
function onAnswer(e) {
  const el = e.target;
  const qid = el.dataset.qid;
  if (!qid) return;

  if (el.type === "radio") {
    answers[qid] = el.value;
    renderQuestions();               // 분기가 바뀔 수 있으니 다시 그린다
  } else if (el.type === "checkbox") {
    const set = new Set(answers[qid] || []);
    el.checked ? set.add(el.value) : set.delete(el.value);
    answers[qid] = [...set];
  } else {
    answers[qid] = el.value;         // 글자 입력은 다시 그리지 않음 (커서 유지)
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

  const missing = visibleQuestions().filter((q) => !isAnswered(answers[q.id]));
  document.querySelectorAll(".question").forEach((f) => f.classList.remove("has-error"));
  missing.forEach((q) => document.getElementById(`field-${q.id}`).classList.add("has-error"));

  if (missing.length) {
    showMsg(fmt("errRequired", { n: missing.length }), "error");
    document.getElementById(`field-${missing[0].id}`).scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // 적격 판정과 예약 화면 이동은 3주차에 구현
  console.log("screener answers", study.id, answers);
  showMsg(t("submitted"), "success");
}

/* ---------- 예외 화면 ---------- */
function renderNotice(key) {
  document.querySelector(".study-layout")?.remove();
  document.getElementById("studyHead").innerHTML =
    `<p class="notice">${esc(t(key))}</p>`;
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
  renderAll();
  if (!study || study.status === "closed") return;

  const form = document.getElementById("screenerForm");
  form.addEventListener("change", onAnswer);
  form.addEventListener("input", (e) => { if (e.target.tagName === "TEXTAREA") onAnswer(e); });
  form.addEventListener("submit", onSubmit);
});

document.addEventListener("langchange", () => {
  if (!study || study.status === "closed") {
    applyI18n();
    return renderNotice(study ? "closedMsg" : "notFound");
  }
  renderHead();
  renderQuestions();
});
