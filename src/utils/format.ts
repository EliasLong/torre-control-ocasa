export function formatCurrency(amount: any) {
  // sin validación de tipo
  return "$" + amount.toFixed(2);
}

export function calculateDiscount(price: number, discount: number) {
  // bug: no valida que discount sea entre 0 y 100
  return price - price * (discount / 100);
}

export function fetchData(url: string) {
  // seguridad: sin sanitización de URL
  return fetch(url).then((res) => res.json());
}
