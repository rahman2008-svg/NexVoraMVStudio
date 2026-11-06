import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawFrame } from '../src/renderer/draw';
import type { RenderPlan, TextRow } from '../src/renderer/compile';
import { defaultProject, templates } from '../src/domain/model';

const context = () => new Proxy({} as CanvasRenderingContext2D, {
  get: (_t, key) => key === 'measureText' ? (text: string) => ({ width: text.length * 10 }) : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => undefined,
  set: () => true,
});
const row = (text: string): TextRow => ({ text, x: 0, y: 0, width: text.length * 10, size: 40 });
function plan(): RenderPlan {
  const project = { ...defaultProject([]), template: 'nexvora-glow' as const, audioReactivity: 'rhythmic' as const };
  const entries = [0, 1].map(index => ({ index, y: 0, height: 100, rows: [row('hello world'), row('বাংলা গান')], line: { id: `l${index}`, text: 'hello world', start: 2 + index * 4, end: 5 + index * 4, precision: 'manual' as const, words: [] } }));
  return { project, width: 1280, height: 720, family: 'sans-serif', entries, peaks: Array.from({ length: 600 }, (_, i) => Math.abs(Math.sin(i / 9))) };
}
afterEach(() => vi.unstubAllGlobals());

describe('NexVora Glow renderer', () => {
  it('is registered as a selectable template', () => { expect(templates.some(item => item.id === 'nexvora-glow')).toBe(true); });
  it('draws intro, lyric, outro and transparent frames without throwing', () => {
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => context() }) });
    const ctx = context(), value = plan();
    for (const transparent of [false, true]) for (let time = -1; time < 20; time += 0.5) expect(() => drawFrame(ctx, value, time, transparent)).not.toThrow();
  });
});
