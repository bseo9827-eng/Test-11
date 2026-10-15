import { UcumLhcUtils } from '@lhncbc/ucum-lhc';
import type { Analyte } from '../data/analytes';
import { SOURCES, type Source } from '../data/sources';
import { molarMass, molarMassExplain } from './formula';

const ucum = UcumLhcUtils.getInstance();

export type UnitKind = 'mass' | 'substance' | 'equivalents' | 'catalytic' | 'massPerSubstance' | 'dimensionless';

const KIND_PROBES: Array<[UnitKind, string]> = [
  ['mass', 'g/L'],
  ['substance', 'mol/L'],
  ['equivalents', 'eq/L'],
  ['catalytic', 'kat/L'],
  ['massPerSubstance', 'g/mol'],
  ['dimensionless', '1'],
];

export const KIND_LABEL: Record<UnitKind, string> = {
  mass: '질량 농도',
  substance: '물질량(몰) 농도',
  equivalents: '당량 농도',
  catalytic: '효소 활성(촉매) 농도',
  massPerSubstance: '질량/물질량 비',
  dimensionless: '무차원(비율·분율)',
};

export interface ConversionOk {
  ok: true;
  value: number;
  from: string;
  to: string;
  method: string;
  /** 선형 변환이면 to = from × factor */
  factor?: number;
  equation: string;
  steps: string[];
  assumptions: string[];
  sources: Source[];
}

export interface ConversionErr {
  ok: false;
  reason: string;
}

export type ConversionResult = ConversionOk | ConversionErr;

export function isValidUnit(u: string): boolean {
  return ucum.validateUnitString(u).status === 'valid';
}

/** UCUM 으로 단위의 차원(종류)을 판별 */
export function unitKind(u: string): UnitKind | undefined {
  for (const [kind, probe] of KIND_PROBES) {
    if (ucum.convertUnitTo(u, 1, probe).status === 'succeeded') return kind;
  }
  return undefined;
}

/** UCUM 변환 계수 (1 from = factor to) */
function ucumFactor(
  from: string,
  to: string,
  opts?: { molecularWeight?: number; charge?: number },
): { factor: number } | { error: string } {
  const r = ucum.convertUnitTo(from, 1, to, opts);
  if (r.status === 'succeeded' && r.toVal !== null && Number.isFinite(r.toVal)) {
    return { factor: r.toVal };
  }
  return { error: r.msg.join(' ') || r.code || 'UCUM 변환 실패' };
}

/** 분석물이 의미를 갖는 단위 차원 */
function allowedKinds(a: Analyte): Set<UnitKind> {
  const s = new Set<UnitKind>();
  for (const u of a.units) {
    if (u.includes('{')) continue;
    const k = unitKind(u);
    if (k) s.add(k);
  }
  if (a.formula && !a.special) {
    s.add('mass');
    s.add('substance');
  }
  if (a.charge) s.add('equivalents');
  return s;
}

export function fmt(x: number, sig = 4): string {
  if (x === 0) return '0';
  const abs = Math.abs(x);
  if (abs >= 1e-3 && abs < 1e7) {
    return String(parseFloat(x.toPrecision(sig)));
  }
  return x.toExponential(sig - 1);
}

const err = (reason: string): ConversionErr => ({ ok: false, reason });

export function convert(a: Analyte, value: number, from: string, to: string): ConversionResult {
  if (!Number.isFinite(value)) return err('숫자 값을 입력하세요.');
  for (const u of [from, to]) {
    if (!isValidUnit(u)) return err(`"${u}" 는 유효한 UCUM 단위 코드가 아닙니다.`);
  }
  if (a.special === 'hba1c') return convertHbA1c(value, from, to);
  if (a.special === 'creatinineRatio') return convertCreatinineRatio(a, value, from, to);
  if (a.special === 'bun' && (from.includes('{urea}') || to.includes('{urea}'))) {
    return convertBunUrea(a, value, from, to);
  }
  return convertGeneric(a, value, from, to);
}

function convertGeneric(a: Analyte, value: number, from: string, to: string): ConversionResult {
  const kf = unitKind(from);
  const kt = unitKind(to);
  if (!kf || !kt) return err('단위의 차원을 판별할 수 없습니다.');

  const allowed = allowedKinds(a);
  for (const [u, k] of [
    [from, kf],
    [to, kt],
  ] as const) {
    if (!allowed.has(k)) {
      return err(
        `${a.nameKo}은(는) ${[...allowed].map((x) => KIND_LABEL[x]).join('·')}로 보고되는 검사입니다. ` +
          `"${u}"(${KIND_LABEL[k]})로의 변환은 근거가 없어 거부합니다.` +
          (a.noMolarReason && (k === 'mass' || k === 'substance') ? ` (${a.noMolarReason})` : ''),
      );
    }
  }

  const steps: string[] = [`UCUM 차원 검사: ${from} = ${KIND_LABEL[kf]}, ${to} = ${KIND_LABEL[kt]}`];
  const assumptions: string[] = [];
  const sources: Source[] = [SOURCES.ucum, SOURCES.ucumLhc];
  const opts: { molecularWeight?: number; charge?: number } = {};

  const chemical = new Set<UnitKind>(['mass', 'substance', 'equivalents']);
  if (kf !== kt && chemical.has(kf) && chemical.has(kt)) {
    const needsMw = kf === 'mass' || kt === 'mass';
    const needsCharge = kf === 'equivalents' || kt === 'equivalents';
    if (needsMw) {
      if (!a.formula) return err(`${a.nameKo}의 분자량을 원자량으로 계산할 수 없어 질량↔몰 변환을 거부합니다.`);
      opts.molecularWeight = molarMass(a.formula);
      steps.push(`분자량(IUPAC 원자량으로 계산): ${molarMassExplain(a.formula)}`);
      sources.push(SOURCES.ciaaw);
    }
    if (needsCharge) {
      if (!a.charge) return err(`${a.nameKo}은(는) 이온 전하가 정의되지 않아 mEq 변환 근거가 없습니다.`);
      opts.charge = a.charge;
      steps.push(`이온 전하 |z| = ${a.charge} → 1 mmol = ${a.charge} mEq`);
    }
    if (a.formulaAssumption) assumptions.push(a.formulaAssumption);
  } else if (kf !== kt) {
    return err(`${KIND_LABEL[kf]}(${from})와 ${KIND_LABEL[kt]}(${to})는 차원이 달라 변환 근거가 없습니다.`);
  }

  const f = ucumFactor(from, to, opts);
  if ('error' in f) return err(`UCUM 이 변환을 거부했습니다: ${f.error}`);

  steps.push(`UCUM 계산 계수: 1 ${from} = ${fmt(f.factor, 6)} ${to}`);
  const method =
    kf === kt
      ? 'UCUM 스케일 변환 (같은 차원)'
      : `UCUM 변환 + ${opts.molecularWeight ? '분자량' : ''}${opts.molecularWeight && opts.charge ? ' + ' : ''}${opts.charge ? '이온 전하' : ''}`;
  if (kf === 'catalytic') assumptions.push('1 U = 1 µmol/min, 1 kat = 1 mol/s (UCUM 정의)');

  return {
    ok: true,
    value: value * f.factor,
    from,
    to,
    method,
    factor: f.factor,
    equation: `값(${to}) = 값(${from}) × ${fmt(f.factor, 6)}`,
    steps,
    assumptions,
    sources,
  };
}

/** NGSP master equation: NGSP(%) = 0.09148 × IFCC(mmol/mol) + 2.152 */
export const NGSP_SLOPE = 0.09148;
export const NGSP_INTERCEPT = 2.152;

function convertHbA1c(value: number, from: string, to: string): ConversionResult {
  const ok = new Set(['%', 'mmol/mol']);
  if (!ok.has(from) || !ok.has(to)) {
    return err('HbA1c 는 NGSP(%)와 IFCC(mmol/mol) 사이의 변환만 근거(NGSP master equation)가 있습니다.');
  }
  const base = {
    ok: true as const,
    from,
    to,
    method: 'NGSP–IFCC master equation (선형 회귀식, 단순 단위 환산 아님)',
    assumptions: [
      '%와 mmol/mol 은 단위 스케일 차이가 아니라 서로 다른 표준화 체계(NGSP vs IFCC)이므로 UCUM 스케일 변환(×10)을 적용하지 않음',
      `흔히 쓰는 역식 IFCC = 10.93 × NGSP − 23.50 은 위 식을 반올림한 것`,
    ],
    sources: [SOURCES.ngsp],
  };
  if (from === to) {
    return { ...base, value, factor: 1, equation: '동일 단위', steps: ['변환 없음'] };
  }
  if (from === '%') {
    const v = (value - NGSP_INTERCEPT) / NGSP_SLOPE;
    return {
      ...base,
      value: v,
      equation: `IFCC = (NGSP − ${NGSP_INTERCEPT}) ÷ ${NGSP_SLOPE}`,
      steps: [
        `NGSP = ${NGSP_SLOPE} × IFCC + ${NGSP_INTERCEPT} (NGSP master equation)`,
        `IFCC = (${fmt(value)} − ${NGSP_INTERCEPT}) ÷ ${NGSP_SLOPE} = ${fmt(v)} mmol/mol`,
      ],
    };
  }
  const v = NGSP_SLOPE * value + NGSP_INTERCEPT;
  return {
    ...base,
    value: v,
    equation: `NGSP = ${NGSP_SLOPE} × IFCC + ${NGSP_INTERCEPT}`,
    steps: [`NGSP = ${NGSP_SLOPE} × ${fmt(value)} + ${NGSP_INTERCEPT} = ${fmt(v)} %`],
  };
}

function convertCreatinineRatio(a: Analyte, value: number, from: string, to: string): ConversionResult {
  const kf = unitKind(from);
  const kt = unitKind(to);
  const valid = new Set<UnitKind>(['dimensionless', 'massPerSubstance']);
  if (!kf || !kt || !valid.has(kf) || !valid.has(kt) || from === '%' || to === '%') {
    return err(`${a.nameKo}는 질량/질량(mg/g) 또는 질량/물질량(mg/mmol) 비율로만 표현됩니다.`);
  }
  const mw = molarMass(a.formula!);
  const steps = [
    `UCUM 차원 검사: ${from} = ${KIND_LABEL[kf]}, ${to} = ${KIND_LABEL[kt]}`,
    `크레아티닌 분자량: ${molarMassExplain(a.formula!)}`,
  ];
  let factor: number;
  if (kf === kt) {
    const f = ucumFactor(from, to);
    if ('error' in f) return err(f.error);
    factor = f.factor;
  } else {
    // 분모 변환: 1 mmol 크레아티닌 = ? g (UCUM + 분자량)
    const gPerMmol = ucumFactor('mmol', 'g', { molecularWeight: mw });
    if ('error' in gPerMmol) return err(gPerMmol.error);
    steps.push(`UCUM: 1 mmol 크레아티닌 = ${fmt(gPerMmol.factor, 6)} g`);
    // from → mg/g → mg/mmol → to
    const toMgPerG = kf === 'dimensionless' ? ucumFactor(from, 'mg/g') : ucumFactor(from, 'mg/mmol');
    const fromMgPerMmol = kt === 'massPerSubstance' ? ucumFactor('mg/mmol', to) : ucumFactor('mg/g', to);
    if ('error' in toMgPerG || 'error' in fromMgPerMmol) return err('UCUM 스케일 변환 실패');
    const core = kf === 'dimensionless' ? gPerMmol.factor : 1 / gPerMmol.factor;
    factor = toMgPerG.factor * core * fromMgPerMmol.factor;
    steps.push(
      kf === 'dimensionless'
        ? `mg/g × (g/mmol) = mg/mmol → 계수 ${fmt(gPerMmol.factor, 6)}`
        : `mg/mmol ÷ (g/mmol) = mg/g → 계수 ${fmt(1 / gPerMmol.factor, 6)}`,
    );
  }
  return {
    ok: true,
    value: value * factor,
    from,
    to,
    factor,
    method: '비율 분모(크레아티닌) g ↔ mmol 환산',
    equation: `값(${to}) = 값(${from}) × ${fmt(factor, 6)}`,
    steps,
    assumptions: [
      a.formulaAssumption!,
      'KDIGO 범주 표는 반올림한 근사(30 mg/g ≈ 3 mg/mmol, 300 mg/g ≈ 30 mg/mmol)를 사용하므로 계산값과 약간 다를 수 있음',
    ],
    sources: [SOURCES.kdigo2024, SOURCES.ucum, SOURCES.ciaaw],
  };
}

function convertBunUrea(a: Analyte, value: number, from: string, to: string): ConversionResult {
  const ureaFormula = 'CH4N2O';
  const mUrea = molarMass(ureaFormula);
  const mN2 = molarMass(a.formula!);
  const strip = (u: string) => u.replace('{urea}', '');
  const isUrea = (u: string) => u.includes('{urea}');
  if (isUrea(from) && isUrea(to)) {
    const f = ucumFactor(strip(from), strip(to));
    if ('error' in f) return err(f.error);
    return {
      ok: true, value: value * f.factor, from, to, factor: f.factor,
      method: 'UCUM 스케일 변환', equation: `값 × ${fmt(f.factor, 6)}`, steps: [], assumptions: [], sources: [SOURCES.ucum],
    };
  }
  // BUN(질소 질량) ↔ 요소(분자 질량): 1 mol 요소 = 1 mol N2
  const ratio = isUrea(to) ? mUrea / mN2 : mN2 / mUrea;
  // from 쪽을 같은 물질 기준 mg/dL 로, 비율 적용 후 to 쪽 단위로
  const pre = isUrea(from)
    ? ucumFactor(strip(from), 'mg/dL')
    : ucumFactor(from, 'mg/dL', { molecularWeight: mN2 });
  const post = isUrea(to)
    ? ucumFactor('mg/dL', strip(to))
    : ucumFactor('mg/dL', to, { molecularWeight: mN2 });
  if ('error' in pre || 'error' in post) return err('BUN/요소 변환에 필요한 UCUM 단위 변환 실패');
  const factor = pre.factor * ratio * post.factor;
  return {
    ok: true,
    value: value * factor,
    from,
    to,
    factor,
    method: 'BUN(요소 질소) ↔ 요소 분자 질량 환산',
    equation: isUrea(to)
      ? `요소(mg/dL) = BUN(mg/dL) × M(urea)/M(2N) = BUN × ${fmt(mUrea / mN2, 6)}`
      : `BUN(mg/dL) = 요소(mg/dL) × M(2N)/M(urea) = 요소 × ${fmt(mN2 / mUrea, 6)}`,
    steps: [
      molarMassExplain(ureaFormula),
      `M(2N) = ${molarMassExplain(a.formula!)}`,
      `총 계수: 1 ${from} = ${fmt(factor, 6)} ${to}`,
    ],
    assumptions: [a.formulaAssumption!, '“mg/dL{urea}” 는 요소 분자 질량 기준 mg/dL 를 뜻하는 UCUM 주석 단위'],
    sources: [SOURCES.ucum, SOURCES.ciaaw],
  };
}

