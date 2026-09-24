'use client';

import { useState } from 'react';
import Logo from './Logo';
import SeatMap from './SeatMap';
import OrdersDrawer from './OrdersDrawer';
import GroupsDrawer from './GroupsDrawer';
import MapDrawer from './MapDrawer';
import { useAdminContext } from './AdminContext';

export default function SeatDashboard() {
  const {
    setMode, setSelectedGroup, setSelectedOrder, setSelectedTicket, setSelectedSeat,
    activeTab, handleSetActiveTab, orders, groups, fetchOrders, fetchGroups, fetchSections,
  } = useAdminContext();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  const ticketCounts: Record<string, number> = { deluxe: 0, iluokka: 0, iiluokka: 0, opiskelija: 0 };
  let placed = 0;
  orders.forEach(order => order.attributes.items.data.forEach(item => {
    const slug = item.attributes.itemType.data?.attributes.slug;
    if (slug && slug in ticketCounts) ticketCounts[slug]++;
    if (item.attributes.seat.data) placed++;
  }));
  const total = orders.reduce((count, order) => count + order.attributes.items.data.length, 0);

  const changeTab = (tab: 'tilaukset' | 'ryhmat' | 'kartta') => {
    setMode(null);
    setSelectedGroup(null);
    setSelectedOrder(null);
    setSelectedTicket(null);
    setSelectedSeat(null);
    handleSetActiveTab(tab);
  };

  const refresh = async () => {
    setRefreshing(true);
    setRefreshError(false);
    try {
      await Promise.all([fetchOrders(), fetchGroups(), fetchSections()]);
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  };

  const tabs = [
    { id: 'tilaukset', name: 'Tilaukset', count: orders.length },
    { id: 'ryhmat', name: 'Ryhmät', count: groups.length },
    { id: 'kartta', name: 'Kartan hallinta' },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-[#0c1523] text-slate-100 lg:h-full lg:min-h-0">
      <header className="shrink-0 border-b border-white/10 bg-[#111d2e] px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg bg-white/5"><Logo /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">RWBK · Liput</p>
              <h1 className="text-xl font-bold tracking-tight text-white">Plassitunkki</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><span className="text-slate-400">Tilauksia </span><strong className="ml-1 text-lg text-white">{orders.length}</strong></div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><span className="text-slate-400">Lippuja </span><strong className="ml-1 text-lg text-white">{total}</strong></div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2"><span className="text-emerald-200">Plassattu </span><strong className="ml-1 text-lg text-white">{placed}/{total}</strong></div>
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Päivitä tiedot" title="Päivitä tiedot"
              className="rounded-xl border border-white/15 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 disabled:opacity-50">
              {refreshing ? 'Päivitetään…' : '↻ Päivitä'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <nav className="flex flex-wrap gap-1" aria-label="Ylläpidon näkymät">
            {tabs.map(tab => (
              <button key={tab.id} type="button" onClick={() => changeTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${activeTab === tab.id ? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                {tab.name} {'count' in tab && <span className="ml-1 text-xs opacity-70">{tab.count}</span>}
              </button>
            ))}
          </nav>
          <p className="text-xs text-slate-400">DeLuxe {ticketCounts.deluxe} · I {ticketCounts.iluokka} · II {ticketCounts.iiluokka} · Opiskelija {ticketCounts.opiskelija}</p>
        </div>
        {refreshError && <p role="alert" className="mt-2 text-sm text-rose-300">Tietojen päivitys epäonnistui. Yritä uudelleen.</p>}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row lg:gap-4 lg:p-4">
        <aside className="h-[440px] min-h-0 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#172337] shadow-xl lg:h-full lg:w-[360px] lg:max-w-[45%] xl:w-[400px] min-[1400px]:w-[480px] min-[1700px]:w-[560px]" aria-label="Ylläpidon tiedot">
          {activeTab === 'tilaukset' && <OrdersDrawer />}
          {activeTab === 'ryhmat' && <GroupsDrawer />}
          {activeTab === 'kartta' && <MapDrawer />}
        </aside>
        <section className="min-h-[520px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 shadow-xl lg:min-h-0" aria-label="Salikartta">
          <SeatMap />
        </section>
      </div>
    </div>
  );
}
