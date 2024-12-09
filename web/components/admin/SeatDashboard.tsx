'use client';

import { useState } from 'react';
import Logo from './Logo';
import SeatMap from './SeatMap';
import OrdersDrawer from './OrdersDrawer';
import GroupsDrawer from './GroupsDrawer';
import MapDrawer from './MapDrawer';

export default function SeatDashboard() {
  const [activeTab, setActiveTab] = useState<'tilaukset' | 'ryhmat' | 'kartta'>('tilaukset'); // State to track active tab

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
          <button
            onClick={() => setActiveTab('kartta')}
            className={`text-2xl font-bold ml-4 cursor-pointer ${
              activeTab === 'kartta' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Kartta
          </button>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-[#3D3D3D] h-full w-full m-4 rounded-md flex">
        {/* Tilaukset Sidebar */}
        <div className="h-full w-[20%] min-w-[400px] border-r-2 border-gray-500">
          {/* Render content based on the active tab */}
          {activeTab === 'tilaukset' && (
            <OrdersDrawer />
          )}
          {activeTab === 'ryhmat' && (
            <GroupsDrawer />
          )}
          {activeTab === 'kartta' && (
            <MapDrawer />
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