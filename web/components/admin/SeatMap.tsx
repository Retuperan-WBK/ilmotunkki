'use client';

import { Seat, Section } from '@/utils/models';
import React, { useEffect, useState, useRef } from 'react';

export default function SeatMap() {
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [zoomLevelIndex, setZoomLevelIndex] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  const zoomLevels = [1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.8, 4.2];

  useEffect(() => {

    // Fetch sections
    fetch('/api/admin/sections')
      .then((res) => res.json())
      .then((data) => setSections(data))
      .catch((err) => console.error('Error fetching sections:', err));

    // Center the map initially
    if (!divRef.current || !svgRef.current) return;
    const divCenterX = divRef.current.clientWidth / 2;
    const divCenterY = divRef.current.clientHeight / 2;
    const svgCenterX = svgRef.current.clientWidth / 2;
    const svgCenterY = svgRef.current.clientHeight / 2;
    setPanOffset({ x: divCenterX - svgCenterX, y: divCenterY - svgCenterY });
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevelIndex((prevIndex) => {
      const newIndex = direction === 'in' ? prevIndex + 1 : prevIndex - 1;
      return Math.max(0, Math.min(zoomLevels.length - 1, newIndex));
    });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
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

    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScroll = (e: React.WheelEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 'out' : 'in';
    handleZoom(direction);
  };

  const getSeatColor = (seat: Seat) => {

    if (seat.attributes.item) return 'red'; // Occupied seats
    return 'green'; // Default available seats
  };

  return (
    <div
      className="seat-map"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#3D3D3D',
        border: '1px solid #ddd',
      }}
      ref={divRef}
      onMouseUp={handleMouseUp}
    >
      {/* Section Selector */}
      <div className='p-4 w-full flex'>
        <h1 className="text-xl font-bold">Salikartta</h1>
        <div className='mx-8 flex gap-4'>
          {
            sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section)}
                className={`text-lg font-bold cursor-pointer ${
                  currentSection?.id === section.id ? 'text-white' : 'text-gray-400'
                }`}
              >
                {section.attributes.Name}
              </button>))
          }
        </div>
      </div>

      {/* Zoom Controls */}
      <div >
        <button onClick={() => handleZoom('in')}>+</button>
        <button onClick={() => handleZoom('out')}>-</button>
      </div>

      {/* SVG Map */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgRef.current?.clientWidth || 1000} ${svgRef.current?.clientHeight || 1000}`}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevels[zoomLevelIndex]})`,
          transformOrigin: '0 0',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleScroll}
      >
        {/* Render Seats for Current Section */}
        {currentSection?.attributes.seats.data.map((seat) => (
          <circle
            key={seat.id}
            cx={seat.attributes.x_cord}
            cy={seat.attributes.y_cord}
            r="5"
            fill={getSeatColor(seat)}
            stroke="#000"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
}
