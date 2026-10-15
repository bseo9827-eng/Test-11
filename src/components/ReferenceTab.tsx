import { useCallback, useMemo, useState } from 'react';
import { ANALYTES, type Analyte } from '../data/analytes';
import { DAY, MISSING_DATA, WEEK, YEAR, type Sex, type Specimen } from '../data/referenceIntervals';
import { SOURCES } from '../data/sources';
import { convert, fmt } from '../engine/convert';
import { classify, findIntervals, hasAnyInterval } from '../engine/interpret';
import { AnalytePicker } from './AnalytePicker';

const AGE_UNITS = { days: DAY, weeks: WEEK, months: YEAR / 12, years: YEAR } as const;
type AgeUnit = keyof typeof AGE_UNITS;
const AGE_LABEL: Record<AgeUnit, string> = { days: '일', weeks: '주', months: '개월', years: '세' };
const FLAG_LABEL = { low: 'LOW (낮음)', normal: 'NORMAL (정상 범위)', high: 'HIGH (높음)' };

export function ReferenceTab() {
  const withData = useCallback((a: Analyte) => hasAnyInterval(a.id), []);
  const [analyte, setAnalyte] = useState<Analyte>(ANALYTES.find((a) => a.id === 'sodium')!);
  const [age, setAge] = useState('40');
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('years');
  const [sex, setSex] = useState<Sex>('M');
  const [specimen, setSpecimen] = useState<Specimen>('serum');
  const [raw, setRaw] = useState('');
  const [valueUnit, setValueUnit] = useState('');

  const ageDays = parseFloat(age) * AGE_UNITS[ageUnit];
  const matches = useMemo(
    () => (Number.isFinite(ageDays) ? findIntervals({ analyteId: analyte.id, ageDays, sex, specimen }) : []),
    [analyte, ageDays, sex, specimen],
  );

  const pick = (a: Analyte) => {
    setAnalyte(a);
    setValueUnit('');
  };

  const value = parseFloat(raw.replace(',', '.'));
  const isChild = Number.isFinite(ageDays) && ageDays < 18 * YEAR;

  return (
    <section>
      <AnalytePicker value={analyte} onChange={pick} filter={withData} />
      <p className="muted small">참고구간 데이터가 있는 분석물만 표시됩니다.</p>

      <div className="row">
        <div className="field">
          <label htmlFor="age">나이</label>
          <div className="inline">
            <input id="age" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} />
            <select aria-label="나이 단위" value={ageUnit} onChange={(e) => setAgeUnit(e.target.value as AgeUnit)}>
              {(Object.keys(AGE_UNITS) as AgeUnit[]).map((u) => (
                <option key={u} value={u}>
                  {AGE_LABEL[u]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="sex">성별</label>
          <select id="sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="M">남</option>
            <option value="F">여</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="spec">검체</label>
          <select id="spec" value={specimen} onChange={(e) => setSpecimen(e.target.value as Specimen)}>
            <option value="serum">혈청 (serum)</option>
            <option value="plasma">혈장 (plasma)</option>
          </select>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="result rejected" role="status">
          <div className="big">공표된 구간 없음</div>
          <p>
            이 조건(나이·성별·검체)에 해당하는 공표 참고구간이 데이터에 없습니다. 인접 나이 구간으로 외삽하지
            않습니다.
          </p>
        </div>
      ) : (
        matches.map((r) => {
          const conv =
            raw.trim() === ''
              ? null
              : convert(analyte, value, valueUnit || r.unit, r.unit);
          const flag = conv?.ok ? classify(conv.value, r) : null;
          return (
            <div className="result" key={`${r.ageLabel}-${r.sex ?? 'all'}`}>
              <div className="big">
                {r.low} – {r.high} <span className="unit">{r.unit}</span>
              </div>
              <dl className="basis">
                <dt>나이 구간</dt>
                <dd>{r.ageLabel}</dd>
                <dt>성별</dt>
                <dd>{r.sex ? (r.sex === 'M' ? '남' : '여') : '공통'}</dd>
                <dt>검체</dt>
                <dd>{r.specimen === 'serum' ? '혈청 (serum)' : '혈장 (plasma)'}</dd>
                <dt>출처</dt>
                <dd>
                  <a href={r.source.url} target="_blank" rel="noreferrer">
                    {r.source.label}
                  </a>
                </dd>
                {r.note && (
                  <>
                    <dt>비고</dt>
                    <dd>{r.note}</dd>
                  </>
                )}
                {r.verify && (
                  <>
                    <dt>확인 상태</dt>
                    <dd className="warn">{r.verify}</dd>
                  </>
                )}
              </dl>

              <div className="row">
                <div className="field">
                  <label htmlFor="res">결과 값</label>
                  <input id="res" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="resu">결과 단위</label>
                  <select id="resu" value={valueUnit || r.unit} onChange={(e) => setValueUnit(e.target.value)}>
                    {[r.unit, ...analyte.units.filter((u) => u !== r.unit)].map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              {conv && !conv.ok && <p className="warn">{conv.reason}</p>}
              {conv?.ok && flag && (
                <p className={`flag ${flag}`}>
                  {FLAG_LABEL[flag]}
                  {conv.from !== conv.to && (
                    <span className="muted small">
                      {' '}
                      ({raw} {conv.from} → {fmt(conv.value)} {conv.to})
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })
      )}

      {isChild && (
        <p className="note">
          소아 참고구간은 연령·성별에 따라 세분화된{' '}
          <a href={SOURCES.caliper.url} target="_blank" rel="noreferrer">
            CALIPER
          </a>{' '}
          자료도 참고하세요. (이 앱은 CALIPER 수치를 포함하지 않습니다.)
        </p>
      )}

      <details className="missing">
        <summary>수집하지 못한 참고구간 데이터와 이유</summary>
        <ul>
          {MISSING_DATA.map((m) => (
            <li key={m.item}>
              <b>{m.item}</b>: {m.reason}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
