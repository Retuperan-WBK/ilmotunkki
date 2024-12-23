"use client";

import {
  createContext, useState, useEffect, FC, useCallback, useMemo
} from "react";
import useSWR from "swr";
import { Customer, Item, ItemType, Order } from "../utils/models";
import { fetcher } from "@/utils/clientHelper";

export interface AppContextType {
  order?: Order;
  customer: Customer;
  items: Item[];
  initializeOrder: () => Promise<string>;
  refreshFields: () => Promise<void>;
  addItem: (item: ItemType) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
  isEmpty: boolean;
  reset: () => void;
}
export const initialCustomer = {
  id: 0,
  attributes: {
    firstName: '',
    lastName: '',
    createdAt: '',
    email: '',
    extra: '',
    locale: '',
    phone: '',
    postalCode: '',
    publishedAt: '',
    startYear: '',
    updatedAt: '',
    uid: '',
    special_arragements: '',
  },
};
const appContextDefault: Required<AppContextType> = {
  customer: initialCustomer,
  order: {
    id: 0,
    attributes: {
      createdAt: '',
      uid: '',
      publishedAt: '',
      status: 'new',
      updatedAt: '',
      transactionId: '',
      kutsuvieras: false,
      tickets_sent: false,
      group: {
        data: undefined
      },
      items: {
        data: []
      },
      customer: {
        data: initialCustomer
      }
    }
  },
  items: [],
  isEmpty: true,
  initializeOrder: () => Promise.resolve(''),
  refreshFields: () => Promise.resolve(),
  addItem: () => Promise.resolve(),
  deleteItem: () => Promise.resolve(),
  reset: () => null,
};

export const AppContext = createContext<AppContextType>(appContextDefault);

type Props = {
  children: React.ReactNode
}

const AppProvider: FC<Props> = ({ children }) => {
  const [orderUid, setOrderUid] = useState<string | undefined>(undefined);
  const { data: order, mutate: mutateOrder, error } = useSWR<Order>(orderUid ? `/api/orders/${orderUid}` : null, fetcher);
  const customer = useMemo(() => order?.attributes.customer.data || appContextDefault.customer, [order]);
  const items = useMemo(() => order?.attributes.items?.data || appContextDefault.items, [order]);
  const reset = useCallback(() => {
    localStorage.removeItem('orderUid');
    setOrderUid('');
    mutateOrder(undefined);
  }, [mutateOrder]);
  useEffect(() => {
    if (error && error.status === 404) {
      reset();
    }
  }, [error, reset]);

  const initializeOrder = async () => {
    const response = await fetch('/api/orders', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error("Error in initializing order");
    }

    const newOrder = await response.json() as Order;
    setOrderUid(newOrder.attributes.uid);
    localStorage.setItem('orderUid', String(newOrder.attributes.uid));
    mutateOrder(newOrder);
    return newOrder.attributes.uid;
  };

  const deleteItem = async (itemId: number) => {
    const itemToRemove = items?.find(({ attributes: { itemType } }) => itemType.data.id === itemId);
    if (!itemToRemove) return;
    try {
      const response = await fetch(`/api/orders/${orderUid}/items/${itemToRemove.id}`, {
        method: 'DELETE',
      });
      const removeResult = await response.json() as Item;
      const filteredItems = items?.filter(item => item.id !== removeResult.id) || [];
      const newOrder = order || appContextDefault.order;
      newOrder.attributes.items = { data: filteredItems };
      mutateOrder(newOrder);
    } catch (error) {
      // Error in deleting an item
    }
  };

  const addItem = async (itemType: ItemType) => {
    const currentOrderUid = orderUid || await initializeOrder();
    try {
      const response = await fetch(`/api/orders/${currentOrderUid}/items`, {
        method: 'POST',
        body: JSON.stringify({
          itemType: itemType.id,
        }),
      });
      const newItem = await response.json() as Item
      const newItems = [...items, newItem];
      const newOrder = order || appContextDefault.order;
      newOrder.attributes.items = { data: newItems };
      mutateOrder(newOrder);
    } catch (error) {
      // Error in adding an item
    }
  }
  const refreshFields = async () => {
    mutateOrder();
  }

  useEffect(() => {
    const savedOrderUid = localStorage.getItem('orderUid');
    if (savedOrderUid) {
      setOrderUid(savedOrderUid);
      return;
    }
    setOrderUid('');
  }, []);
  return (
    <AppContext.Provider value={
      {
        items: items,
        order: order,
        isEmpty: orderUid === '' && !error && !order, // Is empty;
        customer,
        initializeOrder,
        refreshFields,
        addItem,
        deleteItem,
        reset,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;