export type MediaKind = "photo" | "video";

export interface MediaItem {
  id: number;
  kind: MediaKind;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  photographerUrl?: string;
  thumbnail: string;
  source: string;
  pageUrl?: string;
  videoFiles?: Array<{ link: string; width: number; height: number; quality: string }>;
}

export interface Page<T> {
  items: T[];
  page: number;
  perPage: number;
  nextPage?: string;
  totalResults?: number;
}

export type MediaEvent = {
  type: "view" | "download";
  item: MediaItem;
  at: number;
};

export class MediaError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "MediaError";
  }
}

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  alt?: string;
  url: string;
  photographer: string;
  photographer_url?: string;
  src: { medium: string; large2x: string; original: string };
};

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  image: string;
  url: string;
  user: { name: string };
  video_files: Array<{ link: string; width: number; height: number; quality: string }>;
};

type PexelsPage<T> = {
  page: number;
  per_page: number;
  next_page?: string;
  total_results?: number;
  photos?: T[];
  videos?: T[];
};

export interface MediaClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  cacheTtlMs?: number;
}

// Pexels serves photos from /v1/* and now routes videos through /v1/videos/*;
// the older /videos/* prefix is documented as being on a deprecation path, so
// every endpoint lives here instead of being spelled out at each call site.
const photoPaths = {
  search: "/v1/search",
  curated: "/v1/curated",
  item: (id: number) => `/v1/photos/${id}`,
};

const videoPaths = {
  search: "/v1/videos/search",
  popular: "/v1/videos/popular",
  item: (id: number) => `/v1/videos/videos/${id}`,
};

export class MediaClient {
  private fetcher: typeof fetch;
  private baseUrl: string;
  private key: string;
  private ttl: number;
  private cache = new Map<string, { expires: number; value: Page<MediaItem> | MediaItem }>();
  private pending = new Map<string, Promise<Page<MediaItem> | MediaItem>>();
  private listeners = new Set<(event: MediaEvent) => void>();

  constructor(options: MediaClientOptions) {
    if (!options.apiKey) throw new MediaError("A Pexels API key is required.");

    this.key = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.pexels.com";
    // Browser implementations may reject a detached `window.fetch` call with
    // "Illegal invocation", so retain its global receiver. Custom fetchers are
    // already supplied as callable adapters and are used unchanged.
    this.fetcher = options.fetch ?? fetch.bind(globalThis);
    this.ttl = options.cacheTtlMs ?? 60_000;

    this.subscribe((event) => console.info(`[media-core] ${event.type}`, event.item.id));
  }

  subscribe(listener: (event: MediaEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  track(type: MediaEvent["type"], item: MediaItem) {
    const event = { type, item, at: Date.now() } as MediaEvent;
    this.listeners.forEach((listener) => listener(event));
  }

  search(query: string, opts: { page?: number; perPage?: number; kind?: MediaKind } = {}) {
    const kind = opts.kind ?? "photo";
    const path = kind === "photo" ? photoPaths.search : videoPaths.search;
    return this.list(path, { query, page: opts.page, per_page: opts.perPage }, kind);
  }

  curated(opts: { page?: number; perPage?: number; kind?: MediaKind } = {}) {
    const kind = opts.kind ?? "photo";
    const path = kind === "photo" ? photoPaths.curated : videoPaths.popular;
    return this.list(path, { page: opts.page, per_page: opts.perPage }, kind);
  }

  async get(id: number, kind: MediaKind = "photo"): Promise<MediaItem> {
    const path = kind === "photo" ? photoPaths.item(id) : videoPaths.item(id);
    return this.request(path, {}, kind, true) as Promise<MediaItem>;
  }

  private list(path: string, query: Record<string, string | number | undefined>, kind: MediaKind) {
    return this.request(path, query, kind, false) as Promise<Page<MediaItem>>;
  }

  private request(
    path: string,
    query: Record<string, string | number | undefined>,
    kind: MediaKind,
    single: boolean,
  ) {
    const url = new URL(this.baseUrl + path);
    Object.entries(query).forEach(([key, value]) => value != null && url.searchParams.set(key, String(value)));

    const cacheKey = url.toString();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value);

    const ongoing = this.pending.get(cacheKey);
    if (ongoing) return ongoing;

    const work = this.fetcher(cacheKey, { headers: { Authorization: this.key } })
      .then(async (response) => {
        if (!response.ok) throw new MediaError(`Pexels request failed (${response.status})`, response.status);

        const data = await response.json();
        const value = single ? this.toItem(data, kind) : this.toPage(data, kind);
        this.cache.set(cacheKey, { value, expires: Date.now() + this.ttl });
        return value;
      })
      .finally(() => this.pending.delete(cacheKey));

    this.pending.set(cacheKey, work);
    return work;
  }

  private toPage(data: PexelsPage<PexelsPhoto | PexelsVideo>, kind: MediaKind): Page<MediaItem> {
    const records = (kind === "photo" ? data.photos : data.videos) ?? [];
    return {
      items: records.map((record) => this.toItem(record, kind)),
      page: data.page,
      perPage: data.per_page,
      nextPage: data.next_page,
      totalResults: data.total_results,
    };
  }

  private toItem(record: PexelsPhoto | PexelsVideo, kind: MediaKind): MediaItem {
    if (kind === "photo") {
      const photo = record as PexelsPhoto;
      return {
        id: photo.id,
        kind,
        width: photo.width,
        height: photo.height,
        alt: photo.alt ?? "Pexels photo",
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        thumbnail: photo.src.medium,
        source: photo.src.large2x,
        pageUrl: photo.url,
      };
    }

    const video = record as PexelsVideo;
    const best = video.video_files.find((file) => file.quality === "sd") ?? video.video_files[0];
    return {
      id: video.id,
      kind,
      width: video.width,
      height: video.height,
      alt: "Pexels video",
      photographer: video.user.name,
      thumbnail: video.image,
      source: best?.link ?? "",
      pageUrl: video.url,
      videoFiles: video.video_files,
    };
  }
}
