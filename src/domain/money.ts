/**
 * Money is stored and computed as integer minor units (e.g. cents) with an
 * ISO 4217 currency code. Never use floating point for amounts. Formatting is
 * locale-aware and explicit about the currency.
 */
export const CURRENCY_DECIMALS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  JPY: 0,
};

export function decimalsFor(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
}

export function toMinor(units: number, currency = "USD"): number {
  return Math.round(units * 10 ** decimalsFor(currency));
}

export function fromMinor(minor: number, currency = "USD"): number {
  return minor / 10 ** decimalsFor(currency);
}

export function formatMoney(minor: number, currency: string, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: decimalsFor(currency),
    maximumFractionDigits: decimalsFor(currency),
  }).format(fromMinor(minor, currency));
}

export function sumMinor(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}