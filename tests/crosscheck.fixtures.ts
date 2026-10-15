/**
 * 교차 검증 전용 데이터 — 앱 번들에는 포함하지 않는다(tests/ 폴더, src 에서 import 금지).
 *
 * 표에 실린 반올림 계수와 앱이 계산한 계수를 대조해, 계산 로직(분자량·UCUM)이 맞는지 확인한다.
 * 각 행의 verified 는 이번 작업 중 출처 문서의 해당 값을 실제로 확인했는지를 뜻한다.
 *
 * 이 환경에서는 labcorp.com / nbme.org / CMEinfo 에 직접 접속할 수 없었다(DNS·프록시 차단).
 * verified=false 행은 널리 쓰이는 표준 계수를 적어 둔 것으로, TODO(verify) 대상이다.
 */
export interface CrossCheck {
  source: 'Labcorp SI Unit Conversion Table' | 'Quest SI units' | 'CMEinfo' | 'NBME Laboratory Reference Values';
  analyteId: string;
  from: string;
  to: string;
  /** 표에 실린 계수: to = from × factor */
  factor: number;
  /** 허용 상대오차 (표 계수의 반올림 자릿수를 고려) */
  relTol: number;
  verified: boolean;
  note?: string;
}

export const CROSS_CHECKS: CrossCheck[] = [
  // 확인됨: 검색 결과에 인용된 Labcorp 표 행 "Creatinine | serum | mg/dL | 88.4 | μmol/L | 0.0113"
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'creatinine', from: 'mg/dL', to: 'umol/L', factor: 88.4, relTol: 0.001, verified: true },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'creatinine', from: 'umol/L', to: 'mg/dL', factor: 0.0113, relTol: 0.005, verified: true },
  // 확인됨(단, Labcorp 아닌 Quest 표): "Cholesterol, Total mg/dL 0.0259 mmol/L"
  { source: 'Quest SI units', analyteId: 'cholesterol', from: 'mg/dL', to: 'mmol/L', factor: 0.0259, relTol: 0.005, verified: true },

  // TODO(verify): Labcorp 표 원문과 대조하지 못함
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'glucose', from: 'mg/dL', to: 'mmol/L', factor: 0.0555, relTol: 0.005, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'triglycerides', from: 'mg/dL', to: 'mmol/L', factor: 0.0113, relTol: 0.005, verified: false, note: '표는 MW≈885 를 가정' },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'bun', from: 'mg/dL', to: 'mmol/L', factor: 0.357, relTol: 0.005, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'uricAcid', from: 'mg/dL', to: 'umol/L', factor: 59.48, relTol: 0.001, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'bilirubin', from: 'mg/dL', to: 'umol/L', factor: 17.1, relTol: 0.005, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'calcium', from: 'mg/dL', to: 'mmol/L', factor: 0.25, relTol: 0.005, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'magnesium', from: 'mg/dL', to: 'mmol/L', factor: 0.4114, relTol: 0.005, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'phosphate', from: 'mg/dL', to: 'mmol/L', factor: 0.3229, relTol: 0.005, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'iron', from: 'ug/dL', to: 'umol/L', factor: 0.179, relTol: 0.005, verified: false },
  { source: 'Labcorp SI Unit Conversion Table', analyteId: 'alt', from: 'U/L', to: 'ukat/L', factor: 0.0167, relTol: 0.005, verified: false },
  { source: 'CMEinfo', analyteId: 'albumin', from: 'g/dL', to: 'g/L', factor: 10, relTol: 1e-9, verified: false },
  { source: 'NBME Laboratory Reference Values', analyteId: 'urea', from: 'mg/dL', to: 'mmol/L', factor: 0.1665, relTol: 0.005, verified: false, note: 'TODO(verify): NBME PDF 접속 불가 — 요소 계수 0.1665 는 일반 표준값' },
];
