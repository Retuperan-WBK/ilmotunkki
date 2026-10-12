'use client';

import { useEffect, useRef, useState } from 'react';
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
    mobileView, setMobileView,
  } = useAdminContext();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const listPanelRef = useRef<HTMLElement>(null);
  const mapPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(min-width: 750px)').matches) return;
    if (mobileView === 'map') {
      mapPanelRef.current?.querySelector<HTMLElement>('[data-map-viewport]')?.focus({ preventScroll: true });
    } else {
      listPanelRef.current?.focus({ preventScroll: true });
    }
  }, [mobileView]);

  const ticketCounts: Record<string, number> = { deluxe: 0, iluokka: 0, iiluokka: 0, opiskelija: 0 };
  let placed = 0;
  orders.forEach(order => order.attributes.items.data.forEach(item => {
    const slug = item.attributes.itemType.data?.attributes.slug;
    if (slug && slug in ticketCounts) ticketCounts[slug]++;
    if (item.attributes.seat.data) placed++;
  }));
  const total = orders.reduce((count, order) => count + order.attributes.items.data.length, 0);
  const ticketBreakdown = `DeLuxe ${ticketCounts.deluxe} · I ${ticketCounts.iluokka} · II ${ticketCounts.iiluokka} · Opiskelija ${ticketCounts.opiskelija}`;

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

  const navigation = (className: string) => (
    <nav className={className} aria-label="Ylläpidon näkymät">
      {tabs.map(tab => (
        <button key={tab.id} type="button" onClick={() => changeTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`min-h-10 min-w-0 flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 admin:min-h-9 admin:flex-none xl:px-3 xl:text-sm 2xl:px-4 ${activeTab === tab.id ? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          {tab.name} {'count' in tab && <span className="ml-1 text-[10px] opacity-70 xl:text-xs">{tab.count}</span>}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0c1523] text-slate-100">
      <header className="shrink-0 border-b border-white/10 bg-[#111d2e] px-2 py-2 sm:px-3 admin:px-4 xl:px-5 xl:py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 min-[400px]:flex-nowrap admin:gap-3 xl:gap-4">
          <div className="flex shrink-0 items-center gap-2 xl:gap-3">
            <div className="flex h-8 w-11 items-center justify-center overflow-hidden rounded-lg bg-white/5 sm:h-9 sm:w-12 xl:h-10 xl:w-16"><Logo /></div>
            <div>
              <p className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-400 sm:text-[10px] sm:tracking-[0.16em] xl:text-xs">RWBK · Liput</p>
              <h1 className="whitespace-nowrap text-sm font-bold tracking-tight text-white sm:text-base xl:text-lg">Plassitunkki</h1>
            </div>
          </div>

          {navigation('hidden shrink-0 flex-nowrap gap-1 admin:flex')}

          <div className="ml-auto flex w-full min-w-0 items-center justify-end gap-1.5 min-[400px]:w-auto sm:gap-2">
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5 xl:gap-2" aria-label="Myynnin ja plassauksen yhteenveto">
                <div className="flex flex-col items-center whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-1.5 py-1 sm:px-2 xl:flex-row xl:gap-1.5 xl:rounded-xl xl:px-3 xl:py-1.5 2xl:px-4">
                  <span className="text-[10px] text-slate-400 sm:text-[11px] xl:text-xs 2xl:text-sm">Tilauksia</span>
                  <strong className="text-sm tabular-nums text-white sm:text-base 2xl:text-lg">{orders.length}</strong>
                </div>
                <div className="flex flex-col items-center whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-1.5 py-1 sm:px-2 xl:flex-row xl:gap-1.5 xl:rounded-xl xl:px-3 xl:py-1.5 2xl:px-4">
                  <span className="text-[10px] text-slate-400 sm:text-[11px] xl:text-xs 2xl:text-sm">Lippuja</span>
                  <strong className="text-sm tabular-nums text-white sm:text-base 2xl:text-lg">{total}</strong>
                </div>
                <div className="flex flex-col items-center whitespace-nowrap rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-1 sm:px-2 xl:flex-row xl:gap-1.5 xl:rounded-xl xl:px-3 xl:py-1.5 2xl:px-4">
                  <span className="text-[10px] text-emerald-200 sm:text-[11px] xl:text-xs 2xl:text-sm">Plassattu</span>
                  <strong className="text-sm tabular-nums text-white sm:text-base 2xl:text-lg">{placed}/{total}</strong>
                </div>
              </div>
              <p className="hidden whitespace-nowrap text-[10px] leading-tight text-slate-400 xl:block 2xl:text-[11px]">{ticketBreakdown}</p>
            </div>
            <button type="button" onClick={refresh} disabled={refreshing} aria-label={refreshing ? 'Päivitetään tietoja' : 'Päivitä tiedot'} title="Päivitä tiedot"
              className="flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 disabled:opacity-50 xl:h-auto xl:w-auto xl:rounded-xl xl:px-3 xl:py-2">
              <span aria-hidden="true" className={refreshing ? 'animate-spin' : undefined}>↻</span>
              <span className="hidden text-xs xl:inline">{refreshing ? 'Päivitetään…' : 'Päivitä'}</span>
            </button>
          </div>
        </div>
        <p className="mt-1 text-right text-[10px] leading-tight text-slate-400 xl:hidden">{ticketBreakdown}</p>
        {refreshError && <p role="alert" className="mt-2 text-sm text-rose-300">Tietojen päivitys epäonnistui. Yritä uudelleen.</p>}
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#0e1929] p-1 admin:hidden" role="group" aria-label="Mobiilinäkymä">
          <button type="button" onClick={() => setMobileView('list')} aria-pressed={mobileView === 'list'} aria-controls="admin-list-view"
            className={`min-h-10 rounded-lg px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${mobileView === 'list' ? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            {activeTab === 'kartta' ? 'Kartan hallinta' : 'Tilaukset / ryhmät'}
          </button>
          <button type="button" onClick={() => setMobileView('map')} aria-pressed={mobileView === 'map'} aria-controls="admin-map-view"
            className={`min-h-10 rounded-lg px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${mobileView === 'map' ? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            Salikartta
          </button>
        </div>
        {navigation(`${mobileView === 'list' ? 'flex' : 'hidden'} mt-2 flex-nowrap gap-1 admin:hidden`)}
      </header>

      <div className="flex min-h-0 flex-1 gap-2 p-2 admin:gap-4 admin:p-4">
        <aside id="admin-list-view" ref={listPanelRef} tabIndex={-1}
          className={`${mobileView === 'list' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#172337] shadow-xl outline-none admin:flex admin:h-full admin:flex-none admin:w-[360px] admin:max-w-[45%] xl:w-[400px] min-[1400px]:w-[480px] min-[1700px]:w-[560px]`} aria-label="Ylläpidon tiedot">
          {activeTab === 'tilaukset' && <OrdersDrawer />}
          {activeTab === 'ryhmat' && <GroupsDrawer />}
          {activeTab === 'kartta' && <MapDrawer />}
        </aside>
        <section id="admin-map-view" ref={mapPanelRef}
          className={`${mobileView === 'map' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-xl admin:flex`} aria-label="Salikartta">
          <SeatMap />
        </section>
      </div>
    </div>
  );
}
