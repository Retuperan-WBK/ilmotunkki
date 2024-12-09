"use client";

import { AdminGroup, Order, Section } from "@/utils/models";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AdminContextProps {
  orders: Order[];
  groups: AdminGroup[];
  sections: Section[];
  fetchOrders: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  fetchSections: () => Promise<void>;
  updateSeat: (ticketId: number, seatId: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Fetch all orders
  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data);
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
  };

  // Update seat assignment for a ticket
  const updateSeat = async (ticketId: number, seatId: number) => {
    await fetch(`/api/tickets/${ticketId}/assign-seat`, {
      method: "POST",
      body: JSON.stringify({ seatId }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Re-fetch sections and orders after updating
    fetchSections();
    fetchOrders();
  };

  useEffect(() => {
    // Initial fetch of data
    fetchOrders();
    fetchGroups();
    fetchSections();
  }, []);

  return (
    <AdminContext.Provider
      value={{ orders, groups, sections, fetchOrders, fetchGroups, fetchSections, updateSeat }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
