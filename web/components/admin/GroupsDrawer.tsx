import { useEffect, useRef, useState } from "react";
import { useAdminContext } from "./AdminContext";
import TicketList from "./TicketList";
import DisabledSvg from "./DisabledSvg";
import InviteSvg from "./InviteSvg";
import CopyableEmail from "./CopyableEmail";

const GroupsDrawer = () => {

  const { 
    groups, 
    selectedGroup, 
    setSelectedGroup,
    setOrderSortOption,
    orderFilters,
    setOrderFilters,
    orderSortOption,
    handleSendTickets,
    handleSendTicketsManually,
  } = useAdminContext();
  const [search, setSearch] = useState("");
  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const listScrollPosition = useRef(0);

  useEffect(() => {
    if (scrollableDivRef.current) scrollableDivRef.current.scrollTop = listScrollPosition.current;
  }, [selectedGroup]);

  const getOrderStatusColor = (placedCount: number, totalCount: number) => {
    if (placedCount === 0) return "bg-red-500"; // All unplaced
    if (placedCount === totalCount) return "bg-green-500"; // All placed
    return "bg-yellow-500"; // Some unplaced
  };

  const [selectedTicketType, setSelectedTicketType] = useState<string>('');
  const ticketTypes = ['deluxe', 'iluokka', 'iiluokka', 'opiskelija'];

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

  const handleSelectTicketType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTicketType(e.target.value);
    toggleFilter('none', e.target.value);
  }

  const filteredGroups = groups.filter((group) => {
    const hasSpecialArrangement = group.attributes.orders.data.some(
      (order) => order.attributes.customer?.data.attributes.special_arragements
    );
    const isGuest = group.attributes.orders.data.some(
      (order) => order.attributes.kutsuvieras
    );

    if (orderFilters.kutsuvieras && !isGuest) return false;
    if (orderFilters.erikoisjarjestely && !hasSpecialArrangement) return false;

    if (selectedTicketType) {
      const orders = group.attributes.orders.data;
      const hasTicketType = orders.some((order) => order.attributes.items.data.some((item) => item.attributes.itemType.data.attributes.slug === selectedTicketType));
      if (!hasTicketType) return false;
    }

    return true;
  });

  const sortedGroups = filteredGroups.sort((a, b) => {
    switch (orderSortOption) {
      case 'newest':
        return new Date(b.attributes.createdAt).getTime() - new Date(a.attributes.createdAt).getTime();
      case 'oldest':
        return new Date(a.attributes.createdAt).getTime() - new Date(b.attributes.createdAt).getTime();
      case 'largest':
        return b.attributes.orders?.data.length - a.attributes.orders?.data.length;
      case 'smallest':
        return a.attributes.orders?.data.length - b.attributes.orders?.data.length;
      default:
        return 0;
    }
  });

  if (selectedGroup) {
    // Render selected group details
    const orders = selectedGroup.attributes.orders?.data || [];

    return (
      <div className="flex h-full min-h-0 w-full flex-col p-4">
        <button
          className="mb-3 self-start rounded-lg px-2 py-1 text-sm font-medium text-sky-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          onClick={() => setSelectedGroup(null)}
        >
          ← Takaisin ryhmiin
        </button>
        <h1 className="mb-3 max-w-full truncate text-xl font-bold select-text">Ryhmä: {selectedGroup.attributes.name}</h1>

        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-xl border border-white/10 bg-[#223149] p-3">
          <p className="text-md font-bold mb-4">
            Tilaukset ({orders.length})
          </p>
          {orders.map((order) => {
            const tickets = order.attributes.items?.data || [];
            const totalCount = tickets.length || 0;
            const placedCount = tickets.filter((item) => item.attributes.seat.data).length;
            const unplacedCount = totalCount - placedCount;
            return (
              <div
                key={order.id}
                className="mb-3 flex flex-col rounded-xl border border-white/10 bg-[#182639] p-3"
              >
                <div className="flex justify-between items-center">
                  <p className="text-md font-bold select-text">
                    {order.attributes.customer?.data.attributes.firstName}{" "}
                    {order.attributes.customer?.data.attributes.lastName}
                  </p>
                  <p className="text-md">
                    {placedCount}/{totalCount} paikkaa
                  </p>
                </div>
                <CopyableEmail className="mt-2" email={order.attributes.customer?.data.attributes.email} />
                {unplacedCount === 0 && (
                  order.attributes.tickets_sent === true ? (
                    <button className="mt-2 w-fit cursor-not-allowed rounded-md bg-gray-500 px-3 py-1.5 text-sm text-white" disabled>
                      Liput Lähetetty
                    </button>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => handleSendTicketsManually(order, selectedGroup.attributes.name)} className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:opacity-90">
                        Aseta liput lähetetyksi
                      </button>
                      <button onClick={() => handleSendTickets(order, selectedGroup.attributes.name)} className="rounded-md bg-green-500 px-3 py-1.5 text-sm text-white hover:opacity-90">
                        Lähetä liput
                      </button>
                    </div>
                  )
                )}
                <div className="flex items-center gap-2 w-full">
                  <div className="w-full border-gray-400 border-y-2">
                  {order.attributes.customer.data.attributes.special_arragements &&
                  <div className={`flex items-center py-2`}>
                    <div className="flex-[1]">
                      <DisabledSvg height={40} width={40} viewBox="-150 -100 800 800"/>
                    </div>
                    <p className="text-md flex-[6]">{order.attributes.customer.data.attributes.special_arragements}</p>
                  </div>
                  }
                  {order.attributes.kutsuvieras &&
                  <div className="flex items-center py-2">
                    <InviteSvg height={40} width={40} />
                    <p className="text-md ml-2">Kutsuvieras</p>
                  </div>
                  }
                  </div>
                </div>
                <TicketList tickets={tickets} tickets_sent={order.attributes.tickets_sent}/>
              </div>
            );
          })}
        </div>
      </div>
    );
  }  

  const groups_with_unplaced_tickets = sortedGroups.filter((group) =>
    group.attributes.orders?.data.some(
      (order) =>
        order.attributes.items?.data.some(
          (item) => !item.attributes.seat.data
        )
    )
  );

  const groups_without_unplaced_tickets = sortedGroups.filter((group) =>
    group.attributes.orders?.data.every(
      (order) =>
        order.attributes.items?.data.every(
          (item) => item.attributes.seat.data
        )
    )
  );
  const matchesSearch = (group: typeof groups[number]) => group.attributes.name.toLowerCase().includes(search.trim().toLowerCase());
  const visibleUnplacedGroups = groups_with_unplaced_tickets.filter(matchesSearch);
  const visiblePlacedGroups = groups_without_unplaced_tickets.filter(matchesSearch);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-white/10 p-4">
        <div>
          <h1 className="text-xl font-bold text-white">Ryhmät <span className="text-sm font-normal text-slate-400">{groups.length}</span></h1>
        </div>
        <div className="mt-3">
          <input
              type="text"
              aria-label="Hae ryhmiä nimellä"
              placeholder="Hae ryhmän nimellä…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#101a2b] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
            />
        </div>
        <div className="mt-3 flex gap-2">
            <select 
              aria-label="Järjestä ryhmät"
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
              aria-label="Suodata ryhmiä lipputyypin mukaan"
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
            {(search || selectedTicketType || orderFilters.kutsuvieras || orderFilters.erikoisjarjestely) &&
              <button type="button" className="px-2 text-xs text-sky-300 hover:underline" onClick={() => { setSearch(''); setSelectedTicketType(''); setOrderFilters({ ...orderFilters, kutsuvieras: false, erikoisjarjestely: false, ticketType: '' }); }}>Tyhjennä</button>}
          </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4" ref={scrollableDivRef} onScroll={event => { listScrollPosition.current = event.currentTarget.scrollTop; }}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-200">Plassaamattomat ({visibleUnplacedGroups.length})</h2>
        {visibleUnplacedGroups.map((group) => {
          const orders = group.attributes.orders?.data || [];
          const totalTickets = orders.reduce(
            (sum, order) => sum + (order.attributes.items?.data.length || 0),
            0
          );
          const placedTickets = orders.reduce(
            (sum, order) =>
              sum +
              (order.attributes.items?.data.filter(
                (item) => item.attributes.seat.data
              ).length || 0),
            0
          );

          const hasSpecialArrangements = orders.some(
            (order) => order.attributes.customer?.data.attributes.special_arragements
          );
          const hasInvite = orders.some((order) => order.attributes.kutsuvieras);

          return (
            <div
                key={group.id}
                role="button" tabIndex={0} aria-label={`Avaa ryhmä: ${group.attributes.name}`}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedGroup(group); } }}
                className="mb-2 flex cursor-pointer flex-col rounded-xl border border-white/10 bg-[#223149] p-3 transition-colors hover:border-white/25 hover:bg-[#293c57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                onClick={() => setSelectedGroup(group)}
              >
              <div className="flex-col justify-between items-center">
                <p className="text-md font-bold truncate max-w-full">{group.attributes.name}</p>
                <div className="flex gap-x-12 items-center">
                  <p className="text-md">
                    {orders.length} tilausta
                  </p>
                  <p className="text-md">
                    {placedTickets}/{totalTickets} paikkaa
                  </p>
                </div>
              </div>
              <div className="flex items-center mt-4 gap-4">
                <div
                  className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                    placedTickets,
                    totalTickets
                  )} mr-2`}
                ></div>
                <div className="flex items-center gap-2 flex-[1] justify-end">
                  {hasSpecialArrangements && (
                    <DisabledSvg height={40} width={40} />
                  )}
                  {hasInvite && (
                    <InviteSvg height={40} width={40} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {visibleUnplacedGroups.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">Ei hakua vastaavia ryhmiä.</p>}
        <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-200">Plassatut ({visiblePlacedGroups.length})</h2>
        {/* Sort so that groups with ticket sent are last */}
        {visiblePlacedGroups.sort((a, b) => {
          const a_sent = a.attributes.orders?.data.every((order) => order.attributes.tickets_sent === true);
          const b_sent = b.attributes.orders?.data.every((order) => order.attributes.tickets_sent === true);
          if (a_sent && !b_sent) return 1;
          if (!a_sent && b_sent) return -1;
          return 0;
        }).map((group) => {
          const orders = group.attributes.orders?.data || [];
          const totalTickets = orders.reduce(
            (sum, order) => sum + (order.attributes.items?.data.length || 0),
            0
          );
          const placedTickets = orders.reduce(
            (sum, order) =>
              sum +
              (order.attributes.items?.data.filter(
                (item) => item.attributes.seat.data
              ).length || 0),
            0
          );

          const hasSpecialArrangements = orders.some(
            (order) => order.attributes.customer?.data.attributes.special_arragements
          );
          const hasInvite = orders.some((order) => order.attributes.kutsuvieras);
          const all_orders_sent = orders.every((order) => order.attributes.tickets_sent === true);


          return (
            <div
                key={group.id}
                role="button" tabIndex={0} aria-label={`Avaa ryhmä: ${group.attributes.name}`}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedGroup(group); } }}
                className="mb-2 flex cursor-pointer flex-col rounded-xl border border-white/10 bg-[#223149] p-3 transition-colors hover:border-white/25 hover:bg-[#293c57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                onClick={() => setSelectedGroup(group)}
              >
              { all_orders_sent && 
              <div className="mb-2 w-fit rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">
                Liput Lähetetty
              </div>
              }
              <div className="flex-col justify-between mt-2 items-center">
                <p className="text-md font-bold truncate max-w-full">{group.attributes.name}</p>
                <div className="flex gap-x-12 items-center">
                  <p className="text-md">
                    {orders.length} tilausta
                  </p>
                  <p className="text-md">
                    {placedTickets}/{totalTickets} paikkaa
                  </p>
                </div>
              </div>
              <div className="flex items-center mt-2 gap-4">
                <div
                  className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                    placedTickets,
                    totalTickets
                  )} mr-2`}
                ></div>
                <div className="flex items-center gap-2 flex-[1] justify-end">
                  {hasSpecialArrangements && (
                    <DisabledSvg height={40} width={40} />
                  )}
                  {hasInvite && (
                    <InviteSvg height={40} width={40} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visiblePlacedGroups.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">Ei hakua vastaavia ryhmiä.</p>}
      </div>
    </div>
  );
};

export default GroupsDrawer;
