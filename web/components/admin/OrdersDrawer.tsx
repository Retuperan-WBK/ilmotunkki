import { useState } from "react";
import { useAdminContext } from "./AdminContext";
import TicketList from "./TicketList";
import InviteSvg from "./InviteSvg";
import DisabledSvg from "./DisabledSvg";
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
    setOrderFilters
  } = useAdminContext();
  const [search, setSearch] = useState('');

  const getOrderStatusColor = (placedCount: number, totalCount: number) => {
    if (placedCount === 0) return 'bg-red-500'; // All unplaced
    if (placedCount === totalCount) return 'bg-green-500'; // All placed
    return 'bg-yellow-500'; // Some unplaced
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderSortOption(e.target.value as 'newest' | 'oldest' | 'largest' | 'smallest');
  };

  const toggleFilter = (filterName: 'kutsuvieras' | 'erikoisjarjestely') => {
    const newFilters = { ...orderFilters, [filterName]: !orderFilters[filterName] };
    setOrderFilters(newFilters);
  };

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
    const hasSpecialArrangement = order.attributes.customer.data.attributes.special_arragements || false;
    const isGuest = order.attributes.kutsuvieras|| false;

    if (orderFilters.kutsuvieras && !isGuest) return false;
    if (orderFilters.erikoisjarjestely && !hasSpecialArrangement) return false;

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
      <div className="py-4 px-2 flex flex-col items-start w-full h-full">
        <button
          className="mb-4 underline"
          onClick={() => setSelectedOrder(null)}
        >
          ← Takaisin tilauksiin
        </button>
        <h1 className="text-xl font-bold mb-4">Tilauksen Tiedot</h1>
        <div className="flex w-full flex-1 flex-col bg-[#868686] border-4 border-[#868686] rounded-md p-2 overflow-y-auto">
          <div className="flex justify-between items-center">
            <p className="text-md font-bold">
              {selectedOrder.attributes.customer?.data.attributes.firstName}{' '}
              {selectedOrder.attributes.customer?.data.attributes.lastName}
            </p>
            {selectedOrder.attributes.group.data &&
            <p className="text-md">
              Ryhmä: {selectedOrder.attributes.group?.data?.attributes.name || 'N/A'}
            </p>
            }
          </div>
          <p className="text-sm mt-2 cursor-pointer">
            Email: <span onClick={() => navigator.clipboard.writeText(selectedOrder.attributes.customer?.data.attributes.email)} className="cursor-pointer hover:underline">{selectedOrder.attributes.customer?.data.attributes.email}</span>
          </p>
          <div className="flex items-center justify-between mt-4">
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
            {unplaced === 0 && (selectedOrder.attributes.tickets_sent === true ?
            <button className="bg-gray-500 text-white p-1 rounded-md cursor-not-allowed
            " disabled>
              Liput Lähetetty
            </button> :
            <button onClick={() => handleSendTickets(selectedOrder, selectedOrder.attributes.group.data?.attributes.name)} className="bg-green-500 text-white p-1 rounded-md">
              Lähetä liput
            </button>)
            }
          </div>
          <div className="border-y-2 border-gray-400">
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
          <div className="mb-16">
            <TicketList tickets={tickets} tickets_sent={selectedOrder.attributes.tickets_sent} />
          </div>
        </div>
      </div>
    );
  }

  const placedOrders = sortedOrders.filter(
    (order) =>
      order.attributes.items &&
      order.attributes.items.data.every((item) => item.attributes.seat.data) // All items placed
  );

  const unplacedOrders = sortedOrders.filter(
    (order) =>
      order.attributes.items &&
      order.attributes.items.data.some((item) => !item.attributes.seat.data) // Items without seats
  );

  return (
    <div className="p-6 pl-2 pr-0 h-full w-full flex flex-col">
      <div className="flex items-center flex-col">
        <div className="flex gap-4">
          <h1 className="text-2xl font-bold">Tilaukset</h1>
          <input
              type="text"
              placeholder="Hae nimellä"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-1/2 p-1 rounded-sm text-sm text-black"
            />
            {search &&
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

      <div className="py-4 flex-1 overflow-y-auto mb-16">
        <h2 className="text-md font-bold">Plassaamattomat</h2>
        {unplacedOrders.filter((order) => { 
          const fullName = `${order.attributes.customer?.data.attributes.firstName} ${order.attributes.customer?.data.attributes.lastName}`;
          return fullName.toLowerCase().includes(search.toLowerCase());
        }).map((order) => {
          const totalCount = order.attributes.items?.data.length || 0;
          const placedCount =
            order.attributes.items?.data.filter((item) => item.attributes.seat.data).length || 0;

          return (
            <div
              key={order.id}
              className="flex flex-col bg-[#868686] rounded-md p-4 mr-1 mb-4 cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex justify-between items-center">
                <p className="text-md font-bold">
                  {order.attributes.customer?.data.attributes.firstName}{' '}
                  {order.attributes.customer?.data.attributes.lastName}
                </p>
                {order.attributes.group.data &&
                <p className="text-md">
                  Ryhmä: {order.attributes.group?.data?.attributes.name || 'N/A'}
                </p>
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

        <h2 className="text-md font-bold mt-6">Plassatut</h2>
        {/* Sort so that orders with ticket sent are last */}
        {placedOrders.filter((order) => { 
          const fullName = `${order.attributes.customer?.data.attributes.firstName} ${order.attributes.customer?.data.attributes.lastName}`;
          return fullName.toLowerCase().includes(search.toLowerCase());
        })
        .sort((a, b) => a.attributes.tickets_sent === b.attributes.tickets_sent ? 0 : a.attributes.tickets_sent ? 1 : -1)
        .map((order) => {
          const totalCount = order.attributes.items?.data.length || 0;

          return (
            <div
              key={order.id}
              className="flex flex-col bg-[#868686] rounded-md p-4 mr-1 mb-4 cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            > 
            { order.attributes.tickets_sent === true && 
            <div className="bg-green-500 text-white p-1 -m-2 mb-0 rounded-md">
              Liput Lähetetty
            </div>
            }
              <div className="flex justify-between items-center">
                <p className="text-md font-bold">
                  {order.attributes.customer?.data.attributes.firstName}{' '}
                  {order.attributes.customer?.data.attributes.lastName}
                </p>
                {order.attributes.group.data &&
                <p className="text-md">
                  Ryhmä: {order.attributes.group?.data?.attributes.name || 'N/A'}
                </p>
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
      </div>
    </div>
  );
};

export default OrdersDrawer;
