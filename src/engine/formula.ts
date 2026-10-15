/**
 * 화학식 → 분자량 계산.
 *
 * 원자량은 IUPAC CIAAW 의 abridged/conventional 표준 원자량을 사용한다.
 * TODO(verify): 이 환경에서 ciaaw.org 접속이 차단되어 최신 표와 직접 대조하지 못했다.
 * 아래 값은 CIAAW 가 공표한 4~5 자리 abridged 값으로 알려진 수치이다.
 */
export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  P: 30.974,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
};

export type Composition = Array<[element: string, count: number]>;

/** 'C6H12O6' 같은 단순 화학식(괄호 없음)을 원소별 개수로 분해 */
export function parseFormula(formula: string): Composition {
  const re = /([A-Z][a-z]?)(\d*)/g;
  const out: Composition = [];
  let consumed = 0;
  for (const m of formula.matchAll(re)) {
    if (m[0] === '') continue;
    const el = m[1];
    if (!(el in ATOMIC_WEIGHTS)) throw new Error(`원자량 표에 없는 원소: ${el}`);
    const n = m[2] ? parseInt(m[2], 10) : 1;
    const existing = out.find(([e]) => e === el);
    if (existing) existing[1] += n;
    else out.push([el, n]);
    consumed += m[0].length;
  }
  if (consumed !== formula.length || out.length === 0) {
    throw new Error(`해석할 수 없는 화학식: ${formula}`);
  }
  return out;
}

export function molarMass(formula: string): number {
  return parseFormula(formula).reduce((s, [el, n]) => s + ATOMIC_WEIGHTS[el] * n, 0);
}

/** 계산 근거용 전개식: "6×12.011 + 12×1.008 + 6×15.999 = 180.156 g/mol" */
export function molarMassExplain(formula: string): string {
  const parts = parseFormula(formula).map(([el, n]) => `${n}×${ATOMIC_WEIGHTS[el]}(${el})`);
  return `M(${formula}) = ${parts.join(' + ')} = ${round(molarMass(formula), 3)} g/mol`;
}

export function round(x: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}
