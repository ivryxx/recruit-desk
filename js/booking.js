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
  document.getElementById("tzName").textContent = `${viewTz()} · ${utcOffsetLabel(viewTz())}`;
  document.getElementById("tzNow").textContent = timeIn(Date.now(), viewTz());
  const sel = document.getElementById("tzSelect");
  sel.innerHTML = TZ_OPTIONS.map((tz) => {
    const label = tz === "auto"
      ? `${t("tzAuto")} · ${autoTz} (${utcOffsetLabel(autoTz)})`
      : `${tz.split("/").pop().replace(/_/g, " ")} (${utcOffsetLabel(tz)})`;
    return `<option value="${tz}" ${tz === tzChoice ? "selected" : ""}>${esc(label)}</option>`;
  }).join("");
}

/* ---------- 화면: 날짜 탭 (달력 칩) ---------- */
function dateParts(ts, tz) {
  const p = {};
  new Intl.DateTimeFormat(locale(), { timeZone: tz, month: "short", day: "numeric", weekday: "short" })
    .formatToParts(ts).forEach((x) => { p[x.type] = x.value; });
  return p;
}

function renderDayTabs(days) {
  if (!activeDay || !days.has(activeDay)) activeDay = [...days.keys()][0];
  let lastMonth = "";
  document.getElementById("dayTabs").innerHTML = [...days.entries()].map(([date, items]) => {
    const open = items.filter((s) => !s.taken).length;
    const active = date === activeDay;
    const p = dateParts(items[0].start, viewTz());
    const showMonth = p.month !== lastMonth;           // 달이 바뀌는 첫 칸에만 월 표시
    lastMonth = p.month;
    return `<button type="button" role="tab" class="day-tab${active ? " is-active" : ""}${open ? "" : " is-empty"}"
              data-day="${date}" aria-selected="${active}" aria-label="${esc(dayLabel(items[0].start, viewTz()))}">
              <span class="dt-wd">${esc(showMonth ? `${p.month} · ${p.weekday}` : p.weekday)}</span>
              <span class="dt-d">${esc(p.day)}</span>
              <span class="dt-n">${open ? fmt("slotCountFmt", { n: open }) : t("full")}</span>
            </button>`;
  }).join("");
}

/* ---------- 화면: 24시간 타임라인 ---------- */
function slotState(s) {
  if (s.taken) return "is-full";
  return s.night ? "is-night" : "is-ok";
}

/* 시각을 '10:30' 처럼 (오전/오후는 그룹 이름이 대신 보여준다) */
function clockOnly(ts, tz) {
  return new Intl.DateTimeFormat(locale(), { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
    .formatToParts(ts).filter((x) => x.type === "hour" || x.type === "minute" || x.type === "literal")
    .map((x) => x.value).join("").replace(/^[^\d]+|[^\d]+$/g, "");
}

/* 보고 있는 시간대가 서울과 같은 시각이면 '서울 ○시' 보조 표시는 생략 */
function sameAsSeoul(ts) {
  return wallClock(ts, viewTz()).min === wallClock(ts, RESEARCHER_TZ).min;
}

function renderTimeline(items) {
  const segs = workSegments(items);
  const now = wallClock(Date.now(), viewTz());
  const nowLine = now.date === activeDay ? `<span class="tl-now" style="left:${pct(now.min)}"></span>` : "";
  const axis = [[0, "axis0"], [6, "axis6"], [12, "axis12"], [18, "axis18"], [24, "axis0"]]
    .map(([h, k]) => `<span style="left:${pct(h * 60)}">${t(k)}</span>`).join("");

  document.getElementById("timeline").innerHTML = `
    <div class="tl-keys">
      <span><i class="k k-day"></i>${t("keyDay")}</span>
      <span><i class="k k-work"></i>${t("keyWork")}</span>
    </div>
    <div class="tl-bar">
      <span class="tl-day" style="left:${pct(AWAKE.start)};width:${pct(AWAKE.end - AWAKE.start)}"></span>
      ${[AWAKE.start / 2, (AWAKE.end + 1440) / 2]
        .filter((m) => !items.some((s) => s.endMin > m - 60 && s.startMin < m + 60))
        .map((m) => `<span class="tl-moon" style="left:${pct(m)}">🌙</span>`).join("")}
      ${segs.map((g) => `<span class="tl-work" style="left:${pct(g.start)};width:${pct(g.end - g.start)}"></span>`).join("")}
      ${items.map((s) => `
        <button type="button" class="tl-tick ${slotState(s)}${s.id === selectedId ? " is-selected" : ""}"
                style="left:${pct(s.startMin)};width:${pct(Math.min(s.endMin, 1440) - s.startMin)}"
                data-id="${s.id}" ${s.taken ? "disabled" : ""}
                aria-label="${esc(timeIn(s.start, viewTz()))}"
                title="${esc(timeIn(s.start, viewTz()))}${sameAsSeoul(s.start) ? "" : ` · ${esc(fmt("seoulFmt", { time: timeIn(s.start, RESEARCHER_TZ) }))}`}"></button>`).join("")}
      ${nowLine}
    </div>
    <div class="tl-axis">${axis}</div>
    <ul class="legend">
      <li><i class="lg lg-ok"></i>${t("legendOk")}</li>
      <li><i class="lg lg-night"></i>${t("legendNight")}</li>
      <li><i class="lg lg-full"></i>${t("legendFull")}</li>
      <li><i class="lg lg-sel"></i>${t("legendSelected")}</li>
    </ul>`;
}

/* ---------- 화면: 슬롯 목록 (시간대별 묶음 + 작은 칩) ---------- */
const GROUPS = [
  { key: "groupDawn", icon: "🌙", from: 0, to: 6 * 60 },
  { key: "groupMorning", icon: "🌅", from: 6 * 60, to: 12 * 60 },
  { key: "groupAfternoon", icon: "☀️", from: 12 * 60, to: 18 * 60 },
  { key: "groupEvening", icon: "🌆", from: 18 * 60, to: 24 * 60 }
];
let showTaken = false;
let lastViewKey = "";

function clock24(ts, tz) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ts);
}

function chipHTML(s, i) {
  const sub = sameAsSeoul(s.start) ? "" : `<small>${esc(fmt("seoulFmt", { time: clock24(s.start, RESEARCHER_TZ) }))}</small>`;
  const icon = !s.taken && s.night
    ? `<i class="chip-dot" title="${esc(s.early ? t("earlyTag") : t("nightTag"))}" aria-label="${esc(s.early ? t("earlyTag") : t("nightTag"))}"></i>` : "";
  return `
    <button type="button" class="tchip ${slotState(s)}${s.id === selectedId ? " is-selected" : ""}"
            data-id="${s.id}" ${s.taken ? `disabled aria-label="${esc(t("full"))}"` : ""} style="--i:${i}">
      <b>${esc(clockOnly(s.start, viewTz()))}</b>${icon}${sub}
    </button>`;
}

function renderSlotList(items) {
  const box = document.getElementById("slotList");
  const takenCount = items.filter((s) => s.taken).length;
  document.getElementById("takenToggle").hidden = takenCount === 0;
  document.getElementById("takenLabel").textContent = fmt("showTakenFmt", { n: takenCount });

  const visible = items.filter((s) => showTaken || !s.taken);
  if (!visible.length) {
    box.innerHTML = `<div class="slots-empty">🗓️<p>${t("noSlots")}</p></div>`;
    return;
  }
  let i = 0;
  box.innerHTML = GROUPS.map((g) => {
    const list = visible.filter((s) => s.startMin >= g.from && s.startMin < g.to);
    if (!list.length) return "";
    const open = list.filter((s) => !s.taken).length;
    return `
      <div class="slot-group">
        <p class="group-label"><span>${g.icon}</span>${t(g.key)}<em>${fmt("slotCountFmt", { n: open })}</em></p>
        <div class="tchips">${list.map((s) => chipHTML(s, i++)).join("")}</div>
      </div>`;
  }).join("");
}

/* ---------- 화면: 선택 확인 (PC: 오른쪽 카드, 모바일: 하단 고정 바) ---------- */
function dayPeriod(ts, tz) {
  const part = new Intl.DateTimeFormat(locale(), { timeZone: tz, hour: "numeric", hour12: true })
    .formatToParts(ts).find((x) => x.type === "dayPeriod");
  return part ? part.value : "";
}
function rangeText(s, tz) {
  const end = dayPeriod(s.start, tz) === dayPeriod(s.end, tz) ? clockOnly(s.end, tz) : timeIn(s.end, tz);
  return `${timeIn(s.start, tz)} – ${end}`;
}
function longDay(ts, tz) {
  return new Intl.DateTimeFormat(locale(), { timeZone: tz, month: "long", day: "numeric", weekday: "long" }).format(ts);
}

function renderConfirm() {
  const box = document.getElementById("confirmBox");
  const bar = document.getElementById("mobileBar");
  const s = SLOTS.find((x) => x.id === selectedId);

  if (!s) {
    box.innerHTML = `
      <p class="cf-eyebrow">${t("confirmTitle")}</p>
      <div class="confirm-empty">
        <div class="ce-ico">🗓️</div>
        <p>${t("pickHint")}</p>
      </div>
      <dl class="cf-meta">
        <div><dt>${t("method")}</dt><dd>${esc(loc(study.method))}</dd></div>
        <div><dt>${t("duration")}</dt><dd>${fmt("durationFmt", { n: study.durationMin })}</dd></div>
      </dl>`;
    bar.hidden = true;
    document.body.classList.remove("has-bar");
    return;
  }

  const seoul = sameAsSeoul(s.start) ? "" : `
      <div class="cf-seoul">
        <span>${t("seoulTime")}</span>
        <b>${esc(longDay(s.start, RESEARCHER_TZ))} · ${esc(rangeText(s, RESEARCHER_TZ))}</b>
      </div>`;
  box.innerHTML = `
    <p class="cf-eyebrow">${t("confirmTitle")}</p>
    <div class="cf-card">
      <p class="cf-day">${esc(longDay(s.start, viewTz()))}</p>
      <p class="cf-time">${esc(rangeText(s, viewTz()))}</p>
      <p class="cf-tz">${esc(viewTz())} · ${esc(utcOffsetLabel(viewTz()))}</p>
      ${seoul}
    </div>
    <dl class="cf-meta">
      <div><dt>${t("method")}</dt><dd>${esc(loc(study.method))}</dd></div>
      <div><dt>${t("duration")}</dt><dd>${fmt("durationFmt", { n: study.durationMin })}</dd></div>
    </dl>
    <button type="button" class="btn btn-primary btn-block" data-action="book">${t("confirmBtn")}</button>`;

  bar.innerHTML = `
    <div class="mb-text">
      <small>${esc(longDay(s.start, viewTz()))}</small>
      <b>${esc(rangeText(s, viewTz()))}</b>
    </div>
    <button type="button" class="btn btn-primary" data-action="book">${t("bookShort")}</button>`;
  bar.hidden = false;
  document.body.classList.add("has-bar");
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
  document.getElementById("mobileBar").hidden = true;
  document.body.classList.remove("has-bar");
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

  // 날짜·시간대·마감 보기가 바뀔 때만 등장 애니메이션 (시간을 고를 때마다 깜빡이지 않게)
  const viewKey = `${activeDay}|${viewTz()}|${showTaken}|${currentLang}`;
  const animate = viewKey !== lastViewKey;
  lastViewKey = viewKey;
  document.getElementById("timeline").classList.toggle("no-anim", !animate);
  document.getElementById("slotList").classList.toggle("no-anim", !animate);

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

  document.getElementById("showTaken").addEventListener("change", (e) => {
    showTaken = e.target.checked;
    renderBooking();
  });

  // 타임라인 눈금과 목록 칩 모두 같은 방식으로 선택
  document.getElementById("bookingArea").addEventListener("click", (e) => {
    const slot = e.target.closest("[data-id]");
    if (slot && !slot.disabled) {
      selectedId = slot.dataset.id === selectedId ? null : slot.dataset.id;   // 다시 누르면 선택 해제
      renderBooking();
    }
  });

  // 예약 버튼 (오른쪽 카드와 모바일 하단 바 공통)
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-action=book]")) return;
    const s = SLOTS.find((x) => x.id === selectedId);
    if (!s) return;
    writeJSON(BOOKING_KEY, {
      slotId: s.id, studyId: study.id, start: s.start, end: s.end,
      tz: viewTz(), bookedAt: new Date().toISOString()
    });
    renderBooking();
    window.scrollTo({ top: 0, behavior: "smooth" });
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
