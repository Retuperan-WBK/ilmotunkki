import { useEffect, useRef, useState } from "react";
import { useAdminContext } from "./AdminContext";
import TicketList from "./TicketList";
import InviteSvg from "./InviteSvg";
import DisabledSvg from "./DisabledSvg";
import CopyableEmail from "./CopyableEmail";
import { Order } from "@/utils/models";

const OrdersDrawer = () => {
  const { 
    orders, 
    selectedOrder, 
    setSelectedOrder, 
    orderSortOption, 
    setOrderSortOption, 
    orderFilters, 
    handleSendTickets,
    handleSendTicketsManually,
    setOrderFilters,
    groups,
    setSelectedGroup,
    handleSetActiveTab,
  } = useAdminContext();
  const [search, setSearch] = useState('');
  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const listScrollPosition = useRef(0);
  const [selectedTicketType, setSelectedTicketType] = useState('');

  useEffect(() => {
    if (scrollableDivRef.current) scrollableDivRef.current.scrollTop = listScrollPosition.current;
  }, [selectedOrder]);

  const getOrderStatusColor = (placedCount: number, totalCount: number) => {
    if (placedCount === 0) return 'bg-red-500'; // All unplaced
    if (placedCount === totalCount) return 'bg-green-500'; // All placed
    return 'bg-yellow-500'; // Some unplaced
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderSortOption(e.target.value as 'newest' | 'oldest' | 'largest' | 'smallest');
  };

  const toggleFilter = (filterName: 'kutsuvieras' | 'erikoisjarjestely' | 'noGroup' | 'none', ticketType?: string) => {
    let newFilters = {...orderFilters};
    if (filterName != 'none') {
      newFilters = { ...orderFilters, [filterName]: !orderFilters[filterName]};
    } if (ticketType !== undefined) {
      newFilters = { ...orderFilters, ticketType };
    }
    setOrderFilters(newFilters);
  };

  const handleOpenGroup = (groupId: number) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    setSelectedGroup(group);
    handleSetActiveTab('ryhmat');
  }

  const ticketTypes = ['deluxe', 'iluokka', 'iiluokka', 'opiskelija'];

  const sortOrders = (orders: Order[]) => {
    switch (orderSortOption) {
      case 'newest':
        return [...orders].sort((a, b) => new Date(b.attributes.createdAt).getTime() - new Date(a.attributes.createdAt).getTime());
      case 'oldest':
        return [...orders].sort((a, b) => new Date(a.attributes.createdAt).getTime() - new Date(b.attributes.createdAt).getTime());
      case 'largest':
        return [...orders].sort((a, b) => b.attributes.items?.data.length - a.attributes.items?.data.length);
      case 'smallest':
        return [...orders].sort((a, b) => a.attributes.items?.data.length - b.attributes.items?.data.length);
      default:
        return orders;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const hasSpecialArrangement = order.attributes.customer.data?.attributes.special_arragements || false;
    const isGuest = order.attributes.kutsuvieras || false;
    const hasGroup = order.attributes.group.data ? true : false;

    if (orderFilters.kutsuvieras && !isGuest) return false;
    if (orderFilters.erikoisjarjestely && !hasSpecialArrangement) return false;
    if (orderFilters.noGroup && hasGroup) return false;

    if (orderFilters.ticketType && orderFilters.ticketType !== '') {
      const tickets = order.attributes.items?.data || [];
      const ticketType = orderFilters.ticketType;
      const ticketTypeMatch = tickets.some((ticket) => ticket.attributes.itemType.data.attributes.slug === ticketType);
      if (!ticketTypeMatch) return false;
    }

    return true;
  });

  const sortedOrders = sortOrders(filteredOrders);

  if (selectedOrder) {
    // Render selected order details
    const totalCount = selectedOrder.attributes.items?.data.length || 0;
    const placed = selectedOrder.attributes.items?.data.filter(
      (item) => item.attributes.seat.data
    ).length;
    const unplaced = totalCount - placed;
    const tickets = selectedOrder.attributes.items?.data || [];

    return (
      <div className="flex h-full min-h-0 w-full flex-col p-4">
        <button
          className="mb-3 self-start rounded-lg px-2 py-1 text-sm font-medium text-sky-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          onClick={() => setSelectedOrder(null)}
        >
          ← Takaisin tilauksiin
        </button>
        <h1 className="mb-3 text-xl font-bold">Tilauksen tiedot</h1>
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-xl border border-white/10 bg-[#223149] p-4">
          <div className="flex justify-between items-start flex-col">
            <p className="truncate text-lg font-bold text-white select-text">
              {selectedOrder.attributes.customer?.data.attributes.firstName}{' '}
              {selectedOrder.attributes.customer?.data.attributes.lastName}
            </p>
            {selectedOrder.attributes.group.data &&
            <p className="w-fit max-w-[90%] cursor-pointer truncate text-sm text-sky-300 hover:underline select-text" onClick={() => selectedOrder.attributes.group.data && handleOpenGroup(selectedOrder.attributes.group.data.id)}>
              Ryhmä: {selectedOrder.attributes.group?.data?.attributes.name || 'N/A'}
            </p>
            }
          </div>
          <CopyableEmail className="mt-2 break-all" email={selectedOrder.attributes.customer?.data.attributes.email} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <div
                className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                  placed,
                  totalCount
                )} mr-2`}
              ></div>
              <p className="text-md">
                {placed}/{totalCount} paikkaa
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/admin/orders/ticketsPdf/${selectedOrder.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-violet-500/20 px-2 py-1.5 text-sm font-medium text-violet-100 hover:bg-violet-500/30"
              >
                Liput (PDF)
              </a>
              {unplaced === 0 && (selectedOrder.attributes.tickets_sent === true ?
              <button className="rounded-lg bg-emerald-500/20 px-2 py-1.5 text-sm text-emerald-100 cursor-not-allowed
              " disabled>
                Liput Lähetetty
              </button> : (
                <div className="flex gap-2">
                  <button onClick={() => handleSendTicketsManually(selectedOrder)} className="rounded-lg bg-sky-500/20 px-2 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/30">
                    Aseta liput lähetetyksi
                  </button>
                  <button onClick={() => handleSendTickets(selectedOrder, selectedOrder.attributes.group.data?.attributes.name)} className="rounded-lg bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-[#102134] hover:bg-emerald-400">
                    Lähetä liput
                  </button>
                </div>
              ))
              }
            </div>
          </div>
          <div className="mt-3 border-y border-white/10">
            {selectedOrder.attributes.customer.data.attributes.special_arragements &&
            <div className="flex items-center py-2">
              <div className="flex-[1]">
                <DisabledSvg height={40} width={40} viewBox="-150 -100 800 800"/>
              </div>
              <p className="text-md flex-[6]">{selectedOrder.attributes.customer.data.attributes.special_arragements}</p>
            </div>
            }
            {selectedOrder.attributes.kutsuvieras &&
            <div className="flex items-center py-2">
              <InviteSvg height={40} width={40} />
              <p className="text-md ml-2">Kutsuvieras</p>
            </div>
            }
          </div>
          <div className="pb-4">
            <TicketList tickets={tickets} tickets_sent={selectedOrder.attributes.tickets_sent} />
          </div>
        </div>
      </div>
    );
  }

  const placedOrders = sortedOrders.filter(
    (order) =>
      order.attributes.items &&
      order.attributes.items.data.length > 0 &&
      order.attributes.items.data.every((item) => item.attributes.seat.data) // All items placed
  );

  const unplacedOrders = sortedOrders.filter(
    (order) =>
      order.attributes.items &&
      order.attributes.items.data.some((item) => !item.attributes.seat.data) // Items without seats
  );

  const matchesSearch = (order: Order) =>
    `${order.attributes.customer?.data?.attributes.firstName || ''} ${order.attributes.customer?.data?.attributes.lastName || ''}`.toLowerCase().includes(search.trim().toLowerCase());
  const visibleUnplacedOrders = unplacedOrders.filter(matchesSearch);
  const visiblePlacedOrders = placedOrders.filter(matchesSearch);

  const handleSelectTicketType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTicketType(e.target.value);
    toggleFilter('none', e.target.value);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-white">Tilaukset <span className="text-sm font-normal text-slate-400">{orders.length}</span></h1>
        </div>
        <div className="mt-3">
          <input
              type="text"
              aria-label="Hae tilauksia nimellä"
              placeholder="Hae asiakkaan nimellä…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#101a2b] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
            />
        </div>
        <div className="mt-3 flex gap-2">
            <select 
              aria-label="Järjestä tilaukset"
              value={orderSortOption}
              onChange={handleSortChange} 
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#26374f] px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="newest">Uusin ensin</option>
              <option value="oldest">Vanhin ensin</option>
              <option value="largest">Suurin ensin</option>
              <option value="smallest">Pienin ensin</option>
            </select>
            <select 
              aria-label="Suodata lipputyypin mukaan"
              value={selectedTicketType} 
              onChange={handleSelectTicketType}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#26374f] px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">Kaikki lipputyypit</option>
              {ticketTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" aria-pressed={orderFilters.kutsuvieras} onClick={() => toggleFilter('kutsuvieras')} className={`rounded-full border px-2.5 py-1 text-xs ${orderFilters.kutsuvieras ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-slate-300 hover:bg-white/10'}`}>
              Kutsuvieras
            </button>
            <button type="button" aria-pressed={orderFilters.erikoisjarjestely} onClick={() => toggleFilter('erikoisjarjestely')} className={`rounded-full border px-2.5 py-1 text-xs ${orderFilters.erikoisjarjestely ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-slate-300 hover:bg-white/10'}`}>
              Erikoisjärjestely
            </button>
            <button type="button" aria-pressed={orderFilters.noGroup} onClick={() => toggleFilter('noGroup')} className={`rounded-full border px-2.5 py-1 text-xs ${orderFilters.noGroup ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-slate-300 hover:bg-white/10'}`}>
              Ei ryhmää
            </button>
            {(search || selectedTicketType || orderFilters.kutsuvieras || orderFilters.erikoisjarjestely || orderFilters.noGroup) &&
              <button type="button" onClick={() => { setSearch(''); setSelectedTicketType(''); setOrderFilters({ kutsuvieras: false, erikoisjarjestely: false, noGroup: false, ticketType: '' }); }} className="px-2 text-xs text-sky-300 hover:underline">Tyhjennä</button>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4" ref={scrollableDivRef} onScroll={event => { listScrollPosition.current = event.currentTarget.scrollTop; }}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-200">Plassaamattomat ({visibleUnplacedOrders.length})</h2>
        {visibleUnplacedOrders.map((order) => {
          const totalCount = order.attributes.items?.data.length || 0;
          const placedCount =
            order.attributes.items?.data.filter((item) => item.attributes.seat.data).length || 0;

          return (
            <div
              key={order.id}
              role="button" tabIndex={0}
              aria-label={`Avaa tilaus: ${order.attributes.customer.data?.attributes.firstName} ${order.attributes.customer.data?.attributes.lastName}`}
              onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setSelectedOrder(order); } }}
              className="mb-2 flex cursor-pointer flex-col rounded-xl border border-white/10 bg-[#223149] p-3 transition-colors hover:border-white/25 hover:bg-[#293c57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex justify-between flex-col">
                <p className="text-md font-bold">
                  {order.attributes.customer?.data.attributes.firstName}{' '}
                  {order.attributes.customer?.data.attributes.lastName}
                </p>
                {order.attributes.group.data &&
                <button type="button" className="w-fit max-w-[90%] truncate text-left text-sm text-sky-300 hover:underline" onClick={event => { event.stopPropagation(); if (order.attributes.group.data) handleOpenGroup(order.attributes.group.data.id); }}>
                  Ryhmä: {order.attributes.group?.data?.attributes.name || 'N/A'}
                </button>
                }
              </div>
              <div className="flex items-center mt-4 gap-4">
                <div
                  className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                    placedCount,
                    totalCount
                  )} mr-2`}
                ></div>
                <p className="text-md flex-[1]">
                  {placedCount}/{totalCount} paikkaa
                </p>
                <div className="flex items-center gap-2 flex-[1] justify-end">
                {order.attributes.customer.data.attributes.special_arragements &&
                <>
                  <DisabledSvg height={40} width={40}/>
                </>
                }
                {order.attributes.kutsuvieras && 
                <>
                  <InviteSvg height={40} width={40} />
                </>
                }
                </div>
              </div>
            </div>
          );
        })}

        {visibleUnplacedOrders.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">Ei hakua vastaavia tilauksia.</p>}
        <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-200">Plassatut ({visiblePlacedOrders.length})</h2>
        {/* Sort so that orders with ticket sent are last */}
        {visiblePlacedOrders
        .sort((a, b) => a.attributes.tickets_sent === b.attributes.tickets_sent ? 0 : a.attributes.tickets_sent ? 1 : -1)
        .map((order) => {
          const totalCount = order.attributes.items?.data.length || 0;

          return (
            <div
                key={order.id}
                role="button" tabIndex={0}
                aria-label={`Avaa tilaus: ${order.attributes.customer.data?.attributes.firstName} ${order.attributes.customer.data?.attributes.lastName}`}
                onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setSelectedOrder(order); } }}
                className="mb-2 flex cursor-pointer flex-col rounded-xl border border-white/10 bg-[#223149] p-3 transition-colors hover:border-white/25 hover:bg-[#293c57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              onClick={() => setSelectedOrder(order)}
            > 
            { order.attributes.tickets_sent === true && 
            <div className="mb-2 w-fit rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">
              Liput Lähetetty
            </div>
            }
              <div className="flex justify-between flex-col">
                <p className="text-md font-bold">
                  {order.attributes.customer?.data.attributes.firstName}{' '}
                  {order.attributes.customer?.data.attributes.lastName}
                </p>
                {order.attributes.group.data &&
                <button type="button" className="w-fit max-w-[90%] truncate text-left text-sm text-sky-300 hover:underline" onClick={event => { event.stopPropagation(); if (order.attributes.group.data) handleOpenGroup(order.attributes.group.data.id); }}>
                  Ryhmä: {order.attributes.group?.data?.attributes.name || 'N/A'}
                </button>
                }
              </div>
              <div className="flex items-center mt-4 gap-4">
                <div
                  className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                    totalCount,
                    totalCount
                  )} mr-2`}
                ></div>
                <p className="text-md flex-[1]">
                  {totalCount}/{totalCount} paikkaa
                </p>
                <div className="flex items-center gap-2 flex-[1] justify-end">
                {order.attributes.customer.data.attributes.special_arragements &&
                <>
                  <DisabledSvg height={40} width={40}/>
                </>
                }
                {order.attributes.kutsuvieras && 
                <>
                  <InviteSvg height={40} width={40} />
                </>
                }
                </div>
              </div>
            </div>
          );
        })}
        {visiblePlacedOrders.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">Ei hakua vastaavia tilauksia.</p>}
      </div>
    </div>
  );
};

export default OrdersDrawer;
