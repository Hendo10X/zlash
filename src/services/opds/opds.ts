import { XMLParser } from 'fast-xml-parser';

/**
 * OPDS 1.x (Atom) catalog client, plus the OPDS Page Streaming Extension
 * (PSE) for reading page-by-page without downloading the whole file.
 *
 * Works with Komga, Kavita, Calibre-Web, Ubooquity, COPS and any other
 * OPDS 1.x catalog. Komga and Kavita expose PSE, so their comics can be read
 * online; the others are download-to-library only.
 */

export interface OpdsCredentials {
  username?: string;
  password?: string;
}

export interface OpdsAcquisition {
  url: string;
  type: string;
}

export interface OpdsStream {
  /** URL template containing `{pageNumber}` (0-based) and maybe `{maxWidth}`. */
  template: string;
  count: number;
}

export interface OpdsEntry {
  /** Stable key for in-app handoff between screens. */
  key: string;
  id: string;
  title: string;
  author?: string;
  summary?: string;
  thumbnail?: string;
  cover?: string;
  /** Set when the entry opens another feed (a folder, series, shelf…). */
  navigationUrl?: string;
  acquisitions: OpdsAcquisition[];
  stream?: OpdsStream;
}

export interface OpdsFeed {
  url: string;
  title: string;
  entries: OpdsEntry[];
  nextUrl?: string;
  /** OpenSearch description document, if the catalog is searchable. */
  searchDescriptionUrl?: string;
  /** Some servers give the search template directly. */
  searchTemplate?: string;
}

export class OpdsError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
  }
}

const ACQUISITION_REL = 'http://opds-spec.org/acquisition';
const STREAM_REL = 'http://vaemendis.net/opds-pse/stream';
const IMAGE_RELS = ['http://opds-spec.org/image', 'http://opds-spec.org/cover', 'x-stanza-cover-image'];
const THUMB_RELS = ['http://opds-spec.org/image/thumbnail', 'http://opds-spec.org/thumbnail', 'x-stanza-cover-image-thumbnail'];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => name === 'entry' || name === 'link' || name === 'author' || name === 'Url',
});

/** Resolves `href` against `base`. RN's URL polyfill doesn't do relative
 * resolution, so this handles the cases OPDS servers actually emit. */
export function resolveUrl(base: string, href: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  const match = base.match(/^([a-z][a-z0-9+.-]*:)\/\/([^/?#]*)([^?#]*)/i);
  if (!match) return href;
  const [, scheme, host, path] = match;
  if (href.startsWith('//')) return `${scheme}${href}`;
  if (href.startsWith('/')) return `${scheme}//${host}${href}`;
  if (href.startsWith('?')) return `${scheme}//${host}${path}${href}`;
  const dir = path.slice(0, path.lastIndexOf('/') + 1) || '/';
  const parts = `${dir}${href}`.split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (part === '..') out.pop();
    else if (part !== '.') out.push(part);
  }
  return `${scheme}//${host}${out.join('/')}`;
}

/** Normalises what a user types ("demo.komga.org", no scheme) into a URL. */
export function normaliseServerUrl(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, '');
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function base64(text: string): string {
  const bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return btoa(bytes);
}

export function authHeaders(creds?: OpdsCredentials): Record<string, string> {
  if (!creds?.username) return {};
  return { Authorization: `Basic ${base64(`${creds.username}:${creds.password ?? ''}`)}` };
}

function text(node: unknown): string | undefined {
  if (node == null) return undefined;
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) return text((node as Record<string, unknown>)['#text']);
  return undefined;
}

function stripHtml(html?: string): string | undefined {
  if (!html) return undefined;
  const plain = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return plain || undefined;
}

type RawLink = Record<string, string>;

function parseEntry(raw: Record<string, unknown>, feedUrl: string, index: number): OpdsEntry {
  const links = ((raw.link as RawLink[] | undefined) ?? []).filter((l) => l['@_href']);
  const abs = (l: RawLink) => resolveUrl(feedUrl, l['@_href']);
  const rel = (l: RawLink) => l['@_rel'] ?? '';
  const type = (l: RawLink) => l['@_type'] ?? '';

  const acquisitions = links.filter((l) => rel(l).startsWith(ACQUISITION_REL)).map((l) => ({ url: abs(l), type: type(l) }));
  const streamLink = links.find((l) => rel(l) === STREAM_REL);
  const count = streamLink ? Number(streamLink['@_pse:count'] ?? streamLink['@_count'] ?? 0) : 0;
  const navLink =
    links.find((l) => type(l).includes('opds-catalog') && !rel(l).startsWith(ACQUISITION_REL)) ??
    (acquisitions.length === 0 && !streamLink ? links.find((l) => rel(l) === 'subsection' || rel(l) === 'alternate') : undefined);

  const id = text(raw.id) ?? `${feedUrl}#${index}`;
  const author = (raw.author as Record<string, unknown>[] | undefined)?.map((a) => text(a.name)).filter(Boolean).join(', ');

  return {
    key: id,
    id,
    title: text(raw.title) ?? 'Untitled',
    author: author || undefined,
    summary: stripHtml(text(raw.summary) ?? text(raw.content)),
    thumbnail: (() => {
      const l = links.find((x) => THUMB_RELS.includes(rel(x))) ?? links.find((x) => IMAGE_RELS.includes(rel(x)));
      return l ? abs(l) : undefined;
    })(),
    cover: (() => {
      const l = links.find((x) => IMAGE_RELS.includes(rel(x))) ?? links.find((x) => THUMB_RELS.includes(rel(x)));
      return l ? abs(l) : undefined;
    })(),
    navigationUrl: navLink ? abs(navLink) : undefined,
    acquisitions,
    stream: streamLink && count > 0 ? { template: abs(streamLink), count } : undefined,
  };
}

async function request(url: string, creds?: OpdsCredentials): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/atom+xml, application/xml, text/xml, */*', ...authHeaders(creds) } });
  } catch {
    throw new OpdsError('Couldn’t reach the server. Check the address and your connection.');
  }
  if (response.status === 401 || response.status === 403) throw new OpdsError('The server rejected the username or password.', response.status);
  if (!response.ok) throw new OpdsError(`The server answered with an error (${response.status}).`, response.status);
  return response.text();
}

export async function fetchFeed(url: string, creds?: OpdsCredentials): Promise<OpdsFeed> {
  const body = await request(url, creds);
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(body);
  } catch {
    throw new OpdsError('That address didn’t return an OPDS catalog.');
  }
  const feed = doc.feed as Record<string, unknown> | undefined;
  if (!feed) throw new OpdsError('That address didn’t return an OPDS catalog. For Komga try /opds/v1.2/catalog, for Kavita copy the OPDS URL from your user settings.');

  const links = ((feed.link as RawLink[] | undefined) ?? []).filter((l) => l['@_href']);
  const next = links.find((l) => l['@_rel'] === 'next');
  const search = links.find((l) => l['@_rel'] === 'search');
  const searchHref = search ? resolveUrl(url, search['@_href']) : undefined;
  const isTemplate = searchHref?.includes('{searchTerms}');

  return {
    url,
    title: text(feed.title) ?? 'Catalog',
    entries: ((feed.entry as Record<string, unknown>[] | undefined) ?? []).map((e, i) => parseEntry(e, url, i)),
    nextUrl: next ? resolveUrl(url, next['@_href']) : undefined,
    searchTemplate: isTemplate ? searchHref : undefined,
    searchDescriptionUrl: searchHref && !isTemplate ? searchHref : undefined,
  };
}

/** Turns a feed's search link into a URL for `query`. */
export async function buildSearchUrl(feed: OpdsFeed, query: string, creds?: OpdsCredentials): Promise<string> {
  let template = feed.searchTemplate;
  if (!template && feed.searchDescriptionUrl) {
    const doc = parser.parse(await request(feed.searchDescriptionUrl, creds));
    const urls = ((doc.OpenSearchDescription?.Url as RawLink[] | undefined) ?? []).filter((u) => u['@_template']);
    const best = urls.find((u) => (u['@_type'] ?? '').includes('atom')) ?? urls[0];
    if (best) template = resolveUrl(feed.searchDescriptionUrl, best['@_template']);
  }
  if (!template) throw new OpdsError('This catalog doesn’t support search.');
  return template
    .replace('{searchTerms}', encodeURIComponent(query))
    .replace(/\{[a-zA-Z:]+\?\}/g, '')
    .replace(/\{startPage\??\}/g, '1');
}

/** Comic formats Zlash can import, by OPDS acquisition MIME type. */
export function importableFormat(acq: OpdsAcquisition): 'cbz' | 'cbr' | 'pdf' | null {
  const t = acq.type.toLowerCase();
  if (t.includes('pdf')) return 'pdf';
  if (t.includes('rar') || t.includes('cbr')) return 'cbr';
  if (t.includes('zip') || t.includes('cbz') || t.includes('comicbook')) return 'cbz';
  const ext = acq.url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'cbz' || ext === 'zip') return 'cbz';
  if (ext === 'cbr' || ext === 'rar') return 'cbr';
  if (ext === 'pdf') return 'pdf';
  return null;
}

export function streamPageUrl(stream: OpdsStream, index: number, maxWidth: number): string {
  return stream.template.replace('{pageNumber}', String(index)).replace('{maxWidth}', String(maxWidth));
}
