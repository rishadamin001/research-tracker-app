export function priceText(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'code' }).format(amount);
}
