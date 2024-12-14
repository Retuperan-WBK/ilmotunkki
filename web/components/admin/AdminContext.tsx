'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Order, AdminGroup, Section, Seat, ItemType, Item } from '@/utils/models';

interface AdminContextProps {
  orders: Order[];
  groups: AdminGroup[];
  sections: Section[];
  activeSectionId: number | null;
  currentMode: 'add-seat' | 'edit-seat' | 'add-ticket-to-seat' | 'change-ticket-seat' | null;
  setMode: (mode: AdminContextProps['currentMode']) => void;
  setSelectedTicket: (ticketId: Item | null) => void;
  setActiveSection: (sectionId: number) => void;
  selectedTicket: Item | null;
  activeSection: Section | null;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  selectedGroup: AdminGroup | null;
  setSelectedGroup: (group: AdminGroup | null) => void;
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
  setSelectedSeat: (seat: ExtendedSeat | null) => void;
  itemTypes: ItemType[];
  fetchItemTypes: () => Promise<void>;
  filter: HighlightedSeat;
  setFilter: (filter: HighlightedSeat) => void;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

type NewSeat = {
  row: string;
  seatNumber: string;
  special: string;
  itemType: number;
};

interface ExtendedSeat extends Seat {
  itemTypeId?: number;
}

interface HighlightedSeat {
  filter: 'show-class' | 'show-itemtype' | 'highlight-group' | 'highlight-order' | null;
  showReserved: boolean;
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<AdminContextProps['currentMode']>(null);
  
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);

  // MapDrawer
  const [selectedSeat, setSelectedSeat] = useState<ExtendedSeat | null>(null);
  const [newSeat, setNewSeat] = useState<NewSeat>({ row: '1', seatNumber: '1', special: '', itemType: 0 });
  const [filter, setFilter] = useState<HighlightedSeat>({ filter: null, showReserved: true });

  // OrderDrawer and GroupDrawer
  const [selectedTicket, setSelectedTicket] = useState<Item | null>(null);

  // OrderDrawer

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // GroupDrawer

  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);

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
    await reFetch();
    // Automatically up the seat number for the next seat by 1
    setNewSeat({ ...newSeat, seatNumber: (parseInt(newSeat.seatNumber) + 1).toString() });
  };

  // **Edit Seat**
  const updateSeat = async (seatId: number, seatData: Partial<Seat['attributes']>,) => {
    console.log('updateSeat', JSON.stringify({ ...seatData, item_type: selectedSeat?.itemTypeId ? selectedSeat.itemTypeId : seatData.item_type?.data?.id }));
    await fetch(`/api/admin/seats/${seatId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...seatData, item_type: selectedSeat?.itemTypeId ? selectedSeat.itemTypeId : seatData.item_type?.data?.id }),
      headers: { 'Content-Type': 'application/json' },
    });
    await reFetch();
  };

  const deleteSeat = async (seatId: number) => {
    await fetch(`/api/admin/seats/${seatId}`, {
      method: 'DELETE',
    });
    await reFetch();
  }

  const addTicketToSeat = async (ticketId: number, seatId: number) => {
    try {

      // Check if the seat is not already occupied
      if (!activeSection) {
        console.error('Section not found');
        return;
      }

      const seat = activeSection.attributes.seats.data.find((seat) => seat.id === seatId);
      
      if (!seat) {
        console.error('Seat not found');
        return;
      }
      console.log('addTicketToSeat', seat);

      if (seat.attributes.item.data) {
        alert(`Seat R:${seat.attributes.Row} N:${seat.attributes.Number} is already occupied`);
        return;
      }

      const response = await fetch(`/api/admin/items/${ticketId}`, {
        method: 'POST',
        body: JSON.stringify({ seatId }),
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error adding ticket to seat:', errorData);
        return;
      }
  
      await reFetch();
    } catch (error) {
      console.error('Error in addTicketToSeat:', error);
    }
  };
  
  // **Remove Ticket from Seat**
  const removeTicketFromSeat = async (ticketId: number) => {
    try {
      const response = await fetch(`/api/admin/items/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error removing ticket from seat:', errorData);
        return;
      }
  
      await reFetch();
    } catch (error) {
      console.error('Error in removeTicketFromSeat:', error);
    }
  };
  
  // **Change Ticket from Seat to Another**
  const changeTicketSeat = async (ticketId: number, newSeatId: number) => {
    try {

      // Check if the seat is not already occupied
      const seat = activeSection?.attributes.seats.data.find((seat) => seat.id === newSeatId);
      if (!seat) {
        console.error('Seat not found');
        return;
      }

      if (seat.attributes.item.data) {
        alert(`Seat R:${seat.attributes.Row} N:${seat.attributes.Number} is already occupied`);
        return;
      }

      const response = await fetch(`/api/admin/items/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ seatId: newSeatId }),
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error changing ticket seat:', errorData);
        return;
      }

      await reFetch();
    } catch (error) {
      console.error('Error in changeTicketSeat:', error);
    }
  };

  const reFetch = async () => {
    fetchGroups();
    fetchOrders();
    fetchSections();
  }

  useEffect(() => {
    if (!groups) return;
    if (!selectedGroup) return;

    setSelectedGroup(groups.find((group) => group.id === selectedGroup.id) || null);
  }, [groups]);

  useEffect(() => {
    if (!orders) return;
    if (!selectedOrder) return;

    setSelectedOrder(orders.find((order) => order.id === selectedOrder.id) || null);
  }, [orders]);

  useEffect(() => {
    if (!sections) return;
    if (!activeSectionId) return;

    setActiveSectionId(activeSectionId);
  }, [sections]);

  const setActiveSection = (sectionId: number) => {
    setActiveSectionId(sectionId);
  };

  const activeSection = sections.find((section) => section.id === activeSectionId) || null;

  const handleSeatClick = (seat: Seat) => {
    if (!currentMode) return;

    switch (currentMode) {
      case 'edit-seat':
        setSelectedSeat(seat);
        break;
      case 'add-ticket-to-seat':
        if (!selectedTicket) return;
        addTicketToSeat(selectedTicket?.id, seat.id);
        setSelectedTicket(null);
        break;
      case 'change-ticket-seat':
        if (!selectedTicket) return;
        changeTicketSeat(selectedTicket?.id, seat.id);
        setSelectedTicket(null);
        break;
    }
  };

  const handleMapClick = (x: number, y: number) => {

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
        selectedTicket,
        setSelectedTicket,
        selectedOrder,
        setSelectedOrder,
        selectedGroup,
        setSelectedGroup,
        filter,
        setFilter,
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
