/* booking.js — 인터뷰 예약: 시간대 타임라인과 슬롯 선택
 * 주소 예: booking.html?id=jp-remit
 *
 * 핵심 아이디어
 *  - 슬롯은 리서처 기준(서울, 평일 9~18시)으로 만들고 UTC 밀리초로 저장한다.
 *  - 화면에 보여줄 때만 참여자 시간대로 바꾼다 (Intl.DateTimeFormat 의 timeZone 옵션).
 *  - 24시간 막대 위에 '참여자 활동 시간'과 '리서처 근무 시간'을 겹쳐 그려
 *    두 시간이 겹치는 구간을 한눈에 보이게 한다.
 * 4주차에 슬롯·예약 데이터를 Firestore 로 옮길 예정이라, 저장 구조를 그대로 맞춰 두었다.
 */

const params = new URLSearchParams(location.search);
const study = findStudy(params.get("id"));

const RESEARCHER_TZ = "Asia/Seoul";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;      // 한국은 서머타임이 없어 +9시간 고정
const WORK = { start: 9 * 60, end: 18 * 60, lunchStart: 12 * 60, lunchEnd: 13 * 60 };
const AWAKE = { start: 8 * 60, end: 22 * 60 };  // 참여자에게 무리 없는 시간 (현지)
const BOOKING_DAYS = 5;                         // 앞으로 평일 5일

const TZ_OPTIONS = ["auto", "Asia/Seoul", "Asia/Tokyo", "Asia/Taipei", "Asia/Ho_Chi_Minh",
  "Europe/London", "America/New_York", "America/Los_Angeles"];

const BOOKING_KEY = study ? `recruitdesk-booking-${study.id}` : "";
const APPLICANTS_KEY = "recruitdesk-applicants";

let tzChoice = "auto";
let activeDay = null;     // "2026-11-20" (보고 있는 시간대 기준 날짜)
let selectedId = null;

/* ---------- localStorage ---------- */
function readJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch (e) { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 무시 */ }
}

/* ---------- 시간 도우미 ---------- */
const autoTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const viewTz = () => (tzChoice === "auto" ? autoTz : tzChoice);
const locale = () => (currentLang === "ko" ? "ko-KR" : "en-US");

/* 어떤 시각을 특정 시간대로 봤을 때의 날짜와 '하루 중 몇 분째'인지 */
function wallClock(ts, tz) {
  const p = {};
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(ts).forEach((x) => { p[x.type] = x.value; });
  return { date: `${p.year}-${p.month}-${p.day}`, min: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}

function timeIn(ts, tz) {
  return new Intl.DateTimeFormat(locale(), { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(ts);
}
function dayLabel(ts, tz) {
  return new Intl.DateTimeFormat(locale(), { timeZone: tz, month: "short", day: "numeric", weekday: "short" }).format(ts);
}
function fullDate(ts, tz) {
  return new Intl.DateTimeFormat(locale(), {
    timeZone: tz, year: "numeric", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit"
  }).format(ts);
}
function utcOffsetLabel(tz) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
    .formatToParts(new Date()).find((x) => x.type === "timeZoneName");
  return part ? part.value.replace("GMT", "UTC") : "";
}
const pct = (min) => `${(Math.max(0, Math.min(1440, min)) / 1440) * 100}%`;

/* ---------- 슬롯 만들기 (리서처 기준) ---------- */
function makeSlots() {
  const dur = study.durationMin;
  const step = Math.max(30, Math.ceil(dur / 30) * 30);   // 45분 인터뷰 → 60분 간격
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);    // 지금 서울 날짜
  const slots = [];
  let added = 0;

  for (let d = 1; added < BOOKING_DAYS; d++) {
    const day = new Date(Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), nowKst.getUTCDate() + d));
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;          // 주말 제외
    added++;
    for (let m = WORK.start; m + dur <= WORK.end; m += step) {
      if (m < WORK.lunchEnd && m + dur > WORK.lunchStart) continue;   // 점심시간에 걸치면 제외
      const start = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, m) - KST_OFFSET_MS;
      slots.push({ id: `${study.id}-${start}`, start, end: start + dur * 60000 });
    }
  }

  // 다른 참여자가 이미 예약한 것처럼 보이도록 일부를 '마감' 처리 (시연용, 항상 같은 결과)
  slots.forEach((s) => { s.taken = hash(s.id) % 4 === 0; });
  return slots;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const SLOTS = study ? makeSlots() : [];

/* 보고 있는 시간대 기준으로 날짜별로 묶기 */
function slotsByDay() {
  const map = new Map();
  SLOTS.forEach((s) => {
    const w = wallClock(s.start, viewTz());
    const startMin = w.min;
    const endMin = startMin + study.durationMin;            // 자정을 넘으면 1440 이상 (막대에서 잘림)
    const early = startMin < AWAKE.start;
    const item = { ...s, startMin, endMin, early, night: early || endMin > AWAKE.end };
    if (!map.has(w.date)) map.set(w.date, []);
    map.get(w.date).push(item);
  });
  return map;
}

/* 이어지는 슬롯을 합쳐 '리서처 근무 구간'으로 (점심 등 빈 시간은 끊어서 표시) */
function workSegments(items) {
  const segs = [];
  items.forEach((s) => {
    const last = segs[segs.length - 1];
    if (last && s.startMin - last.end <= 30) last.end = Math.max(last.end, s.endMin);
    else segs.push({ start: s.startMin, end: s.endMin });
  });
  return segs;
}

/* ---------- 화면: 상단 ---------- */
function renderHead() {
  document.title = `Recruit Desk · ${t("bookTitle")}`;
  document.getElementById("backLink").href = `./study.html?id=${encodeURIComponent(study.id)}`;
  document.getElementById("studyHead").innerHTML = `
    <span class="badge badge-country">${flagImg(study.flag)} ${esc(loc(study.countryName))}</span>
    <h1 class="study-title">${esc(loc(study.title))}</h1>
    <p class="study-summary">${esc(loc(study.method))} · ${fmt("durationFmt", { n: study.durationMin })}</p>`;
}

function renderTzSelect() {
  const sel = document.getElementById("tzSelect");
  sel.innerHTML = TZ_OPTIONS.map((tz) => {
    const label = tz === "auto"
      ? `${t("tzAuto")} · ${autoTz} (${utcOffsetLabel(autoTz)})`
      : `${tz.split("/").pop().replace(/_/g, " ")} (${utcOffsetLabel(tz)})`;
    return `<option value="${tz}" ${tz === tzChoice ? "selected" : ""}>${esc(label)}</option>`;
  }).join("");
}

/* ---------- 화면: 날짜 탭 ---------- */
function renderDayTabs(days) {
  if (!activeDay || !days.has(activeDay)) activeDay = [...days.keys()][0];
  document.getElementById("dayTabs").innerHTML = [...days.entries()].map(([date, items]) => {
    const open = items.filter((s) => !s.taken).length;
    const active = date === activeDay;
    return `<button type="button" role="tab" class="day-tab${active ? " is-active" : ""}"
              data-day="${date}" aria-selected="${active}">
              <span class="day-name">${esc(dayLabel(items[0].start, viewTz()))}</span>
              <span class="day-left">${fmt("leftFmt", { n: open })}</span>
            </button>`;
  }).join("");
}

/* ---------- 화면: 24시간 타임라인 ---------- */
function slotState(s) {
  if (s.taken) return "is-full";
  return s.night ? "is-night" : "is-ok";
}

function renderTimeline(items) {
  const segs = workSegments(items);
  const overlaps = segs
    .map((g) => ({ start: Math.max(g.start, AWAKE.start), end: Math.min(g.end, AWAKE.end) }))
    .filter((g) => g.end > g.start);

  // 오늘이면 현재 시각 선 표시
  const now = wallClock(Date.now(), viewTz());
  const nowLine = now.date === activeDay ? `<span class="tl-now" style="left:${pct(now.min)}"></span>` : "";

  const ticks = [0, 3, 6, 9, 12, 15, 18, 21, 24]
    .map((h) => `<span style="left:${pct(h * 60)}">${h}</span>`).join("");

  document.getElementById("timeline").innerHTML = `
    <div class="tl-grid">
      <div class="tl-label"><b>${t("rowAwake")}</b><small>${t("rowAwakeSub")}</small></div>
      <div class="tl-track tl-awake">
        <span class="tl-band" style="left:${pct(AWAKE.start)};width:${pct(AWAKE.end - AWAKE.start)}"></span>
      </div>

      <div class="tl-label"><b>${t("rowWork")}</b><small>${t("rowWorkSub")} 9–18</small></div>
      <div class="tl-track tl-work">
        ${segs.map((g) => `<span class="tl-band" style="left:${pct(g.start)};width:${pct(g.end - g.start)}"></span>`).join("")}
      </div>

      <div class="tl-label"><b>${t("rowSlots")}</b></div>
      <div class="tl-track tl-slots">
        ${items.map((s) => `
          <button type="button" class="tl-slot ${slotState(s)}${s.id === selectedId ? " is-selected" : ""}"
                  style="left:${pct(s.startMin)};width:${pct(s.endMin - s.startMin)}"
                  data-id="${s.id}" ${s.taken ? "disabled" : ""}
                  title="${esc(timeIn(s.start, viewTz()))} · ${esc(fmt("seoulFmt", { time: timeIn(s.start, RESEARCHER_TZ) }))}"></button>`).join("")}
      </div>

      <!-- 겹치는 구간을 세 줄 위에 반투명하게 덮어 표시 -->
      <div class="tl-cover">
        ${overlaps.map((g) => `<span style="left:${pct(g.start)};width:${pct(g.end - g.start)}"></span>`).join("")}
        ${nowLine}
      </div>

      <div class="tl-axis">${ticks}</div>
    </div>`;
}

/* ---------- 화면: 슬롯 목록 ---------- */
function renderSlotList(items) {
  const box = document.getElementById("slotList");
  if (!items.length) {
    box.innerHTML = `<p class="empty">${t("noSlots")}</p>`;
    return;
  }
  box.innerHTML = items.map((s, i) => `
    <button type="button" class="slot ${slotState(s)}${s.id === selectedId ? " is-selected" : ""}"
            data-id="${s.id}" ${s.taken ? "disabled" : ""} style="--i:${i}">
      <span class="slot-time">${esc(timeIn(s.start, viewTz()))}</span>
      <span class="slot-sub">${esc(fmt("seoulFmt", { time: timeIn(s.start, RESEARCHER_TZ) }))}</span>
      ${s.taken ? `<span class="slot-tag">${t("full")}</span>`
        : s.night ? `<span class="slot-tag">${s.early ? "🌅 " + t("earlyTag") : "🌙 " + t("nightTag")}</span>` : ""}
    </button>`).join("");
}

/* ---------- 화면: 선택 확인 ---------- */
function renderConfirm() {
  const box = document.getElementById("confirmBox");
  const s = SLOTS.find((x) => x.id === selectedId);
  if (!s) {
    box.innerHTML = `
      <h3 class="panel-title">${t("confirmTitle")}</h3>
      <div class="confirm-empty">🗓️<p>${t("pickHint")}</p></div>`;
    return;
  }
  box.innerHTML = `
    <h3 class="panel-title">${t("confirmTitle")}</h3>
    <div class="confirm-time">
      <p class="ct-label">${t("myTime")} · ${esc(viewTz())}</p>
      <p class="ct-main">${esc(fullDate(s.start, viewTz()))}</p>
      <p class="ct-label">${t("seoulTime")}</p>
      <p class="ct-sub">${esc(fullDate(s.start, RESEARCHER_TZ))}</p>
    </div>
    <button type="button" id="bookBtn" class="btn btn-primary btn-block">${t("confirmBtn")}</button>`;
}

/* ---------- 화면: 예약 완료 ---------- */
function bookingText(b) {
  return [
    `[Recruit Desk] ${loc(study.title)}`,
    `${t("myTime")}: ${fullDate(b.start, b.tz)} (${b.tz})`,
    `${t("seoulTime")}: ${fullDate(b.start, RESEARCHER_TZ)}`,
    `${t("method")}: ${loc(study.method)} · ${fmt("durationFmt", { n: study.durationMin })}`
  ].join("\n");
}

function renderDone(b) {
  document.getElementById("bookingArea").hidden = true;
  const box = document.getElementById("doneBox");
  box.hidden = false;
  box.innerHTML = `
    ${checkIconSVG()}
    <h2 class="result-title">${t("doneTitle")}</h2>
    <p class="result-desc">${t("doneDesc")}</p>
    <div class="done-times">
      <div><p class="ct-label">${t("myTime")} · ${esc(b.tz)}</p><p class="ct-main">${esc(fullDate(b.start, b.tz))}</p></div>
      <div><p class="ct-label">${t("seoulTime")}</p><p class="ct-sub">${esc(fullDate(b.start, RESEARCHER_TZ))}</p></div>
    </div>
    <div class="done-actions">
      <button type="button" class="btn btn-primary" data-action="copy">${t("copyInfo")}</button>
      <button type="button" class="btn btn-outline" data-action="cancel">${t("cancelBooking")}</button>
    </div>`;
  document.getElementById("stepper").innerHTML = stepperHTML(4);
}

/* ---------- 예외: 아직 적격 판정을 받지 않음 ---------- */
function isEligible() {
  return readJSON(APPLICANTS_KEY, []).some((a) => a.studyId === study.id && a.eligible);
}

function renderNotice(key, withLink) {
  document.getElementById("bookingArea")?.remove();
  document.getElementById("doneBox")?.remove();
  document.getElementById("stepper").innerHTML = "";
  const link = withLink
    ? `<p><a class="btn btn-primary" href="./study.html?id=${encodeURIComponent(study.id)}">${t("goScreener")}</a></p>` : "";
  document.getElementById("studyHead").insertAdjacentHTML("beforeend",
    `<div class="notice"><p>${esc(t(key))}</p>${link}</div>`);
}

/* ---------- 전체 그리기 ---------- */
function renderBooking() {
  const booking = readJSON(BOOKING_KEY, null);
  if (booking) return renderDone(booking);

  document.getElementById("bookingArea").hidden = false;
  document.getElementById("doneBox").hidden = true;
  document.getElementById("stepper").innerHTML = stepperHTML(3);

  const days = slotsByDay();
  renderTzSelect();
  renderDayTabs(days);
  const items = days.get(activeDay) || [];
  renderTimeline(items);
  renderSlotList(items);
  renderConfirm();
}

function renderAll() {
  applyI18n();
  if (!study) {
    document.querySelector(".study-page").innerHTML = `<p class="notice">${esc(t("notFound"))}</p>`;
    return;
  }
  renderHead();
  if (study.status === "closed") return renderNotice("closedMsg", false);
  if (!isEligible()) return renderNotice("notEligibleYet", true);
  renderBooking();
}

/* ---------- 이벤트 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initLangToggle();
  renderAll();
  if (!study || study.status === "closed" || !isEligible()) return;

  document.getElementById("tzSelect").addEventListener("change", (e) => {
    tzChoice = e.target.value;
    activeDay = null;                 // 시간대가 바뀌면 날짜 경계도 바뀐다
    renderBooking();
  });

  document.getElementById("dayTabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".day-tab");
    if (!tab) return;
    activeDay = tab.dataset.day;
    renderBooking();
  });

  // 타임라인 막대와 목록 버튼 모두 같은 방식으로 선택
  document.getElementById("bookingArea").addEventListener("click", (e) => {
    const slot = e.target.closest("[data-id]");
    if (slot && !slot.disabled) {
      selectedId = slot.dataset.id;
      renderBooking();
      if (window.innerWidth < 860) {
        document.getElementById("confirmBox").scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (e.target.id === "bookBtn") {
      const s = SLOTS.find((x) => x.id === selectedId);
      if (!s) return;
      writeJSON(BOOKING_KEY, {
        slotId: s.id, studyId: study.id, start: s.start, end: s.end,
        tz: viewTz(), bookedAt: new Date().toISOString()
      });
      renderBooking();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  document.getElementById("doneBox").addEventListener("click", async (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "copy") {
      const ok = await copyText(bookingText(readJSON(BOOKING_KEY, null)));
      if (ok) toast(t("copied"));
    } else if (action === "cancel") {
      try { localStorage.removeItem(BOOKING_KEY); } catch (err) { /* 무시 */ }
      selectedId = null;
      renderBooking();
      toast(t("cancelled"));
    }
  });
});

document.addEventListener("langchange", renderAll);
