# Test-11 — 임상검사 단위 변환 · 참고구간

**사이트: https://bseo9827-eng.github.io/Test-11/**

React + TypeScript + Vite 정적 사이트. GitHub Actions 가 `main` 푸시마다 테스트 → 빌드 → `gh-pages` 브랜치로 배포합니다.

> 교육·참고용입니다. 임상 판단은 소속 검사실의 보고 단위와 참고구간을 따르세요.

## 기능

### 1. 변환 탭
- 분석물 검색(영문·한글·동의어) → 값·원본 단위·대상 단위 입력
- 결과를 크게 표시하고 바로 아래에 **계산 근거**(방법, 계수, 수식, 계산 과정, 가정, 출처 링크)
- 양방향 스왑(⇄), 결과 복사 버튼
- 근거 없는 변환(예: 포도당 mg/dL → U/L, 알부민 g/dL → mmol/L)은 이유와 함께 거부

### 2. 참고구간 탭
- 분석물 + 나이 + 성별 + 검체 → 공표된 구간만 그대로 표시 (없는 나이 구간은 외삽하지 않음)
- 결과 값 입력 시 low / normal / high 판정 (다른 단위로 입력하면 변환 엔진으로 환산 후 판정)
- 출처·검체·나이 구간·확인 상태 표시, 18세 미만이면 CALIPER 안내

## 데이터 출처와 역할

| 역할 | 출처 | 앱 포함 |
|---|---|---|
| 차원 검사·스케일 변환 | UCUM (`@lhncbc/ucum-lhc` 8.0.0) | ✅ |
| 분자량 | IUPAC CIAAW 표준 원자량으로 화학식에서 **계산** (`src/engine/formula.ts`) | ✅ |
| mEq/L | 이온 전하 + UCUM `charge` 옵션 | ✅ |
| HbA1c NGSP↔IFCC | NGSP master equation `NGSP = 0.09148 × IFCC + 2.152` (ngsp.org/ifcc.asp) | ✅ |
| uACR·uPCR mg/g↔mg/mmol | 크레아티닌 분자량으로 분모 g↔mmol 환산 (KDIGO 2024 범주는 근사) | ✅ |
| BUN↔요소 | M(urea)/M(2N) | ✅ |
| 중성지방 | 트리올레인(C57H104O6) 분자량 가정 | ✅ |
| 참고구간 | RCPA Harmonised Reference Intervals Table 6 (일부 AACB 보고서) | ✅ |
| 소아 참고구간 안내 | CALIPER (링크만) | 링크 |
| 교차 검증 | Labcorp SI Unit Conversion Table, CMEinfo, NBME (`tests/crosscheck.fixtures.ts`) | ❌ 테스트 전용 |

변환 계수는 어떤 표에서도 복사하지 않습니다. 교차검증 표는 `tests/` 에만 있고, `src/` 가 이를 import 하지 않음을 테스트로 확인합니다.

## 개발

```bash
npm ci
npm test        # Vitest
npm run dev
npm run build   # tsc + vite build → dist/
```

## 확인하지 못한 사항 — TODO(verify)

작업 환경의 네트워크 정책 때문에 rcpa.edu.au, aacb.asn.au, ngsp.org, labcorp.com, nbme.org, caliperproject.ca, ciaaw.org 에 직접 접속할 수 없었습니다. 값은 웹 검색 결과에 인용된 원문으로만 확인했습니다.

- **IUPAC 원자량**: CIAAW abridged 값 사용, 최신 표와 직접 대조하지 못함.
- **RCPA Table 6 수치**: 검색 결과 인용으로 확인. 원문 직접 대조 필요.
- **중탄산염 구간**: AACB 2014 보고서 값. 현행 RCPA Table 6 에 같은 값이 있는지 미확인.
- **크레아티닌 구간**: AACB QUPP 2014 보고서 값. 현행 RCPA Table 6 과 동일한지 미확인.
- **나이 경계**: 년 = 365.25일로 환산. RCPA APUTS 문서의 일(day) 단위 경계와 하루 차이가 날 수 있음.
- **교차검증 계수**: Labcorp 크레아티닌(88.4 / 0.0113)과 Quest 콜레스테롤(0.0259)만 원문 인용 확인, 나머지는 표준 계수로 적어 두고 `verified: false` 표시.
- **KDIGO 2024**: 알부민뇨 범주(A1 <3 mg/mmol·<30 mg/g 등)는 2012 지침과 같은 값으로 인용됨. 2024 원문 문구는 직접 확인 못 함.

## 구하지 못한 데이터 (넣지 않음)

- 혈장 칼륨 구간: RCPA 에 별도 행이 있지만 수치를 확보하지 못함
- 칼슘·마그네슘 소아 구간, 인산염 20세 미만 구간
- ALP · LD · 총단백: 성인 값은 언급되나 나이·성별 적용 조건을 확인 못 함
- ALT · GGT · 알부민 · 빌리루빈: harmonised 수치를 찾지 못함
- 크레아티닌 60세 이상: 원래 공표되지 않음 (외삽하지 않음)
- 포도당·지질·요산·요소·철·HbA1c 참고구간: RCPA Table 6 수록 여부·수치 미확인
- CALIPER 수치: 요구사항대로 안내 링크만 제공
