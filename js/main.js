/* main.js — 초기 화면: 세계 시계, 리서치 카드 목록, 국가 필터 */

let activeCountry = "ALL";

/* ---------- 세계 시계 ---------- */
const RESEARCHER = { flag: "kr", tz: "Asia/Seoul", name: { ko: "서울 · 리서처", en: "Seoul · Researcher" } };

function clockRows() {
  const seen = new Set();
  const rows = [RESEARCHER];
  STUDIES.forEach((s) => {
    if (s.status === "open" && !seen.has(s.country)) {
      seen.add(s.country);
      rows.push({ flag: s.flag, tz: s.tz, name: s.countryName });
    }
  });
  return rows;
}

function renderClocks() {
  const now = new Date();
  const locale = currentLang === "ko" ? "ko-KR" : "en-US";
  document.getElementById("clocks").innerHTML = clockRows().map((c) => {
    const p = {};
    new Intl.DateTimeFormat("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now).forEach((x) => { p[x.type] = x.value; });
    const minutes = (Number(p.hour) % 24) * 60 + Number(p.minute);
    const isDay = minutes >= 7 * 60 && minutes < 19 * 60;
    const time = new Intl.DateTimeFormat(locale, { timeZone: c.tz, hour: "2-digit", minute: "2-digit" }).format(now);
    return `
      <li class="clock">
        <span class="clock-flag">${flagImg(c.flag)}</span>
        <span class="clock-name">${esc(loc(c.name))}</span>
        <span class="clock-time">${esc(time)}</span>
        <span class="clock-icon" title="${isDay ? "day" : "night"}">${isDay ? "☀️" : "🌙"}</span>
        <span class="day-bar"><span style="left:${(minutes / 1440) * 100}%"></span></span>
      </li>`;
  }).join("");
}

/* ---------- 필터 ---------- */
function renderFilters() {
  const bar = document.getElementById("filterBar");
  const countries = [...new Map(STUDIES.map((s) => [s.country, s])).values()];

  const all = `<button type="button" class="chip${activeCountry === "ALL" ? " is-active" : ""}"
                 data-country="ALL" aria-pressed="${activeCountry === "ALL"}">${esc(t("filterAll"))}</button>`;
  bar.innerHTML = all + countries.map((s) => {
    const pressed = s.country === activeCountry;
    return `<button type="button" class="chip${pressed ? " is-active" : ""}"
              data-country="${s.country}" aria-pressed="${pressed}">${flagImg(s.flag)} ${esc(loc(s.countryName))}</button>`;
  }).join("");
}

/* ---------- 카드 ---------- */
function cardHTML(s, i) {
  const remain = Math.max(0, s.quota - s.filled);
  const closed = s.status === "closed" || remain === 0;
  const pct = Math.round((s.filled / s.quota) * 100);

  return `
    <article class="study-card${closed ? " is-closed" : ""}" style="--i:${i}">
      <div class="card-top">
        <span class="badge badge-country">${flagImg(s.flag)} ${esc(loc(s.countryName))}</span>
        <span class="badge ${closed ? "badge-closed" : "badge-open"}">
          ${t(closed ? "statusClosed" : "statusOpen")}
        </span>
      </div>
      <h3 class="card-title">${esc(loc(s.title))}</h3>
      <p class="card-summary">${esc(loc(s.summary))}</p>
      <dl class="card-meta">
        <div><dt>${t("method")}</dt><dd>${esc(loc(s.method))}</dd></div>
        <div><dt>${t("duration")}</dt><dd>${fmt("durationFmt", { n: s.durationMin })}</dd></div>
        <div><dt>${t("reward")}</dt><dd>${esc(loc(s.reward))}</dd></div>
      </dl>
      <div class="quota">
        <div class="quota-bar"><span style="width:${pct}%"></span></div>
        <p class="quota-text">${fmt("remainFmt", { r: remain, q: s.quota })}</p>
      </div>
      <a class="btn ${closed ? "btn-disabled" : "btn-outline"}"
         href="./study.html?id=${encodeURIComponent(s.id)}"
         ${closed ? 'aria-disabled="true" tabindex="-1"' : ""}>${t("viewDetail")}</a>
    </article>`;
}

function renderStudies() {
  const grid = document.getElementById("studyGrid");
  const list = STUDIES.filter((s) => activeCountry === "ALL" || s.country === activeCountry);

  // 모집 중인 리서치를 먼저, 마감은 뒤로
  list.sort((a, b) => (a.status === "closed") - (b.status === "closed"));

  document.getElementById("studyCount").textContent =
    fmt("countFmt", { n: list.filter((s) => s.status === "open").length });

  grid.innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<p class="empty">${t("empty")}</p>`;
}

function renderAll() {
  applyI18n();
  renderClocks();
  renderFilters();
  renderStudies();
}

document.addEventListener("DOMContentLoaded", () => {
  initLangToggle();
  renderAll();
  setInterval(renderClocks, 30 * 1000);

  // 필터 버튼: 이벤트 위임
  document.getElementById("filterBar").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeCountry = btn.dataset.country;
    renderFilters();
    renderStudies();
  });

  // 마감 카드 링크 클릭 막기
  document.getElementById("studyGrid").addEventListener("click", (e) => {
    if (e.target.closest(".btn-disabled")) e.preventDefault();
  });
});

document.addEventListener("langchange", renderAll);
