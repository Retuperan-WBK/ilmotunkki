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
    selectedSeat
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

  const handleScroll = (e: React.WheelEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 'out' : 'in';
    handleZoom(direction);
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.attributes.item.data) return 'red'; // Reserved seats
    return 'green'; // Default available seats
  };

  return (
    <div className="seat-map" ref={divRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid #ddd' }}>
      
      {/* Section Selector */}
      <div className="p-4 absolute w-full flex bg-[#3D3D3D] !z-30 border-gray-200 border-b-2">
        <h2 className="text-lg font-bold">Salikartta</h2>
        <div className="ml-24 flex space-x-4">
          {sections.map((section) => (
            <button key={section.id} onClick={() => setActiveSection(section.id)} className="text-lg font-bold"  style={{ color: activeSection?.id === section.id ? 'white' : 'gray' }}>
              {section.attributes.Name}
            </button>
          ))}
        </div>
        <div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-20 left-4 flex flex-col bg-[#3d3d3d94] z-20 rounded-md">
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
            
            return (
              <>
              <circle
              key={seat.id}
              cx={x}
              cy={y}
              r="4"
              fill="blue"
              stroke="#000"
              strokeWidth="1"
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
          
          const x = (seat.attributes.x_cord / originalWidth) * 1000;
          const y = (seat.attributes.y_cord / originalHeight) * 1000;
          return (
            <>
              <circle
                key={seat.id}
                cx={x}
                cy={y}
                r="4"
                fill={getSeatColor(seat)}
                stroke="#000"
                strokeWidth="1"
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
        })}
      </svg>
    </div>
  );
}
