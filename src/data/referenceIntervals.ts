import { SOURCES, type Source } from './sources';

/**
 * 참고구간 — 공표된 행만 그대로 옮긴다. 비어 있는 나이 구간을 메우거나 외삽하지 않는다.
 *
 * 수집 경로: 이 작업 환경에서는 rcpa.edu.au / aacb.asn.au 에 직접 접속할 수 없어(네트워크 차단),
 * 웹 검색 결과에 인용된 해당 문서의 본문으로 값을 확인했다. 원문과 직접 대조한 것이 아니므로
 * 모든 행은 verify 플래그를 가진다. TODO(verify): 원문 표와 한 번 더 대조할 것.
 */
export type Sex = 'M' | 'F';
export type Specimen = 'serum' | 'plasma';

export const DAY = 1;
export const WEEK = 7;
export const YEAR = 365.25;

export interface ReferenceInterval {
  analyteId: string;
  specimen: Specimen;
  /** undefined 이면 남녀 공통 */
  sex?: Sex;
  /** 나이 하한(일, 포함) */
  ageMinDays: number;
  /** 나이 상한(일, 미포함) */
  ageMaxDays: number;
  ageLabel: string;
  low: number;
  high: number;
  unit: string;
  source: Source;
  note?: string;
  /** 원문과 직접 대조하지 못한 경우의 설명 — TODO(verify) */
  verify?: string;
}

const RCPA_VERIFY = 'TODO(verify): rcpa.edu.au 접속 차단 — 검색 결과에 인용된 RCPA Table 6 본문으로 확인';

const row = (
  analyteId: string,
  ageMinDays: number,
  ageMaxDays: number,
  ageLabel: string,
  low: number,
  high: number,
  unit: string,
  extra: Partial<ReferenceInterval> = {},
): ReferenceInterval => ({
  analyteId,
  specimen: 'serum',
  ageMinDays,
  ageMaxDays,
  ageLabel,
  low,
  high,
  unit,
  source: SOURCES.rcpaTable6,
  verify: RCPA_VERIFY,
  ...extra,
});

export const REFERENCE_INTERVALS: ReferenceInterval[] = [
  // Sodium — RCPA Table 6 (serum)
  row('sodium', 0, 1 * WEEK, '0 – <1주', 132, 147, 'mmol/L'),
  row('sodium', 1 * WEEK, 18 * YEAR, '1주 – <18세', 133, 144, 'mmol/L'),
  row('sodium', 18 * YEAR, 120 * YEAR, '18 – <120세', 135, 145, 'mmol/L'),

  // Potassium — RCPA Table 6 (serum). 혈장(plasma) 칼륨은 별도 값이 있으나 수집하지 못함.
  row('potassium', 0, 1 * WEEK, '0 – <1주', 3.8, 6.5, 'mmol/L'),
  row('potassium', 1 * WEEK, 26 * WEEK, '1주 – <26주', 4.2, 6.7, 'mmol/L'),
  row('potassium', 26 * WEEK, 2 * YEAR, '26주 – <2세', 3.9, 5.6, 'mmol/L'),
  row('potassium', 2 * YEAR, 18 * YEAR, '2 – <18세', 3.6, 5.3, 'mmol/L'),
  row('potassium', 18 * YEAR, 120 * YEAR, '18 – <120세', 3.5, 5.2, 'mmol/L'),

  // Chloride — RCPA Table 6 (serum)
  row('chloride', 0, 1 * WEEK, '0 – <1주', 98, 115, 'mmol/L'),
  row('chloride', 1 * WEEK, 18 * YEAR, '1주 – <18세', 97, 110, 'mmol/L'),
  row('chloride', 18 * YEAR, 120 * YEAR, '18 – <120세', 95, 110, 'mmol/L'),

  // Bicarbonate — AACB 2014 Common Reference Intervals (RCPA Table 6 본문에서는 미확인)
  ...(
    [
      [0, 1 * WEEK, '0 – <1주', 15, 28],
      [1 * WEEK, 2 * YEAR, '1주 – <2세', 16, 29],
      [2 * YEAR, 10 * YEAR, '2 – <10세', 17, 30],
      [10 * YEAR, 18 * YEAR, '10 – <18세', 20, 32],
      [18 * YEAR, 120 * YEAR, '18 – <120세', 22, 32],
    ] as const
  ).map(([a, b, l, lo, hi]) =>
    row('bicarbonate', a, b, l, lo, hi, 'mmol/L', {
      source: SOURCES.aacb2014,
      verify:
        'TODO(verify): AACB 2014 보고서 값. RCPA Table 6 현행본에 같은 값이 실려 있는지 확인하지 못함' +
        (a === 18 * YEAR ? ' (성인 연령 경계 18세는 다른 RCPA 행에 맞춘 것으로 원문 확인 필요)' : ''),
    }),
  ),

  // Calcium (total) — RCPA Table 6, 성인만 확인
  row('calcium', 18 * YEAR, 120 * YEAR, '18 – <120세', 2.1, 2.6, 'mmol/L'),

  // Phosphate — RCPA Table 6, 성인(≥20세)만 확인
  row('phosphate', 20 * YEAR, 120 * YEAR, '20 – <120세', 0.75, 1.5, 'mmol/L'),

  // Magnesium — RCPA Table 6, 성인만 확인
  row('magnesium', 18 * YEAR, 120 * YEAR, '18 – <120세', 0.7, 1.1, 'mmol/L'),

  // Creatinine — AACB QUPP 2014 보고서 (harmonised). 60세 이상은 공표된 공통 구간 없음.
  ...(
    [
      [0, 1 * WEEK, '0 – <1주', undefined, 22, 93],
      [1 * WEEK, 4 * WEEK, '1주 – <4주', undefined, 17, 50],
      [4 * WEEK, 2 * YEAR, '4주 – <2세', undefined, 11, 36],
      [2 * YEAR, 6 * YEAR, '2 – <6세', undefined, 20, 44],
      [6 * YEAR, 12 * YEAR, '6 – <12세', undefined, 27, 58],
      [12 * YEAR, 15 * YEAR, '12 – <15세', 'M', 35, 83],
      [12 * YEAR, 15 * YEAR, '12 – <15세', 'F', 35, 74],
      [15 * YEAR, 19 * YEAR, '15 – <19세', 'M', 50, 100],
      [15 * YEAR, 19 * YEAR, '15 – <19세', 'F', 38, 82],
      [19 * YEAR, 60 * YEAR, '19 – <60세', 'M', 60, 110],
      [19 * YEAR, 60 * YEAR, '19 – <60세', 'F', 45, 90],
    ] as const
  ).map(([a, b, l, sex, lo, hi]) =>
    row('creatinine', a, b, l, lo, hi, 'umol/L', {
      sex,
      source: SOURCES.aacbQupp,
      note: '공통(harmonised) 구간은 60세 미만 성인까지만 공표됨',
      verify: 'TODO(verify): AACB QUPP 2014 보고서 값. 현행 RCPA Table 6 과 동일한지 확인하지 못함',
    }),
  ),
];

/**
 * 데이터를 구하지 못한 항목 — 억지로 채우지 않고 이유를 남긴다.
 */
export const MISSING_DATA: Array<{ item: string; reason: string }> = [
  {
    item: '혈장(plasma) 칼륨',
    reason: 'RCPA Table 6 에 별도 행이 있다는 것은 확인했으나 수치를 인용한 출처를 찾지 못함(rcpa.edu.au 직접 접속 차단)',
  },
  {
    item: '칼슘·마그네슘 소아 구간, 인산염 20세 미만 구간',
    reason: '검색 결과에서 성인 행만 확인됨. 소아 행 수치는 원문 접속 불가로 확보하지 못함',
  },
  {
    item: 'ALP · LD · 총단백',
    reason: 'AACB 자료에 성인 값(ALP 30–110 U/L, LD 120–250 U/L, 총단백 60–80 g/L)이 언급되나 적용 나이 경계·성별 조건을 원문으로 확인하지 못해 넣지 않음',
  },
  {
    item: 'ALT · GGT · 알부민 · 빌리루빈',
    reason: '검색으로 확인 가능한 harmonised 수치를 찾지 못함 (ALT 는 검사실별 상한 30–55 U/L 로 harmonised 되지 않았다는 언급만 있음)',
  },
  {
    item: '크레아티닌 60세 이상',
    reason: 'AACB/RCPA 는 60세 미만까지만 공통 구간을 공표함 — 외삽하지 않음',
  },
  {
    item: '포도당·콜레스테롤·중성지방·요산·요소·철·HbA1c 등',
    reason: 'RCPA Table 6 에 해당 행이 있는지/수치가 무엇인지 검색으로 확인하지 못함',
  },
  {
    item: 'CALIPER 소아 구간 수치',
    reason: '요구사항대로 앱은 CALIPER 를 안내(링크)만 하며 수치는 넣지 않음. caliperproject.ca 도 이 환경에서 접속 차단',
  },
];
