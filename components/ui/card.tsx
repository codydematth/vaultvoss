import {View, type ViewProps} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type Variant =
  | 'default' // subtle bg + hairline border  — most common
  | 'elevated' // slightly lighter bg + border — modal sheets, stacked layers
  | 'outline' // transparent bg + visible border — secondary containers
  | 'ghost'; // fully transparent — for grouped content with no visual boundary

export type CardProps = ViewProps & {
  variant?: Variant;
  className?: string;
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

type CardTokens = {bg: string; borderColor: string; borderWidth: number};

const tokens: Record<Variant, CardTokens> = {
  default: {bg: '#0A0A0A', borderColor: '#1A1A1A', borderWidth: 1},
  elevated: {bg: '#141414', borderColor: '#242424', borderWidth: 1},
  outline: {bg: 'transparent', borderColor: '#2A2A2A', borderWidth: 1},
  ghost: {bg: 'transparent', borderColor: 'transparent', borderWidth: 0},
};

const RADIUS = 16;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * App-wide Card container.
 *
 * @example
 * <Card>
 *   <Text variant="label">Face ID</Text>
 * </Card>
 *
 * <Card variant="elevated" style={{padding: 20}}>
 *   <Text variant="body">Balance</Text>
 * </Card>
 */
export function Card({
  variant = 'default',
  style,
  className,
  ...rest
}: CardProps) {
  const t = tokens[variant];

  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: t.bg,
          borderColor: t.borderColor,
          borderWidth: t.borderWidth,
          borderRadius: RADIUS,
          padding: 16,
        },
        style,
      ]}
      {...rest}
    />
  );
}
