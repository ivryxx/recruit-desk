/* insights.js — 메인 화면 '전 세계 리서치 현황'
 *  1) 점으로 그린 세계지도 (SVG): 서울에서 각 리서치 국가로 이어지는 곡선, 마커, 툴팁
 *  2) 핵심 지표 4개 (숫자가 올라가는 애니메이션)
 *  3) 차트 2개 (Chart.js): 리서치별 모집 현황, 서울 근무시간과 겹치는 현지 시간
 * 지도 육지 데이터는 worldmap-data.js (Natural Earth 기반, 미리 계산해 둔 점 격자)
 */

const GEO = {                      // [경도, 위도] — 마커 위치
  KR: [126.98, 37.57],             // 서울
  JP: [139.69, 35.69],             // 도쿄
  VN: [106.66, 10.76],             // 호찌민
  US: [-74.0, 40.71],              // 뉴욕
  TW: [121.56, 25.03]              // 타이베이
};
// 이름표 위치: [정렬, x, y] — 동아시아에 마커가 몰려 있어 서로 겹치지 않게 방향을 나눈다
const LABEL_POS = {
  JP: ["start", 16, 7],
  TW: ["start", 16, 9],
  VN: ["end", -16, 7],
  US: ["middle", 0, -20],
  HUB: ["end", -18, -10]
};
const WORK_KST = { start: 9 * 60, end: 18 * 60 };
const AWAKE_LOCAL = { start: 8 * 60, end: 22 * 60 };
const CELL = 10;                   // 격자 한 칸 = SVG 10단위
const CHART_BLUE = "#3182f6";      // dataviz 검증 통과 (명도·채도·대비)
const TRACK_GRAY = "#e5e8eb";

let charts = [];

/* ---------- 좌표 변환 (태평양 중심 정거원통도법) ---------- */
function project([lon, lat]) {
  const { step, lon0, latTop } = WORLD_DOTS;
  const dx = (((lon - lon0) % 360) + 360) % 360;
  return [(dx / step) * CELL + CELL / 2, ((latTop - lat) / step) * CELL + CELL / 2];
}

/* 나라별 요약: 모집 중 리서치 수, 시간대 */
function countrySummary() {
  const map = new Map();
  STUDIES.forEach((s) => {
    const c = map.get(s.country) || { code: s.country, flag: s.flag, tz: s.tz, name: s.countryName, open: 0, total: 0 };
    c.total++;
    if (s.status === "open" && s.filled < s.quota) c.open++;
    map.set(s.country, c);
  });
  return [...map.values()];
}

/* ---------- 1. 세계지도 ---------- */
function labelSVG(code, text) {
  const [anchor, x, y] = LABEL_POS[code] || ["middle", 0, -18];
  return `<text class="mk-label" text-anchor="${anchor}" x="${x}" y="${y}">${esc(text)}</text>`;
}

function renderMap() {
  const svg = document.getElementById("worldMap");
  const W = WORLD_DOTS.cols * CELL;
  const H = WORLD_DOTS.rows * CELL;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  // 육지 점: 원 수천 개 대신 path 하나로 그려 가볍게 만든다
  let d = "";
  WORLD_DOTS.grid.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === "1") {
        const x = c * CELL + CELL / 2;
        const y = r * CELL + CELL / 2;
        d += `M${x - 2.6},${y}a2.6,2.6 0 1,0 5.2,0a2.6,2.6 0 1,0 -5.2,0`;
      }
    }
  });

  const hub = project(GEO.KR);
  const countries = countrySummary();

  // 서울 → 각 나라 곡선 (거리에 비례해 위로 휘게)
  const arcs = countries.map((c, i) => {
    const [x, y] = project(GEO[c.code]);
    const mx = (hub[0] + x) / 2;
    const my = (hub[1] + y) / 2 - Math.hypot(x - hub[0], y - hub[1]) * 0.35;
    const path = `M${hub[0]},${hub[1]} Q${mx},${my} ${x},${y}`;
    const live = c.open > 0;
    return `
      <path class="arc${live ? "" : " is-closed"}" d="${path}" style="--i:${i}"/>
      ${live ? `<circle class="comet" r="4"><animateMotion dur="${2.6 + i * 0.4}s" repeatCount="indefinite" path="${path}"/></circle>` : ""}`;
  }).join("");

  const markers = countries.map((c) => {
    const [x, y] = project(GEO[c.code]);
    const live = c.open > 0;
    return `
      <g class="mk${live ? " is-open" : " is-closed"}" data-country="${c.code}" transform="translate(${x},${y})"
         tabindex="0" role="button" aria-label="${esc(loc(c.name))}">
        ${live ? `<circle class="mk-pulse" r="9"/>` : ""}
        <circle class="mk-hit" r="26"/>
        <circle class="mk-core" r="9"/>
        ${labelSVG(c.code, loc(c.name))}
      </g>`;
  }).join("");

  svg.innerHTML = `
    <defs>
      <radialGradient id="hubGlow"><stop offset="0" stop-color="#6ea8ff" stop-opacity=".55"/><stop offset="1" stop-color="#6ea8ff" stop-opacity="0"/></radialGradient>
    </defs>
    <path class="land" d="${d}"/>
    <circle cx="${hub[0]}" cy="${hub[1]}" r="60" fill="url(#hubGlow)"/>
    ${arcs}
    ${markers}
    <g class="mk mk-hub" transform="translate(${hub[0]},${hub[1]})">
      <circle class="mk-core" r="10"/>
      ${labelSVG("HUB", t("hubName"))}
    </g>`;
}

/* 마커 툴팁 */
function localTime(tz) {
  return new Intl.DateTimeFormat(currentLang === "ko" ? "ko-KR" : "en-US",
    { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function showTip(g) {
  const c = countrySummary().find((x) => x.code === g.dataset.country);
  if (!c) return;
  const tip = document.getElementById("mapTip");
  tip.innerHTML = `
    <p class="tip-head">${flagImg(c.flag)} <b>${esc(loc(c.name))}</b></p>
    <p class="tip-line">🕒 ${esc(fmt("tipLocal", { time: localTime(c.tz) }))}</p>
    <p class="tip-line ${c.open ? "tip-open" : "tip-closed"}">${c.open ? fmt("tipOpen", { n: c.open }) : t("tipClosed")}</p>
    ${c.open ? `<p class="tip-cta">${t("tipCta")}</p>` : ""}`;
  tip.hidden = false;

  // 마커 위쪽에 띄우되, 카드 밖으로 나가지 않게
  const card = tip.parentElement.getBoundingClientRect();
  const m = g.querySelector(".mk-core").getBoundingClientRect();
  const x = m.left + m.width / 2 - card.left;
  const y = m.top - card.top;
  const left = Math.min(Math.max(x - tip.offsetWidth / 2, 8), card.width - tip.offsetWidth - 8);
  tip.style.left = `${left}px`;
  tip.style.top = `${Math.max(y - tip.offsetHeight - 12, 8)}px`;
}

function hideTip() {
  document.getElementById("mapTip").hidden = true;
}

/* 마커를 누르면 아래 목록을 그 나라로 필터 (main.js 의 함수 사용) */
function goCountry(code) {
  const c = countrySummary().find((x) => x.code === code);
  if (!c || !c.open) return;
  activeCountry = code;
  renderFilters();
  renderStudies();
  document.getElementById("studies").scrollIntoView({ behavior: "smooth" });
}

/* ---------- 2. 핵심 지표 ---------- */
function overlapHours(tz) {
  // 다음 평일 서울 9~18시를 15분 단위로 훑으며, 현지 8~22시에 들어가는 시간을 센다
  const kstNow = new Date(Date.now() + 9 * 3600e3);
  let day = 1;
  while ([0, 6].includes(new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + day)).getUTCDay())) day++;
  const base = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + day) - 9 * 3600e3;
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  let inside = 0;
  let first = null;
  let last = null;
  for (let m = WORK_KST.start; m < WORK_KST.end; m += 15) {
    const ts = base + m * 60000;
    const p = {};
    f.formatToParts(ts).forEach((x) => { p[x.type] = x.value; });
    const local = (Number(p.hour) % 24) * 60 + Number(p.minute);
    if (local >= AWAKE_LOCAL.start && local < AWAKE_LOCAL.end) {
      inside += 15;
      if (first === null) first = ts;
      last = ts + 15 * 60000;
    }
  }
  return { hours: inside / 60, first, last };
}

function renderKpis() {
  const open = STUDIES.filter((s) => s.status === "open" && s.filled < s.quota);
  const countries = new Set(open.map((s) => s.country));
  const seats = open.reduce((sum, s) => sum + (s.quota - s.filled), 0);
  const overlaps = [...countries].map((code) => overlapHours(open.find((s) => s.country === code).tz).hours);
  const avg = overlaps.length ? overlaps.reduce((a, b) => a + b, 0) / overlaps.length : 0;

  const tiles = [
    { key: "kpiOpen", value: open.length, unit: "unitStudies", dec: 0 },
    { key: "kpiCountries", value: countries.size, unit: "unitCountries", dec: 0 },
    { key: "kpiSeats", value: seats, unit: "unitPeople", dec: 0 },
    { key: "kpiOverlap", value: avg, unit: "unitHours", dec: 1 }
  ];
  document.getElementById("kpis").innerHTML = tiles.map((k) => `
    <div class="kpi">
      <p class="kpi-label">${t(k.key)}</p>
      <p class="kpi-value"><span data-count="${k.value}" data-dec="${k.dec}">${k.value.toFixed(k.dec)}</span><small>${t(k.unit)}</small></p>
    </div>`).join("");
}

/* 화면에 보일 때 숫자가 0부터 올라가는 효과 */
function countUp(root) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const dec = Number(el.dataset.dec);
    if (reduce) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 900);
      el.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- 3. 차트 ---------- */
/* 막대 끝에 값 글자를 직접 쓰는 작은 플러그인 (값마다 다 쓰지 않고 막대 하나당 하나) */
const endLabels = {
  id: "endLabels",
  afterDatasetsDraw(chart, _args, opts) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(opts.datasetIndex ?? chart.data.datasets.length - 1);
    ctx.save();
    ctx.font = "600 12px 'Noto Sans KR', sans-serif";
    ctx.fillStyle = "#4e5968";
    ctx.textBaseline = "middle";
    meta.data.forEach((bar, i) => ctx.fillText(opts.text(i), bar.x + 8, bar.y));
    ctx.restore();
  }
};

function baseOptions() {
  return {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: "easeOutCubic" },
    layout: { padding: { right: 56 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#191f28",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { family: "'Noto Sans KR', sans-serif", weight: "700" },
        bodyFont: { family: "'Noto Sans KR', sans-serif" }
      }
    },
    scales: {
      x: {
        grid: { color: "#f2f4f6" },
        border: { display: false },
        ticks: { color: "#8b95a1", font: { size: 11 } }
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#4e5968", font: { size: 12, family: "'Noto Sans KR', sans-serif" } }
      }
    }
  };
}

function shortTitle(s) {
  return loc(s.countryName);          // 축 이름은 짧게 (전체 제목은 툴팁에)
}

function renderCharts() {
  charts.forEach((c) => c.destroy());
  charts = [];

  // 데이터
  const studies = [...STUDIES];
  const overlapRows = countrySummary()
    .map((c) => ({ ...c, ...overlapHours(c.tz) }))
    .sort((a, b) => b.hours - a.hours);
  const rangeText = (r, tz) => {
    if (r.first === null) return "—";
    const f = new Intl.DateTimeFormat(currentLang === "ko" ? "ko-KR" : "en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
    return fmt("localRangeFmt", { a: f.format(r.first), b: f.format(r.last) });
  };

  // 표 (차트를 못 그리는 환경이나 화면 낭독기용)
  document.getElementById("quotaTable").innerHTML = `
    <table><thead><tr><th>${t("colStudy")}</th><th>${t("colFilled")}</th><th>${t("colQuota")}</th></tr></thead>
    <tbody>${studies.map((s) => `<tr><td>${esc(loc(s.title))}</td><td>${s.filled}</td><td>${s.quota}</td></tr>`).join("")}</tbody></table>`;
  document.getElementById("overlapTable").innerHTML = `
    <table><thead><tr><th>${t("colCountry")}</th><th>${t("colHours")}</th><th>${t("colRange")}</th></tr></thead>
    <tbody>${overlapRows.map((r) => `<tr><td>${esc(loc(r.name))}</td><td>${r.hours}</td><td>${esc(rangeText(r, r.tz))}</td></tr>`).join("")}</tbody></table>`;

  if (!window.Chart) {                      // CDN 을 못 불러오면 표를 보여준다
    document.querySelectorAll(".chart-box").forEach((b) => { b.hidden = true; });
    document.querySelectorAll(".chart-table").forEach((b) => b.classList.add("is-visible"));
    return;
  }

  // 차트 1: 리서치별 모집 현황 (확정 인원 + 남은 자리를 회색 트랙으로)
  const q = baseOptions();
  q.scales.x.stacked = true;
  q.scales.y.stacked = true;
  q.scales.x.ticks.precision = 0;
  q.plugins.endLabels = { datasetIndex: 1, text: (i) => `${studies[i].filled}/${studies[i].quota}` };
  q.plugins.tooltip.filter = (item) => item.datasetIndex === 0;
  q.plugins.tooltip.callbacks = {
    title: (items) => loc(studies[items[0].dataIndex].title),
    label: (item) => {
      const s = studies[item.dataIndex];
      return [loc(s.method),
        `${fmt("tipFilled", { n: s.filled })} · ${fmt("tipQuota", { n: s.quota })} (${Math.round((s.filled / s.quota) * 100)}%)`];
    }
  };
  charts.push(new Chart(document.getElementById("quotaChart"), {
    type: "bar",
    data: {
      labels: studies.map(shortTitle),
      datasets: [
        { data: studies.map((s) => s.filled), backgroundColor: CHART_BLUE, borderRadius: 4, borderSkipped: "start", barThickness: 14 },
        { data: studies.map((s) => s.quota - s.filled), backgroundColor: TRACK_GRAY, borderRadius: 4, borderSkipped: "start", barThickness: 14 }
      ]
    },
    options: q,
    plugins: [endLabels]
  }));

  // 차트 2: 서울 평일 9~18시 중 현지 8~22시와 겹치는 시간
  const o = baseOptions();
  o.scales.x.max = 9;
  o.scales.x.ticks.stepSize = 3;
  o.plugins.endLabels = { datasetIndex: 0, text: (i) => fmt("hoursFmt", { n: overlapRows[i].hours }) };
  o.plugins.tooltip.callbacks = {
    title: (items) => loc(overlapRows[items[0].dataIndex].name),
    label: (item) => {
      const r = overlapRows[item.dataIndex];
      return [fmt("hoursFmt", { n: r.hours }), rangeText(r, r.tz)];
    }
  };
  charts.push(new Chart(document.getElementById("overlapChart"), {
    type: "bar",
    data: {
      labels: overlapRows.map((r) => loc(r.name)),
      datasets: [{ data: overlapRows.map((r) => r.hours), backgroundColor: CHART_BLUE, borderRadius: 4, borderSkipped: "start", barThickness: 14 }]
    },
    options: o,
    plugins: [endLabels]
  }));
}

/* ---------- 시작 ---------- */
function renderInsights() {
  renderMap();
  renderKpis();
  renderCharts();
}

document.addEventListener("DOMContentLoaded", () => {
  renderInsights();

  // 지표 숫자 애니메이션은 화면에 들어올 때 한 번
  const kpis = document.getElementById("kpis");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { countUp(kpis); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(kpis);
  }

  // 지도 마커: 마우스를 올리면 툴팁, 누르면 목록 필터
  const svg = document.getElementById("worldMap");
  svg.addEventListener("mouseover", (e) => {
    const g = e.target.closest(".mk[data-country]");
    g ? showTip(g) : hideTip();
  });
  svg.addEventListener("mouseleave", hideTip);
  svg.addEventListener("click", (e) => {
    const g = e.target.closest(".mk[data-country]");
    if (g) goCountry(g.dataset.country);
  });
  svg.addEventListener("focusin", (e) => {
    const g = e.target.closest(".mk[data-country]");
    if (g) showTip(g);
  });
  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest(".mk[data-country]");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); goCountry(g.dataset.country); }
  });
});

document.addEventListener("langchange", () => {
  hideTip();
  renderInsights();
  countUp(document.getElementById("kpis"));
});
