import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import {storage} from '@/lib/storage';
import * as SecureStore from 'expo-secure-store';

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

export const SYMBOL_TO_CODE: Record<string, string> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '₦': 'NGN',
  'CA$': 'CAD',
  'A$': 'AUD',
};

const STATIC_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1500.0,
  CAD: 1.37,
  AUD: 1.51,
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  formatMoney: (value: number | undefined | null, customCurrency?: string) => string;
  getCurrencySymbol: () => string;
  convert: (amount: any, from: string | null | undefined, to: string | null | undefined) => number;
  rates: Record<string, number>;
  loadingRates: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({children}: {children: React.ReactNode}) {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>(STATIC_RATES);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      // 1. Load preference & cached rates
      const saved = await storage.getCurrencyPreference();
      setCurrencyState(saved);

      try {
        const cachedRaw = await SecureStore.getItemAsync('vv_cached_rates');
        if (cachedRaw) {
          setRates(JSON.parse(cachedRaw));
        }
      } catch (e) {
        console.warn('Failed to load cached rates', e);
      }

      // 2. Fetch live rates
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const json = await res.json();
        if (json && json.result === 'success' && json.rates) {
          // Filter to only store rates for currencies we support
          const newRates: Record<string, number> = { ...STATIC_RATES };
          for (const code of CURRENCIES) {
            if (json.rates[code]) {
              newRates[code] = json.rates[code];
            }
          }
          setRates(newRates);
          await SecureStore.setItemAsync('vv_cached_rates', JSON.stringify(newRates));
        }
      } catch (e) {
        console.warn('Failed to fetch live rates, using fallback', e);
      } finally {
        setLoadingRates(false);
      }
    })();
  }, []);

  const setCurrency = async (newVal: string) => {
    await storage.setCurrencyPreference(newVal);
    setCurrencyState(newVal);
  };

  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] ?? currency;
  };

  const convert = useCallback((amount: any, from: string | null | undefined, to: string | null | undefined): number => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || amount === null || amount === undefined) {
      return 0;
    }

    const cleanFrom = (from ? (SYMBOL_TO_CODE[from.trim()] ?? from.trim()) : 'USD').toUpperCase();
    const cleanTo = (to ? (SYMBOL_TO_CODE[to.trim()] ?? to.trim()) : 'USD').toUpperCase();

    const fromRate = rates[cleanFrom] ?? STATIC_RATES[cleanFrom] ?? 1.0;
    const toRate = rates[cleanTo] ?? STATIC_RATES[cleanTo] ?? 1.0;
    
    if (fromRate <= 0) return 0;
    
    // Convert from -> USD, then USD -> to
    const amountInUSD = numericAmount / fromRate;
    return amountInUSD * toRate;
  }, [rates]);

  const formatMoney = (value: number | undefined | null, customCurrency?: string) => {
    if (value === undefined || value === null) return '—';
    const activeCurrency = customCurrency ?? currency;
    const symbol = CURRENCY_SYMBOLS[activeCurrency] ?? activeCurrency;
    const formatted = Math.abs(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{currency, setCurrency, formatMoney, getCurrencySymbol, convert, rates, loadingRates}}>
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

export function formatAmountWithCommas(val: string): string {
  const cleanVal = val.replace(/[^0-9.]/g, '');
  const parts = cleanVal.split('.');
  if (parts.length > 2) {
    parts.splice(2);
  }
  const integerPart = parts[0];
  const formattedInteger = integerPart ? Number(integerPart).toLocaleString(undefined) : '';
  if (parts.length === 2) {
    return `${formattedInteger}.${parts[1].slice(0, 2)}`;
  }
  return formattedInteger;
}
