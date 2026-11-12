/*
  The ZLASH wordmark as a field of characters.
  Each character has a home cell inside the letters. The pointer pushes characters away
  and scrambles them; a spring pulls them home. The loop stops once everything is at rest.
*/

const RAMP = '.:-=+*';
const SOLID = '#%@&8$';
const SCRAMBLE = '/\\|<>+=*#%&?!zlashZLASH';

const STEP_MS = 1000 / 60;
const SPRING = 0.07;
const DAMPING = 0.84;
const PUSH = 5;
const BURST = 26;
const REST = 0.02;

interface Cell {
  readonly hx: number;
  readonly hy: number;
  readonly home: string;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  glyph: string;
  /** Frames left showing a scrambled glyph. 0 means it shows `home`. */
  scramble: number;
}

export interface LetterBox {
  readonly letter: string;
  readonly x: number;
  readonly baseline: number;
}

export interface FieldLayout {
  readonly width: number;
  readonly height: number;
  readonly font: string;
  readonly letters: readonly LetterBox[];
  readonly cell: number;
}

export interface FieldColors {
  readonly ink: string;
  readonly hot: string;
}

type Pointer = { readonly x: number; readonly y: number } | null;

const randomGlyph = () => SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]!;

/** Rasterises the letters once and keeps a character for every cell they cover. */
function sampleCells(layout: FieldLayout): Cell[] {
  const { width, height, cell } = layout;
  const mask = new OffscreenCanvas(Math.ceil(width), Math.ceil(height));
  const ctx = mask.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas unavailable');

  ctx.font = layout.font;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#000';
  for (const { letter, x, baseline } of layout.letters) ctx.fillText(letter, x, baseline);

  const { data } = ctx.getImageData(0, 0, mask.width, mask.height);
  const alphaAt = (x: number, y: number) => data[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3]! / 255;

  const cells: Cell[] = [];
  const samples = [0.2, 0.5, 0.8];
  for (let top = 0; top + cell <= height; top += cell) {
    for (let left = 0; left + cell <= width; left += cell) {
      let coverage = 0;
      for (const sy of samples) for (const sx of samples) coverage += alphaAt(left + sx * cell, top + sy * cell);
      coverage /= samples.length * samples.length;
      if (coverage < 0.12) continue;

      // Edges thin out along the ramp; solid areas get a stable mix of dense glyphs.
      const home =
        coverage > 0.9
          ? SOLID[(((left * 73856093) ^ (top * 19349663)) >>> 0) % SOLID.length]!
          : RAMP[Math.min(RAMP.length - 1, Math.floor(coverage * RAMP.length))]!;
      cells.push({ hx: left + cell / 2, hy: top + cell / 2, home, glyph: home, dx: 0, dy: 0, vx: 0, vy: 0, scramble: 0 });
    }
  }
  return cells;
}

export class AsciiField {
  private readonly ctx: CanvasRenderingContext2D;
  private cells: Cell[] = [];
  private layout: FieldLayout | null = null;
  private pointer: Pointer = null;
  private frame = 0;
  private last = 0;
  private carry = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly colors: FieldColors,
    private readonly reducedMotion: boolean,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
  }

  /** Rebuilds the field for a new size. `scatter` plays the one-time entrance. */
  setLayout(layout: FieldLayout, scatter: boolean) {
    this.layout = layout;
    this.cells = sampleCells(layout);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(layout.width * dpr);
    this.canvas.height = Math.round(layout.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (scatter) {
      for (const c of this.cells) {
        c.scramble = 8 + Math.floor(Math.random() * 40);
        c.glyph = randomGlyph();
        if (this.reducedMotion) continue;
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 90;
        c.dx = Math.cos(angle) * distance;
        c.dy = Math.sin(angle) * distance;
      }
    }
    this.wake();
  }

  pointerAt(pointer: Pointer) {
    this.pointer = pointer;
    this.wake();
  }

  /** A click or tap: knock nearby characters outward. */
  burst(x: number, y: number) {
    const radius = this.radius() * 2.2;
    for (const c of this.cells) {
      const px = c.hx + c.dx - x;
      const py = c.hy + c.dy - y;
      const d = Math.hypot(px, py);
      if (d > radius) continue;
      const falloff = 1 - d / radius;
      c.scramble = Math.max(c.scramble, Math.floor(10 + falloff * 30));
      c.glyph = randomGlyph();
      if (this.reducedMotion || d === 0) continue;
      c.vx += (px / d) * BURST * falloff;
      c.vy += (py / d) * BURST * falloff;
    }
    this.wake();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private radius() {
    return (this.layout?.cell ?? 8) * 9;
  }

  private wake() {
    if (this.frame) return;
    this.last = performance.now();
    this.carry = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number) => {
    this.carry += Math.min(now - this.last, 100);
    this.last = now;

    // A frame that lands before a full step has elapsed runs no step; keep going.
    let moving = true;
    while (this.carry >= STEP_MS) {
      moving = this.step();
      this.carry -= STEP_MS;
    }
    this.draw();

    this.frame = moving || this.pointer ? requestAnimationFrame(this.tick) : 0;
  };

  /** Advances one 60Hz step. Returns whether anything is still moving or scrambled. */
  private step(): boolean {
    const radius = this.radius();
    const pointer = this.pointer;
    let moving = false;

    for (const c of this.cells) {
      let ax = -SPRING * c.dx;
      let ay = -SPRING * c.dy;

      if (pointer) {
        const px = c.hx + c.dx - pointer.x;
        const py = c.hy + c.dy - pointer.y;
        const d = Math.hypot(px, py);
        if (d < radius) {
          const falloff = 1 - d / radius;
          if (!this.reducedMotion && d > 0) {
            ax += (px / d) * PUSH * falloff * falloff;
            ay += (py / d) * PUSH * falloff * falloff;
          }
          if (Math.random() < falloff * 0.25) {
            c.glyph = randomGlyph();
            c.scramble = 6 + Math.floor(falloff * 18);
          }
        }
      }

      c.vx = (c.vx + ax) * DAMPING;
      c.vy = (c.vy + ay) * DAMPING;
      c.dx += c.vx;
      c.dy += c.vy;

      if (c.scramble > 0 && --c.scramble === 0) c.glyph = c.home;

      const settled = Math.abs(c.dx) < REST && Math.abs(c.dy) < REST && Math.abs(c.vx) < REST && Math.abs(c.vy) < REST;
      if (settled) {
        c.dx = c.dy = c.vx = c.vy = 0;
      }
      if (!settled || c.scramble > 0) moving = true;
    }
    return moving;
  }

  private draw() {
    const layout = this.layout;
    if (!layout) return;
    const { ctx } = this;

    ctx.clearRect(0, 0, layout.width, layout.height);
    ctx.font = `600 ${Math.round(layout.cell * 1.3)}px "Kumbh Sans Variable", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Two passes so the fill colour changes twice per frame, not per character.
    ctx.fillStyle = this.colors.ink;
    for (const c of this.cells) if (c.scramble === 0) ctx.fillText(c.glyph, c.hx + c.dx, c.hy + c.dy);
    ctx.fillStyle = this.colors.hot;
    for (const c of this.cells) if (c.scramble > 0) ctx.fillText(c.glyph, c.hx + c.dx, c.hy + c.dy);
  }
}
