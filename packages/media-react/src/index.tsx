import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { MediaClient, type MediaClientOptions, type MediaEvent, type MediaItem, type MediaKind, type Page } from "media-core";

export type { MediaClientOptions, MediaEvent, MediaItem, MediaKind, Page } from "media-core";

const Context = createContext<MediaClient | null>(null);

export function MediaProvider({ options, children }: { options: MediaClientOptions; children: ReactNode }) {
  const [client] = useState(() => new MediaClient(options));
  return <Context.Provider value={client}>{children}</Context.Provider>;
}

export function useMediaClient() {
  const client = useContext(Context);
  if (!client) throw new Error("useMediaClient must be used inside MediaProvider");
  return client;
}

export function useMediaEvents(listener: (event: MediaEvent) => void) {
  const client = useMediaClient();
  useEffect(() => client.subscribe(listener), [client, listener]);
}

export function useMediaFeed(kind: MediaKind, query = "", page = 1) {
  const client = useMediaClient();
  const [state, setState] = useState<{ data?: Page<MediaItem>; loading: boolean; error?: Error }>({ loading: true });

  useEffect(() => {
    let active = true;
    setState({ loading: true });

    const request = query
      ? client.search(query, { kind, page, perPage: 15 })
      : client.curated({ kind, page, perPage: 15 });

    request
      .then((data) => active && setState({ data, loading: false }))
      .catch((error) => active && setState({ loading: false, error }));

    return () => {
      active = false;
    };
  }, [client, kind, page, query]);

  return state;
}

export interface MediaInfiniteFeed {
  items: MediaItem[];
  loading: boolean;
  error?: Error;
  hasMore: boolean;
  loadMore: () => void;
}

interface FeedState {
  key: string;
  requested: number;
  items: MediaItem[];
  hasMore: boolean;
  loading: boolean;
  error?: Error;
}

function startFeed(key: string): FeedState {
  return { key, requested: 1, items: [], hasMore: true, loading: true };
}

export function useMediaInfiniteFeed(kind: MediaKind, query = "", perPage = 15): MediaInfiniteFeed {
  const client = useMediaClient();
  // Accumulated pages belong to one kind + query. A different key is a new feed
  // that starts at page 1 again, and because the page is derived from the key we
  // can also drop a response that arrives late from the previous feed.
  const feedKey = `${kind}:${query}`;
  const [feed, setFeed] = useState<FeedState>(() => startFeed(feedKey));

  const current = feed.key === feedKey ? feed : startFeed(feedKey);

  useEffect(() => {
    let active = true;
    const requested = current.requested;
    const request = query
      ? client.search(query, { kind, page: requested, perPage })
      : client.curated({ kind, page: requested, perPage });

    request
      .then((data) => {
        if (!active) return;
        setFeed((previous) => {
          const base = previous.key === feedKey ? previous : startFeed(feedKey);
          const known = new Set(base.items.map((item) => item.id));
          return {
            key: feedKey,
            requested: base.requested,
            items: [...base.items, ...data.items.filter((item) => !known.has(item.id))],
            hasMore: Boolean(data.nextPage),
            loading: false,
          };
        });
      })
      .catch((error) => {
        if (!active) return;
        setFeed((previous) => (previous.key === feedKey ? { ...previous, loading: false, error } : previous));
      });

    return () => {
      active = false;
    };
  }, [client, kind, query, perPage, feedKey, current.requested]);

  const loadMore = useCallback(() => {
    setFeed((previous) =>
      previous.key === feedKey ? { ...previous, requested: previous.requested + 1, loading: true, error: undefined } : previous,
    );
  }, [feedKey]);

  return {
    items: current.items,
    loading: current.loading,
    error: current.error,
    hasMore: current.hasMore,
    loadMore,
  };
}
