'use client';

import Logo from './Logo';
import SeatMap from './SeatMap';
import OrdersDrawer from './OrdersDrawer';
import GroupsDrawer from './GroupsDrawer';
import MapDrawer from './MapDrawer';
import { useAdminContext } from './AdminContext';

export default function SeatDashboard() {
  const { setMode, setSelectedGroup, setSelectedOrder, setSelectedTicket, setSelectedSeat, activeTab, handleSetActiveTab, orders } = useAdminContext();

  const calculateTickets = () => {
    let deluxe = 0;
    let firstClass = 0;
    let secondClass = 0;
    let totalTickets = 0;
    let totalPlaced = 0;

    orders.forEach((order) => {
      order.attributes.items.data.forEach((item) => {
        if (item.attributes.itemType.data.attributes.slug === 'deluxe') {
          deluxe += 1;
        } else if (item.attributes.itemType.data.attributes.slug === 'iluokka') {
          firstClass += 1;
        } else if (item.attributes.itemType.data.attributes.slug === 'iiluokka') {
          secondClass += 1;
        } 
      });
    });
    
    orders.forEach((order) => {
      totalTickets += order.attributes.items.data.length;
      totalPlaced += order.attributes.items.data.filter((item) => item.attributes.seat.data).length;
    });

    return { deluxe, firstClass, secondClass, totalTickets, totalPlaced };
  };

  const { deluxe, firstClass, secondClass, totalTickets, totalPlaced } = calculateTickets();

  const handleChangeTab = (tab: 'tilaukset' | 'ryhmat' | 'kartta') => {
    setMode(null);
    setSelectedGroup(null);
    setSelectedOrder(null);
    setSelectedTicket(null);
    setSelectedSeat(null);
    handleSetActiveTab(tab);
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header Section */}
      <div className="flex w-full h-24 items-start justify-start gap-4 pl-2">
        <div className="flex flex-col items-center">
          <Logo />
          <p className="text-lg font-bold">Plassitunkki</p>
        </div>
        <div className="flex items-center justify-start h-full w-full">
          <button
            onClick={() => handleChangeTab('tilaukset')}
            className={`text-2xl font-bold cursor-pointer ${
              activeTab === 'tilaukset' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Tilaukset
          </button>
          <button
            onClick={() => handleChangeTab('ryhmat')}
            className={`text-2xl font-bold ml-4 cursor-pointer ${
              activeTab === 'ryhmat' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Ryhmät
          </button>
          <button
            onClick={() => handleChangeTab('kartta')}
            className={`text-2xl font-bold ml-4 cursor-pointer ${
              activeTab === 'kartta' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Kartta
          </button>
        </div>
        <div className="flex items-center justify-center h-full w-full gap-4 pr-2">
          <div className='flex flex-1 items-center gap-4'>
            <h3 className="text-base">Mydyyt liput:</h3>
            <div>
              <p className='text-sm'>DeLuxe: {deluxe}</p>
              <p className='text-sm'>I-Luokka {firstClass}</p>
              <p className='text-sm'>II-Luokka {secondClass}</p>
              <p className='text-sm'>Yht: {totalTickets}</p>
            </div>
          </div>
          <div className='flex-col flex-1 items-center gap-4'>
          <h3 className="text-base">Plasssattu: {totalPlaced}/{totalTickets}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Section */}s
      <div className="bg-[#3D3D3D] h-full w-full rounded-md flex">
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