'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Order, AdminGroup, Section, Seat, ItemType, Item } from '@/utils/models';
import { handleAddTicketToSeat_State, handleChangeTicketSeat_State, handleRemoveTicketFromSeat_State, handleSetOrderTicketsSent_State, UpdatedItem } from './UnHolyFunctions';
import ConfirmDialog, { ConfirmOptions } from './ConfirmDialog';

interface AdminContextProps {
  orders: Order[];
  groups: AdminGroup[];
  sections: Section[];
  activeSectionId: number | null;
  currentMode: 'add-seat' | 'edit-seat' | 'add-ticket-to-seat' | 'change-ticket-seat' | 'multi-select' | null;
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
  deleteSeat: (seatId: number) => Promise<boolean>;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
  addTicketToSeat: (ticketId: number, seatId: number) => Promise<void>;
  removeTicketFromSeat: (ticketId: number) => Promise<void>;
  changeTicketSeat: (ticketId: number, newSeatId: number) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  fetchSections: () => Promise<void>;
  handleMapClick: (x: number, y: number, ctrl: boolean) => void;
  handleSeatClick: (seat: Seat) => void;
  newSeat: NewSeat;
  setNewSeat: (newSeat: NewSeat) => void;
  selectedSeat: ExtendedSeat | null;
  setSelectedSeat: (seat: ExtendedSeat | null) => void;
  itemTypes: ItemType[];
  fetchItemTypes: () => Promise<void>;
  filter: HighlightedSeat;
  setFilter: (filter: HighlightedSeat) => void;
  bottomDrawerOpen: boolean;
  setBottomDrawerOpen: (open: boolean) => void;
  handleSetActiveTab: (tab: 'tilaukset' | 'ryhmat' | 'kartta') => void;
  activeTab: 'tilaukset' | 'ryhmat' | 'kartta';
  setMultiSelectedSeats: (seats: Seat[]) => void;
  multiSelectedSeats: Seat[];
  updateMultipleSeats: (seats: {id: number, special: string | null}[]) => Promise<void>;
  orderSortOption: 'newest' | 'oldest' | 'largest' | 'smallest';
  setOrderSortOption: (option: 'newest' | 'oldest' | 'largest' | 'smallest') => void;
  orderFilters: { kutsuvieras: boolean, erikoisjarjestely: boolean, ticketType: string, noGroup: boolean};
  setOrderFilters: (filters: { kutsuvieras: boolean, erikoisjarjestely: boolean, ticketType: string, noGroup: boolean}) => void;
  handleSendTickets: (order: Order, groupName?: string) => void;
  handleSendTicketsManually: (order: Order, groupName?: string) => void;
  removeMultipleTicketsFromSeat: (ticketIds: number[]) => void;
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
  filter: 'show-class' | 'show-itemtype' | 'highlight-group' | 'highlight-order' | 'special' | null;
  showReserved: boolean;
}

const formatOrderTicketDetails = (order: Order, groupName?: string) => [
  `Tilaus: ${order.attributes.customer.data?.attributes.firstName || ''} ${order.attributes.customer.data?.attributes.lastName || ''}`,
  `Ryhmä: ${groupName || order.attributes.group.data?.attributes.name || 'Ei ryhmää'}`,
  'Liput:',
  ...order.attributes.items.data.map(item => {
    const seat = item.attributes.seat.data;
    return seat
      ? `${item.attributes.itemType.data.attributes.slug} — ${seat.attributes.section.data?.attributes.Name || ''}, rivi ${seat.attributes.Row}, paikka ${seat.attributes.Number}`
      : `${item.attributes.itemType.data.attributes.slug} — ei paikkaa`;
  }),
].join('\n');

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<AdminContextProps['currentMode']>(null);
  const [activeTab, setActiveTab] = useState<'tilaukset' | 'ryhmat' | 'kartta'>('tilaukset'); // State to track active tab
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);

  const [orderSortOption, setOrderSortOption] = useState<'newest' | 'oldest' | 'largest' | 'smallest'>('newest');
  const [orderFilters, setOrderFilters] = useState<{ kutsuvieras: boolean, erikoisjarjestely: boolean, ticketType: string, noGroup: boolean}>({ kutsuvieras: false, erikoisjarjestely: false, ticketType: '', noGroup: false });

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

  // BottomDrawer
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
  const [multiSelectedSeats, setMultiSelectedSeats] = useState<Seat[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const confirmResolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirmAction = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    confirmResolver.current?.(false);
    confirmResolver.current = resolve;
    setConfirmOptions(options);
  }), []);

  const resolveConfirm = useCallback((confirmed: boolean) => {
    const resolve = confirmResolver.current;
    confirmResolver.current = null;
    setConfirmOptions(null);
    resolve?.(confirmed);
  }, []);

  useEffect(() => () => {
    confirmResolver.current?.(false);
    confirmResolver.current = null;
  }, []);

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
  const fetchSections = useCallback(async () => {
    const res = await fetch("/api/admin/sections");
    const data = await res.json();
    setSections(data);

    setActiveSectionId(current => current ?? data[0]?.id ?? null);
  }, []);

  // **Add Seat**
  const addSeat = async (sectionId: number, seatData: Partial<Seat['attributes']>) => {
    if (!newSeat.itemType) return;
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
    await fetch(`/api/admin/seats/${seatId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...seatData, item_type: selectedSeat?.itemTypeId !== undefined ? (selectedSeat.itemTypeId || null) : (seatData.item_type?.data?.id ?? selectedSeat?.attributes.item_type.data?.id ?? null), special: selectedSeat?.attributes.special }),
      headers: { 'Content-Type': 'application/json' },
    });
    await reFetch();
  };

  const deleteSeat = async (seatId: number) => {
    if (!await confirmAction({
      title: 'Poista istuin?',
      message: `Istuin ${selectedSeat?.attributes.Row || ''} / ${selectedSeat?.attributes.Number || seatId} poistetaan kartalta.`,
      confirmLabel: 'Poista istuin',
      tone: 'danger',
    })) return false;
    await fetch(`/api/admin/seats/${seatId}`, { method: 'DELETE' });
    await reFetch();
    return true;
  }

  const updateMultipleSeats = async (seats: {id: number, special: string | null}[]) => {
    try {
      await Promise.all(
        seats.map((seat) =>
          fetch(`/api/admin/seats/${seat.id}`, {
            method: 'PUT',
            body: JSON.stringify({ item_type: newSeat.itemType, special: seat.special }),
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );
      await reFetch();
    } catch (error) {
      console.error('Error in updateMultipleSeats:', error);
    }
  };

  const addTicketToSeat = async (ticketId: number, seatId: number) => {
    try {
      // Check if the seat is not already occupied
      if (!activeSection) {
        console.error('Section not found');
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

      const data = await response.json() as UpdatedItem;
  
      const {
        updatedOrders,
        updatedGroups,
        updatedSections
      } = await handleAddTicketToSeat_State(orders, groups, sections, data);
      
      setOrders(updatedOrders as Order[]);
      setGroups(updatedGroups as AdminGroup[]);
      setSections(updatedSections as Section[]);
      
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
  
      const data = await response.json() as UpdatedItem;

      const {
        updatedOrders,
        updatedGroups,
        updatedSections
      } = await handleRemoveTicketFromSeat_State(orders, groups, sections, data);

      setOrders(updatedOrders as Order[]);
      setGroups(updatedGroups as AdminGroup[]);
      setSections(updatedSections as Section[]);

    } catch (error) {
      console.error('Error in removeTicketFromSeat:', error);
    }
  };

  const removeMultipleTicketsFromSeat = async (ticketIds: number[]) => {
    try {
      await Promise.all(
        ticketIds.map((ticketId) =>
          fetch(`/api/admin/items/${ticketId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );
      await reFetch();
    } catch (error) {
      console.error('Error in removeMultipleTicketsFromSeat:', error);
    }
  }
  
  // **Change Ticket from Seat to Another**
  const changeTicketSeat = async (ticketId: number, newSeatId: number) => {
    try {
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

      const data = await response.json() as UpdatedItem;

      const {
        updatedOrders,
        updatedGroups,
        updatedSections
      } = await handleChangeTicketSeat_State(orders, groups, sections, data);

      setOrders(updatedOrders as Order[]);
      setGroups(updatedGroups as AdminGroup[]);
      setSections(updatedSections as Section[]);

    } catch (error) {
      console.error('Error in changeTicketSeat:', error);
    }
  };

  const reFetch = async () => {
    fetchGroups();
    fetchOrders();
    fetchSections();
  }

  const handleSetActiveTab = (tab: 'tilaukset' | 'ryhmat' | 'kartta') => {
    setMultiSelectedSeats([]);
    setSelectedSeat(null);
    setOrderFilters({ kutsuvieras: false, erikoisjarjestely: false, ticketType: '', noGroup: false });
    setActiveTab(tab);
  }

  const handleSendTickets = async (order: Order, groupName?: string) => {

    // Make sure that all tickets have a seat
    if (order.attributes.items.data.some((item) => item.attributes.seat.data)) {
      if (!await confirmAction({
        title: 'Lähetä liput?',
        message: 'Liput lähetetään asiakkaalle sähköpostitse.',
        details: formatOrderTicketDetails(order, groupName),
        confirmLabel: 'Lähetä liput',
      })) {
        return;
      }
      const response = await fetch(`/api/admin/orders/sendTickets/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      //Response data should be {response: true}

      const data = await response.json();
      
      if (!data.response) {
        alert('Lippujen lähettäminen epäonnistui');
        return;
      } 


      const {
        updatedOrders,
        updatedGroups,
        updatedSections
      } = await handleSetOrderTicketsSent_State(orders, groups, sections, order.id);

      setOrders(updatedOrders as Order[]);
      setGroups(updatedGroups as AdminGroup[]);
      setSections(updatedSections as Section[]);

    } else {
      alert('Kaikilla lipuilla ei ole paikkaa. Tarkista että kaikilla lipuilla on paikka ennen lippujen lähettämistä');
    }
  }

  const handleSendTicketsManually = async (order: Order, groupName?: string) => {

    // Make sure that all tickets have a seat
    if (order.attributes.items.data.some((item) => item.attributes.seat.data)) {
      if (!await confirmAction({
        title: 'Merkitse liput lähetetyiksi?',
        message: 'Liput merkitään lähetetyiksi ilman sähköpostin lähettämistä.',
        details: formatOrderTicketDetails(order, groupName),
        confirmLabel: 'Merkitse lähetetyiksi',
      })) {
        return;
      }
      const response = await fetch(`/api/admin/orders/sendTicketsManually/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      //Response data should be {response: true}

      const data = await response.json();
      
      if (!data.response) {
        alert('Liput on asetettu lähetetyksi');
        return;
      } 


      const {
        updatedOrders,
        updatedGroups,
        updatedSections
      } = await handleSetOrderTicketsSent_State(orders, groups, sections, order.id);

      setOrders(updatedOrders as Order[]);
      setGroups(updatedGroups as AdminGroup[]);
      setSections(updatedSections as Section[]);

    } else {
      alert('Kaikilla lipuilla ei ole paikkaa. Tarkista että kaikilla lipuilla on paikka ennen lippujen asettamista lähetetyksi');
    }
  }

  useEffect(() => {
    if (!groups) return;
    if (!selectedGroup) return;

    setSelectedGroup(groups.find((group) => group.id === selectedGroup.id) || null);
  }, [groups, selectedGroup]);

  useEffect(() => {
    if (!orders) return;
    if (!selectedOrder) return;

    setSelectedOrder(orders.find((order) => order.id === selectedOrder.id) || null);
  }, [orders, selectedOrder]);

  const setActiveSection = (sectionId: number) => {
    setActiveSectionId(sectionId);
  };

  const activeSection = sections.find((section) => section.id === activeSectionId) || null;

  const handleSeatClick = async (seat: Seat) => {

    switch (currentMode) {
      case 'edit-seat':
        setSelectedSeat(seat);
        break;
      case 'add-ticket-to-seat':
        if (!selectedTicket) return;
        if (seat.attributes.item.data) {
          alert(`Seat R:${seat.attributes.Row} N:${seat.attributes.Number} is already occupied`);
          return;
        }
        if (seat.attributes.special?.trim()) {
          if (!await confirmAction({
            title: 'Paikalla on erityishuomio',
            message: `Rivi ${seat.attributes.Row}, paikka ${seat.attributes.Number}. Haluatko jatkaa plassausta?`,
            details: seat.attributes.special,
            confirmLabel: 'Jatka plassausta',
          })) {
            return;
          }
        }
        addTicketToSeat(selectedTicket?.id, seat.id);
        setSelectedTicket(null);
        setCurrentMode(null);
        setSelectedSeat(null);
        break;
      case 'change-ticket-seat':
        if (!selectedTicket) return;
        if (seat.attributes.item.data) {
          alert(`Seat R:${seat.attributes.Row} N:${seat.attributes.Number} is already occupied`);
          return;
        }
        if (seat.attributes.special?.trim()) {
          if (!await confirmAction({
            title: 'Paikalla on erityishuomio',
            message: `Rivi ${seat.attributes.Row}, paikka ${seat.attributes.Number}. Haluatko jatkaa siirtoa?`,
            details: seat.attributes.special,
            confirmLabel: 'Jatka siirtoa',
          })) {
            return;
          }
        }
        changeTicketSeat(selectedTicket?.id, seat.id);
        setSelectedTicket(null);
        setCurrentMode(null);
        setSelectedSeat(null);
        break;
      case 'multi-select':
        if (multiSelectedSeats.includes(seat)) {
          setMultiSelectedSeats(multiSelectedSeats.filter((selectedSeat) => selectedSeat !== seat));
        } else {
          setMultiSelectedSeats([...multiSelectedSeats, seat]);
        }
        break;
      default:
        setSelectedSeat(seat);
        setBottomDrawerOpen(true);
    }
  };

  const handleMapClick = (x: number, y: number, ctrl: boolean) => {
    if (currentMode === 'add-seat' && activeSectionId && ctrl) {
      addSeat(activeSectionId, { x_cord: x, y_cord: y });
    }
  };

  useEffect(() => {
    // Initial fetch of data
    fetchOrders();
    fetchGroups();
    fetchSections();
    fetchItemTypes();
  }, [fetchSections]);

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
        confirmAction,
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
        bottomDrawerOpen,
        setBottomDrawerOpen,
        handleSetActiveTab,
        activeTab,
        setMultiSelectedSeats,
        multiSelectedSeats,
        updateMultipleSeats,
        orderSortOption,
        setOrderSortOption,
        orderFilters,
        setOrderFilters,
        handleSendTickets,
        removeMultipleTicketsFromSeat,
        handleSendTicketsManually,
      }}
    >
      {children}
      {confirmOptions && <ConfirmDialog options={confirmOptions} resolve={resolveConfirm} />}
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
