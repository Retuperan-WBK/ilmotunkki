'use client';

import { Item } from "@/utils/models";
import { useAdminContext } from "./AdminContext";

const TicketList = ({tickets} : {tickets: Item[]}) => {

  const { selectedTicket, setSelectedTicket, setMode} = useAdminContext();

  const getTicketStatusColor = (ticket: Item) => {
    if (ticket.attributes.seat.data) return "bg-green-500"; // Placed
    return "bg-red-500"; // Unplaced
  };

  const getTicketSeatNumber = (ticket: Item) => {
    if (ticket.attributes.seat && ticket.attributes.seat.data) {
      const number = ticket.attributes.seat.data.attributes.Number;
      const row = ticket.attributes.seat.data.attributes.Row;

      return `R:${row} N:${number}`;
    }
    return 'EI PAIKKAA';
  };

  const getTicketSection = (ticket: Item) => {
    if (ticket.attributes.seat && ticket.attributes.seat.data) {
      return ticket.attributes.seat.data.attributes.section.data.attributes.Name;
    }
    return '';
  }

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

  return (
    <div className="mt-4">
      <h2 className="text-md font-bold mb-2">Liput:</h2>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="flex items-center justify-between bg-[#3D3D3D] rounded-md mb-2 py-4 px-1"
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
          <div className="ml-2">
            <p className="text-sm">{getTicketSection(ticket)}</p>
            <p className="text-sm">{getTicketSeatNumber(ticket)}</p>
          </div>
          <button
            className="text-white px-2 py-1 rounded-md text-sm"
            style={selectedTicket && selectedTicket.id === ticket.id ? { backgroundColor: "green" } : { backgroundColor: 'gray' }}
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
  );
}

export default TicketList;