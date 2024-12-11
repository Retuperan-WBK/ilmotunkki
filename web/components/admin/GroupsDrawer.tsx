import { useAdminContext } from "./AdminContext";
import TicketList from "./TicketList";

const GroupsDrawer = () => {

  const { groups, selectedGroup, setSelectedGroup } = useAdminContext();

  const getOrderStatusColor = (placedCount: number, totalCount: number) => {
    if (placedCount === 0) return "bg-red-500"; // All unplaced
    if (placedCount === totalCount) return "bg-green-500"; // All placed
    return "bg-yellow-500"; // Some unplaced
  };

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

        <div className="flex flex-col flex-1 bg-[#868686] border-4 border-[#868686] rounded-md p-2 overflow-y-auto">
          <p className="text-md font-bold mb-4">
            Tilaukset:
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
                <TicketList tickets={tickets} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }  

  const groups_with_unplaced_tickets = groups.filter((group) =>
    group.attributes.orders?.data.some(
      (order) =>
        order.attributes.items?.data.some(
          (item) => !item.attributes.seat.data
        )
    )
  );

  const groups_without_unplaced_tickets = groups.filter((group) =>
    group.attributes.orders?.data.every(
      (order) =>
        order.attributes.items?.data.every(
          (item) => item.attributes.seat.data
        )
    )
  );

  return (
    <div className="p-6 pl-2 pr-0 h-full w-full flex flex-col">
      <h1 className="text-xl font-bold mb-4">Ryhmät</h1>

      <div className="flex-1 overflow-y-auto mb-16">
        <h2 className="text-md font-bold mb-4">Plassaamattomat</h2>
        {groups_with_unplaced_tickets.map((group) => {
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

          return (
            <div
              key={group.id}
              className="flex flex-col bg-[#868686] rounded-md  p-4 mr-1 mb-4 cursor-pointer"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex justify-between items-center">
                <p className="text-md font-bold">{group.attributes.name}</p>
                <p className="text-md">
                  {placedTickets}/{totalTickets} paikkaa
                </p>
              </div>
              <div className="flex items-center mt-4">
                <div
                  className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                    placedTickets,
                    totalTickets
                  )} mr-2`}
                ></div>
              </div>
            </div>
          );
        })}

        <h2 className="text-md font-bold mt-6 mb-4">Plassatut</h2>
        {groups_without_unplaced_tickets.map((group) => {
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

          return (
            <div
              key={group.id}
              className="flex flex-col bg-[#868686] rounded-md p-4 mr-1 mb-4 cursor-pointer"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex justify-between items-center">
                <p className="text-md font-bold">{group.attributes.name}</p>
                <p className="text-md">
                  {placedTickets}/{totalTickets} paikkaa
                </p>
              </div>
              <div className="flex items-center mt-4">
                <div
                  className={`w-4 h-4 rounded-full ${getOrderStatusColor(
                    placedTickets,
                    totalTickets
                  )} mr-2`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupsDrawer;
