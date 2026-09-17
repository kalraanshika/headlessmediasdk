// Pure hook contracts for React Native consumers. No SDK or Pexels knowledge.
export function useMediaGrid({ onLoadMore, hasMore }: { onLoadMore?: () => void; hasMore?: boolean }) {
  return {
    getListProps: () => ({ onEndReached: hasMore ? onLoadMore : undefined }),
    getItemProps: (onPress: () => void) => ({ accessibilityRole: "button" as const, onPress }),
  };
}

export function useLightbox({ onClose }: { onClose: () => void }) {
  return {
    getOverlayProps: () => ({ accessibilityViewIsModal: true }),
    getCloseProps: () => ({ accessibilityRole: "button" as const, onPress: onClose }),
  };
}

export function useReelSwiper({ onActiveChange }: { onActiveChange?: (index: number) => void } = {}) {
  return {
    getPagerProps: () => ({
      pagingEnabled: true,
      onMomentumScrollEnd: (event: {
        nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number } };
      }) => onActiveChange?.(Math.round(event.nativeEvent.contentOffset.y / event.nativeEvent.layoutMeasurement.height)),
    }),
  };
}
