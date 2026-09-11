const DB_NAME = 'LinBookDB';
const DB_VERSION = 1;
const STORE_NAME = 'customers';

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

const INITIAL_NAMES: string[] = [
    "Wawan", "Kake Irja", "Abizar Cuplis", "Adit", "Husein", "Abinaya", "Rama Baru", "Cantika", "Nazril", "Tian", "Goku", "Nadia", "Mpeng", "Ezi", "V.Dwi", "Zio", "Dannish", "Eva", "Vio", "Laura", "Dinda", "Emira", "Nisa Libero", "Nanda", "Kelpin", "Azhar", "Eza Jambi", "Radea", "Rehan", "Syahdan", "Fatih", "Sabrina", "Rendra", "Dikda", "Key", "Abror", "Eko", "Mas Okta", "Dani Elang", "Savana", "Madun", "Zaki", "Putri", "Mba Okta", "Mba Amel", "Imel", "Dwi Baru", "Aska Gede", "Vika", "Acha", /* 50 */ "Wahyu", "Galih", "Ipeh", "Feri Lampung", "Yaya", "Ara", "Anggun", "Rendi", "Elsa", "Enyok", "Jihan", "Keyla", "Lidia Baru", "Aska Cilik", "Vemas", "Rafi Bakau", "Brian", "Sella", "Kevin", "Miky", "Aini", "Bonge", "Adam", "Nasya", "Inggil", "Plenger", "Aira", "Pk. Opik", "Ateng", "Heru", "Hobil", "Adil", "Yay", "Syahril", "Elang", "Fadil Cilik", "Hapis", "Bili", "Rifki", "Ciko", "Aldi", "Raguel", "Rian Baru", "Cipung", "Pajri", "Cinta Alviatu", "Faza", "Jonsen", "Haidar", "Salsabila", /* 100 */ "Amel Kecil", "Habib", "Aurora", "Jamil", "Tasya"
];

const createInitialData = (): Customer[] => {
  const colors = ['blue', 'green', 'coral', 'purple'];
  return INITIAL_NAMES.map((name, index) => {
    const trimmed = name.trim();
    const initials = trimmed
      .split(' ')
      .map(p => p[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return {
      id: Date.now() + index,
      name: trimmed,
      phone: '',
      amount: 0,
      due: '',
      initials,
      color: colors[index % colors.length],
      transactions: []
    };
  });
};

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.transaction.oncomplete = () => {
          const initialData = createInitialData();
          if (initialData.length > 0) {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            initialData.forEach(c => {
              tx.objectStore(STORE_NAME).add(c);
            });
          }
        };
      }
    };
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = () => reject(request.error);
  });
};

export const saveAllCustomers = async (customers: Customer[]): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  customers.forEach(c => store.put(c));
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
};

export const loadAllCustomers = async (): Promise<Customer[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const req = store.getAll();
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
    tx.oncomplete = () => db.close();
  });
};
