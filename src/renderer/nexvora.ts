// NexVora Glow: a Canvas 2D lyric renderer. Every frame is a pure function of project time
// and the decoded audio envelope, so preview, offline export and real-time export match.
import { clamp, ease } from '../domain/model';
import type { RenderPlan, TextRow } from './compile';
import i18n from '../i18n';

type Rgb = readonly [number, number, number];
const CYAN: Rgb = [34, 211, 238], VIOLET: Rgb = [139, 92, 246], ICE: Rgb = [165, 243, 252], LILAC: Rgb = [196, 181, 253];
const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a)})`;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const schemes = { nexvora: [CYAN, VIOLET], cyan: [CYAN, ICE], violet: [VIOLET, LILAC] } as const;
export type GlowScheme = keyof typeof schemes;
export const glowSchemes = Object.keys(schemes) as GlowScheme[];

const fract = (x: number) => x - Math.floor(x);
const rnd = (i: number, k: number, seed: number) => fract(Math.sin(i * 127.1 + k * 311.7 + seed * 0.013) * 43758.5453);

interface Cache { sprites: HTMLCanvasElement[]; particles: number; prefixes: WeakMap<TextRow, number[]> }
const caches = new WeakMap<RenderPlan, Cache>();

function sprite(color: Rgb) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!, g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, rgba([255, 255, 255], 0.95)); g.addColorStop(0.25, rgba(color, 0.7)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); return canvas;
}
function cacheFor(plan: RenderPlan): Cache {
  let cache = caches.get(plan);
  if (!cache) {
    const [a, b] = schemes[plan.project.glowScheme ?? 'nexvora'];
    // Low-memory Android devices get fewer particles; export uses the same count as preview.
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const density = clamp(plan.project.particleDensity ?? 0.5);
    cache = { sprites: [sprite(a), sprite(b)], particles: Math.round(density * 150 * (memory <= 4 ? 0.6 : 1)), prefixes: new WeakMap() };
    caches.set(plan, cache);
  }
  return cache;
}

function rawEnergy(peaks: number[], time: number, duration: number) {
  if (!peaks.length) return 0.4;
  const f = clamp(time / Math.max(duration, 0.001)) * (peaks.length - 1), i = Math.floor(f), k = f - i;
  const a = peaks[i] ?? 0, b = peaks[Math.min(peaks.length - 1, i + 1)] ?? a; return a + (b - a) * k;
}
function level(plan: RenderPlan, time: number) {
  const p = plan.project; if (p.audioReactivity === 'off') return 0.25;
  const gain = (p.audioReactivity === 'rhythmic' ? 1 : 0.55) * p.audioReactivityAmount;
  const d = p.duration, e = (rawEnergy(plan.peaks, time - 0.08, d) + rawEnergy(plan.peaks, time, d) * 2 + rawEnergy(plan.peaks, time + 0.08, d)) / 4;
  return clamp(0.12 + gain * Math.pow(e, p.audioReactivity === 'rhythmic' ? 1.4 : 1));
}
function progressOf(entry: RenderPlan['entries'][number], time: number, estimated: boolean) {
  const { line } = entry;
  if (line.words.length) {
    let total = 0, passed = 0;
    for (const w of line.words) { const n = Array.from(w.text).length; total += n; passed += n * clamp((time - w.start) / Math.max(0.03, w.end - w.start)); }
    return total ? passed / total : 1;
  }
  return estimated ? clamp((time - line.start!) / Math.max(0.1, line.end! - line.start!)) : ease((time - line.start!) / 0.55);
}
function prefixWidths(ctx: CanvasRenderingContext2D, cache: Cache, row: TextRow) {
  let widths = cache.prefixes.get(row);
  if (!widths) {
    const parts = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(row.text), s => s.segment);
    widths = [0]; let text = ''; for (const part of parts) { text += part; widths.push(ctx.measureText(text).width); }
    cache.prefixes.set(row, widths);
  }
  return widths;
}

function background(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, lv: number, colors: readonly [Rgb, Rgb]) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05070f'); g.addColorStop(1, '#0b1022');
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = Math.max(w, h) * 0.62;
  const blobs: [number, number, Rgb][] = [[0.2 + 0.08 * Math.sin(time * 0.17), 0.25 + 0.06 * Math.cos(time * 0.13), colors[0]], [0.82 + 0.07 * Math.cos(time * 0.15), 0.8 + 0.07 * Math.sin(time * 0.11), colors[1]]];
  for (const [bx, by, c] of blobs) {
    const rg = ctx.createRadialGradient(bx * w, by * h, 0, bx * w, by * h, r);
    rg.addColorStop(0, rgba(c, 0.13 + 0.16 * lv)); rg.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  }
}
function particles(ctx: CanvasRenderingContext2D, plan: RenderPlan, cache: Cache, time: number, lv: number, scale: number) {
  const { width: w, height: h, project: p } = plan, drift = p.intensity;
  for (let i = 0; i < cache.particles; i++) {
    const phase = rnd(i, 4, p.seed), speed = 0.012 + rnd(i, 2, p.seed) * 0.045;
    const y = 1 - fract(rnd(i, 5, p.seed) + time * speed * drift), x = rnd(i, 1, p.seed) + Math.sin(time * 0.4 + phase * 6.283) * 0.03;
    const twinkle = 0.5 + 0.5 * Math.sin(time * (1 + rnd(i, 6, p.seed) * 2) + phase * 6.283);
    const size = (6 + rnd(i, 3, p.seed) * 14 + lv * 16) * scale;
    ctx.globalAlpha = clamp(twinkle * (0.2 + 0.6 * lv) * Math.sin(Math.PI * clamp(y)));
    ctx.drawImage(cache.sprites[i % 2], x * w - size / 2, y * h - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}
function bars(ctx: CanvasRenderingContext2D, plan: RenderPlan, time: number, lv: number, scale: number, colors: readonly [Rgb, Rgb]) {
  const { width: w, height: h, project: p } = plan, n = 48, x0 = w * 0.18, span = w * 0.64, gap = span / n;
  const g = ctx.createLinearGradient(x0, 0, x0 + span, 0); g.addColorStop(0, rgba(colors[0], 0.85)); g.addColorStop(1, rgba(colors[1], 0.85));
  ctx.fillStyle = g; ctx.globalAlpha = 0.8;
  for (let i = 0; i < n; i++) {
    const e = rawEnergy(plan.peaks, time + (i - n / 2) * 0.06, p.duration), bar = (2 + (plan.peaks.length ? e : 0.2) * 26 * (0.4 + lv)) * scale;
    ctx.fillRect(x0 + i * gap, h * 0.9 - bar / 2, Math.max(1, gap * 0.55), bar);
  }
  ctx.globalAlpha = 1;
}
function glowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, alpha: number, lv: number, scale: number, colors: readonly [Rgb, Rgb], glow: number, clipRight?: number) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${0.2 * alpha})`; ctx.fillText(text, x, y);
  if (clipRight !== undefined) { ctx.beginPath(); ctx.rect(x - size * 2, y - size * 2.2, clipRight + size * 2, size * 3.6); ctx.clip(); }
  const g = ctx.createLinearGradient(x, 0, x + Math.max(width, 1), 0); g.addColorStop(0, rgba(mix(colors[0], [255, 255, 255], 0.55), 1)); g.addColorStop(1, rgba(mix(colors[1], [255, 255, 255], 0.55), 1));
  ctx.globalAlpha = alpha;
  if (glow > 0.02) { ctx.shadowColor = rgba(colors[0], 0.9); ctx.shadowBlur = (10 + 36 * lv) * scale * glow; }
  ctx.fillStyle = g; ctx.fillText(text, x, y);
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.globalAlpha = alpha * 0.55; ctx.fillStyle = '#ffffff'; ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawNexvoraFrame(ctx: CanvasRenderingContext2D, plan: RenderPlan, time: number, transparent = false) {
  const { width: w, height: h, project: p, family } = plan, scale = Math.min(w, h) / 720, cache = cacheFor(plan);
  const colors = schemes[p.glowScheme ?? 'nexvora'], glow = clamp((p.glowIntensity ?? 0.8) / 1.5) * 1.5;
  const t = time - p.offset, lv = level(plan, time), weight = p.fontWeight || 500;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  if (transparent) ctx.clearRect(0, 0, w, h);
  else { background(ctx, w, h, time, lv, colors); if (cache.particles) particles(ctx, plan, cache, time, lv, scale); bars(ctx, plan, time, lv, scale, colors); }
  const entries = plan.entries, first = entries[0]?.line.start ?? 0, last = Math.max(0, ...entries.map(e => e.line.end ?? 0));
  if (!entries.length || t < first - 0.5 || t > last + 0.8) {
    const outro = entries.length > 0 && t > last + 0.8, size = 54 * scale * p.fontScale, pulse = 1 + 0.025 * lv;
    ctx.font = `${weight} ${size * pulse}px ${family}`;
    const title = p.title || i18n.t('export.untitledWork'), tw = Math.min(ctx.measureText(title).width, w * 0.8);
    glowText(ctx, title, (w - tw) / 2, h * 0.47, tw, size, 1, lv, scale, colors, glow);
    ctx.font = `${weight} ${18 * scale}px ${family}`; const sub = outro ? i18n.t('export.thanksForListening') : p.artist, sw = Math.min(ctx.measureText(sub).width, w * 0.8);
    glowText(ctx, sub, (w - sw) / 2, h * 0.57, sw, 18 * scale, 0.7, lv, scale, colors, glow * 0.5);
    return;
  }
  for (const entry of entries) {
    const elapsed = t - entry.line.start!, after = t - entry.line.end!;
    if (elapsed < -0.35 || after > 0.6) continue;
    const enter = ease((elapsed + 0.35) / 0.7), leave = ease(after / 0.6), alpha = enter * (1 - leave);
    const lift = ((1 - enter) * 26 - leave * 20) * scale * p.intensity, zoom = 1 + (1 - enter) * 0.06 * p.intensity;
    const rows = entry.rows, size = rows[0].size, lineHeight = size * 1.35, top = h * 0.46 - rows.length * lineHeight / 2 + size;
    const progress = progressOf(entry, t, p.estimatedReveal);
    ctx.save(); ctx.translate(w / 2, h * 0.46 + lift); ctx.scale(zoom, zoom); ctx.translate(-w / 2, -h * 0.46);
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j]; ctx.font = `${weight} ${row.size}px ${family}`;
      const widths = prefixWidths(ctx, cache, row), n = widths.length - 1, rowProgress = clamp(progress * rows.length - j);
      const pos = rowProgress * n, k = Math.min(n, Math.floor(pos)), px = widths[k] + ((widths[Math.min(n, k + 1)] ?? widths[k]) - widths[k]) * (pos - k);
      glowText(ctx, row.text, (w - row.width) / 2, top + j * lineHeight, row.width, row.size, alpha, lv, scale, colors, glow, rowProgress >= 1 ? undefined : px);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#ffffff'; ctx.font = `${12 * scale}px Arial`;
  if (!transparent) { ctx.fillText(p.title, w * 0.065, h * 0.065, w * 0.65); ctx.fillText(p.artist, w * 0.065, h * 0.095, w * 0.65); }
  ctx.globalAlpha = 1;
}
