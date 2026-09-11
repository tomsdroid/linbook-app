import {
  IonApp, IonAvatar, IonBadge, IonButton, IonButtons, IonCard, IonCardContent,
  IonChip, IonContent, IonFab, IonFabButton, IonFooter, IonHeader, IonIcon,
  IonInput, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonMenuToggle,
  IonModal, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToast, IonToggle, IonToolbar,
  setupIonicReact,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { addOutline, barChartOutline, checkmarkCircle, chevronForwardOutline, homeOutline, lockClosedOutline, menuOutline, moonOutline, peopleOutline, personCircleOutline, searchOutline, shieldCheckmarkOutline, sparklesOutline, sunnyOutline, walletOutline } from 'ionicons/icons';

import {
  type Customer,
  type Transaction,
  openDB,
  saveAllCustomers,
  loadAllCustomers,
} from './db';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.class.css';
import './theme/variables.css';
import './App.css';

setupIonicReact();
ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('catatanku-owner-session') === 'true');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('catatanku-dark-mode') === 'true');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDebt, setShowDebt] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNote, setDebtNote] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDebtAmount, setEditDebtAmount] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; danger?: boolean }>({ show: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const initDB = async () => {
      try { const data = await loadAllCustomers(); setCustomers(data); }
      catch { setFeedback('Gagal memuat data'); setCustomers([]); }
      finally { setIsLoading(false); }
    };
    initDB();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      saveAllCustomers(customers).catch(() => setFeedback('Gagal menyimpan data'));
    }, 300);
    return () => clearTimeout(timer);
  }, [customers, isLoading]);

  useEffect(() => {
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
  }, [isDark]);

  const totalDebt = useMemo(() => customers.reduce((sum, c) => sum + c.amount, 0), [customers]);
  const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
  const parseRupiah = (value: string) => Number(value.replace(/\D/g, '')) || 0;
  const formatRupiahInput = (value: string) => (parseRupiah(value) ? formatRupiah(parseRupiah(value)) : '');

  const showConfirm = (title: string, message: string, onConfirm: () => void, danger = false) => {
    setConfirmModal({ show: true, title, message, onConfirm, danger });
  };

  const openOwnerAction = (action: () => void) => {
    if (isAuthenticated) { action(); return; }
    setPendingAction(() => action);
    setPin(''); setShowPin(true);
  };

  const verifyPin = () => {
    if (pin === '1234') {
      localStorage.setItem('catatanku-owner-session', 'true');
      setIsAuthenticated(true); setShowPin(false);
      pendingAction?.(); setPendingAction(null);
    } else { setFeedback('PIN salah'); }
  };

  const toggleDarkMode = (enabled: boolean) => {
    setIsDark(enabled);
    localStorage.setItem('catatanku-dark-mode', String(enabled));
  };

  const lockOwner = () => {
    localStorage.removeItem('catatanku-owner-session');
    setIsAuthenticated(false);
    setFeedback('Akses berhasil dikunci');
  };

  const addCustomer = () => {
    const cleanName = newName.trim();
    const amount = parseRupiah(newAmount);
    if (!cleanName) { setFeedback('Nama wajib diisi'); return; }
    const initials = cleanName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['blue', 'green', 'coral', 'purple'];
    const newCustomer: Customer = {
      id: Date.now(), name: cleanName, phone: newPhone || 'Nomor belum diisi',
      amount, due: 'Belum ditentukan', initials,
      color: colors[Math.floor(Math.random() * colors.length)], transactions: []
    };
    if (amount > 0) {
      newCustomer.transactions.push({
        id: Date.now() + 1, type: 'debt', amount,
        note: newNote || 'Hutang pertama',
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      });
    }
    setCustomers(c => [...c, newCustomer]);
    setNewName(''); setNewPhone(''); setNewAmount(''); setNewNote('');
    setShowAdd(false);
    setFeedback(amount > 0 ? 'Pelanggan ditambahkan' : 'Ditambahkan (hutang 0)');
  };

  const selectedDetail = selectedCustomer ? customers.find(c => c.id === selectedCustomer.id) ?? selectedCustomer : null;
  const openDebtModal = () => { if (!selectedDetail) return; setDebtAmount(''); setDebtNote(''); setShowDebt(true); };

  const addDebt = () => {
    const amount = parseRupiah(debtAmount);
    if (!selectedDetail || !amount) { setFeedback('Masukkan nominal'); return; }
    setCustomers(c => c.map(cust => cust.id === selectedDetail.id ? {
      ...cust, amount: cust.amount + amount,
      transactions: [...cust.transactions, {
        id: Date.now(), type: 'debt', amount,
        note: debtNote.trim() || 'Penambahan hutang',
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      }]
    } : cust));
    setShowDebt(false);
    setFeedback(`Hutang ${formatRupiah(amount)} ditambahkan`);
  };

  const openPaymentModal = (id: number) => { setPaymentTarget(id); setPaymentAmount(''); setPaymentNote(''); setShowPayment(true); };
  const addPayment = () => {
    const amount = parseRupiah(paymentAmount);
    const target = customers.find(c => c.id === paymentTarget);
    if (!target || !amount) { setFeedback('Masukkan nominal'); return; }
    if (amount > target.amount) { setFeedback('Tidak boleh melebihi sisa hutang'); return; }
    setCustomers(c => c.map(cust => cust.id === target.id ? {
      ...cust, amount: cust.amount - amount,
      transactions: [...cust.transactions, {
        id: Date.now(), type: 'payment', amount,
        note: paymentNote.trim() || 'Pembayaran',
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      }]
    } : cust));
    setShowPayment(false);
    setFeedback(`Pembayaran ${formatRupiah(amount)} dicatat`);
  };

  const openEditModal = () => {
    if (!selectedDetail) return;
    setEditName(selectedDetail.name); setEditPhone(selectedDetail.phone);
    setEditDebtAmount(formatRupiah(selectedDetail.amount)); setShowEdit(true);
  };

  const saveEdit = () => {
    if (!selectedDetail || !editName.trim()) { setFeedback('Nama wajib diisi'); return; }
    const newAmount = parseRupiah(editDebtAmount);
    const initials = editName.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    setCustomers(c => c.map(cust => {
      if (cust.id !== selectedDetail.id) return cust;
      const diff = newAmount - cust.amount;
      return {
        ...cust, name: editName.trim(), phone: editPhone || 'Nomor belum diisi',
        initials, amount: newAmount,
        ...(diff !== 0 && { transactions: [...cust.transactions, {
          id: Date.now(), type: diff > 0 ? 'debt' : 'payment', amount: Math.abs(diff),
          note: 'Perubahan sisa hutang',
          date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        }] })
      };
    }));
    setSelectedCustomer(prev => prev ? { ...prev, name: editName.trim(), phone: editPhone || 'Nomor belum diisi', initials, amount: newAmount } : prev);
    setShowEdit(false);
    setFeedback('Data diperbarui');
  };

  const shareCustomer = async () => {
    if (!selectedDetail) return;
    const text = `${selectedDetail.name} hutang: ${formatRupiah(selectedDetail.amount)}`;
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
    setFeedback('Disalin ke papan klip');
  };

  const settleCustomer = (id: number) => {
    const target = customers.find(c => c.id === id);
    if (!target || target.amount <= 0) return;
    showConfirm('Pelunasan', `Lunasi ${target.name} sebesar ${formatRupiah(target.amount)}?`, () => {
      setCustomers(c => c.map(cust => cust.id === id ? {
        ...cust, amount: 0,
        transactions: [...cust.transactions, {
          id: Date.now(), type: 'payment', amount: target.amount,
          note: 'Pelunasan penuh',
          date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        }]
      } : cust));
      setFeedback('Berhasil dilunasi');
    });
  };

  const deleteCustomer = (id: number) => {
    const target = customers.find(c => c.id === id);
    if (!target) return;
    showConfirm('Hapus', `Hapus ${target.name}?`, () => {
      setCustomers(c => c.filter(cust => cust.id !== id));
      setSelectedCustomer(null); setShowEdit(false);
      setFeedback(`${target.name} dihapus`);
    }, true);
  };

  const HomeView = ({ customers, totalDebt, formatRupiah, onAdd, onCustomers, onSelectCustomer, onPay }: {
    customers: Customer[]; totalDebt: number; formatRupiah: (n: number) => string;
    onAdd: () => void; onCustomers: () => void; onSelectCustomer: (c: Customer) => void; onPay: (id: number) => void;
  }) => {
    const biggestDebt = customers.reduce((max, c) => c.amount > max.amount ? c : max, customers[0]);
    return (
      <>
        <div className="dashboard-hero">
          <div>
            <h2 style={{fontSize: "3rem"}}>Catatan Hutang</h2>
            <p style={{fontSize: "1.12rem"}}>Kelola piutang warung, pembayaran & laporan rapi.</p>
          </div>
          <div className="bill-art"><span>Rp</span><i>✓</i></div>
        </div>
        <div className="dashboard-metrics">
          <div><div className="metric-icon">Rp</div><span>Total Piutang</span><strong>{formatRupiah(totalDebt)}</strong></div>
          <div><div className="metric-icon people">●●</div><span>Pelanggan</span><strong>{customers.length}</strong></div>
        </div>
        {biggestDebt && biggestDebt.amount > 0 && (
          <div className="biggest-card">
            <IonAvatar className={`customer-avatar ${biggestDebt.color}`}><span>{biggestDebt.initials}</span></IonAvatar>
            <div><small>Hutang terbesar</small><strong>{biggestDebt.name}</strong><b>{formatRupiah(biggestDebt.amount)}</b></div>
            <button onClick={() => onSelectCustomer(biggestDebt)}>Lihat</button>
          </div>
        )}
        <div className="section-heading"><h3>Piutang Aktif</h3><button onClick={onCustomers}>Lihat semua</button></div>
        {customers.filter(c => c.amount > 0).length === 0 ? (
          <p className="ion-text-center ion-padding text-muted">Belum ada piutang aktif</p>
        ) : (
          <div className="customer-list">
            {customers.filter(c => c.amount > 0).slice(0, 3).map(c => (
              <CustomerRow key={c.id} customer={c} formatRupiah={formatRupiah} onPay={onPay} onSelect={() => onSelectCustomer(c)} showAmountLabel={false} showPaymentAction={false} />
            ))}
          </div>
        )}
        <IonFab slot="fixed" className="reference-fab-container">
          <IonFabButton className="reference-fab" onClick={onAdd}><IonIcon icon={addOutline} /><span>Pelanggan</span></IonFabButton>
        </IonFab>
      </>
    );
  };

  const CustomersView = ({ customers, formatRupiah, searchTerm, onSearch, onAdd, onSelect, onPay }: {
    customers: Customer[]; formatRupiah: (n: number) => string; searchTerm: string;
    onSearch: (s: string) => void; onAdd: () => void; onSelect: (c: Customer) => void; onPay: (id: number) => void;
  }) => (
    <div className="inner-page">
      <div className="page-heading compact"><div><p className="eyebrow">DATA PELANGGAN</p><h1>Pelanggan</h1></div></div>
      <div className="search-field"><IonIcon icon={searchOutline} /><IonInput value={searchTerm} onIonInput={(e) => onSearch(e.detail.value ?? '')} placeholder="Cari nama / nomor" /></div>
      <p className="list-count">{customers.length} pelanggan terdaftar</p>
      {customers.length === 0 ? (
        <p className="ion-text-center ion-padding text-muted">Belum ada pelanggan</p>
      ) : (
        <div className="customer-list full-list">
          {customers.map(c => <CustomerRow key={c.id} customer={c} formatRupiah={formatRupiah} onPay={onPay} onSelect={() => onSelect(c)} showAmountLabel={false} showPaymentAction={false} />)}
        </div>
      )}
      <IonFab slot="fixed" className="reference-fab-container">
        <IonFabButton className="reference-fab compact-fab" onClick={onAdd}><IonIcon icon={addOutline} /><span>Tambah</span></IonFabButton>
      </IonFab>
    </div>
  );

  const CustomerRow = ({ customer, formatRupiah, onPay, onSelect, showAmountLabel = true, showPaymentAction = true }: {
    customer: Customer; formatRupiah: (n: number) => string; onPay: (id: number) => void;
    onSelect?: () => void; showAmountLabel?: boolean; showPaymentAction?: boolean;
  }) => (
    <div className="customer-row" onClick={onSelect}>
      <IonAvatar className={`customer-avatar ${customer.color}`}><span>{customer.initials}</span></IonAvatar>
      <div className="customer-info"><strong>{customer.name}</strong><small>{customer.phone}</small></div>
      <div className="customer-amount">
        {showAmountLabel && <small>Total Hutang</small>}
        <strong>{formatRupiah(customer.amount)}</strong>
        {showPaymentAction && <button onClick={e => { e.stopPropagation(); onPay(customer.id); }}>Bayar</button>}
      </div>
      <IonIcon className="row-chevron" icon={chevronForwardOutline} />
    </div>
  );

  const CustomerDetail = ({ customer, formatRupiah, onBack, onAddDebt, onPay, onShare, onEdit, onDelete, onSettle }: {
    customer: Customer; formatRupiah: (n: number) => string; onBack: () => void; onAddDebt: () => void;
    onPay: (id: number) => void; onShare: () => void; onEdit: () => void; onDelete: (id: number) => void; onSettle: (id: number) => void;
  }) => (
    <div className="detail-page">
      <div className="detail-header"><button onClick={onBack}>‹</button><strong>Detail Pelanggan</strong></div>
      <div className="detail-hero">
        <div className="detail-profile">
          <IonAvatar className={`customer-avatar ${customer.color}`}><span>{customer.initials}</span></IonAvatar>
          <div><h2>{customer.name}</h2><p>{customer.phone}</p></div>
        </div>
        <p className="detail-label">Sisa hutang</p>
        <strong className="detail-total">{formatRupiah(customer.amount)}</strong>
      </div>
      <div className="detail-actions">
        <button onClick={onAddDebt}><IonIcon icon={addOutline} /><span>Tambah Hutang</span></button>
        <button onClick={() => onPay(customer.id)}><IonIcon icon={walletOutline} /><span>Bayar</span></button>
        <button onClick={onShare}><IonIcon icon={sparklesOutline} /><span>Bagikan</span></button>
        <button onClick={() => onSettle(customer.id)}><IonIcon icon={checkmarkCircle} /><span>Lunasi</span></button>
      </div>
      <button className="edit-customer" onClick={onEdit}>Edit Pelanggan</button>
      <button className="detail-delete" onClick={() => onDelete(customer.id)}>Hapus pelanggan</button>
      <div className="transaction-panel">
        <h3>Riwayat Transaksi</h3>
        {customer.transactions.length === 0 ? <p className="empty-transactions">Belum ada transaksi</p> : (
          [...customer.transactions].reverse().map(t => (
            <div className="transaction" key={t.id}>
              <span className={`transaction-icon ${t.type === 'debt' ? 'debt' : 'paid'}`}>{t.type === 'debt' ? '+' : '-'}</span>
              <div><strong>{t.type === 'debt' ? 'Hutang' : 'Pembayaran'}</strong><small>{t.date} · {t.note}</small></div>
              <b className={t.type === 'payment' ? 'paid-text' : ''}>{t.type === 'debt' ? '+' : '-'}{formatRupiah(t.amount)}</b>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ReportsView = ({ customers, totalDebt, formatRupiah, onCustomers, onPay }: {
    customers: Customer[]; totalDebt: number; formatRupiah: (n: number) => string;
    onCustomers: () => void; onPay: (id: number) => void;
  }) => {
    const [period, setPeriod] = useState('6');
    const months6 = ['Jan','Feb','Mar','Apr','Mei','Jun'];
    const months12 = [...months6, 'Jul','Agu','Sep','Okt','Nov','Des'];
    const labels = period === '6' ? months6 : months12;
    
    const chartData: ChartData<'bar' | 'line', number[], string> = useMemo(() => {
      const baseVal = totalDebt / labels.length;
      return {
        labels,
        datasets: [
          {
            type: 'bar' as const,
            label: 'Total Piutang (Rp)',
            data: labels.map((_, i) => Math.round(baseVal * (0.3 + (i * 0.12) + Math.random() * 0.2))),
            backgroundColor: 'rgba(25, 118, 210, 0.6)',
            borderColor: 'rgba(25, 118, 210, 1)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            type: 'line' as const,
            label: 'Jumlah Pelanggan',
            data: labels.map((_, i) => Math.round(customers.length * (0.4 + (i * 0.08) + Math.random() * 0.15))),
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            yAxisID: 'y1',
          }
        ]
      };
    }, [period, totalDebt, customers.length]);

    const chartOptions: ChartOptions<'bar' | 'line'> = {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
        y1: { position: 'right' as const, beginAtZero: true, grid: { display: false } },
        x: { grid: { display: false } }
      },
      plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, padding: 16 } } }
    };

    return (
      <div className="inner-page report-page">
        <div className="page-heading compact">
          <div><p className="eyebrow">RINGKASAN PIUTANG</p><h1>Laporan</h1></div>
          <IonIcon className="report-icon" icon={barChartOutline} />
        </div>
        <div className="report-hero">
          <div><h2>Ringkasan Piutang</h2><p>Lihat tren piutang & jumlah pelanggan</p></div>
          <div className="bill-art report-art"><span>Rp</span><i>↗</i></div>
        </div>
        <div className="report-title-row">
          <h3>Grafik Piutang</h3>
          <IonSegment value={period} onIonChange={(e) => setPeriod(e.detail.value as string)} className="report-filter">
            <IonSegmentButton value="6">6 Bulan</IonSegmentButton>
            <IonSegmentButton value="12">12 Bulan</IonSegmentButton>
          </IonSegment>
        </div>
        <IonCard className="report-card">
          <IonCardContent>
            <Bar data={chartData} options={chartOptions} height={260} />
          </IonCardContent>
        </IonCard>
        <div className="section-heading report-list-heading"><h3>Daftar Piutang</h3><button onClick={onCustomers}>Lihat semua</button></div>
        {customers.length === 0 ? (
          <p className="ion-text-center ion-padding text-muted">Belum ada data</p>
        ) : (
          <div className="customer-list report-list">
            {customers.slice(0, 4).map(c => (
              <CustomerRow key={c.id} customer={c} formatRupiah={formatRupiah} onPay={onPay} showAmountLabel={false} showPaymentAction={false} />
            ))}
          </div>
        )}
        <p className="report-total">Total: {formatRupiah(totalDebt)}</p>
      </div>
    );
  };

  const ProfileView = ({ isDark, isAuthenticated, onToggleDark, onLock }: {
    isDark: boolean; isAuthenticated: boolean; onToggleDark: (v: boolean) => void; onLock: () => void;
  }) => (
    <div className="inner-page">
      <div className="profile-hero">
        <IonAvatar className="large-avatar"><span>ML</span></IonAvatar>
        <p className="eyebrow">PEMILIK TOKO</p><h1>Mbak Lin</h1>
        <p className="muted">Catatan hutang pribadi</p>
      </div>
      <div className="settings-list">
        <div><IonIcon icon={shieldCheckmarkOutline} /><span>Backup lokal aktif<small>Data aman di perangkat</small></span><IonBadge color="success">Aktif</IonBadge></div>
        <button onClick={onLock} disabled={!isAuthenticated}>
          <IonIcon icon={lockClosedOutline} />
          <span>{isAuthenticated ? 'Kunci akses owner' : 'Akses terkunci'}<small>{isAuthenticated ? 'PIN diperlukan' : 'Masukkan PIN'}</small></span>
          <IonIcon icon={chevronForwardOutline} />
        </button>
      </div>
      <p className="footer-note">LinBook v1.0 · Data lokal</p>
    </div>
  );

  return (
    <IonApp className={isDark ? 'ion-palette-dark' : ''}>
      <IonMenu contentId="main" className="app-drawer">
        <IonHeader className="ion-no-border drawer-header"><IonToolbar className="drawer-toolbar" /></IonHeader>
        <IonContent>
          <div className="drawer-profile"><IonAvatar className="large-avatar"><span>ML</span></IonAvatar><strong>LinBook</strong><small>Catatan piutang pribadi</small></div>
          <IonList lines="none" className="drawer-list">
            {[['Beranda', homeOutline, 'home'], ['Pelanggan', peopleOutline, 'customers'], ['Laporan', barChartOutline, 'reports'], ['Profil', personCircleOutline, 'profile']].map(([label, icon, tab]) => (
              <IonMenuToggle key={tab} autoHide>
                <IonItem button onClick={() => { if (tab === 'customers') setSelectedCustomer(null); setActiveTab(tab as string); }}>
                  <IonIcon icon={icon as string} slot="start" /><IonLabel>{label}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            ))}
          </IonList>
        </IonContent>
      </IonMenu>

      <IonPage id="main" className="app-shell">
        <IonHeader className="ion-no-border">
          <IonToolbar className="topbar">
            <IonButtons slot="start"><IonMenuButton className="menu-button" autoHide={false}><IonIcon icon={menuOutline} /></IonMenuButton></IonButtons>
            <IonTitle>LinBook</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen className="main-content">
          {isLoading ? <p className="ion-text-center ion-padding">Memuat data...</p> : (
            <>
              {activeTab === 'home' && (
                <HomeView {...{ customers, totalDebt, formatRupiah }}
                  onAdd={() => openOwnerAction(() => setShowAdd(true))}
                  onCustomers={() => setActiveTab('customers')}
                  onSelectCustomer={(c) => { setSelectedCustomer(c); setActiveTab('customers'); }}
                  onPay={(id) => openOwnerAction(() => settleCustomer(id))}
                />
              )}
              {activeTab === 'customers' && !selectedCustomer && (
                <CustomersView customers={customers.filter(c => `${c.name} ${c.phone}`.toLowerCase().includes(searchTerm.toLowerCase()))}
                  {...{ formatRupiah, searchTerm }}
                  onSearch={setSearchTerm}
                  onAdd={() => openOwnerAction(() => setShowAdd(true))}
                  onSelect={setSelectedCustomer}
                  onPay={(id) => openOwnerAction(() => settleCustomer(id))}
                />
              )}
              {activeTab === 'customers' && selectedCustomer && selectedDetail && (
                <CustomerDetail customer={selectedDetail} {...{ formatRupiah }}
                  onBack={() => setSelectedCustomer(null)}
                  onAddDebt={() => openOwnerAction(openDebtModal)}
                  onPay={(id) => openOwnerAction(() => openPaymentModal(id))}
                  onShare={shareCustomer}
                  onEdit={() => openOwnerAction(openEditModal)}
                  onDelete={(id) => openOwnerAction(() => deleteCustomer(id))}
                  onSettle={(id) => openOwnerAction(() => settleCustomer(id))}
                />
              )}
              {activeTab === 'reports' && (
                <ReportsView {...{ customers, totalDebt, formatRupiah }}
                  onCustomers={() => { setSelectedCustomer(null); setActiveTab('customers'); }}
                  onPay={(id) => openOwnerAction(() => openPaymentModal(id))}
                />
              )}
              {activeTab === 'profile' && <ProfileView {...{ isDark, isAuthenticated }} onToggleDark={toggleDarkMode} onLock={lockOwner} />}
            </>
          )}
        </IonContent>

        <IonFooter className="ion-no-border">
          <IonToolbar className="tab-toolbar">
            <div className="tabbar">
              {[[homeOutline, 'home', 'Beranda'], [peopleOutline, 'customers', 'Pelanggan'], [barChartOutline, 'reports', 'Laporan'], [personCircleOutline, 'profile', 'Profil']].map(([icon, key, label]) => (
                <button key={key as string} className={activeTab === key ? 'tab active' : 'tab'} onClick={() => setActiveTab(key as string)}>
                  <IonIcon icon={icon as string} /><span>{label}</span>
                </button>
              ))}
            </div>
          </IonToolbar>
        </IonFooter>
      </IonPage>

      <IonModal isOpen={showAdd} onDidDismiss={() => setShowAdd(false)}>
        <IonHeader><IonToolbar><IonTitle>Pelanggan Baru</IonTitle><IonButtons slot="end"><IonButton onClick={() => setShowAdd(false)}>Tutup</IonButton></IonButtons></IonToolbar></IonHeader>
        <IonContent className="ion-padding">
          <IonList lines="none">
            <IonItem><IonLabel position="stacked">Nama Pelanggan</IonLabel><IonInput placeholder="Ex: John Doe" value={newName} onIonInput={(e) => setNewName(e.detail.value ?? '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Nomor WhatsApp</IonLabel><IonInput placeholder="Ex: 08xxxxxxxxx" value={newPhone} onIonInput={(e) => setNewPhone(e.detail.value ?? '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Jumlah Hutang</IonLabel><IonInput placeholder="Ex: 25000" value={newAmount} onIonInput={(e) => setNewAmount(formatRupiahInput(e.detail.value ?? ''))} inputMode="numeric" /></IonItem>
            <IonItem><IonLabel position="stacked">Keterangan</IonLabel><IonInput placeholder="Ex: Mie Ayam" value={newNote} onIonInput={(e) => setNewNote(e.detail.value ?? '')} /></IonItem>
          </IonList>
          <IonButton expand="block" onClick={addCustomer}>Simpan Pelanggan</IonButton>
        </IonContent>
      </IonModal>

      <IonModal isOpen={showDebt} onDidDismiss={() => setShowDebt(false)}>
        <IonHeader><IonToolbar><IonTitle>Tambah Hutang</IonTitle><IonButtons slot="end"><IonButton onClick={() => setShowDebt(false)}>Tutup</IonButton></IonButtons></IonToolbar></IonHeader>
        <IonContent className="ion-padding">
          <IonList lines="none">
            <IonItem><IonLabel position="stacked">Nominal</IonLabel><IonInput placeholder="Ex: 25000" value={debtAmount} onIonInput={(e) => setDebtAmount(formatRupiahInput(e.detail.value ?? ''))} inputMode="numeric" /></IonItem>
            <IonItem><IonLabel position="stacked">Keterangan</IonLabel><IonInput placeholder="Ex: Seblak" value={debtNote} onIonInput={(e) => setDebtNote(e.detail.value ?? '')} /></IonItem>
          </IonList>
          <IonButton expand="block" onClick={addDebt}>Simpan Hutang</IonButton>
        </IonContent>
      </IonModal>

      <IonModal isOpen={showPayment} onDidDismiss={() => setShowPayment(false)}>
        <IonHeader><IonToolbar><IonTitle>Catat Pembayaran</IonTitle><IonButtons slot="end"><IonButton onClick={() => setShowPayment(false)}>Tutup</IonButton></IonButtons></IonToolbar></IonHeader>
        <IonContent className="ion-padding">
          <IonList lines="none">
            <IonItem><IonLabel position="stacked">Nominal Dibayar</IonLabel><IonInput placeholder="Ex: 100000" value={paymentAmount} onIonInput={(e) => setPaymentAmount(formatRupiahInput(e.detail.value ?? ''))} inputMode="numeric" /></IonItem>
            <IonItem><IonLabel position="stacked">Keterangan</IonLabel><IonInput placeholder="Ex: Bayar Mie Ayam" value={paymentNote} onIonInput={(e) => setPaymentNote(e.detail.value ?? '')} /></IonItem>
          </IonList>
          <IonButton expand="block" onClick={addPayment}>Simpan Pembayaran</IonButton>
        </IonContent>
      </IonModal>

      <IonModal isOpen={showEdit} onDidDismiss={() => setShowEdit(false)}>
        <IonHeader><IonToolbar><IonTitle>Edit Pelanggan</IonTitle><IonButtons slot="end"><IonButton onClick={() => setShowEdit(false)}>Tutup</IonButton></IonButtons></IonToolbar></IonHeader>
        <IonContent className="ion-padding">
          <IonList lines="none">
            <IonItem><IonLabel position="stacked">Nama</IonLabel><IonInput placeholder="Ex: John Doe" value={editName} onIonInput={(e) => setEditName(e.detail.value ?? '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Nomor WhatsApp</IonLabel><IonInput placeholder="Ex: 08xxxxxxxxx" value={editPhone} onIonInput={(e) => setEditPhone(e.detail.value ?? '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Sisa Hutang</IonLabel><IonInput placeholder="Ex: 25000" value={editDebtAmount} onIonInput={(e) => setEditDebtAmount(formatRupiahInput(e.detail.value ?? ''))} inputMode="numeric" /></IonItem>
          </IonList>
          <IonButton expand="block" onClick={saveEdit}>Simpan Perubahan</IonButton>
          <IonButton expand="block" fill="clear" color="danger" onClick={() => selectedDetail && openOwnerAction(() => deleteCustomer(selectedDetail.id))}>Hapus Pelanggan</IonButton>
        </IonContent>
      </IonModal>

      <IonModal isOpen={showPin} onDidDismiss={() => setShowPin(false)}>
        <IonContent className="ion-padding ion-text-center">
          <IonIcon icon={lockClosedOutline} size="large" style={{ fontSize: '3rem', margin: '1rem 0' }} />
          <h2>Masukkan PIN</h2>
          <IonInput type="password" inputMode="numeric" maxlength={4} value={pin} onIonInput={(e) => setPin(e.detail.value ?? '')} placeholder="••••" style={{ maxWidth: 200, margin: '0 auto' }} />
          <IonButton expand="block" style={{ marginTop: '1rem' }} onClick={verifyPin}>Buka Akses</IonButton>
        </IonContent>
      </IonModal>

      <IonModal isOpen={confirmModal.show} onDidDismiss={() => setConfirmModal(p => ({ ...p, show: false }))}>
        <IonContent className="ion-padding ion-text-center">
          <h3>{confirmModal.title}</h3>
          <p>{confirmModal.message}</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <IonButton expand="block" fill="outline" onClick={() => setConfirmModal(p => ({ ...p, show: false }))}>Batal</IonButton>
            <IonButton expand="block" color={confirmModal.danger ? 'danger' : 'primary'} onClick={() => { confirmModal.onConfirm(); setConfirmModal(p => ({ ...p, show: false })); }}>Ya, Lanjutkan</IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonToast isOpen={!!feedback} message={feedback} duration={1800} position="bottom" onDidDismiss={() => setFeedback('')} />
    </IonApp>
  );
};

export default App;
