'use client';

import { Item } from "@/utils/models";
import { useAdminContext } from "./AdminContext";

const TicketList = ({tickets, tickets_sent} : {tickets: Item[], tickets_sent?: boolean}) => {

  const { selectedTicket, setSelectedTicket, setMode, removeTicketFromSeat, removeMultipleTicketsFromSeat} = useAdminContext();

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
    if (tickets_sent) {
      alert('Nämä liput on jo lähetetty, et voi muokata tätä tilausta');
      return;
    }
    setMode('add-ticket-to-seat');
    setSelectedTicket(ticket);
  }

  const handleRemoveAllTicketsFromSeat = () => {

    if (tickets_sent) {
      alert('Nämä liput on jo lähetetty, et voi muokata tätä tilausta');
      return;
    }

    if (confirm('Haluatko varmasti poistaa plassin kaikista tilauksen lipuista?')) {
      const ticketIdsWithSeat = tickets.filter(ticket => ticket.attributes.seat.data).map(ticket => ticket.id);

      removeMultipleTicketsFromSeat(ticketIdsWithSeat);
    }
  }


  const handleRemoveTicketFromSeat = (ticket: Item) => {
    if (tickets_sent) {
      alert('Nämä liput on jo lähetetty, et voi muokata tätä tilausta');
      return;
    }
    if (confirm(`Haluatko varmasti poistaa lipun paikalta ${getTicketSeatNumber(ticket)}?`)) {
      removeTicketFromSeat(ticket.id);
    }
  }

  const handleMoveTicketToSeat = (ticket: Item) => {
    if (tickets_sent) {
      alert('Nämä liput on jo lähetetty, et voi muokata tätä tilausta');
      return;
    }
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
          <p className="text-sm flex-[4] font-semibold text-center">
            {ticket.attributes.itemType?.data?.attributes.slug || "Unknown"}{" "}
          </p>
          <div className="flex-[8]">
            <p className="text-sm">{getTicketSection(ticket)}</p>
            <p className="text-sm">{getTicketSeatNumber(ticket)}</p>
          </div>
          <div className="flex flex-col items-center flex-[4]">
            {tickets_sent ? 
              null :
            <button
              className="text-white px-2 py-1 rounded-md text-sm flex-[2]"
              style={selectedTicket && selectedTicket.id === ticket.id ? { backgroundColor: "green" } : { backgroundColor: 'gray' }}
              disabled={tickets_sent}
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
            }
            <p style={{ visibility: tickets_sent || !ticket.attributes.seat.data ? "hidden" : "visible" }} className="text-xs flex-[1] mt-2 mb-[-12px] hover:underline cursor-pointer" onClick={() => handleRemoveTicketFromSeat(ticket)}>
              Poista plassi
            </p>
          </div>
        </div>
      ))}
      {tickets_sent ? null :
      <p
        className="text-sm bg-opacity-80 text-white p-1 rounded-md mt-2 cursor-pointer inline hover:underline"
        onClick={handleRemoveAllTicketsFromSeat}
      >
        Poista kaikki tilauksen plassit
      </p>
      }
    </div>
  );
}

export default TicketList;