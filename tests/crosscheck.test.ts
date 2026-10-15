import { describe, expect, it } from 'vitest';
import { findAnalyte } from '../src/data/analytes';
import { convert } from '../src/engine/convert';
import { CROSS_CHECKS } from './crosscheck.fixtures';

describe('외부 변환표와 교차 검증 (앱에는 미포함)', () => {
  it.each(CROSS_CHECKS.map((c) => [`${c.source} · ${c.analyteId} ${c.from}→${c.to}${c.verified ? '' : ' [TODO(verify)]'}`, c] as const))(
    '%s',
    (_, c) => {
      const r = convert(findAnalyte(c.analyteId)!, 1, c.from, c.to);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const rel = Math.abs(r.value - c.factor) / c.factor;
      expect(rel).toBeLessThanOrEqual(c.relTol);
    },
  );

  it('src 코드가 교차검증 표를 import 하지 않는다', async () => {
    const files = import.meta.glob('../src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });
    for (const [path, text] of Object.entries(files)) {
      expect(String(text), path).not.toMatch(/crosscheck|Labcorp|NBME|CMEinfo/i);
    }
  });
});
