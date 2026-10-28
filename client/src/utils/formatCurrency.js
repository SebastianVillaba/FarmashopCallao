const formatter = new Intl.NumberFormat('es-PY', {
  style: 'currency',
  currency: 'PYG',
  maximumFractionDigits: 0
});

export const formatCurrency = (value) => formatter.format(Number(value) || 0);
