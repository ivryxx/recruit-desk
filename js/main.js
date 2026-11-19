/* main.js — 초기 화면: 리서치 카드 목록과 국가 필터 */

let activeCountry = "ALL";

function renderFilters() {
  const bar = document.getElementById("filterBar");
  const countries = [...new Map(STUDIES.map((s) => [s.country, s.countryName])).entries()];

  const buttons = [["ALL", null], ...countries].map(([code, name]) => {
    const label = code === "ALL" ? t("filterAll") : loc(name);
    const pressed = code === activeCountry;
    return `<button type="button" class="chip${pressed ? " is-active" : ""}"
              data-country="${code}" aria-pressed="${pressed}">${esc(label)}</button>`;
  });
  bar.innerHTML = buttons.join("");
}

function cardHTML(s) {
  const remain = Math.max(0, s.quota - s.filled);
  const closed = s.status === "closed" || remain === 0;
  const pct = Math.round((s.filled / s.quota) * 100);

  return `
    <article class="study-card${closed ? " is-closed" : ""}">
      <div class="card-top">
        <span class="badge badge-country">${esc(s.country)} · ${esc(loc(s.countryName))}</span>
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
  renderFilters();
  renderStudies();
}

document.addEventListener("DOMContentLoaded", () => {
  initLangToggle();
  renderAll();

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
