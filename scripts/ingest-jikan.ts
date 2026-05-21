/**
 * One-shot ingest from Jikan API v4 (unofficial MyAnimeList mirror).
 * Fetches the top-N anime by popularity, normalizes, upserts into our `anime` table.
 *
 * Run: bun run scripts/ingest-jikan.ts [count]
 *   Default count = 100 (4 pages × 25).
 *
 * Idempotent on mal_id. Safe to re-run — overwrites with latest data.
 * Rate limit: Jikan enforces ~3 req/sec; we sleep 400ms between pages
 * to stay well under and keep this script polite.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { anime } from "../src/db/schema/anime";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var required");
  process.exit(1);
}

const JIKAN_BASE = "https://api.jikan.moe/v4";
const PAGE_SIZE = 25; // Jikan max per page
const DEFAULT_COUNT = 100;

interface JikanAnime {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  type: string | null;
  episodes: number | null;
  aired: { from: string | null; to: string | null };
  season: string | null;
  year: number | null;
  status: string | null;
  studios: Array<{ name: string }>;
  genres: Array<{ name: string }>;
  themes: Array<{ name: string }>;
  score: number | null;
  scored_by: number | null;
  members: number | null;
  popularity: number | null;
  images: { jpg: { large_image_url: string | null } };
  synopsis: string | null;
}

interface JikanResponse {
  data: JikanAnime[];
  pagination: { has_next_page: boolean; current_page: number };
}

const ANIME_TYPES = ["TV", "Movie", "OVA", "ONA", "Special", "Music"] as const;
const ANIME_STATUSES = [
  "Finished Airing",
  "Currently Airing",
  "Not yet aired",
] as const;

function normalizeType(t: string | null): (typeof ANIME_TYPES)[number] | null {
  if (!t) return null;
  return (ANIME_TYPES as readonly string[]).includes(t)
    ? (t as (typeof ANIME_TYPES)[number])
    : null;
}

function normalizeStatus(s: string | null): (typeof ANIME_STATUSES)[number] | null {
  if (!s) return null;
  return (ANIME_STATUSES as readonly string[]).includes(s)
    ? (s as (typeof ANIME_STATUSES)[number])
    : null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(page: number): Promise<JikanResponse> {
  const url = `${JIKAN_BASE}/top/anime?filter=bypopularity&limit=${PAGE_SIZE}&page=${page}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "otaku-intelligence/0.1 (portfolio demo)" },
  });
  if (!res.ok) {
    throw new Error(`Jikan ${res.status} on page ${page}: ${await res.text()}`);
  }
  return res.json() as Promise<JikanResponse>;
}

async function main() {
  const count = Number.parseInt(process.argv[2] ?? String(DEFAULT_COUNT), 10);
  const pages = Math.ceil(count / PAGE_SIZE);

  const client = postgres(DATABASE_URL!, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log(`→ Ingesting top-${count} anime from Jikan (${pages} pages, 400ms between)`);

  let totalUpserted = 0;
  for (let page = 1; page <= pages; page++) {
    const resp = await fetchPage(page);
    const rows = resp.data.slice(0, count - totalUpserted).map((a) => ({
      malId: a.mal_id,
      title: a.title,
      titleJp: a.title_japanese,
      type: normalizeType(a.type),
      episodes: a.episodes,
      airedFrom: a.aired.from,
      airedTo: a.aired.to,
      season: a.season,
      year: a.year,
      status: normalizeStatus(a.status),
      studios: a.studios.map((s) => s.name),
      genres: a.genres.map((g) => g.name),
      themes: a.themes.map((t) => t.name),
      score: a.score !== null ? String(a.score) : null,
      scoredBy: a.scored_by,
      members: a.members,
      popularity: a.popularity,
      imageUrl: a.images.jpg.large_image_url,
      synopsis: a.synopsis,
    }));

    if (rows.length === 0) break;

    await db
      .insert(anime)
      .values(rows)
      .onConflictDoUpdate({
        target: anime.malId,
        set: {
          title: anime.title,
          titleJp: anime.titleJp,
          score: anime.score,
          members: anime.members,
          popularity: anime.popularity,
          ingestedAt: new Date(),
        },
      });

    totalUpserted += rows.length;
    console.log(
      `  page ${page}/${pages}: +${rows.length} (total ${totalUpserted}) · top title: "${rows[0]?.title ?? "?"}"`,
    );

    if (page < pages) await sleep(400);
  }

  console.log(`✓ Ingest complete. ${totalUpserted} anime upserted into otaku.anime.`);
  await client.end();
}

main().catch((err) => {
  console.error("✗ Ingest failed:", err);
  process.exit(1);
});
