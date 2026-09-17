---
name: media-react-wiring
description: Wire media-react into a React screen when configuring a Pexels client, fetching feeds, or recording media activity. Do not use for visual component decisions.
---

# Wire media data

Wrap the part of the tree that needs media with `MediaProvider` from `media-react`. Pass an API key from the app's runtime configuration; do not copy the key into UI components or helper modules.

Use `useMediaFeed(kind, query, page)` for a page-numbered feed. Render its `loading` and `error` states and use `data?.items` as the view-model: keep the page in the app's own state and advance it only while `data?.nextPage` is defined. A changed query or kind is a new feed starting at page 1 — do not merge pages into one list inside a component, and do not reach past this hook for fetching.

Use `useMediaInfiniteFeed(kind, query)` when the screen appends pages (infinite scroll or a load-more button). It owns the page counter and appends de-duplicated pages into `items`, which already reset to page 1 when kind or query changes, so never clear or merge `items` yourself. Pass its `hasMore` and `loadMore` straight to the grid prop-getters, and gate `hasMore` on an idle feed (`feed.hasMore && !feed.loading`) so one page is never requested twice. Use one feed hook per screen, not both.

Use `useMediaClient()` only for explicit activity (`client.track("view", item)` on opening, `client.track("download", item)` on a user download action). Subscribe with `useMediaEvents` for independent analytics. Never import `media-core` into a screen that already uses this wrapper.

Example:

```tsx
<MediaProvider options={{ apiKey: import.meta.env.VITE_PEXELS_API_KEY }}>
  <Gallery />
</MediaProvider>
```

```tsx
const feed = useMediaInfiniteFeed(kind, query);
const grid = useMediaGrid({ onLoadMore: feed.loadMore, hasMore: feed.hasMore && !feed.loading });
```

Keep network and cache behaviour in the SDK. The screen owns only the search text, kind, and the selected item.
