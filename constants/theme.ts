// ─── VaultVoss Theme ──────────────────────────────────────────────────────────
// Rosario (Google Font) + dark-mode colour tokens.

export const Colors = {
  dark: {
    text: '#111111',
    background: '#FFFFFF',
    tint: '#0088FF',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#0088FF',
  },
};

// ─── Font families ────────────────────────────────────────────────────────────
// Lato is loaded in _layout.tsx via expo-font.
// We reference the exact PostScript names that expo-font registers.
export const Fonts = {
  sans: 'Lato_400Regular',
  sansMedium: 'Lato_400Regular',
  sansSemiBold: 'Lato_700Bold',
  sansBold: 'Lato_900Black',
  mono: 'monospace',
} as const;
