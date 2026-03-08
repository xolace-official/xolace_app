import { useResolveClassNames } from 'uniwind'
/**
 * Hook that provides reusable large header screen options
 */
export function useLargeHeaderOptions() {
    const headerTintColorStyle = useResolveClassNames('bg-gray-50 dark:bg-gray-950')

  return {
    headerTintColor: headerTintColorStyle.backgroundColor,
    headerTransparent: true,
    headerLargeStyle: {
      backgroundColor: "transparent",
    },
    headerLargeTitle: true,
    headerShown: true,
  };
}