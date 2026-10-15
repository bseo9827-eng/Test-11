import { useMemo, useState } from 'react';
import { searchAnalytes, type Analyte } from '../data/analytes';

interface Props {
  value: Analyte;
  onChange: (a: Analyte) => void;
  filter?: (a: Analyte) => boolean;
}

export function AnalytePicker({ value, onChange, filter }: Props) {
  const [q, setQ] = useState('');
  const list = useMemo(() => searchAnalytes(q).filter((a) => !filter || filter(a)), [q, filter]);

  return (
    <div className="field">
      <label htmlFor="analyte-search">분석물 검색 (영문·한글·동의어)</label>
      <input
        id="analyte-search"
        type="search"
        placeholder="예: glucose, 크레아티닌, BUN, A1c"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        aria-label="분석물"
        value={list.some((a) => a.id === value.id) ? value.id : ''}
        onChange={(e) => {
          const a = list.find((x) => x.id === e.target.value);
          if (a) onChange(a);
        }}
        size={Math.min(6, Math.max(2, list.length))}
      >
        {list.length === 0 && <option disabled>검색 결과 없음</option>}
        {list.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nameKo} · {a.nameEn}
          </option>
        ))}
      </select>
      <small className="muted">
        선택됨: <b>{value.nameKo}</b> ({value.nameEn})
      </small>
    </div>
  );
}
