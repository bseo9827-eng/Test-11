import { describe, expect, it } from 'vitest';
import { findAnalyte } from '../src/data/analytes';
import { convert, unitKind } from '../src/engine/convert';
import { molarMass, parseFormula } from '../src/engine/formula';

const A = (id: string) => {
  const a = findAnalyte(id);
  if (!a) throw new Error(id);
  return a;
};
const ok = (id: string, v: number, from: string, to: string) => {
  const r = convert(A(id), v, from, to);
  if (!r.ok) throw new Error(r.reason);
  return r;
};

describe('분자량 계산 (IUPAC 원자량)', () => {
  it.each([
    ['C6H12O6', 180.156],
    ['C4H7N3O', 113.12],
    ['CH4N2O', 60.056],
    ['C27H46O', 386.664],
    ['C5H4N4O3', 168.112],
    ['C33H36N4O6', 584.673],
    ['C57H104O6', 885.453],
  ])('%s = %f', (f, mw) => {
    expect(molarMass(f)).toBeCloseTo(mw, 3);
  });

  it('잘못된 화학식은 거부', () => {
    expect(() => parseFormula('Xx2')).toThrow();
    expect(() => parseFormula('c6')).toThrow();
  });
});

describe('UCUM 차원 판별', () => {
  it.each([
    ['mg/dL', 'mass'],
    ['mmol/L', 'substance'],
    ['meq/L', 'equivalents'],
    ['U/L', 'catalytic'],
    ['ukat/L', 'catalytic'],
    ['mg/mmol', 'massPerSubstance'],
    ['mg/g', 'dimensionless'],
  ])('%s → %s', (u, k) => expect(unitKind(u)).toBe(k));
});

describe('일반 변환 (UCUM + 분자량)', () => {
  it('glucose 100 mg/dL → 5.551 mmol/L', () => {
    expect(ok('glucose', 100, 'mg/dL', 'mmol/L').value).toBeCloseTo(5.5507, 3);
  });
  it('creatinine 1 mg/dL → 88.40 µmol/L', () => {
    expect(ok('creatinine', 1, 'mg/dL', 'umol/L').value).toBeCloseTo(88.4, 1);
  });
  it('왕복 변환이 원래 값으로 돌아온다', () => {
    const x = ok('cholesterol', 200, 'mg/dL', 'mmol/L').value;
    expect(ok('cholesterol', x, 'mmol/L', 'mg/dL').value).toBeCloseTo(200, 9);
  });
  it('같은 차원 스케일 변환 (g/dL → g/L)', () => {
    const r = ok('albumin', 4, 'g/dL', 'g/L');
    expect(r.value).toBeCloseTo(40, 9);
    expect(r.method).toContain('스케일');
  });
  it('효소 U/L → µkat/L (1 U = 1 µmol/min)', () => {
    expect(ok('alt', 60, 'U/L', 'ukat/L').value).toBeCloseTo(1, 9);
  });
  it('근거에 분자량 계산식이 포함된다', () => {
    const r = ok('glucose', 90, 'mg/dL', 'mmol/L');
    expect(r.steps.join('\n')).toContain('M(C6H12O6)');
    expect(r.sources.map((s) => s.id)).toContain('ciaaw');
  });
});

describe('mEq 변환 (이온 전하)', () => {
  it('calcium 2.5 mmol/L → 5 mEq/L (z=2)', () => {
    expect(ok('calcium', 2.5, 'mmol/L', 'meq/L').value).toBeCloseTo(5, 9);
  });
  it('calcium 10 mg/dL → 4.990 mEq/L', () => {
    expect(ok('calcium', 10, 'mg/dL', 'meq/L').value).toBeCloseTo(4.9903, 3);
  });
  it('sodium mmol/L = mEq/L (z=1)', () => {
    expect(ok('sodium', 140, 'mmol/L', 'meq/L').value).toBeCloseTo(140, 9);
  });
});

describe('근거 없는 변환 거부', () => {
  it('glucose mg/dL → U/L 거부', () => {
    const r = convert(A('glucose'), 100, 'mg/dL', 'U/L');
    expect(r.ok).toBe(false);
  });
  it('ALT U/L → mg/dL 거부', () => {
    expect(convert(A('alt'), 30, 'U/L', 'mg/dL').ok).toBe(false);
  });
  it('albumin g/dL → mmol/L 거부 (분자량 미정의)', () => {
    const r = convert(A('albumin'), 4, 'g/dL', 'mmol/L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('분자량');
  });
  it('glucose → mEq/L 거부 (전하 없음)', () => {
    expect(convert(A('glucose'), 100, 'mg/dL', 'meq/L').ok).toBe(false);
  });
  it('phosphate → mEq/L 거부 (전하 미정의)', () => {
    expect(convert(A('phosphate'), 3, 'mg/dL', 'meq/L').ok).toBe(false);
  });
  it('잘못된 단위 문자열 거부', () => {
    expect(convert(A('glucose'), 100, 'mg/dL', 'foo/L').ok).toBe(false);
  });
  it('숫자가 아닌 값 거부', () => {
    expect(convert(A('glucose'), NaN, 'mg/dL', 'mmol/L').ok).toBe(false);
  });
});

describe('HbA1c NGSP ↔ IFCC (master equation)', () => {
  it('7.0 % → 53 mmol/mol', () => {
    expect(ok('hba1c', 7, '%', 'mmol/mol').value).toBeCloseTo(53.0, 0);
  });
  it('48 mmol/mol → 6.5 %', () => {
    expect(ok('hba1c', 48, 'mmol/mol', '%').value).toBeCloseTo(6.543, 2);
  });
  it('UCUM 스케일(×10)을 쓰지 않는다', () => {
    expect(ok('hba1c', 7, '%', 'mmol/mol').value).not.toBeCloseTo(70, 0);
  });
  it('반올림 역식 10.93×NGSP−23.50 과 0.1 mmol/mol 이내로 일치', () => {
    for (const ngsp of [5, 6, 6.5, 7, 8, 10, 12]) {
      expect(Math.abs(ok('hba1c', ngsp, '%', 'mmol/mol').value - (10.93 * ngsp - 23.5))).toBeLessThan(0.1);
    }
  });
  it('왕복', () => {
    const x = ok('hba1c', 8.2, '%', 'mmol/mol').value;
    expect(ok('hba1c', x, 'mmol/mol', '%').value).toBeCloseTo(8.2, 9);
  });
  it('% / mmol/mol 이외 단위는 거부', () => {
    expect(convert(A('hba1c'), 7, '%', 'mg/dL').ok).toBe(false);
  });
});

describe('uACR / uPCR mg/g ↔ mg/mmol', () => {
  it('30 mg/g ≈ 3.39 mg/mmol (KDIGO 근사 3 mg/mmol)', () => {
    const r = ok('uacr', 30, 'mg/g', 'mg/mmol');
    expect(r.value).toBeCloseTo(30 * 0.11312, 4);
  });
  it('30 mg/mmol → 265.2 mg/g', () => {
    expect(ok('upcr', 30, 'mg/mmol', 'mg/g').value).toBeCloseTo(30 / 0.11312, 2);
  });
  it('g/g 등 같은 차원 스케일도 지원', () => {
    expect(ok('uacr', 1, 'g/g', 'mg/g').value).toBeCloseTo(1000, 9);
  });
  it('% 는 거부', () => {
    expect(convert(A('uacr'), 1, '%', 'mg/mmol').ok).toBe(false);
  });
});

describe('BUN ↔ 요소', () => {
  it('BUN 14 mg/dL → 5.0 mmol/L', () => {
    expect(ok('bun', 14, 'mg/dL', 'mmol/L').value).toBeCloseTo(14 * 10 / 28.014, 4);
  });
  it('BUN 10 mg/dL → 요소 21.44 mg/dL', () => {
    expect(ok('bun', 10, 'mg/dL', 'mg/dL{urea}').value).toBeCloseTo((10 * 60.056) / 28.014, 4);
  });
  it('요소 mg/dL → BUN mmol/L 은 요소 mmol/L 와 같다', () => {
    const viaBun = ok('bun', 60.056, 'mg/dL{urea}', 'mmol/L').value;
    const direct = ok('urea', 60.056, 'mg/dL', 'mmol/L').value;
    expect(viaBun).toBeCloseTo(direct, 9);
    expect(direct).toBeCloseTo(10, 6);
  });
});

describe('중성지방 (트리올레인 가정)', () => {
  it('150 mg/dL → 1.694 mmol/L, 가정이 근거에 표시된다', () => {
    const r = ok('triglycerides', 150, 'mg/dL', 'mmol/L');
    expect(r.value).toBeCloseTo(1.694, 3);
    expect(r.assumptions.join()).toContain('트리올레인');
  });
});
