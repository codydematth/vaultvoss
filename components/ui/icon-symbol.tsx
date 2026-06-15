import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { type StyleProp, type ViewStyle } from 'react-native';

// Mapping from SF Symbol names used in the app to Feather icon names.
const MAPPING: Record<string, keyof typeof Feather.glyphMap> = {
  // Navigation / Tabs
  'house.fill': 'home',
  'chart.bar.xaxis': 'trending-up',
  'lock.shield.fill': 'shield',
  'faceid': 'user',
  'bell': 'bell',
  'rectangle.portrait.and.arrow.right': 'log-out',
  'plus.circle.fill': 'plus-circle',
  'chart.pie.fill': 'pie-chart',
  'arrow.clockwise': 'repeat',
  'chart.bar.fill': 'bar-chart-2',
  'xmark.circle.fill': 'x-circle',
  'magnifyingglass': 'search',
  'person.fill': 'user',
  'waveform.path.ecg': 'activity',
  'info.circle': 'info',
  'eye': 'eye',
  'eye.slash': 'eye-off',
  'calendar': 'calendar',
  'checkmark.circle.fill': 'check-circle',
  'circle': 'circle',
  'checkmark': 'check',
  'plus': 'plus',
  'trash': 'trash-2',
  'trash.fill': 'trash-2',
  'arrow.up.right': 'arrow-up-right',
  'arrow.down.left': 'arrow-down-left',
  'chevron.right': 'chevron-right',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'list.bullet': 'list',
  'gearshape.fill': 'settings',
  'envelope': 'mail',
  'lock': 'lock',
  'person': 'user',
  'lock.shield': 'shield',
  'gift': 'gift',
  'chevron.left': 'chevron-left',
  'lock.rotation': 'lock',
  'key.fill': 'key',
  'lock.open.fill': 'unlock',
  'text.alignleft': 'edit-3',
  'dollarsign': 'dollar-sign',
  'note.text': 'edit-2',
  'moon': 'moon',
  'credit-card': 'credit-card',
  'repeat': 'repeat',
  'activity': 'activity',
  'list': 'list',
  'trending-up': 'trending-up',
  'slider.horizontal.3': 'sliders',
  'filter': 'filter',
};

export type IconSymbolName = keyof typeof MAPPING;

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
  const featherName = MAPPING[name] || 'help-circle';
  return <Feather color={color} size={size} name={featherName} style={style as any} />;
}
