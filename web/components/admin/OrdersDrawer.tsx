import { useState } from "react";
import { useAdminContext } from "./AdminContext";
import TicketList from "./TicketList";

const OrdersDrawer = () => {
  const { orders, selectedOrder, setSelectedOrder } = useAdminContext();
  const [search, setSearch] = useState('');

  const getOrderStatusColor = (placedCount: number, totalCount: number) => {
    if (placedCount === 0) return 'bg-red-500'; // All unplaced
    if (placedCount === totalCount) return 'bg-green-500'; // All placed
    return 'bg-yellow-500'; // Some unplaced
  };

  if (selectedOrder) {
    // Render selected order details
    const totalCount = selectedOrder.attributes.items?.data.length || 0;
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
            <p className="text-md">
              Ryhmä: {selectedOrder.attributes.group?.data?.attributes.name || 'N/A'}
            </p>
          </div>
          <div className="flex items-center mt-4">
            <div
              className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                tickets.filter((item) => item.attributes.seat.data).length,
                totalCount
              )} mr-2`}
            ></div>
            <p className="text-md">
              {tickets.filter((item) => item.attributes.seat.data).length}/{totalCount} paikkaa
            </p>
          </div>
          <div className="mb-16">
            <TicketList tickets={tickets} />
          </div>
        </div>
      </div>
    );
  }

  const placedOrders = orders.filter(
    (order) =>
      order.attributes.items &&
      order.attributes.items.data.every((item) => item.attributes.seat.data) // All items placed
  );

  const unplacedOrders = orders.filter(
    (order) =>
      order.attributes.items &&
      order.attributes.items.data.some((item) => !item.attributes.seat.data) // Items without seats
  );

  return (
    <div className="p-6 pl-2 pr-0 h-full w-full flex flex-col">
      <div className="flex items-center flex-col mb-8">
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
        <div className="flex items-center gap-2 mt-4 pl-4">
          Tähän muita filttereitä
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
                <p className="text-md">
                  Ryhmä: {order.attributes.group?.data?.attributes.name || 'N/A'}
                </p>
              </div>
              <div className="flex items-center mt-4">
                <div
                  className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                    placedCount,
                    totalCount
                  )} mr-2`}
                ></div>
                <p className="text-md">
                  {placedCount}/{totalCount} paikkaa
                </p>
              </div>
            </div>
          );
        })}

        <h2 className="text-md font-bold mt-6">Plassatut</h2>
        {placedOrders.filter((order) => { 
          const fullName = `${order.attributes.customer?.data.attributes.firstName} ${order.attributes.customer?.data.attributes.lastName}`;
          return fullName.toLowerCase().includes(search.toLowerCase());
        }).map((order) => {
          const totalCount = order.attributes.items?.data.length || 0;

          return (
            <div
              key={order.id}
              className="flex items-center justify-between bg-[#868686] rounded-md p-4 mr-1 mb-4 cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <p className="text-sm font-bold">
                    {order.attributes.customer?.data.attributes.firstName}{' '}
                    {order.attributes.customer?.data.attributes.lastName}
                  </p>
                  <p className="text-sm">
                    {totalCount}/{totalCount} paikkaa
                  </p>
                </div>
              </div>
              <p className="text-sm">
                Ryhmä: {order.attributes.group?.data?.attributes.name || 'N/A'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersDrawer;
