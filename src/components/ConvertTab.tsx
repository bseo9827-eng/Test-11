import { useMemo, useState } from 'react';
import { ALL_UNITS, ANALYTES, type Analyte } from '../data/analytes';
import { convert, fmt } from '../engine/convert';
import { AnalytePicker } from './AnalytePicker';

const unitOptions = (a: Analyte) => [...a.units, ...ALL_UNITS.filter((u) => !a.units.includes(u))];

export function ConvertTab() {
  const [analyte, setAnalyte] = useState<Analyte>(ANALYTES[0]);
  const [raw, setRaw] = useState('100');
  const [from, setFrom] = useState(analyte.units[0]);
  const [to, setTo] = useState(analyte.units[1]);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const v = parseFloat(raw.replace(',', '.'));
    return convert(analyte, v, from, to);
  }, [analyte, raw, from, to]);

  const pick = (a: Analyte) => {
    setAnalyte(a);
    setFrom(a.units[0]);
    setTo(a.units[1] ?? a.units[0]);
  };

  const swap = () => {
    if (result.ok) setRaw(fmt(result.value, 6));
    setFrom(to);
    setTo(from);
  };

  const copy = async () => {
    if (!result.ok) return;
    const text = `${fmt(result.value)} ${result.to}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 권한 없음 */
    }
  };

  return (
    <section>
      <AnalytePicker value={analyte} onChange={pick} />

      <div className="row">
        <div className="field">
          <label htmlFor="val">값</label>
          <input id="val" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="from">원본 단위</label>
          <select id="from" value={from} onChange={(e) => setFrom(e.target.value)}>
            {unitOptions(analyte).map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <button type="button" className="swap" onClick={swap} aria-label="단위 바꾸기" title="양방향 스왑">
          ⇄
        </button>
        <div className="field">
          <label htmlFor="to">대상 단위</label>
          <select id="to" value={to} onChange={(e) => setTo(e.target.value)}>
            {unitOptions(analyte).map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {result.ok ? (
        <div className="result">
          <div className="big">
            {fmt(result.value)} <span className="unit">{result.to}</span>
            <button type="button" className="copy" onClick={copy}>
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="basis">
            <h3>계산 근거</h3>
            <dl>
              <dt>방법</dt>
              <dd>{result.method}</dd>
              {result.factor !== undefined && (
                <>
                  <dt>계수</dt>
                  <dd>
                    1 {result.from} = {fmt(result.factor, 6)} {result.to}
                  </dd>
                </>
              )}
              <dt>수식</dt>
              <dd>
                <code>{result.equation}</code>
              </dd>
              {result.steps.length > 0 && (
                <>
                  <dt>계산 과정</dt>
                  <dd>
                    <ul>
                      {result.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
              {result.assumptions.length > 0 && (
                <>
                  <dt>가정</dt>
                  <dd>
                    <ul>
                      {result.assumptions.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
              <dt>출처</dt>
              <dd>
                <ul>
                  {result.sources.map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </div>
        </div>
      ) : (
        <div className="result rejected" role="alert">
          <div className="big">변환 불가</div>
          <p>{result.reason}</p>
        </div>
      )}
    </section>
  );
}
