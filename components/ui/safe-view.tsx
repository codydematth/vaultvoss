import {View, type ViewProps} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// ─── Types ───────────────────────────────────────────────────────────────────

type Edge = 'top' | 'bottom' | 'left' | 'right';

export type SafeViewProps = ViewProps & {
  /**
   * Which edges to pad with safe-area insets.
   * Defaults to `['top', 'bottom']`.
   */
  edges?: Edge[];
  className?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Root screen wrapper that applies safe-area insets and the app background.
 *
 * @example
 * // Full screen — avoid notch + home bar
 * <SafeView>
 *   <Text>Hello</Text>
 * </SafeView>
 *
 * // Top edge only (e.g. screen with a bottom sheet)
 * <SafeView edges={['top']}>
 *   <Content />
 * </SafeView>
 */
export function SafeView({
  edges = ['top', 'bottom'],
  style,
  className,
  ...rest
}: SafeViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={className}
      style={[
        {
          flex: 1,
          backgroundColor: '#000000',
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: edges.includes('left') ? insets.left : 0,
          paddingRight: edges.includes('right') ? insets.right : 0,
        },
        style,
      ]}
      {...rest}
    />
  );
}
