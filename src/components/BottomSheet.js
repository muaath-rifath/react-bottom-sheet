import React, { useState, useEffect, useRef } from 'react';
import './BottomSheet.css';

// Snap point definitions
const SNAP_POINTS = {
  CLOSED: 0,
  HALF: 50,
  FULL: 85
};

const BottomSheet = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [snapPoint, setSnapPoint] = useState(SNAP_POINTS.CLOSED);
  const bottomSheetRef = useRef(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentYRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentSnapPointRef = useRef(SNAP_POINTS.CLOSED);

  // Keep refs in sync with state
  useEffect(() => {
    currentSnapPointRef.current = snapPoint;
  }, [snapPoint]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setSnapPoint(SNAP_POINTS.HALF);
    } else {
      setSnapPoint(SNAP_POINTS.CLOSED);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent pull-to-refresh and overscroll when bottom sheet is open
  useEffect(() => {
    if (!isOpen) return;

    const preventPullToRefresh = (e) => {
      if (window.scrollY === 0 && e.touches && e.touches.length === 1) {
        const touch = e.touches[0];
        const target = e.target;
        const isOnBottomSheet = bottomSheetRef.current && 
          (bottomSheetRef.current.contains(target) || bottomSheetRef.current === target);
        
        if (isOnBottomSheet) {
          e.preventDefault();
        }
      }
    };

    const preventBodyScroll = (e) => {
      if (isDraggingRef.current) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    document.addEventListener('touchmove', preventBodyScroll, { passive: false });
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.removeEventListener('touchstart', preventPullToRefresh);
      document.removeEventListener('touchmove', preventBodyScroll);
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [isOpen]);

  // Handle mouse/touch move
  const handleDragMove = (e) => {
    if (!isDraggingRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get current coordinates
    let clientY, clientX;
    if (e.type === 'touchmove') {
      if (e.touches.length === 0) return;
      clientY = e.touches[0].clientY;
      clientX = e.touches[0].clientX;
    } else {
      clientY = e.clientY;
      clientX = e.clientX;
    }
    
    currentYRef.current = clientY;
    currentXRef.current = clientX;
    
    // Calculate movement distances
    const deltaY = currentYRef.current - startYRef.current;
    const deltaX = currentXRef.current - startXRef.current;
    
    // Check if vertical movement is dominant
    const absDeltaY = Math.abs(deltaY);
    const absDeltaX = Math.abs(deltaX);
    const isValidVerticalDrag = absDeltaY > absDeltaX * 0.5 || absDeltaY > 20;
    
    if (isValidVerticalDrag) {
      // Use only vertical component for positioning
      const windowHeight = window.innerHeight;
      const dragPercentage = (deltaY / windowHeight) * 100;
      let newPosition = currentSnapPointRef.current - dragPercentage;
      
      // Constrain to bounds with overdrag allowance
      const overdragLimit = 15;
      newPosition = Math.max(-overdragLimit, Math.min(SNAP_POINTS.FULL + overdragLimit, newPosition));
      
      // Apply position immediately
      if (bottomSheetRef.current) {
        bottomSheetRef.current.style.transform = `translateY(${100 - newPosition}%)`;
      }
    }
  };

  // Handle mouse/touch end
  const handleDragEnd = (e) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    
    // Calculate final position based on vertical drag
    const deltaY = currentYRef.current - startYRef.current;
    const deltaX = currentXRef.current - startXRef.current;
    
    // Check if this was a valid vertical drag
    const absDeltaY = Math.abs(deltaY);
    const absDeltaX = Math.abs(deltaX);
    const isValidVerticalDrag = absDeltaY > absDeltaX * 0.5 || absDeltaY > 20;
    
    if (isValidVerticalDrag) {
      // Process snap based on vertical movement
      const windowHeight = window.innerHeight;
      const dragPercentage = (deltaY / windowHeight) * 100;
      let newSnapPoint = currentSnapPointRef.current - dragPercentage;
      
      // Find closest snap point
      const snapPoints = Object.values(SNAP_POINTS);
      const closestSnapPoint = snapPoints.reduce((prev, curr) => 
        Math.abs(curr - newSnapPoint) < Math.abs(prev - newSnapPoint) ? curr : prev
      );
      
      // Handle closing or snap to position
      if (closestSnapPoint === SNAP_POINTS.CLOSED) {
        onClose();
      } else {
        setSnapPoint(closestSnapPoint);
      }
    }
    
    // Re-enable CSS transitions
    if (bottomSheetRef.current) {
      bottomSheetRef.current.style.transition = '';
      bottomSheetRef.current.style.transform = '';
    }
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    document.removeEventListener('touchcancel', handleDragEnd);
  };

  // Handle mouse/touch start
  const handleDragStart = (e) => {
    // Set drag state immediately using ref (synchronous)
    isDraggingRef.current = true;
    
    // Get coordinates
    let clientY, clientX;
    if (e.type === 'touchstart') {
      if (e.touches.length === 0) return;
      clientY = e.touches[0].clientY;
      clientX = e.touches[0].clientX;
    } else {
      clientY = e.clientY;
      clientX = e.clientX;
    }
    
    // Store initial positions
    startYRef.current = clientY;
    startXRef.current = clientX;
    currentYRef.current = clientY;
    currentXRef.current = clientX;
    
    // Prevent all default behaviors
    e.preventDefault();
    e.stopPropagation();
    
    // Disable CSS transitions immediately
    if (bottomSheetRef.current) {
      bottomSheetRef.current.style.transition = 'none';
    }
    
    // Add event listeners
    if (e.type === 'touchstart') {
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd, { passive: false });
      document.addEventListener('touchcancel', handleDragEnd, { passive: false });
    } else {
      document.addEventListener('mousemove', handleDragMove, { passive: false });
      document.addEventListener('mouseup', handleDragEnd, { passive: false });
    }
  };

  // Handle snap point buttons
  const handleSnapTo = (point) => {
    if (point === SNAP_POINTS.CLOSED) {
      onClose();
    } else {
      setSnapPoint(point);
    }
  };

  // Get content based on snap point
  const getContentForSnapPoint = () => {
    switch (snapPoint) {
      case SNAP_POINTS.HALF:
        return (
          <div className="bottom-sheet-content">
            <p>Half-open view - Some content is visible.</p>
            <div className="snap-buttons">
              <button onClick={() => handleSnapTo(SNAP_POINTS.FULL)}>
                Expand to Full
              </button>
              <button onClick={() => handleSnapTo(SNAP_POINTS.CLOSED)}>
                Close
              </button>
            </div>
          </div>
        );
      case SNAP_POINTS.FULL:
        return (
          <div className="bottom-sheet-content">
            <p>Fully open view - All content is visible.</p>
            <p>This is the complete content area where you can display:</p>
            <ul>
              <li>Detailed information</li>
              <li>Form elements</li>
              <li>Lists of data</li>
              <li>Images and media</li>
              <li>Interactive components</li>
            </ul>
            
            <div className="content-demo">
              <h3>Sample Content</h3>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>
            
            <div className="snap-buttons">
              <button onClick={() => handleSnapTo(SNAP_POINTS.HALF)}>
                Minimize to Half
              </button>
              <button onClick={() => handleSnapTo(SNAP_POINTS.CLOSED)}>
                Close
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop/Overlay */}
      <div 
        className={`bottom-sheet-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* Bottom Sheet Content */}
      <div 
        ref={bottomSheetRef}
        className={`bottom-sheet ${isOpen ? 'open' : ''} ${isDraggingRef.current ? 'dragging' : ''} snap-${snapPoint}`}
        style={{
          transform: `translateY(${100 - snapPoint}%)`
        }}
      >
        <div 
          className="bottom-sheet-header"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{ 
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          <div className="bottom-sheet-handle" />
          <h2>Bottom Sheet - {snapPoint === SNAP_POINTS.HALF ? 'Half Open' : 'Fully Open'}</h2>
        </div>
        
        {getContentForSnapPoint()}
      </div>
    </>
  );
};

export default BottomSheet;
