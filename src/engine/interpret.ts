import {
  REFERENCE_INTERVALS,
  type ReferenceInterval,
  type Sex,
  type Specimen,
} from '../data/referenceIntervals';

export interface IntervalQuery {
  analyteId: string;
  ageDays: number;
  sex: Sex;
  specimen: Specimen;
}

/** 공표된 행 중 조건에 정확히 맞는 것만 반환 — 없는 나이 구간은 외삽하지 않는다 */
export function findIntervals(q: IntervalQuery): ReferenceInterval[] {
  return REFERENCE_INTERVALS.filter(
    (r) =>
      r.analyteId === q.analyteId &&
      r.specimen === q.specimen &&
      (r.sex === undefined || r.sex === q.sex) &&
      q.ageDays >= r.ageMinDays &&
      q.ageDays < r.ageMaxDays,
  );
}

export function hasAnyInterval(analyteId: string): boolean {
  return REFERENCE_INTERVALS.some((r) => r.analyteId === analyteId);
}

export type Flag = 'low' | 'normal' | 'high';

/** 구간 경계값은 정상으로 본다 (low ≤ x ≤ high) */
export function classify(value: number, r: ReferenceInterval): Flag {
  if (value < r.low) return 'low';
  if (value > r.high) return 'high';
  return 'normal';
}
