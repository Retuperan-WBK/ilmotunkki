import { AdminGroup, Item } from "@/utils/models";
import { useAdminContext } from "./AdminContext";
import { useEffect, useState } from "react";

const GroupsDrawer = () => {

  const { groups, selectedTicket, setSelectedTicket, setMode} = useAdminContext();
  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);

  const getOrderStatusColor = (placedCount: number, totalCount: number) => {
    if (placedCount === 0) return "bg-red-500"; // All unplaced
    if (placedCount === totalCount) return "bg-green-500"; // All placed
    return "bg-yellow-500"; // Some unplaced
  };

  const getTicketStatusColor = (ticket: Item) => {
    if (ticket.attributes.seat.data) return "bg-green-500"; // Placed
    return "bg-red-500"; // Unplaced
  };

  const getTicketSeatNumber = (ticket: Item) => {
    if (ticket.attributes.seat && ticket.attributes.seat.data) {
      const section = ticket.attributes.seat.data.attributes.section.data.attributes.Name;
      const number = ticket.attributes.seat.data.attributes.Number;
      const row = ticket.attributes.seat.data.attributes.Row;

      return `${section} R:${row} N:${number}`;
    }
    return "EI PAIKKAA";
  };

  const ticketBorderColor = (ticket: Item) => {
    switch (ticket.attributes.itemType.data.attributes.slug) {
      case "deluxe":
        return "#DAA520";
      case "iluokka":
        return "#C8C8C8";
      case "iiluokka":
        return "#E98E35";
      case "opiskelija":
        return "#E98E35";
      default:
        return "";
    }
  };

  const handleSetTicketToSeat = (ticket: Item) => {
    setMode('add-ticket-to-seat');
    setSelectedTicket(ticket);
  }

  const handleRemoveTicketFromSeat = (ticket: Item) => {
    setMode('remove-ticket-from-seat');
    setSelectedTicket(ticket);
  }

  const handleMoveTicketToSeat = (ticket: Item) => {
    setMode('change-ticket-seat');
    setSelectedTicket(ticket);
  }

  useEffect(() => {
    if (selectedGroup) {
      const group = groups.find((group) => group.id === selectedGroup.id);
      if (group) {
        setSelectedGroup(group);
      }
    }
  } , [groups, selectedGroup]);

  if (selectedGroup) {
    // Render selected group details
    const orders = selectedGroup.attributes.orders?.data || [];

    return (
      <div className="p-6 flex flex-col items-start w-full h-full">
        <button
          className="mb-4 underline"
          onClick={() => setSelectedGroup(null)}
        >
          ← Takaisin ryhmiin
        </button>
        <h1 className="text-xl font-bold mb-4">Ryhmä: {selectedGroup.attributes.name}</h1>
        <div className="flex w-full h-full flex-col bg-[#868686] border-4 border-[#868686] rounded-md p-4 pb-8 mb-4 overflow-y-scroll">
        <p className="text-md font-bold mb-4">
          Tilaukset:
        </p>
          {orders.map((order) => {
            const tickets = order.attributes.items?.data || [];
            const totalCount = tickets.length || 0;

            return (
              <div
                key={order.id}
                className="flex flex-col bg-[#3D3D3D] rounded-md p-4 mb-4"
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
                <div className="mt-4">
                  <h2 className="text-md font-bold mb-2">Liput:</h2>
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between bg-[#3D3D3D] rounded-md p-2 mb-2 py-4"
                      style={{
                        borderTop: `6px solid ${ticketBorderColor(ticket)}`,
                      }}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${getTicketStatusColor(
                          ticket
                        )} mr-2`}
                      ></div>
                      <p className="text-sm">
                        {ticket.attributes.itemType?.data?.attributes.slug || "Unknown"}{" "}
                      </p>
                      <p className="text-sm">{getTicketSeatNumber(ticket)}</p>
                      <button
                        className="text-white px-2 py-1 rounded-md"
                        style={selectedTicket && selectedTicket.id === ticket.id ? { backgroundColor: "green" } : { backgroundColor: 'red' }}
                        onClick={() => 
                        {
                          if (selectedTicket && selectedTicket.id === ticket.id) {
                            setSelectedTicket(null);
                          } else {
                          if (ticket.attributes.seat.data) {
                            handleMoveTicketToSeat(ticket);
                          } else {
                            handleSetTicketToSeat(ticket);
                          }}
                        }
                        }
                      >
                        {selectedTicket && selectedTicket.id === ticket.id ? "Peruuta" : ticket.attributes.seat.data ? "Siirrä" : "Plassaa"}
                      </button>
                    </div>
                  ))}
                </div>
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
    <div className="p-6">
      <h1 className="text-xl font-bold">Ryhmät</h1>


      <div className="py-4">
        <h2 className="text-md font-bold">Plassaamattomat</h2>
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
              className="flex flex-col bg-[#868686] rounded-md p-4 mb-4 cursor-pointer"
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

      <div className="py-4">
        <h2 className="text-md font-bold">Plassatut</h2>
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
              className="flex flex-col bg-[#868686] rounded-md p-4 mb-4 cursor-pointer"
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
