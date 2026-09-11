export const formatRupiah = (amount: number) =>
  `Rp ${amount.toLocaleString('id-ID')}`;

export const parseRupiah = (value: string) =>
  Number(value.replace(/\D/g, '')) || 0;

export const formatRupiahInput = (value: string) => {
  const amount = parseRupiah(value);
  return amount ? formatRupiah(amount) : '';
};

export const getTodayDate = () =>
  new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
