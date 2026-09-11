export type Transaction = {
  id: number;
  type: 'debt' | 'payment';
  amount: number;
  note: string;
  date: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  amount: number;
  due: string;
  initials: string;
  color: string;
  transactions: Transaction[];
};
