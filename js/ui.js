/* ui.js — 여러 화면에서 함께 쓰는 UI 조각 (국기, 진행 단계, 토스트 알림, 체크 아이콘) */

/* 국기 이미지: 국기 이모지는 Windows 에서 글자로만 보여서 이미지로 표시한다 (flagcdn.com) */
function flagImg(code) {
  return `<img class="flag" src="https://flagcdn.com/w40/${code}.png" alt="" width="20" height="15" loading="lazy">`;
}

/* 진행 단계: current = 1(리서치 선택) / 2(사전 설문) / 3(인터뷰 예약) / 4(모두 완료) */
function stepperHTML(current) {
  const keys = ["step1T", "step2T", "step3T"];
  return `<ol class="stepper">${keys.map((k, i) => {
    const n = i + 1;
    const state = n < current ? "is-done" : n === current ? "is-current" : "";
    return `<li class="${state}">
      <span class="step-dot">${n < current ? "✓" : n}</span>
      <span class="step-label">${esc(t(k))}</span>
    </li>`;
  }).join("")}</ol>`;
}

/* 화면 아래에 잠깐 떴다 사라지는 알림 */
function toast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* 원과 체크 표시가 그려지는 아이콘 (CSS 애니메이션) */
function checkIconSVG() {
  return `<svg class="check-svg" viewBox="0 0 52 52" aria-hidden="true">
    <circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg>`;
}

/* 클립보드 복사: Clipboard API 를 쓰고, 안 되는 환경이면 예전 방식으로 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
