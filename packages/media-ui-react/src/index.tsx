// Headless grid, lightbox and reel-swiper hooks for React. No styles, no SDK.
import { useEffect, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type RefAttributes } from "react";

export interface GridItem {
  id: number | string;
  thumbnail: string;
  alt?: string;
}

export function useMediaGrid({ onLoadMore, hasMore }: { onLoadMore?: () => void; hasMore?: boolean }) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(), {
      rootMargin: "300px",
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  return {
    getGridProps: (): HTMLAttributes<HTMLDivElement> => ({ role: "grid" }),
    getItemProps: (item: GridItem, onSelect: () => void): ButtonHTMLAttributes<HTMLButtonElement> => ({
      role: "gridcell",
      type: "button",
      "aria-label": item.alt ?? "Open media",
      onClick: onSelect,
    }),
    getSentinelProps: (): HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> => ({
      ref: sentinelRef,
      "aria-hidden": true,
    }),
  };
}

export function useLightbox({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  const getDialogProps = (): HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> => ({
    ref: dialogRef,
    role: "dialog",
    "aria-modal": true,
    tabIndex: -1,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") onClose();
    },
  });

  const getBackdropProps = (): HTMLAttributes<HTMLDivElement> => ({
    role: "presentation",
    onMouseDown: (event) => {
      if (event.target === event.currentTarget) onClose();
    },
  });

  return { getDialogProps, getBackdropProps };
}

export function useReelSwiper({ onActiveChange }: { onActiveChange?: (index: number) => void } = {}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          onActiveChange?.(Number((entry.target as HTMLElement).dataset.index));
        }),
      { root: node, threshold: 0.7 },
    );

    node.querySelectorAll("[data-index]").forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [onActiveChange]);

  return {
    getContainerProps: (): HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> => ({
      ref: rootRef,
      role: "region",
      "aria-label": "Video reels",
    }),
    getSlideProps: (index: number): HTMLAttributes<HTMLDivElement> & { "data-index": number } => ({
      "data-index": index,
      role: "group",
      "aria-roledescription": "slide",
    }),
  };
}
