'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Item } from "@/utils/models";
import { useAdminContext } from "./AdminContext";

const SpecialSeatNotice = ({ description }: { description: string }) => {
  const tooltipId = useId();
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean } | null>(null);

  const show = (target: HTMLButtonElement) => {
    const rect = target.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
      top: rect.bottom + 100 > window.innerHeight ? rect.top - 8 : rect.bottom + 8,
      above: rect.bottom + 100 > window.innerHeight,
    });
  };

  return <>
    <button type="button" aria-label="Paikan erityishuomio" aria-describedby={position ? tooltipId : undefined}
      onMouseEnter={event => show(event.currentTarget)} onMouseLeave={() => setPosition(null)}
      onFocus={event => show(event.currentTarget)} onBlur={() => setPosition(null)}
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#961816] text-xs font-bold text-white ring-1 ring-red-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400">!</button>
    {position && createPortal(
      <div id={tooltipId} role="tooltip" className="pointer-events-none fixed z-[100] max-h-[40vh] w-80 max-w-[calc(100vw-16px)] overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-red-400/60 bg-[#961816] p-3 text-sm text-white shadow-xl"
        style={{ left: position.left, top: position.top, transform: position.above ? 'translateY(-100%)' : undefined }}>
        <strong>Paikan huomio:</strong> {description}
      </div>, document.body
    )}
  </>;
};

const TicketList = ({tickets, tickets_sent} : {tickets: Item[], tickets_sent?: boolean}) => {

  const { selectedTicket, setSelectedTicket, setMode, removeTicketFromSeat, removeMultipleTicketsFromSeat, confirmAction } = useAdminContext();

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

  const handleRemoveAllTicketsFromSeat = async () => {

    if (tickets_sent) {
      alert('Nämä liput on jo lähetetty, et voi muokata tätä tilausta');
      return;
    }

    const ticketIdsWithSeat = tickets.filter(ticket => ticket.attributes.seat.data).map(ticket => ticket.id);
    if (!ticketIdsWithSeat.length || !await confirmAction({
      title: 'Poista kaikki paikat?',
      message: `Paikat poistetaan ${ticketIdsWithSeat.length} lipulta tässä tilauksessa.`,
      confirmLabel: 'Poista paikat',
      tone: 'danger',
    })) return;
    removeMultipleTicketsFromSeat(ticketIdsWithSeat);
  }


  const handleRemoveTicketFromSeat = async (ticket: Item) => {
    if (tickets_sent) {
      alert('Nämä liput on jo lähetetty, et voi muokata tätä tilausta');
      return;
    }
    if (!await confirmAction({
      title: 'Poista lippu paikalta?',
      message: `Lipun paikka ${getTicketSeatNumber(ticket)} vapautetaan.`,
      confirmLabel: 'Poista paikka',
      tone: 'danger',
    })) return;
    removeTicketFromSeat(ticket.id);
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
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Liput ({tickets.length})</h2>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#162337] px-2 py-3"
          style={{
            borderLeft: `4px solid ${ticketBorderColor(ticket)}`,
          }}
        >
          <div
            className={`h-3 w-3 shrink-0 rounded-full ${getTicketStatusColor(
              ticket
            )}`}
          ></div>
          <p className="min-w-0 flex-[4] truncate text-center text-xs font-semibold text-white">
            {ticket.attributes.itemType?.data?.attributes.slug || "Unknown"}{" "}
          </p>
          <div className="min-w-0 flex-[8]">
            <p className="truncate text-xs text-slate-400">{getTicketSection(ticket)}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium">{getTicketSeatNumber(ticket)}</p>
              {ticket.attributes.seat.data?.attributes.special?.trim() &&
                <SpecialSeatNotice description={ticket.attributes.seat.data.attributes.special} />}
            </div>
          </div>
          <div className="flex flex-col items-center flex-[4]">
            {tickets_sent ? 
              null :
            <button
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${selectedTicket?.id === ticket.id ? 'bg-amber-500/20 text-amber-100' : 'bg-sky-500/20 text-sky-100 hover:bg-sky-500/30'}`}
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
            {!tickets_sent && ticket.attributes.seat.data &&
              <button type="button" className="mt-1 text-[11px] text-slate-400 hover:text-rose-300 hover:underline" onClick={() => handleRemoveTicketFromSeat(ticket)}>Poista paikka</button>}
          </div>
        </div>
      ))}
      {tickets_sent ? null :
      <p
        className="mt-2 inline rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-rose-200"
        onClick={handleRemoveAllTicketsFromSeat}
      >
        Poista kaikki tilauksen plassit
      </p>
      }
    </div>
  );
}

export default TicketList;
