import { StrictMode, useCallback, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { MediaProvider, useMediaClient, useMediaEvents, useMediaInfiniteFeed } from "media-react";
import type { MediaItem } from "media-react";
import { useLightbox, useMediaGrid, useReelSwiper } from "media-ui-react";
import "./styles.css";

const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
const pexelsUrl = "https://www.pexels.com";

type Kind = "photo" | "video";

function DocsLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="docs">
      <nav className="docs-nav" aria-label="Documentation">
        <a href="/">Demo</a>
        <a href="/docs/sdk">SDK docs</a>
        <a href="/docs/components">Component docs</a>
      </nav>
      <h1>{title}</h1>
      {children}
    </main>
  );
}

function SdkDocs() {
  return (
    <DocsLayout title="Headless Media SDK">
      <p>Framework-agnostic Pexels media access lives in <code>media-core</code>; <code>media-react</code> adapts it to React.</p>
      <h2>Install and configure</h2>
      <pre><code>{`import { MediaProvider } from "media-react";

<MediaProvider options={{ apiKey: import.meta.env.VITE_PEXELS_API_KEY }}>
  <App />
</MediaProvider>`}</code></pre>
      <p>Keep the API key in the consuming app’s runtime configuration. UI components should never receive or import it.</p>
      <h2>Fetch media</h2>
      <pre><code>{`const feed = useMediaInfiniteFeed("photo", query);
// feed: { items, loading, error, hasMore, loadMore }

const page = useMediaFeed("video", query, 1);
// page: { data, loading, error }`}</code></pre>
      <p><code>useMediaInfiniteFeed</code> owns pagination and de-duplicates appended items. Use <code>useMediaFeed</code> for page-numbered screens.</p>
      <h2>Track activity</h2>
      <pre><code>{`const client = useMediaClient();
client.track("view", item);
client.track("download", item);

useMediaEvents((event) => analytics.track(event.type, event));`}</code></pre>
      <p>The core client emits <code>view</code> and <code>download</code> events, logs them by default, and supports independent subscriptions.</p>
      <h2>Core client</h2>
      <p><code>MediaClient</code> supports search, curated/popular lists, single-item retrieval, typed responses, request de-duplication, and a 60-second in-memory cache by default.</p>
    </DocsLayout>
  );
}

function ComponentDocs() {
  return (
    <DocsLayout title="Headless Media Components">
      <p><code>media-ui-react</code> provides behavior only. The consuming app owns its data, markup, and CSS; it has no dependency on the SDK.</p>
      <h2>Grid</h2>
      <pre><code>{`const grid = useMediaGrid({ onLoadMore: feed.loadMore, hasMore: feed.hasMore && !feed.loading });

<section {...grid.getGridProps()}>{/* items */}</section>
<button {...grid.getItemProps(item, () => select(item))} />
{feed.hasMore && <div {...grid.getSentinelProps()} />}`}</code></pre>
      <p>The sentinel uses an intersection observer to invoke <code>onLoadMore</code>. Disable it while a request is in progress to avoid duplicate page requests.</p>
      <h2>Lightbox</h2>
      <pre><code>{`const lightbox = useLightbox({ open: Boolean(selected), onClose: close });
<div {...lightbox.getBackdropProps()}>
  <div {...lightbox.getDialogProps()}>{/* visible close button and media */}</div>
</div>`}</code></pre>
      <p>Prop getters provide dialog semantics, focus on open, Escape-to-close, and outside-click dismissal.</p>
      <h2>Reel swiper</h2>
      <pre><code>{`const reels = useReelSwiper({ onActiveChange: (index) => setActive(index) });
<section {...reels.getContainerProps()} className="reels">
  {items.map((item, index) => <article {...reels.getSlideProps(index)} />)}
</section>`}</code></pre>
      <p>Add consumer-owned vertical scrolling and CSS scroll snapping. The hook reports the slide that is at least 70% visible.</p>
      <h2>Accessibility contract</h2>
      <p>Spread every prop getter without replacing its handlers. Use semantic buttons for selectable media, meaningful alt text, and a visible close control inside each dialog.</p>
    </DocsLayout>
  );
}

// Pexels asks consumers to credit the photographer and link back to the source
// page, so attribution is rendered here rather than inside the UI library.
function Credit({ item }: { item: MediaItem }) {
  const pageUrl = item.pageUrl ?? pexelsUrl;

  return (
    <p className="credit">
      {item.kind === "video" ? "Video" : "Photo"} by{" "}
      <a href={item.photographerUrl ?? pageUrl} target="_blank" rel="noreferrer">
        {item.photographer}
      </a>{" "}
      on{" "}
      <a href={pageUrl} target="_blank" rel="noreferrer">
        Pexels
      </a>
    </p>
  );
}

function Gallery() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [kind, setKind] = useState<Kind>("photo");
  const [selected, setSelected] = useState<MediaItem>();

  const feed = useMediaInfiniteFeed(kind, submittedQuery);
  const client = useMediaClient();
  // A page that is already in flight must not be asked for twice, so the grid
  // only sees hasMore while the feed is idle.
  const grid = useMediaGrid({ onLoadMore: feed.loadMore, hasMore: feed.hasMore && !feed.loading });
  const lightbox = useLightbox({ open: Boolean(selected), onClose: () => setSelected(undefined) });
  const reels = useReelSwiper({ onActiveChange: (index) => console.log("active reel", index) });

  useMediaEvents(useCallback((event) => console.log("app analytics", event), []));

  function search(event: FormEvent) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function openItem(item: MediaItem) {
    client.track("view", item);
    setSelected(item);
  }

  const videos = kind === "video" ? feed.items : [];

  return (
    <main>
      <h1>Headless Media</h1>

      <form onSubmit={search}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Pexels" />
        <button>Search</button>
        <select value={kind} onChange={(event) => setKind(event.target.value as Kind)}>
          <option value="photo">Photos</option>
          <option value="video">Videos</option>
        </select>
      </form>

      {feed.error && <p role="alert">{feed.error.message}</p>}
      {feed.loading && feed.items.length === 0 && <p>Loading media…</p>}

      <section className="grid" {...grid.getGridProps()}>
        {feed.items.map((item) => (
          <button className="tile" key={item.id} {...grid.getItemProps(item, () => openItem(item))}>
            <img src={item.thumbnail} alt={item.alt} />
          </button>
        ))}
      </section>

      {/* The sentinel is the load-more trigger, so it only exists while a next page does. */}
      {feed.hasMore && <div {...grid.getSentinelProps()} />}
      {feed.loading && feed.items.length > 0 && <p className="status">Loading more…</p>}

      {videos.length > 0 && (
        <section className="reels" {...reels.getContainerProps()}>
          {videos.map((item, index) => (
            <div className="reel" key={item.id} {...reels.getSlideProps(index)}>
              <video controls poster={item.thumbnail} src={item.source} />
              <Credit item={item} />
            </div>
          ))}
        </section>
      )}

      {selected && (
        <div className="backdrop" {...lightbox.getBackdropProps()}>
          <div className="dialog" {...lightbox.getDialogProps()}>
            <button autoFocus onClick={() => setSelected(undefined)}>
              Close
            </button>
            {selected.kind === "video" ? (
              <video controls autoPlay src={selected.source} />
            ) : (
              <img src={selected.source} alt={selected.alt} />
            )}
            <Credit item={selected} />
            <button onClick={() => client.track("download", selected)}>Track download</button>
          </div>
        </div>
      )}

      <footer className="credit">
        <a href={pexelsUrl} target="_blank" rel="noreferrer">
          Photos provided by Pexels
        </a>
      </footer>
    </main>
  );
}

function App() {
  if (window.location.pathname === "/docs/sdk") return <SdkDocs />;
  if (window.location.pathname === "/docs/components") return <ComponentDocs />;

  if (!apiKey) {
    return (
      <main>
        <h1>Headless Media</h1>
        <p>
          Add <code>VITE_PEXELS_API_KEY</code> to <code>apps/media-demo/.env.local</code> and restart Vite.
        </p>
      </main>
    );
  }

  return (
    <MediaProvider options={{ apiKey }}>
      <Gallery />
    </MediaProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
