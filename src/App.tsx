import { useState } from 'react';
import { ConvertTab } from './components/ConvertTab';
import { ReferenceTab } from './components/ReferenceTab';

type Tab = 'convert' | 'reference';

export default function App() {
  const [tab, setTab] = useState<Tab>('convert');
  return (
    <main>
      <header>
        <h1>임상검사 단위 변환 · 참고구간</h1>
        <p className="muted small">
          변환 계수는 표에서 복사하지 않고 UCUM + IUPAC 원자량으로 계산합니다. 임상 판단의 유일한 근거로 쓰지 마세요.
        </p>
      </header>
      <nav role="tablist">
        <button role="tab" aria-selected={tab === 'convert'} onClick={() => setTab('convert')}>
          변환
        </button>
        <button role="tab" aria-selected={tab === 'reference'} onClick={() => setTab('reference')}>
          참고구간
        </button>
      </nav>
      {tab === 'convert' ? <ConvertTab /> : <ReferenceTab />}
    </main>
  );
}
