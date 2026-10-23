import fs from 'fs';
import path from 'path';
import { RESERVED_SLUGS, SLUG_PATTERN } from '../models/Invitation';
import { getPublishedSnapshot, type PublicSnapshot } from './publicInvitations';

/*
 * Taklifnoma sahifasini (/doniyor-hilola) tezlashtirish.
 *
 * Oddiy SPA'da mehmon telefoni ketma-ket kutadi: HTML → asosiy JS → API →
 * shablon kodi → rasm. Server uzoqda bo'lsa, har bir qadam yuzlab ms. Shuning
 * uchun nashr qilingan taklifnoma uchun index.html'ga oldindan qo'shamiz:
 *  - taklifnoma ma'lumoti (window.__INVITATION__) — API so'rovi kerak emas;
 *  - shablon JS/CSS'i (modulepreload) va birinchi ekran rasmi (preload) —
 *    asosiy JS bilan parallel yuklanadi;
 *  - sarlavha va Open Graph teglari — Telegram/Instagram'da chiroyli preview.
 *
 * Rasm manzillari frontend so'raydiganlar bilan harfma-harf bir xil bo'lishi
 * shart (aks holda ikki marta yuklanadi): lib/api.ts → mediaUrl, PHOTO_WIDTHS.
 */

/** frontend PHOTO_WIDTHS bilan bir xil */
const WIDTH = { card: 1000, hero: 1600 };
const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

interface ManifestChunk {
  file: string;
  css?: string[];
  imports?: string[];
  isEntry?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** <script> ichiga xavfsiz joylash: "</script>" va satr ajratgichlari qochiriladi. */
function inlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(new RegExp('\\u2028', 'g'), '\\u2028')
    .replace(new RegExp('\\u2029', 'g'), '\\u2029');
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return y && m && d ? `${d}-${UZ_MONTHS[m - 1]}, ${y}` : '';
}

export function createInvitationPageRenderer(webDist: string, basePath: string) {
  const indexHtml = fs.readFileSync(path.join(webDist, 'index.html'), 'utf8');
  let manifest: Record<string, ManifestChunk> = {};
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(webDist, '.vite', 'manifest.json'), 'utf8'));
  } catch {
    console.warn('Vite manifest topilmadi — shablon kodi oldindan yuklanmaydi');
  }

  const assetsByTemplate = new Map<string, { js: string[]; css: string[] }>();
  /** Shablon chunk'i va u import qiladigan umumiy chunk'lar (asosiy entry'siz). */
  function templateAssets(template: string) {
    const known = assetsByTemplate.get(template);
    if (known) return known;
    const entry = Object.keys(manifest).find(
      (key) => key.startsWith(`src/templates/${template}/`) && key.endsWith('Template.tsx')
    );
    const js = new Set<string>();
    const css = new Set<string>();
    const visit = (key: string) => {
      const chunk = manifest[key];
      if (!chunk || chunk.isEntry || js.has(chunk.file)) return;
      js.add(chunk.file);
      chunk.css?.forEach((file) => css.add(file));
      chunk.imports?.forEach(visit);
    };
    if (entry) visit(entry);
    const assets = { js: [...js], css: [...css] };
    assetsByTemplate.set(template, assets);
    return assets;
  }

  const asset = (file: string) => `${basePath}/${file}`;

  /** Frontend'dagi mediaUrl(path, width) bilan bir xil manzil. */
  function mediaUrl(file: string, width: number): string {
    if (!file) return '';
    if (/^https?:\/\//.test(file)) return file;
    if (file.startsWith('/uploads/') && /\.(jpe?g|png|webp)$/i.test(file)) return `${basePath}${file}?w=${width}`;
    return `${basePath}${file}`;
  }

  /** Birinchi ko'rinadigan katta rasm — shablonlardagi tanlov mantiqiga mos. */
  function heroImage(inv: PublicSnapshot): string {
    if (inv.template === 'osmon') {
      // templates/osmon/photos.ts → resolveOsmonPhotos
      const hero = inv.coverPhoto || inv.couplePhoto || inv.gallery[0] || '/templates/osmon/cover.jpg';
      return mediaUrl(hero, WIDTH.hero);
    }
    return mediaUrl(inv.couplePhoto, WIDTH.card);
  }

  function render(inv: PublicSnapshot, origin: string): string {
    const names = `${inv.groomName} va ${inv.brideName}`;
    const title = `${names} | To'y taklifnomasi`;
    const details = [inv.eventTitle, formatDate(inv.date), inv.time && `soat ${inv.time}`, inv.venueName]
      .filter(Boolean)
      .join(' · ');
    const description = `${inv.inviteText || "Sizni to'yimizga taklif etamiz"} — ${details}`;
    const hero = heroImage(inv);
    const { js, css } = templateAssets(inv.template);
    const url = `${origin}${basePath}/${inv.slug}`;

    const head = [
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeHtml(description)}" />`,
      `<meta property="og:title" content="${escapeHtml(names)}" />`,
      `<meta property="og:description" content="${escapeHtml(details || description)}" />`,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
      hero && `<meta property="og:image" content="${escapeHtml(origin + hero)}" />`,
      hero && `<meta name="twitter:card" content="summary_large_image" />`,
      // Osmon'da rasm birinchi ekranda; boshqalarda konvert ochilgach chiqadi
      hero && `<link rel="preload" as="image" href="${escapeHtml(hero)}"${inv.template === 'osmon' ? ' fetchpriority="high"' : ''} />`,
      ...css.map((file) => `<link rel="stylesheet" crossorigin href="${asset(file)}" />`),
      ...js.map((file) => `<link rel="modulepreload" crossorigin href="${asset(file)}" />`),
      `<script>window.__INVITATION__=${inlineJson(inv)}</script>`,
    ]
      .filter(Boolean)
      .join('\n    ');

    return indexHtml
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
      .replace(/<meta\s+property="og:(title|description)"[\s\S]*?\/>/g, '')
      .replace('</head>', `    ${head}\n  </head>`);
  }

  /**
   * /<slug> (va /<slug>/tilaklar) — nashr qilingan taklifnoma bo'lsa tayyor HTML,
   * aks holda null (oddiy index.html beriladi; qoralamani frontend o'zi so'raydi).
   */
  return async function renderInvitationPage(requestPath: string, origin: string): Promise<string | null> {
    const match = /^\/([a-z0-9-]+)(?:\/.*)?$/.exec(requestPath.toLowerCase());
    const slug = match?.[1];
    if (!slug || !SLUG_PATTERN.test(slug) || RESERVED_SLUGS.has(slug)) return null;
    const inv = await getPublishedSnapshot(slug);
    return inv ? render(inv, origin) : null;
  };
}
