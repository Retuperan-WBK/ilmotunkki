'use client';

import { useEffect } from 'react';

const DisableTrackpadPinchZoom = () => {
  useEffect(() => {
    const preventPinchZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent pinch zoom
      }
    };

    // Add event listener
    document.addEventListener('wheel', preventPinchZoom, { passive: false });

    // Clean up on unmount
    return () => {
      document.removeEventListener('wheel', preventPinchZoom);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default DisableTrackpadPinchZoom;
