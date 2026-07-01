// ─── VaultVoss Color Palette ──────────────────────────────────────────────────
// Pure dark-mode design inspired by the Grey finance app aesthetic.

export const C = {
  // Backgrounds
  bg: '#FFFFFF',
  bgCard: '#F9FAFB',
  bgCardAlt: '#F3F4F6',
  bgInput: '#F9FAFB',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#111111',
  borderError: '#EF4444',

  // Accent (pure black/dark gray for slickness)
  accent: '#000000',
  accentDim: 'rgba(0,0,0,0.05)',
  accentPress: '#222222',

  // Brand Blue (used only for active tab and settings icons)
  brandBlue: '#0088FF',
  brandBlueDim: 'rgba(0,136,255,0.08)',

  // Text
  textPrimary: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Semantic
  income: '#10B981',
  incomeDim: 'rgba(16,185,129,0.08)',
  expense: '#EF4444',
  expenseDim: 'rgba(239,68,68,0.08)',
  warning: '#F59E0B',
  warningDim: 'rgba(245,158,11,0.08)',

  // Category colours (for icons / donut)
  catFood: '#F97316',
  catTransport: '#0EA5E9',
  catShopping: '#EC4899',
  catEntertainment: '#A855F7',
  catBills: '#EAB308',
  catHealth: '#06B6D4',
  catOther: '#64748B',
  catSalary: '#10B981',
  catFreelance: '#84CC16',
  catGift: '#F472B6',
  catInvestment: '#06B6D4',
  catMiscellaneous: '#94A3B8',
  catBetting: '#F43F5E',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.4)',
} as const;

// Category → colour mapping
export const EXPENSE_CATEGORY_COLOR: Record<string, string> = {
  Food: C.catFood,
  Transport: C.catTransport,
  Shopping: C.catShopping,
  Entertainment: C.catEntertainment,
  Bills: C.catBills,
  Health: C.catHealth,
  Gift: C.catGift,
  Miscellaneous: C.catMiscellaneous,
  Betting: C.catBetting,
  Other: C.catOther,
};

export const INCOME_CATEGORY_COLOR: Record<string, string> = {
  Salary: C.catSalary,
  Freelance: C.catFreelance,
  Gift: C.catGift,
  Investment: C.catInvestment,
  Other: C.catOther,
};

export function getCategoryColor(
  category: string | null | undefined,
  type: 'income' | 'expense',
): string {
  if (!category) return type === 'income' ? C.income : C.expense;
  const map = type === 'income' ? INCOME_CATEGORY_COLOR : EXPENSE_CATEGORY_COLOR;
  return map[category] ?? C.catOther;
}
