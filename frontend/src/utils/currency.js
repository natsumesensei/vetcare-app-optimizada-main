// Configuración unificada de monedas y utilidades de formato para VetCare

export const CURRENCIES = [
  { code: "DOP", symbol: "RD$", label: "DOP (RD$) - Peso Dominicano" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "USD", symbol: "$", label: "USD ($) - Dólar Estadounidense" },
  { code: "GBP", symbol: "£", label: "GBP (£) - Libra Esterlina" },
  { code: "MXN", symbol: "$", label: "MXN ($) - Peso Mexicano" },
  { code: "COP", symbol: "$", label: "COP ($) - Peso Colombiano" },
  { code: "ARS", symbol: "$", label: "ARS ($) - Peso Argentino" },
  { code: "CLP", symbol: "$", label: "CLP ($) - Peso Chileno" },
  { code: "PEN", symbol: "S/", label: "PEN (S/) - Sol Peruano" },
  { code: "BRL", symbol: "R$", label: "BRL (R$) - Real Brasileño" },
];

export const CURRENCY_SYMBOLS = {
  DOP: "RD$",
  EUR: "€",
  USD: "$",
  GBP: "£",
  MXN: "$",
  COP: "$",
  ARS: "$",
  CLP: "$",
  PEN: "S/",
  BRL: "R$",
};

export function getCurrencySymbol(code = "EUR") {
  if (!code) return "€";
  const clean = String(code).trim().toUpperCase();
  return CURRENCY_SYMBOLS[clean] || clean || "€";
}

export function formatMoney(amount, currencyCode = "EUR", locale = "es-ES") {
  const num = Number(amount || 0);
  const symbol = getCurrencySymbol(currencyCode);
  const formattedNum = num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currencyCode === "DOP" || currencyCode === "USD") {
    return `${symbol} ${formattedNum}`;
  }
  return `${formattedNum} ${symbol}`;
}
