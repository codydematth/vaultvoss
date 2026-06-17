import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Mask } from 'react-native-svg';

function ModernHomeIcon({
  color,
  size,
  focused,
  style,
}: {
  color: string;
  size: number;
  focused: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const pathData = "m9.02 2.84-5.39 4.2C2.73 7.74 2 9.23 2 10.36v7.41c0 2.32 1.89 4.22 4.21 4.22h11.58c2.32 0 4.21-1.9 4.21-4.21V10.5c0-1.21-.81-2.76-1.8-3.45l-6.18-4.33c-1.4-.98-3.65-.93-5 .12Z";

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {focused ? (
        <>
          <Mask id="houseMask">
            <Path
              d={pathData}
              fill="white"
            />
            <Path
              d="M12 17.99v-3"
              stroke="black"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Mask>
          <Path
            d={pathData}
            fill={color}
            mask="url(#houseMask)"
          />
          <Path
            d={pathData}
            stroke={color}
            strokeWidth={0.5}
          />
        </>
      ) : (
        <Path
          d="m9.02 2.84-5.39 4.2C2.73 7.74 2 9.23 2 10.36v7.41c0 2.32 1.89 4.22 4.21 4.22h11.58c2.32 0 4.21-1.9 4.21-4.21V10.5c0-1.21-.81-2.76-1.8-3.45l-6.18-4.33c-1.4-.98-3.65-.93-5 .12ZM12 17.99v-3"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

type IconConfig = 
  | { family: 'Feather'; name: keyof typeof Feather.glyphMap }
  | { family: 'Ionicons'; name: keyof typeof Ionicons.glyphMap };

// Mapping from SF Symbol names used in the app to Feather / Ionicons icon names.
const MAPPING: Record<string, IconConfig> = {
  // Navigation / Tabs
  'chart.bar.xaxis': { family: 'Feather', name: 'trending-up' },
  'lock.shield.fill': { family: 'Feather', name: 'shield' },
  'faceid': { family: 'Feather', name: 'user' },
  'bell': { family: 'Feather', name: 'bell' },
  'rectangle.portrait.and.arrow.right': { family: 'Feather', name: 'log-out' },
  'plus.circle.fill': { family: 'Feather', name: 'plus-circle' },
  'chart.pie.fill': { family: 'Feather', name: 'pie-chart' },
  'arrow.clockwise': { family: 'Feather', name: 'repeat' },
  'chart.bar.fill': { family: 'Feather', name: 'bar-chart-2' },
  'xmark.circle.fill': { family: 'Feather', name: 'x-circle' },
  'magnifyingglass': { family: 'Feather', name: 'search' },
  'person.fill': { family: 'Feather', name: 'user' },
  'waveform.path.ecg': { family: 'Feather', name: 'activity' },
  'info.circle': { family: 'Feather', name: 'info' },
  'eye': { family: 'Feather', name: 'eye' },
  'eye.slash': { family: 'Feather', name: 'eye-off' },
  'calendar': { family: 'Feather', name: 'calendar' },
  'checkmark.circle.fill': { family: 'Feather', name: 'check-circle' },
  'circle': { family: 'Feather', name: 'circle' },
  'checkmark': { family: 'Feather', name: 'check' },
  'plus': { family: 'Feather', name: 'plus' },
  'trash': { family: 'Feather', name: 'trash-2' },
  'trash.fill': { family: 'Feather', name: 'trash-2' },
  'arrow.up.right': { family: 'Feather', name: 'arrow-up-right' },
  'arrow.down.left': { family: 'Feather', name: 'arrow-down-left' },
  'chevron.right': { family: 'Feather', name: 'chevron-right' },
  'paperplane.fill': { family: 'Feather', name: 'send' },
  'chevron.left.forwardslash.chevron.right': { family: 'Feather', name: 'code' },
  'list.bullet': { family: 'Feather', name: 'list' },
  'gearshape.fill': { family: 'Feather', name: 'settings' },
  'envelope': { family: 'Feather', name: 'mail' },
  'lock': { family: 'Feather', name: 'lock' },
  'person': { family: 'Feather', name: 'user' },
  'lock.shield': { family: 'Feather', name: 'shield' },
  'gift': { family: 'Feather', name: 'gift' },
  'chevron.left': { family: 'Feather', name: 'chevron-left' },
  'lock.rotation': { family: 'Feather', name: 'lock' },
  'key.fill': { family: 'Feather', name: 'key' },
  'lock.open.fill': { family: 'Feather', name: 'unlock' },
  'text.alignleft': { family: 'Feather', name: 'edit-3' },
  'dollarsign': { family: 'Feather', name: 'dollar-sign' },
  'note.text': { family: 'Feather', name: 'edit-2' },
  'moon': { family: 'Feather', name: 'moon' },
  'credit-card': { family: 'Feather', name: 'credit-card' },
  'repeat': { family: 'Feather', name: 'repeat' },
  'activity': { family: 'Feather', name: 'activity' },
  'list': { family: 'Feather', name: 'list' },
  'trending-up': { family: 'Feather', name: 'trending-up' },
  'slider.horizontal.3': { family: 'Feather', name: 'sliders' },
  'filter': { family: 'Feather', name: 'filter' },
};

export type IconSymbolName = keyof typeof MAPPING | 'house' | 'house.fill';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: any;
}) {
  if (name === 'house') {
    return <ModernHomeIcon color={color} size={size} focused={false} style={style} />;
  }
  if (name === 'house.fill') {
    return <ModernHomeIcon color={color} size={size} focused={true} style={style} />;
  }

  const config = MAPPING[name];
  if (!config) {
    return <Feather color={color} size={size} name="help-circle" style={style as any} />;
  }

  if (config.family === 'Ionicons') {
    return <Ionicons color={color} size={size} name={config.name} style={style as any} />;
  }

  return <Feather color={color} size={size} name={config.name} style={style as any} />;
}
