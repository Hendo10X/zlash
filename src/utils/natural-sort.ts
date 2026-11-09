/** Compares strings the way a human expects for filenames: "page2.jpg"
 * before "page10.jpg", not after. Used to order CBZ archive entries. */
export function naturalCompare(a: string, b: string): number {
  const chunks = /(\d+)|(\D+)/g;
  const ax = a.match(chunks) ?? [a];
  const bx = b.match(chunks) ?? [b];
  const len = Math.max(ax.length, bx.length);

  for (let i = 0; i < len; i++) {
    const av = ax[i] ?? '';
    const bv = bx[i] ?? '';
    if (av === bv) continue;

    const an = Number(av);
    const bn = Number(bv);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return av < bv ? -1 : 1;
  }
  return 0;
}
