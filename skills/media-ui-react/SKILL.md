---
name: media-ui-react
description: Build accessible React media views with media-ui-react headless hooks and consumer-owned markup/CSS. Do not use for Pexels data fetching or authentication.
---

# Compose headless media UI

`media-ui-react` has no knowledge of the SDK. Give its hooks ordinary item data and callbacks from the consuming app; do not add Pexels-specific fields or imports to this package.

- Call `useMediaGrid({ onLoadMore, hasMore })`, spread `getGridProps()` on the collection, `getItemProps(item, onSelect)` on the interactive item, and `getSentinelProps()` on an empty element after the list. Render that sentinel only while another page exists and pass `hasMore` as an idle-feed flag (`hasMore && !loading`), otherwise an in-flight page can be requested twice. The consumer supplies all layout CSS.
- Call `useLightbox({ open, onClose })`, spread `getBackdropProps()` on the overlay and `getDialogProps()` on the dialog. Preserve the returned keyboard handler so Escape works. Put a visible close button inside the dialog.
- Call `useReelSwiper({ onActiveChange })`, spread `getContainerProps()` on the scrollable vertical container and `getSlideProps(index)` on each full-height slide. Add `scroll-snap` styling in the app.

Do not wrap the prop getters in custom keyboard or click handlers that replace the returned ones. Compose behavior instead. Use semantic buttons for selectable cards and meaningful alt text from the supplied item.

Example:

```tsx
const grid = useMediaGrid({ onLoadMore: loadMore, hasMore: hasMore && !loading });
<section {...grid.getGridProps()} className="my-grid">
  {items.map(item => <button {...grid.getItemProps(item, () => onSelect(item))} />)}
</section>
{hasMore && <div {...grid.getSentinelProps()} />}
```
