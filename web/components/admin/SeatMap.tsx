'use client';

import { Seat } from '@/utils/models';
import React, { useEffect, useState, useRef } from 'react';
import { useAdminContext } from './AdminContext';

export default function SeatMap() {
  const { 
    activeSection, 
    sections, 
    setActiveSection, 
    handleMapClick, 
    handleSeatClick,
    selectedSeat,
    filter,
    setFilter,
    selectedGroup,
    selectedOrder,
    bottomDrawerOpen,
    setBottomDrawerOpen,
    orders,
    groups,
    setSelectedGroup,
    setSelectedOrder,
    setActiveTab,
    multiSelectedSeats,
    setSelectedSeat
  } = useAdminContext();
  
  const [zoomLevelIndex, setZoomLevelIndex] = useState(3); // Default zoom at index 3 (1x)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<SVGImageElement>(null);

  const zoomLevels = [0.5, 0.7, 0.85, 1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.8, 4.2];

  useEffect(() => {
    if (!divRef.current || !svgRef.current) return;
    const divCenterX = divRef.current.clientWidth / 2;
    const divCenterY = divRef.current.clientHeight / 2;
    const svgCenterX = svgRef.current.clientWidth / 2;
    const svgCenterY = svgRef.current.clientHeight / 2;
    setPanOffset({ x: divCenterX - svgCenterX, y: divCenterY - svgCenterY });
  }, []);

  useEffect(() => {
    if (sections.length > 0) {
      setActiveSection(sections[0].id);
    }
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevelIndex((prevIndex) => {
      const newIndex = direction === 'in' ? prevIndex + 1 : prevIndex - 1;
      return Math.max(0, Math.min(zoomLevels.length - 1, newIndex));
    });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragDistance(0);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePosition.x;
    const deltaY = e.clientY - lastMousePosition.y;

    setPanOffset((prevOffset) => ({
      x: prevOffset.x + deltaX,
      y: prevOffset.y + deltaY,
    }));

    setDragDistance((prevDistance) => prevDistance + Math.abs(deltaX) + Math.abs(deltaY));
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(false);
    if (dragDistance > 5) return; // Ignore if it was a drag

    if (!svgRef.current || !imageRef.current) return;

    const imageRect = imageRef.current.getBoundingClientRect();

    // Get click position relative to the image on screen
    const x = (e.clientX - imageRect.left) / imageRect.width;
    const y = (e.clientY - imageRect.top) / imageRect.height;

    // Calculate position relative to the original image dimensions
    const originalWidth = activeSection?.attributes.background_image.data.attributes.width || 1;
    const originalHeight = activeSection?.attributes.background_image.data.attributes.height || 1;

    const relativeX = x * originalWidth;
    const relativeY = y * originalHeight;

    handleMapClick(relativeX, relativeY);
  };

  const generateColor = (id: number): string => {
    // Generate a unique color using the HSL color model
    const hue = (id * 137.508) % 360; // Use a larger multiplier to spread out the hues
    const saturation = 70 + (id % 30); // Vary saturation between 70% and 100%
    const lightness = 50 + (id % 20); // Vary lightness between 50% and 70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleScroll = (e: React.WheelEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 'out' : 'in';
    handleZoom(direction);
  };

  const handleCloseDrawer = () => {
    setBottomDrawerOpen(false);
    setSelectedSeat(null);
  }

  const multiSelectedSeatIds = multiSelectedSeats?.map((seat) => seat.id);

  const getSeatStyles = (seat: Seat) => {
    let backgroundColor = 'gray'; // Default background
    let borderColor = 'black'; // Default border
  
    if (filter.filter === 'show-class') {
      switch (seat.attributes.item_type.data?.attributes.slug) {
        case 'deluxe': backgroundColor = '#f39c12'; break;
        case 'iluokka': backgroundColor = '#3498db'; break;
        case 'iiluokka': backgroundColor = '#9b59b6'; break;
      }
    }
  
    // 2️⃣ Visualize Seat Item Type
    if (filter.filter === 'show-itemtype' && seat.attributes.item.data) {
      switch (seat.attributes.item.data.attributes.itemType.data.attributes.slug) {
        case 'deluxe': backgroundColor = '#f39c12'; break;
        case 'iluokka': backgroundColor = '#3498db'; break;
        case 'iiluokka': backgroundColor = '#9b59b6'; break;
      }
    }
  
    // 3️⃣ Highlight by Group
    if (filter.filter === 'highlight-group' && seat.attributes.item.data?.attributes.order.data.attributes.group.data) {
      const groupId = seat.attributes.item.data.attributes.order.data.attributes.group.data.id;
      backgroundColor = generateColor(groupId);
    }
  
    // 4️⃣ Highlight by Order
    if (filter.filter === 'highlight-order' && seat.attributes.item.data?.attributes.order.data) {
      const orderId = seat.attributes.item.data.attributes.order.data.id;
      backgroundColor = generateColor(orderId);
    }

    if (filter.filter === 'special' && seat.attributes.special) {
      backgroundColor = 'blue';
    }

    if (selectedGroup && seat.attributes.item.data?.attributes.order.data && selectedGroup.id === seat.attributes.item.data.attributes.order.data.attributes.group.data?.id) {
      backgroundColor = 'gold';
    }

    if (selectedOrder && seat.attributes.item.data && selectedOrder.id === seat.attributes.item.data.attributes.order.data.id) {
      backgroundColor = 'gold';
    }
  
    // 5️⃣ Taken/Free indicator
    if (filter.showReserved) {
      if (seat.attributes.item.data) {
        borderColor = 'red';
      } else {
        borderColor = 'mediumseagreen';
      }
    }
    
    if (selectedSeat && selectedSeat.id === seat.id) {
      backgroundColor = 'red';
    }

    if (multiSelectedSeatIds && multiSelectedSeatIds.includes(seat.id)) {
      backgroundColor = 'red';
    }
  
    return {
      backgroundColor,
      borderColor,
    };
  };

  const getOrderFullName = (seat: Seat) => {
    if (!seat.attributes.item.data) return '';
    const order = seat.attributes.item.data.attributes.order.data.id;
    const firstName = orders.find((o) => o.id === order)?.attributes.customer.data.attributes.firstName;
    const lastName = orders.find((o) => o.id === order)?.attributes.customer.data.attributes.lastName;

    if (!firstName || !lastName) return '';

    return `${firstName} ${lastName}`;
  }

  const getOrderGroup = (seat: Seat) => {
    if (!seat.attributes.item.data) return '';
    const order = seat.attributes.item.data.attributes.order.data;
    return order.attributes.group.data?.attributes.name || '';
  }

  const handleOpenGroup = (groupId: number) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    setSelectedGroup(group);
    setActiveTab('ryhmat');
  }

  const handleOpenOrder = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setSelectedOrder(order);
    setActiveTab('tilaukset');
  }

  return (
    <div className="seat-map" ref={divRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid #ddd' }}>
      
      {/* Section Selector */}
      <div className="p-4 absolute w-full flex bg-[#3D3D3D] !z-30 border-gray-200 border-b-2">
        <h2 className="text-lg font-bold flex-[1] mt-[2px]">Salikartta</h2>
        <div className="flex space-x-4 flex-[5] justify-center">
          {sections.map((section) => (
            <button key={section.id} onClick={() => setActiveSection(section.id)} className="text-lg font-bold"  style={{ color: activeSection?.id === section.id ? 'white' : 'gray' }}>
              {section.attributes.Name}
            </button>
          ))}
        </div>
        <div className="flex-[7] flex flex-col gap-y-2">
          <h3 className="text-sm my-[-8px] font-bold">Suodattimet:</h3>
          <div className="flex gap-4">
            <button onClick={() => setFilter({...filter, filter: "show-class"})} className={filter.filter === 'show-class' ? 'bg-red-700 rounded-md p-1' : ''}>Penkkiluokka</button>
            <button onClick={() => setFilter({...filter, filter: "show-itemtype"})} className={filter.filter === 'show-itemtype' ? 'bg-red-700 rounded-md p-1' : ''}>Lippuluokka</button>
            <button onClick={() => setFilter({...filter, filter: "highlight-group"})} className={filter.filter === 'highlight-group' ? 'bg-red-700 rounded-md p-1' : ''}>Ryhmät</button>
            <button onClick={() => setFilter({...filter, filter: "highlight-order"})} className={filter.filter === 'highlight-order' ? 'bg-red-700 rounded-md p-1' : ''}>Tilaukset</button>
            <button onClick={() => setFilter({...filter, filter: "special"})} className={filter.filter === 'special' ? 'bg-red-700 rounded-md p-1' : ''}>Special</button>
            <button onClick={() => setFilter({...filter, filter: null})} className={filter.filter === null ? 'bg-red-700 rounded-md p-1' : ''}>Ei</button>
          </div>
          <div className="flex gap-1">
            <label htmlFor="search" className="text-white">Näytä varattu/vapaa reuna:</label>
            <input type="checkbox" placeholder="Hae" checked={filter.showReserved} className="p-1 rounded-md" onChange={() => setFilter({...filter, showReserved: !filter.showReserved})} />
          </div>
        </div>
      </div>

      {/* Bottom Drawer 
      Render the bottom drawer if it's open and a seat is selected, include basic information of the seats and the order where it has been set to*/}
      {bottomDrawerOpen && selectedSeat && 
        <div className="absolute bottom-20 w-full bg-[#3d3d3dDD] p-4 z-40 h-40">
          <h2 className="text-lg font-bold">Rivi: {selectedSeat.attributes.Row} - Paikka: {selectedSeat.attributes.Number}</h2>
          <div className="flex flex-wrap">
            <span className="flex-[1]">
              <span className="font-bold">Penkkiluokka:</span> {selectedSeat.attributes.item_type.data?.attributes.slug || 'Ei valittu'}
            </span>
            <span className="flex-[1]">
              <span className="font-bold">Lisähuomio:</span> {selectedSeat.attributes.special || 'Ei'}
            </span>
          </div>
          <div className="flex flex-wrap">
            <span className="flex-[1] hover:underline cursor-pointer" onClick={() =>selectedSeat.attributes.item.data?.attributes.order.data.id && handleOpenOrder(selectedSeat.attributes.item.data?.attributes.order.data.id)}>
              <span className="font-bold">Tilaus:</span> {getOrderFullName(selectedSeat) || 'Ei tilausta'}
            </span>
            <span className="flex-[1] hover:underline cursor-pointer" onClick={() => selectedSeat.attributes.item.data?.attributes.order.data.attributes.group.data?.id && handleOpenGroup(selectedSeat.attributes.item.data?.attributes.order.data.attributes.group.data?.id)}>
              <span className="font-bold">Ryhmä:</span> {getOrderGroup(selectedSeat) || 'Ei ryhmää'}
            </span>
          </div>
          <div className="flex gap-4 absolute top-2 right-2">
            <button className="bg-red-500 text-white p-2 rounded-md" onClick={handleCloseDrawer}>Sulje</button>
          </div>
        </div>
      }

      {/* Zoom Controls */}
      <div className="absolute top-32 left-4 flex flex-col bg-[#3d3d3d94] z-20 rounded-md">
        <button className='hover:bg-[#6b6b6b8c]' onClick={() => handleZoom('in')}>+</button>
        <button className='hover:bg-[#6b6b6b8c]' onClick={() => handleZoom('out')}>-</button>
        <br></br>
        <button className='hover:bg-[#6b6b6b8c]' onClick={() => setPanOffset({x: 0, y: 0})}>Center</button>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevels[zoomLevelIndex]})`, backgroundColor: '#f9f9f994', zIndex: 10 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleScroll}
        onMouseLeave={() => setIsDragging(false)}
      >
        {/* Background Images */}
        {sections.map((section) => (
          <image
            key={section.id}
            href={`/api/admin/image?url=${section.attributes.background_image.data.attributes.url}`}
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter='grayscale(75%)'
            preserveAspectRatio="xMidYMid meet"
            style={{ display: activeSection?.id === section.id ? 'block' : 'none' }}
          />
        ))}

        {/* Render Seats */}
        {activeSection?.attributes.seats.data.map((seat) => {
          const originalWidth = activeSection?.attributes.background_image.data.attributes.width || 1;
          const originalHeight = activeSection?.attributes.background_image.data.attributes.height || 1;

          
          if (selectedSeat && selectedSeat.id === seat.id) {
            
            const x = (selectedSeat.attributes.x_cord / originalWidth) * 1000;
            const y = (selectedSeat.attributes.y_cord / originalHeight) * 1000;
            const styles = getSeatStyles(seat);
            
            return (
              <>
              <circle
              key={seat.id}
              cx={x}
              cy={y}
              r="4"
              fill={styles.backgroundColor}
              stroke={styles.borderColor}
              strokeWidth={filter.showReserved ? 0.5 : 0}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                handleSeatClick(seat);
              }}
            />
            <text x={x} y={y} fontSize="4" textAnchor="middle" fill="white" style={{ userSelect: 'none', cursor: 'pointer' }} onClick={(e) => {
                  e.stopPropagation();
                  handleSeatClick(seat);
                }}>
              {seat.attributes.Number}
            </text>
            </>
            );
          }
          
          const styles = getSeatStyles(seat);
          const x = (seat.attributes.x_cord / originalWidth) * 1000;
          const y = (seat.attributes.y_cord / originalHeight) * 1000;
          return (
            <>
              <circle
                key={seat.id}
                cx={x}
                cy={y}
                r="4"
                fill={styles.backgroundColor}
                stroke={styles.borderColor}
                strokeWidth={filter.showReserved ? 1 : 0.1}
                style={{ cursor: 'pointer'}}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeatClick(seat);
                }}
              />
              <text x={x} y={y} fontSize="4" textAnchor="middle" fill="white" style={{ userSelect: 'none', cursor: 'pointer' }} onClick={(e) => {
                  e.stopPropagation();
                  handleSeatClick(seat);
                }}>
                {seat.attributes.Number}
              </text>
            </>
          );
        })}
      </svg>
    </div>
  );
}
