import { useState } from "react";
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
  } = useAdminContext();
  const [search, setSearch] = useState("");

  const getOrderStatusColor = (placedCount: number, totalCount: number) => {
    if (placedCount === 0) return "bg-red-500"; // All unplaced
    if (placedCount === totalCount) return "bg-green-500"; // All placed
    return "bg-yellow-500"; // Some unplaced
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderSortOption(e.target.value as 'newest' | 'oldest' | 'largest' | 'smallest');
  };

  const toggleFilter = (filterName: 'kutsuvieras' | 'erikoisjarjestely') => {
    const newFilters = { ...orderFilters, [filterName]: !orderFilters[filterName] };
    setOrderFilters(newFilters);
  };

  const filteredGroups = groups.filter((group) => {
    const hasSpecialArrangement = group.attributes.orders.data.some(
      (order) => order.attributes.customer?.data.attributes.special_arragements
    );
    const isGuest = group.attributes.orders.data.some(
      (order) => order.attributes.kutsuvieras
    );

    if (orderFilters.kutsuvieras && !isGuest) return false;
    if (orderFilters.erikoisjarjestely && !hasSpecialArrangement) return false;

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
        <h1 className="text-xl font-bold mb-4">Ryhmä: {selectedGroup.attributes.name}</h1>

        <div className="flex flex-col flex-1 bg-[#868686] border-4 border-[#868686] rounded-md p-2 overflow-y-auto w-full mb-16">
          <p className="text-md font-bold mb-4">
            Tilaukset ({orders.length})
          </p>
          {orders.map((order) => {
            const tickets = order.attributes.items?.data || [];
            const totalCount = tickets.length || 0;
            return (
              <div
                key={order.id}
                className="flex flex-col bg-[#5e5e5e] rounded-md py-4 px-2 mb-4"
              >
                <div className="flex justify-between items-center">
                  <p className="text-md font-bold">
                    {order.attributes.customer?.data.attributes.firstName}{" "}
                    {order.attributes.customer?.data.attributes.lastName}
                  </p>
                  <p className="text-md">
                    {tickets.filter((item) => item.attributes.seat.data).length}/{totalCount} paikkaa
                  </p>
                </div>
                <p className="text-sm mt-2 cursor-pointer">
                  Email: <span onClick={() => navigator.clipboard.writeText(order.attributes.customer?.data.attributes.email)} className="cursor-pointer hover:underline">{order.attributes.customer?.data.attributes.email}</span>
                </p>
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
                <TicketList tickets={tickets} />
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
        <div className="flex gap-4">
          <h1 className="text-2xl font-bold">Ryhmät</h1>
          <input
              type="text"
              placeholder="Hae nimellä"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-1/2 p-1 rounded-sm text-sm text-black"
            />
            { search &&
            <p
              className="bg-[#868686] rounded-md hover:underline cursor-pointer p-1"
              onClick={() => setSearch('')}
            >
              Tyhjennä
            </p>
            }
        </div>
        {/* Sort and Filter Section */}
        <div className="flex gap-4 items-center my-2">
          <select 
            value={orderSortOption} 
            onChange={handleSortChange} 
            className="p-2 bg-[#868686] rounded-md"
          >
            <option value="newest">Uusin ensin</option>
            <option value="oldest">Vanhin ensin</option>
            <option value="largest">Suurin ensin</option>
            <option value="smallest">Pienin ensin</option>
          </select>

          <label>
            <input 
              type="checkbox" 
              checked={orderFilters.kutsuvieras} 
              onChange={() => toggleFilter('kutsuvieras')} 
            />
            Kutsuvieras
          </label>

          <label>
            <input 
              type="checkbox" 
              checked={orderFilters.erikoisjarjestely} 
              onChange={() => toggleFilter('erikoisjarjestely')} 
            />
            Erikoisjärjestely
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-16">
        <h2 className="text-md font-bold mb-4">Plassaamattomat</h2>
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
              <div className="flex justify-between items-center">
                <p className="text-md font-bold">{group.attributes.name}</p>
                <p className="text-md">
                  {orders.length} tilausta
                </p>
                <p className="text-md">
                  {placedTickets}/{totalTickets} paikkaa
                </p>
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

        <h2 className="text-md font-bold mt-6 mb-4">Plassatut</h2>
        {groups_without_unplaced_tickets.filter((group) => { 
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
              <div className="flex justify-between items-center">
                <p className="text-md font-bold">{group.attributes.name}</p>
                <p className="text-md">
                  {orders.length} tilausta
                </p>
                <p className="text-md">
                  {placedTickets}/{totalTickets} paikkaa
                </p>
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
      </div>
    </div>
  );
};

export default GroupsDrawer;
