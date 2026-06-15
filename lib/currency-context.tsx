import React, {createContext, useContext, useState, useEffect} from 'react';
import {storage} from '@/lib/storage';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'] as const;
export type CurrencyCode = typeof CURRENCIES[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  CAD: 'CA$',
  AUD: 'A$',
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  formatMoney: (value: number | undefined | null) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({children}: {children: React.ReactNode}) {
  const [currency, setCurrencyState] = useState<string>('USD');

  useEffect(() => {
    (async () => {
      const saved = await storage.getCurrencyPreference();
      setCurrencyState(saved);
    })();
  }, []);

  const setCurrency = async (newVal: string) => {
    await storage.setCurrencyPreference(newVal);
    setCurrencyState(newVal);
  };

  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] ?? currency;
  };

  const formatMoney = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '—';
    const symbol = getCurrencySymbol();
    const formatted = Math.abs(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{currency, setCurrency, formatMoney, getCurrencySymbol}}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used inside a CurrencyProvider');
  }
  return ctx;
}
