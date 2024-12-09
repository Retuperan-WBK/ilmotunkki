'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Order, AdminGroup, Section, Seat, ItemType } from '@/utils/models';

interface AdminContextProps {
  orders: Order[];
  groups: AdminGroup[];
  sections: Section[];
  activeSectionId: number | null;
  currentMode: 'add-seat' | 'edit-seat' | 'add-ticket-to-seat' | 'remove-ticket-from-seat' | 'change-ticket-seat' | null;
  setMode: (mode: AdminContextProps['currentMode']) => void;
  setSelectedTicket: (ticketId: number | null) => void;
  setActiveSection: (sectionId: number) => void;
  selectedTicketId: number | null;
  activeSection: Section | null;
  addSeat: (sectionId: number, seatData: Partial<Seat['attributes']>) => Promise<void>;
  updateSeat: (seatId: number, seatData: Partial<Seat['attributes']>) => Promise<void>;
  deleteSeat: (seatId: number) => Promise<void>;
  addTicketToSeat: (ticketId: number, seatId: number) => Promise<void>;
  removeTicketFromSeat: (ticketId: number) => Promise<void>;
  changeTicketSeat: (ticketId: number, newSeatId: number) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  fetchSections: () => Promise<void>;
  handleMapClick: (x: number, y: number) => void;
  handleSeatClick: (seat: Seat) => void;
  newSeat: NewSeat;
  setNewSeat: (newSeat: NewSeat) => void;
  selectedSeat: Seat | null;
  setSelectedSeat: (seat: Seat | null) => void;
  itemTypes: ItemType[];
  fetchItemTypes: () => Promise<void>;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

type NewSeat = {
  row: string;
  seatNumber: string;
  special: string;
  itemType: number;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<AdminContextProps['currentMode']>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);

  // MapDrawer
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [newSeat, setNewSeat] = useState<NewSeat>({ row: '1', seatNumber: '1', special: '', itemType: 0 });

  // Fetch all orders
  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data);
  };

  // Fetch item types function
  const fetchItemTypes = async () => {
    const res = await fetch("/api/admin/itemtypes");
    const data = await res.json();
    setItemTypes(data);
  };

  // Fetch all groups
  const fetchGroups = async () => {
    const res = await fetch("/api/admin/groups");
    const data = await res.json();
    setGroups(data);
  };

  // Fetch all sections (with seats populated)
  const fetchSections = async () => {
    const res = await fetch("/api/admin/sections");
    const data = await res.json();
    setSections(data);

    // Automatically set the active section to the first one if none is set
    if (!activeSectionId && data.length > 0) {
      setActiveSectionId(data[0].id);
    }
  };

  // **Add Seat**
  const addSeat = async (sectionId: number, seatData: Partial<Seat['attributes']>) => {
    await fetch(`/api/admin/seats`, {
      method: 'POST',
      body: JSON.stringify({ sectionId, ...seatData, Row: newSeat.row, Number: newSeat.seatNumber, special: newSeat.special, itemType: newSeat.itemType }),
      headers: { 'Content-Type': 'application/json' },
    });
    await fetchSections();
    // Automatically up the seat number for the next seat by 1
    setNewSeat({ ...newSeat, seatNumber: (parseInt(newSeat.seatNumber) + 1).toString() });
  };

  // **Edit Seat**
  const updateSeat = async (seatId: number, seatData: Partial<Seat['attributes']>) => {
    await fetch(`/api/admin/seats/${seatId}`, {
      method: 'PUT',
      body: JSON.stringify(seatData),
      headers: { 'Content-Type': 'application/json' },
    });
    await fetchSections();
  };

  const deleteSeat = async (seatId: number) => {
    await fetch(`/api/admin/seats/${seatId}`, {
      method: 'DELETE',
    });
    await fetchSections();
  }

  // **Add Ticket to Seat**
  const addTicketToSeat = async (ticketId: number, seatId: number) => {
    await fetch(`/api/admin/tickets/${ticketId}/assign-seat`, {
      method: 'POST',
      body: JSON.stringify({ seatId }),
      headers: { 'Content-Type': 'application/json' },
    });
    await fetchOrders();
    await fetchSections();
  };

  // **Remove Ticket from Seat**
  const removeTicketFromSeat = async (ticketId: number) => {
    await fetch(`/api/admin/tickets/${ticketId}/remove-seat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    await fetchOrders();
    await fetchSections();
  };

  // **Change Ticket from Seat to Another**
  const changeTicketSeat = async (ticketId: number, newSeatId: number) => {
    await fetch(`/api/admin/tickets/${ticketId}/change-seat`, {
      method: 'POST',
      body: JSON.stringify({ seatId: newSeatId }),
      headers: { 'Content-Type': 'application/json' },
    });
    await fetchOrders();
    await fetchSections();
  };

  const setActiveSection = (sectionId: number) => {
    setActiveSectionId(sectionId);
    console.log('Active Section:', sections.find((section) => section.id === sectionId));
  };

  const activeSection = sections.find((section) => section.id === activeSectionId) || null;

  const handleSeatClick = (seat: Seat) => {
    if (!currentMode) return;

    console.log('Seat Clicked:', currentMode);

    switch (currentMode) {
      case 'edit-seat':
        setSelectedSeat(seat);
        break;
      case 'add-ticket-to-seat':
        console.log('Add Ticket to Seat', seat);
        break;
      case 'remove-ticket-from-seat':
        console.log('Remove Ticket from Seat', seat);
        break;
      case 'change-ticket-seat':
        console.log('Change Ticket Seat', seat);
        break;
    }
  };

  const handleMapClick = (x: number, y: number) => {

    console.log('Map Clicked:', x, y);

    if (currentMode === 'add-seat' && activeSectionId) {
      addSeat(activeSectionId, { x_cord: x, y_cord: y });
    }
  };

  useEffect(() => {
    // Initial fetch of data
    fetchOrders();
    fetchGroups();
    fetchSections();
    fetchItemTypes();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        orders,
        groups,
        sections,
        activeSectionId,
        activeSection,
        setActiveSection,
        currentMode,
        setMode: setCurrentMode,
        selectedTicketId,
        setSelectedTicket: setSelectedTicketId,
        addSeat,
        updateSeat,
        deleteSeat,
        addTicketToSeat,
        removeTicketFromSeat,
        changeTicketSeat,
        fetchOrders,
        fetchGroups,
        fetchSections,
        handleMapClick,
        handleSeatClick,
        selectedSeat,
        setSelectedSeat,
        itemTypes,
        fetchItemTypes,
        newSeat,
        setNewSeat,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
