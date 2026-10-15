import { describe, expect, it } from 'vitest';
import { REFERENCE_INTERVALS, WEEK, YEAR } from '../src/data/referenceIntervals';
import { classify, findIntervals } from '../src/engine/interpret';

describe('참고구간 조회', () => {
  it('성인 나트륨 135–145 (RCPA Table 6)', () => {
    const r = findIntervals({ analyteId: 'sodium', ageDays: 40 * YEAR, sex: 'M', specimen: 'serum' });
    expect(r).toHaveLength(1);
    expect([r[0].low, r[0].high]).toEqual([135, 145]);
    expect(r[0].source.id).toBe('rcpaTable6');
  });

  it('신생아 칼륨 구간', () => {
    const r = findIntervals({ analyteId: 'potassium', ageDays: 3, sex: 'F', specimen: 'serum' });
    expect([r[0].low, r[0].high]).toEqual([3.8, 6.5]);
  });

  it('경계: 1주 정확히는 다음 구간', () => {
    const r = findIntervals({ analyteId: 'sodium', ageDays: 1 * WEEK, sex: 'F', specimen: 'serum' });
    expect(r[0].ageLabel).toContain('1주 – <18세');
  });

  it('성별 구분 (크레아티닌 성인)', () => {
    const m = findIntervals({ analyteId: 'creatinine', ageDays: 30 * YEAR, sex: 'M', specimen: 'serum' });
    const f = findIntervals({ analyteId: 'creatinine', ageDays: 30 * YEAR, sex: 'F', specimen: 'serum' });
    expect([m[0].low, m[0].high]).toEqual([60, 110]);
    expect([f[0].low, f[0].high]).toEqual([45, 90]);
  });

  it('공표되지 않은 나이 구간은 외삽하지 않는다 (크레아티닌 70세)', () => {
    expect(findIntervals({ analyteId: 'creatinine', ageDays: 70 * YEAR, sex: 'M', specimen: 'serum' })).toEqual([]);
  });

  it('공표되지 않은 소아 구간은 비어 있다 (칼슘 5세)', () => {
    expect(findIntervals({ analyteId: 'calcium', ageDays: 5 * YEAR, sex: 'M', specimen: 'serum' })).toEqual([]);
  });

  it('데이터 없는 검체는 비어 있다 (혈장 칼륨)', () => {
    expect(findIntervals({ analyteId: 'potassium', ageDays: 40 * YEAR, sex: 'M', specimen: 'plasma' })).toEqual([]);
  });

  it('같은 분석물·검체·성별에서 나이 구간이 겹치지 않는다', () => {
    for (const a of REFERENCE_INTERVALS) {
      for (const b of REFERENCE_INTERVALS) {
        if (a === b || a.analyteId !== b.analyteId || a.specimen !== b.specimen) continue;
        if (a.sex && b.sex && a.sex !== b.sex) continue;
        const overlap = a.ageMinDays < b.ageMaxDays && b.ageMinDays < a.ageMaxDays;
        expect(overlap, `${a.analyteId} ${a.ageLabel} / ${b.ageLabel}`).toBe(false);
      }
    }
  });

  it('모든 행에 출처가 있고 low < high', () => {
    for (const r of REFERENCE_INTERVALS) {
      expect(r.source.url).toMatch(/^https:\/\//);
      expect(r.low).toBeLessThan(r.high);
    }
  });
});

describe('low/normal/high 판정', () => {
  const na = findIntervals({ analyteId: 'sodium', ageDays: 40 * YEAR, sex: 'M', specimen: 'serum' })[0];
  it.each([
    [130, 'low'],
    [135, 'normal'],
    [140, 'normal'],
    [145, 'normal'],
    [150, 'high'],
  ] as const)('%d → %s', (v, f) => expect(classify(v, na)).toBe(f));
});
