/**
 * 분석물 정의. 변환 계수는 여기에 적지 않는다 — 화학식(→분자량)과 이온 전하만 두고
 * 계수는 엔진이 UCUM + 분자량으로 계산한다.
 */
export type SpecialKind = 'hba1c' | 'creatinineRatio' | 'bun';

export interface Analyte {
  id: string;
  nameEn: string;
  nameKo: string;
  synonyms: string[];
  /** 분자량 계산용 화학식 (질량↔몰 변환이 가능한 경우에만) */
  formula?: string;
  /** 분자량 계산에 쓴 화학식에 대한 가정 (예: 중성지방 = 트리올레인) */
  formulaAssumption?: string;
  /** 이온 전하의 절댓값 (mEq/L 변환이 가능한 경우에만) */
  charge?: number;
  /** 화면에서 제안할 단위(UCUM 코드) */
  units: string[];
  special?: SpecialKind;
  /** 질량↔몰 변환을 지원하지 않는 이유 */
  noMolarReason?: string;
}

export const ANALYTES: Analyte[] = [
  {
    id: 'glucose',
    nameEn: 'Glucose',
    nameKo: '포도당(혈당)',
    synonyms: ['GLU', 'blood sugar', 'FBS', '공복혈당', '당'],
    formula: 'C6H12O6',
    units: ['mg/dL', 'mmol/L', 'g/L'],
  },
  {
    id: 'cholesterol',
    nameEn: 'Cholesterol (total / HDL / LDL)',
    nameKo: '콜레스테롤(총·HDL·LDL)',
    synonyms: ['TC', 'HDL-C', 'LDL-C', 'chol', '총콜레스테롤'],
    formula: 'C27H46O',
    units: ['mg/dL', 'mmol/L'],
  },
  {
    id: 'triglycerides',
    nameEn: 'Triglycerides',
    nameKo: '중성지방',
    synonyms: ['TG', 'triglyceride', '트리글리세라이드'],
    formula: 'C57H104O6',
    formulaAssumption:
      '혈청 중성지방은 여러 분자의 혼합물이므로 관례에 따라 트리올레인(triolein, C57H104O6)의 분자량을 대표값으로 가정함',
    units: ['mg/dL', 'mmol/L'],
  },
  {
    id: 'creatinine',
    nameEn: 'Creatinine',
    nameKo: '크레아티닌',
    synonyms: ['Cr', 'Cre', 'SCr', '크레아티닌'],
    formula: 'C4H7N3O',
    units: ['mg/dL', 'umol/L', 'mmol/L'],
  },
  {
    id: 'urea',
    nameEn: 'Urea',
    nameKo: '요소',
    synonyms: ['urea', '우레아'],
    formula: 'CH4N2O',
    units: ['mg/dL', 'mmol/L'],
  },
  {
    id: 'bun',
    nameEn: 'Blood urea nitrogen (BUN)',
    nameKo: '혈액요소질소(BUN)',
    synonyms: ['BUN', 'urea nitrogen', '요소질소'],
    formula: 'N2',
    formulaAssumption: 'BUN 은 요소 분자 속 질소(N 2개)의 질량이므로 1 mol 요소 = 1 mol N2 로 계산함',
    units: ['mg/dL', 'mmol/L', 'mg/dL{urea}'],
    special: 'bun',
  },
  {
    id: 'uricAcid',
    nameEn: 'Uric acid (urate)',
    nameKo: '요산',
    synonyms: ['UA', 'urate', '요산'],
    formula: 'C5H4N4O3',
    units: ['mg/dL', 'umol/L', 'mmol/L'],
  },
  {
    id: 'bilirubin',
    nameEn: 'Bilirubin',
    nameKo: '빌리루빈',
    synonyms: ['T-bil', 'TB', 'total bilirubin', '총빌리루빈'],
    formula: 'C33H36N4O6',
    units: ['mg/dL', 'umol/L'],
  },
  {
    id: 'sodium',
    nameEn: 'Sodium',
    nameKo: '나트륨',
    synonyms: ['Na', 'Na+', '소듐'],
    formula: 'Na',
    charge: 1,
    units: ['mmol/L', 'meq/L', 'mg/dL'],
  },
  {
    id: 'potassium',
    nameEn: 'Potassium',
    nameKo: '칼륨',
    synonyms: ['K', 'K+', '포타슘'],
    formula: 'K',
    charge: 1,
    units: ['mmol/L', 'meq/L', 'mg/dL'],
  },
  {
    id: 'chloride',
    nameEn: 'Chloride',
    nameKo: '염소',
    synonyms: ['Cl', 'Cl-', '클로라이드', '염화물'],
    formula: 'Cl',
    charge: 1,
    units: ['mmol/L', 'meq/L', 'mg/dL'],
  },
  {
    id: 'bicarbonate',
    nameEn: 'Bicarbonate',
    nameKo: '중탄산염',
    synonyms: ['HCO3', 'HCO3-', 'total CO2', 'tCO2', '중탄산'],
    formula: 'CHO3',
    charge: 1,
    units: ['mmol/L', 'meq/L'],
  },
  {
    id: 'calcium',
    nameEn: 'Calcium (total)',
    nameKo: '칼슘(총)',
    synonyms: ['Ca', 'Ca2+', '칼슘'],
    formula: 'Ca',
    charge: 2,
    units: ['mg/dL', 'mmol/L', 'meq/L'],
  },
  {
    id: 'magnesium',
    nameEn: 'Magnesium',
    nameKo: '마그네슘',
    synonyms: ['Mg', 'Mg2+'],
    formula: 'Mg',
    charge: 2,
    units: ['mg/dL', 'mmol/L', 'meq/L'],
  },
  {
    id: 'phosphate',
    nameEn: 'Phosphate (inorganic, as phosphorus)',
    nameKo: '인산염(무기인)',
    synonyms: ['P', 'phosphorus', 'PO4', 'Pi', '인'],
    formula: 'P',
    formulaAssumption:
      'mg/dL 표기는 인(P) 원자 질량 기준(“inorganic phosphorus”)이므로 P 의 원자량을 사용함. 인산염 이온은 pH 에 따라 전하가 달라 mEq/L 변환은 제공하지 않음',
    units: ['mg/dL', 'mmol/L'],
  },
  {
    id: 'iron',
    nameEn: 'Iron',
    nameKo: '철',
    synonyms: ['Fe', 'serum iron', '혈청철'],
    formula: 'Fe',
    units: ['ug/dL', 'umol/L'],
  },
  {
    id: 'albumin',
    nameEn: 'Albumin',
    nameKo: '알부민',
    synonyms: ['Alb', 'ALB'],
    units: ['g/dL', 'g/L'],
    noMolarReason: '단백질은 단일 화학식이 아니어서 원자량으로 분자량을 계산할 수 없음',
  },
  {
    id: 'totalProtein',
    nameEn: 'Total protein',
    nameKo: '총단백',
    synonyms: ['TP', 'protein'],
    units: ['g/dL', 'g/L'],
    noMolarReason: '여러 단백질의 혼합물이라 분자량이 정의되지 않음',
  },
  {
    id: 'hemoglobin',
    nameEn: 'Hemoglobin',
    nameKo: '혈색소(헤모글로빈)',
    synonyms: ['Hb', 'Hgb', '헤모글로빈', '혈색소'],
    units: ['g/dL', 'g/L'],
    noMolarReason: '단백질은 단일 화학식이 아니어서 원자량으로 분자량을 계산할 수 없음',
  },
  ...(
    [
      ['alt', 'Alanine aminotransferase (ALT)', 'ALT(알라닌아미노전이효소)', ['ALT', 'GPT', 'SGPT']],
      ['ast', 'Aspartate aminotransferase (AST)', 'AST(아스파르트산아미노전이효소)', ['AST', 'GOT', 'SGOT']],
      ['alp', 'Alkaline phosphatase (ALP)', 'ALP(알칼리인산분해효소)', ['ALP', 'alk phos']],
      ['ggt', 'Gamma-glutamyl transferase (GGT)', 'GGT(감마지티피)', ['GGT', 'γ-GT', 'r-GTP', '감마지티피']],
      ['ld', 'Lactate dehydrogenase (LD)', 'LD(젖산탈수소효소)', ['LD', 'LDH']],
    ] as const
  ).map(
    ([id, nameEn, nameKo, syn]): Analyte => ({
      id,
      nameEn,
      nameKo,
      synonyms: [...syn],
      units: ['U/L', 'ukat/L'],
      noMolarReason: '효소는 활성(촉매량)으로 측정하므로 질량·몰 농도와 서로 바꿀 근거가 없음',
    }),
  ),
  {
    id: 'hba1c',
    nameEn: 'Hemoglobin A1c (HbA1c)',
    nameKo: '당화혈색소(HbA1c)',
    synonyms: ['A1c', 'HbA1c', 'glycated hemoglobin', '당화혈색소'],
    units: ['%', 'mmol/mol'],
    special: 'hba1c',
  },
  {
    id: 'uacr',
    nameEn: 'Urine albumin-to-creatinine ratio (uACR)',
    nameKo: '소변 알부민/크레아티닌 비(uACR)',
    synonyms: ['ACR', 'UACR', 'microalbumin', '미세알부민'],
    formula: 'C4H7N3O',
    formulaAssumption: '분모(크레아티닌)의 g ↔ mmol 환산에 크레아티닌 분자량을 사용함',
    units: ['mg/g', 'mg/mmol'],
    special: 'creatinineRatio',
  },
  {
    id: 'upcr',
    nameEn: 'Urine protein-to-creatinine ratio (uPCR)',
    nameKo: '소변 단백/크레아티닌 비(uPCR)',
    synonyms: ['PCR', 'UPCR', '단백뇨'],
    formula: 'C4H7N3O',
    formulaAssumption: '분모(크레아티닌)의 g ↔ mmol 환산에 크레아티닌 분자량을 사용함',
    units: ['mg/g', 'mg/mmol'],
    special: 'creatinineRatio',
  },
];

/** 단위 선택 상자에 노출할 전체 단위 (분석물과 맞지 않는 단위를 고르면 엔진이 이유와 함께 거부) */
export const ALL_UNITS = [
  'mg/dL',
  'g/dL',
  'g/L',
  'ug/dL',
  'mmol/L',
  'umol/L',
  'meq/L',
  'U/L',
  'ukat/L',
  '%',
  'mmol/mol',
  'mg/g',
  'mg/mmol',
  'mg/dL{urea}',
];

export function findAnalyte(id: string): Analyte | undefined {
  return ANALYTES.find((a) => a.id === id);
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[\s\-_()]/g, '');
}

/** 영문·한글·동의어 검색 */
export function searchAnalytes(q: string): Analyte[] {
  const n = norm(q);
  if (!n) return ANALYTES;
  return ANALYTES.filter((a) =>
    [a.id, a.nameEn, a.nameKo, ...a.synonyms].some((s) => norm(s).includes(n)),
  );
}
