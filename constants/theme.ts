// ─── VaultVoss Theme ──────────────────────────────────────────────────────────
// Rosario (Google Font) + dark-mode colour tokens.

export const Colors = {
  dark: {
    text: '#111111',
    background: '#FFFFFF',
    tint: '#000000',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#000000',
  },
};

// ─── Font families ────────────────────────────────────────────────────────────
// Rosario is loaded in _layout.tsx via expo-font.
// We reference the exact PostScript names that expo-font registers.
export const Fonts = {
  sans: 'Rosario_400Regular',
  sansMedium: 'Rosario_500Medium',
  sansSemiBold: 'Rosario_600SemiBold',
  sansBold: 'Rosario_700Bold',
  mono: 'monospace',
} as const;
