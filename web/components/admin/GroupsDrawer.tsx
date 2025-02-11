import { useEffect, useRef, useState } from "react";
import { useAdminContext } from "./AdminContext";
import TicketList from "./TicketList";
import DisabledSvg from "./DisabledSvg";
import InviteSvg from "./InviteSvg";

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
  } = useAdminContext();
  const [search, setSearch] = useState("");
  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const [listScrollPosition, setListScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableDivRef.current) {
        setListScrollPosition(scrollableDivRef.current.scrollTop);
      }
    };

    const div = scrollableDivRef.current;
    if (div) {
      div.addEventListener('scroll', handleScroll);
      div.scrollTop = listScrollPosition; // Set initial scroll position
    }
    
    return () => {
      if (div) {
        div.removeEventListener('scroll', handleScroll);
      }
    };

  }, [listScrollPosition, setListScrollPosition, selectedGroup]);

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
      <div className="py-4 px-2 flex flex-col items-start w-full h-full">
        <button
          className="mb-4 underline"
          onClick={() => setSelectedGroup(null)}
        >
          ← Takaisin ryhmiin
        </button>
        <h1 className="text-xl font-bold mb-4 truncate max-w-full select-text">Ryhmä: {selectedGroup.attributes.name}</h1>

        <div className="flex flex-col flex-1 bg-[#868686] border-4 border-[#868686] rounded-md p-2 overflow-y-auto w-full mb-16">
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
                className="flex flex-col bg-[#5e5e5e] rounded-md py-4 px-2 mb-4"
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
                <div className="flex items-center justify-between">
                  <p className="text-sm mt-2 cursor-pointer select-text">
                    Email: <span onClick={() => navigator.clipboard.writeText(order.attributes.customer?.data.attributes.email)} className="cursor-pointer hover:underline">{order.attributes.customer?.data.attributes.email}</span>
                  </p>
                  {unplacedCount === 0 && (order.attributes.tickets_sent === true ?
                  <button className="bg-gray-500 text-white p-1 rounded-md cursor-not-allowed
                  " disabled>
                    Liput Lähetetty
                  </button> :
                  <button onClick={() => handleSendTickets(order, selectedGroup.attributes.name)} className="bg-green-500 text-white p-1 rounded-md">
                    Lähetä liput
                  </button>)
                  }
                </div>
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

  return (
    <div className="p-6 pl-2 pr-0 h-full w-full flex flex-col">
      <div className="flex items-center flex-col mb-4">
        <div className="flex gap-4 justify-start w-full ml-2">
          <h1 className="text-2xl font-bold mr-4">Ryhmät ({groups.length})</h1>
          <input
              type="text"
              placeholder="Hae nimellä"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[40%] p-1 rounded-sm text-sm text-black"
            />
        </div>
        {/* Sort and Filter Section */}
        <div className="flex gap-4 items-center my-2">
          <div className="flex-col">
            <select 
              value={orderSortOption}
              onChange={handleSortChange} 
              className="p-1 bg-[#868686] rounded-md mb-1"
            >
              <option value="newest">Uusin ensin</option>
              <option value="oldest">Vanhin ensin</option>
              <option value="largest">Suurin ensin</option>
              <option value="smallest">Pienin ensin</option>
            </select>
            <select 
              value={selectedTicketType} 
              onChange={handleSelectTicketType}
              className="p-1 bg-[#868686] rounded-md"
            >
              <option value="">Kaikki lipputyypit</option>
              {ticketTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pr-2">
            <label onClick={() => toggleFilter('kutsuvieras')} className={orderFilters.kutsuvieras ? 'bg-red-700 rounded-md p-[2px]' : 'p-[2px]'}>
              Kutsuvieras
            </label>
            <label onClick={() => toggleFilter('erikoisjarjestely')} className={orderFilters.erikoisjarjestely ? 'bg-red-700 rounded-md p-[2px]' : 'p-[2px]'}>
              Erikoisjärjestely
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-16" ref={scrollableDivRef}>
        <h2 className="text-md font-bold mb-4">Plassaamattomat ({groups_with_unplaced_tickets.length})</h2>
        {groups_with_unplaced_tickets.filter((group) => { 
          return group.attributes.name.toLowerCase().includes(search.toLowerCase());
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

          return (
            <div
                key={group.id}
                className="flex flex-col bg-[#868686] rounded-md p-4 mr-1 mb-4 cursor-pointer"
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

        <h2 className="text-md font-bold mt-6 mb-4">Plassatut ({groups_without_unplaced_tickets.length})</h2>
        {/* Sort so that groups with ticket sent are last */}
        {groups_without_unplaced_tickets.filter((group) => { 
          return group.attributes.name.toLowerCase().includes(search.toLowerCase());
        }).sort((a, b) => {
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
                className="flex flex-col bg-[#868686] rounded-md p-4 mr-1 mb-4 cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
              { all_orders_sent && 
              <div className="bg-green-500 text-white p-1 -m-2 mb-0 rounded-md">
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
      </div>
    </div>
  );
};

export default GroupsDrawer;
