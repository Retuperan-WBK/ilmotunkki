'use client';

import { useEffect, useState } from 'react';
import Logo from './Logo';
import SeatMap from './SeatMap';
import { Order } from '@/utils/models';

export default function SeatDashboard() {
  const [activeTab, setActiveTab] = useState<'tilaukset' | 'ryhmat'>('tilaukset'); // State to track active tab

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header Section */}
      <div className="flex w-full h-24 items-start justify-start gap-4">
        <div className="flex flex-col items-center">
          <Logo />
          <p>Ilmotunkki</p>
        </div>
        <div className="flex items-center justify-start h-full w-full">
          <button
            onClick={() => setActiveTab('tilaukset')}
            className={`text-2xl font-bold cursor-pointer ${
              activeTab === 'tilaukset' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Tilaukset
          </button>
          <button
            onClick={() => setActiveTab('ryhmat')}
            className={`text-2xl font-bold ml-4 cursor-pointer ${
              activeTab === 'ryhmat' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Ryhmät
          </button>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-[#3D3D3D] h-full w-full m-4 rounded-md flex">
        {/* Tilaukset Sidebar */}
        <div className="h-full w-[20%] min-w-[250px] border-r-2 border-gray-500">
          {/* Render content based on the active tab */}
          {activeTab === 'tilaukset' && (
            <OrdersDrawer />
          )}
          {activeTab === 'ryhmat' && (
            <GroupsDrawer />
          )}
        </div>

        {/* Main Content */}
        <div className="h-full flex-[75%]">
          <SeatMap />
        </div>
      </div>
    </div>
  );
}

const OrdersDrawer = () => {

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Fetch orders data
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setOrders(data);
      })
      .catch((error) => {
        console.error(error);
      });
  } ,[]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Tilaukset Content</h1>
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between p-2 border-b-2 border-gray-500"> 
          <p>{order.attributes.uid}</p>
          <p>{order.attributes.status}</p>
        </div>))
        }
    </div>
  );
}

const GroupsDrawer = () => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Ryhmät Content</h1>
      {/* Add Ryhmät-specific content here */}
    </div>
  );
}