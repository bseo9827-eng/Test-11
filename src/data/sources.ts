export interface Source {
  id: string;
  label: string;
  url: string;
}

export const SOURCES = {
  ucum: {
    id: 'ucum',
    label: 'UCUM (Unified Code for Units of Measure) · @lhncbc/ucum-lhc',
    url: 'https://ucum.org/',
  },
  ucumLhc: {
    id: 'ucumLhc',
    label: 'NLM LHC ucum-lhc 라이브러리',
    url: 'https://github.com/lhncbc/ucum-lhc',
  },
  ciaaw: {
    id: 'ciaaw',
    label: 'IUPAC CIAAW 표준 원자량 (abridged/conventional values)',
    url: 'https://www.ciaaw.org/atomic-weights.htm',
  },
  ngsp: {
    id: 'ngsp',
    label: 'NGSP – IFCC Standardization of HbA1c (master equation)',
    url: 'https://ngsp.org/ifcc.asp',
  },
  kdigo2024: {
    id: 'kdigo2024',
    label: 'KDIGO 2024 CKD Evaluation and Management Guideline',
    url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
  },
  rcpaTable6: {
    id: 'rcpaTable6',
    label: 'RCPA Manual – Table 6: Harmonised reference intervals for chemical pathology',
    url: 'https://www.rcpa.edu.au/Manuals/RCPA-Manual/General-Information/IG/Table-6-Harmonised-reference-intervals-for-chem',
  },
  aacb2014: {
    id: 'aacb2014',
    label: 'AACB – Common Reference Intervals, Clin Biochem Rev 35(4) 2014 (Special Report)',
    url: 'https://www.aacb.asn.au/common/Uploaded%20files/aacb/guidelines%20and%20position%20statements/position%20statements/supporting%20documentation/20200211%20GPS%20Adult%20and%20paediatric%20common%20reference%20intervals%20for%20a%20first%20panel%20.pdf',
  },
  aacbQupp: {
    id: 'aacbQupp',
    label: 'AACB – Harmonisation of Adult and Paediatric Reference Intervals (QUPP final report, 2014)',
    url: 'https://aacblm.imiscloud.com/common/Uploaded%20files/aacb/guidelines%20and%20position%20statements/position%20statements/supporting%20documentation/20140630%20GPS%20Harmonisation%20QUPP%20final%20report.pdf',
  },
  caliper: {
    id: 'caliper',
    label: 'CALIPER – Canadian Laboratory Initiative on Paediatric Reference Intervals',
    url: 'https://caliperproject.ca/',
  },
} satisfies Record<string, Source>;
