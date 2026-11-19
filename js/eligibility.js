/* eligibility.js — 적격 판정 규칙 (3주차)
 * 리서치마다 조건 목록을 두고, 모든 조건을 만족하면 적격으로 판정한다.
 *   { q: 질문 id, in:  [값...] }  → 단일 선택 응답이 이 값 중 하나여야 함
 *   { q: 질문 id, any: [값...] }  → 복수 선택 응답에 이 값이 하나 이상 있어야 함
 * 규칙을 질문 데이터와 분리해 두어, 질문을 고치지 않고도 조건만 바꿀 수 있다.
 */

const ELIGIBILITY = {
  "jp-remit": [
    { q: "q1", in: ["yes"] },                 // 일본 거주
    { q: "q2", in: ["yes"] }                  // 최근 6개월 해외 송금 경험
  ],
  "vn-onboarding": [
    { q: "q2", in: ["daily", "weekly"] }      // 금융 앱을 주 1회 이상 사용
  ],
  "us-cards": [
    { q: "q1", in: ["yes"] },                 // 대학 재학
    { q: "q2", any: ["mobile", "p2p"] }       // 간편결제 또는 송금 앱 사용
  ]
};

function checkEligibility(studyId, answers) {
  const rules = ELIGIBILITY[studyId] || [];
  const failed = rules.filter((r) => {
    const v = answers[r.q];
    if (r.in) return !r.in.includes(v);
    if (r.any) return !(Array.isArray(v) && v.some((x) => r.any.includes(x)));
    return false;
  });
  return { eligible: failed.length === 0, failed: failed.map((r) => r.q) };
}
