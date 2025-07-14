import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BottomSheet.css';

// Snap point definitions
const SNAP_POINTS = {
  CLOSED: 0,
  HALF: 50,
  FULL: 85
};

// Responsive snap points for different screen sizes
const getResponsiveSnapPoints = (isMobile, isTablet) => {
  if (isMobile) {
    return { CLOSED: 0, HALF: 50, FULL: 85 };
  } else if (isTablet) {
    return { CLOSED: 0, HALF: 40, FULL: 75 };
  } else {
    // Desktop
    return { CLOSED: 0, HALF: 35, FULL: 70 };
  }
};

// Spring animation configuration
const SPRING_CONFIG = {
  tension: 280,
  friction: 30,
  mass: 1
};

const BottomSheet = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [snapPoint, setSnapPoint] = useState(SNAP_POINTS.CLOSED);
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [currentSnapPoints, setCurrentSnapPoints] = useState(SNAP_POINTS);
  const bottomSheetRef = useRef(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentYRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentSnapPointRef = useRef(SNAP_POINTS.CLOSED);
  
  // Spring animation refs
  const animationFrameRef = useRef(null);
  const currentPositionRef = useRef(0);
  const velocityRef = useRef(0);
  const targetPositionRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isInitialOpenRef = useRef(false);

  // Detect screen size and update responsive state
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width <= 1024;
      
      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);
      setCurrentSnapPoints(getResponsiveSnapPoints(newIsMobile, newIsTablet));
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Get responsive transform based on screen size
  const getResponsiveTransform = useCallback((position) => {
    if (isMobile) {
      return `translateY(${100 - position}%)`;
    } else {
      // For tablet and desktop, maintain horizontal centering
      return `translateX(-50%) translateY(${100 - position}%)`;
    }
  }, [isMobile]);

  // Spring animation function
  const animateToPosition = useCallback((targetPosition) => {
    if (isAnimatingRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    isAnimatingRef.current = true;
    targetPositionRef.current = targetPosition;
    
    const animate = () => {
      // Use much gentler spring settings for opening animation to create visible 0.3s duration
      const springConfig = isInitialOpenRef.current 
        ? { tension: 120, friction: 14, mass: 1 } // Much gentler for visible opening animation
        : SPRING_CONFIG; // Normal settings for other animations
      
      const { tension, friction, mass } = springConfig;
      
      // Spring physics calculations
      const displacement = currentPositionRef.current - targetPositionRef.current;
      const springForce = -tension * displacement;
      const dampingForce = -friction * velocityRef.current;
      const acceleration = (springForce + dampingForce) / mass;
      
      // Update velocity and position
      velocityRef.current += acceleration * 0.016; // 60fps
      currentPositionRef.current += velocityRef.current * 0.016;
      
      // Apply the transform
      if (bottomSheetRef.current && !isDraggingRef.current) {
        bottomSheetRef.current.style.transform = getResponsiveTransform(currentPositionRef.current);
      }
      
      // Check if animation should continue (spring has settled)
      const isSettled = Math.abs(displacement) < 0.1 && Math.abs(velocityRef.current) < 0.1;
      
      if (!isSettled && isAnimatingRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished, snap to exact position
        isAnimatingRef.current = false;
        currentPositionRef.current = targetPositionRef.current;
        velocityRef.current = 0;
        if (bottomSheetRef.current && !isDraggingRef.current) {
          bottomSheetRef.current.style.transform = getResponsiveTransform(targetPositionRef.current);
        }
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [getResponsiveTransform]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keep refs in sync with state and animate to new positions
  useEffect(() => {
    currentSnapPointRef.current = snapPoint;
    currentPositionRef.current = snapPoint;
    if (!isDraggingRef.current) {
      animateToPosition(snapPoint);
    }
  }, [snapPoint, animateToPosition]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      isInitialOpenRef.current = true;
      
      // Set initial position at bottom
      if (bottomSheetRef.current) {
        bottomSheetRef.current.style.transform = getResponsiveTransform(0);
        // Ensure CSS transition is enabled for opening
        bottomSheetRef.current.classList.remove('spring-animating');
        bottomSheetRef.current.classList.remove('dragging');
      }
      
      // Use CSS transition for the opening animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (bottomSheetRef.current) {
            // Animate to half position using CSS transition
            bottomSheetRef.current.style.transform = getResponsiveTransform(SNAP_POINTS.HALF);
          }
          setSnapPoint(currentSnapPoints.HALF);
          
          // After opening animation, switch to spring animation
          setTimeout(() => {
            isInitialOpenRef.current = false;
            if (bottomSheetRef.current) {
              bottomSheetRef.current.classList.add('spring-animating');
            }
            currentPositionRef.current = currentSnapPoints.HALF;
          }, 300); // Match CSS transition duration
        });
      });
    } else {
      isInitialOpenRef.current = false;
      setSnapPoint(currentSnapPoints.CLOSED);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentSnapPoints, getResponsiveTransform]);

  // Set initial position when component mounts
  useEffect(() => {
    if (bottomSheetRef.current && isVisible) {
      if (isOpen && snapPoint === currentSnapPoints.CLOSED) {
        // When opening, explicitly start from bottom (fully closed position)
        bottomSheetRef.current.style.transform = getResponsiveTransform(0);
        currentPositionRef.current = 0; // Start at 0 (closed position)
        velocityRef.current = 0; // Reset velocity
      }
    }
  }, [isVisible, isOpen, snapPoint, getResponsiveTransform, currentSnapPoints]);

  // Prevent pull-to-refresh and overscroll when bottom sheet is open
  useEffect(() => {
    if (!isOpen) return;

    const preventPullToRefresh = (e) => {
      if (window.scrollY === 0 && e.touches && e.touches.length === 1) {
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
    
    // Stop any ongoing spring animation
    if (isAnimatingRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      isAnimatingRef.current = false;
    }
    
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
      newPosition = Math.max(-overdragLimit, Math.min(currentSnapPoints.FULL + overdragLimit, newPosition));
      
      // Update position refs for spring animation
      currentPositionRef.current = newPosition;
      velocityRef.current = 0; // Reset velocity during drag
      
      // Apply position immediately
      if (bottomSheetRef.current) {
        bottomSheetRef.current.style.transform = getResponsiveTransform(newPosition);
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
      // Calculate how much the user dragged as a percentage of screen height
      const windowHeight = window.innerHeight;
      const dragPercentage = (deltaY / windowHeight) * 100;
      
      // Define threshold for moving to next snap point (25% of screen height)
      const DRAG_THRESHOLD = 25;
      
      // Determine target snap point based on drag direction and threshold
      let targetSnapPoint = currentSnapPointRef.current;
      
      if (Math.abs(dragPercentage) > DRAG_THRESHOLD) {
        // User dragged far enough to move to next snap point
        if (dragPercentage > 0) {
          // Dragging down (closing direction)
          if (currentSnapPointRef.current === currentSnapPoints.FULL) {
            targetSnapPoint = currentSnapPoints.HALF;
          } else if (currentSnapPointRef.current === currentSnapPoints.HALF) {
            targetSnapPoint = currentSnapPoints.CLOSED;
          }
        } else {
          // Dragging up (opening direction)
          if (currentSnapPointRef.current === currentSnapPoints.CLOSED) {
            targetSnapPoint = currentSnapPoints.HALF;
          } else if (currentSnapPointRef.current === currentSnapPoints.HALF) {
            targetSnapPoint = currentSnapPoints.FULL;
          }
        }
      }
      // If dragPercentage < DRAG_THRESHOLD, targetSnapPoint remains the same (spring back)
      
      // Calculate velocity for spring animation (based on drag speed)
      const dragTime = 16; // Approximate time between frames
      velocityRef.current = (deltaY / windowHeight * 100) / dragTime;
      
      // Handle closing or snap to position with spring animation
      if (targetSnapPoint === currentSnapPoints.CLOSED) {
        onClose();
      } else if (targetSnapPoint !== currentSnapPointRef.current) {
        // Moving to a different snap point
        setSnapPoint(targetSnapPoint);
      } else {
        // Staying at the same snap point, force spring back to exact position
        animateToPosition(targetSnapPoint);
      }
    } else {
      // No valid drag, spring back to current position
      animateToPosition(currentSnapPointRef.current);
    }
    
    // Remove any inline styles that override spring animation
    if (bottomSheetRef.current) {
      bottomSheetRef.current.style.transition = '';
      // Don't remove transform here - let spring animation handle it
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
    
    // Stop any ongoing spring animation
    if (isAnimatingRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      isAnimatingRef.current = false;
    }
    
    // Disable CSS transitions and enable spring animation
    if (bottomSheetRef.current) {
      bottomSheetRef.current.classList.add('dragging');
      bottomSheetRef.current.classList.add('spring-animating');
    }
    
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
    
    // Disable any CSS transitions (spring animation takes over)
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
    if (point === currentSnapPoints.CLOSED) {
      onClose();
    } else {
      setSnapPoint(point);
    }
  };

  // Get content based on snap point
  const getContentForSnapPoint = () => {
    switch (snapPoint) {
      case currentSnapPoints.HALF:
        return (
          <div className="bottom-sheet-content">
            <p>Half-open view - Some content is visible.</p>
            <div className="snap-buttons">
              <button onClick={() => handleSnapTo(currentSnapPoints.FULL)}>
                Expand to Full
              </button>
              <button onClick={() => handleSnapTo(currentSnapPoints.CLOSED)}>
                Close
              </button>
            </div>
          </div>
        );
      case currentSnapPoints.FULL:
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
              <button onClick={() => handleSnapTo(currentSnapPoints.HALF)}>
                Minimize to Half
              </button>
              <button onClick={() => handleSnapTo(currentSnapPoints.CLOSED)}>
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
        className={`bottom-sheet ${isOpen ? 'open' : ''} ${isDraggingRef.current ? 'dragging' : ''} ${isAnimatingRef.current ? 'spring-animating' : ''} snap-${snapPoint}`}
        style={{
          // Don't set transform here - animations handle it completely
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
          <h2>Bottom Sheet - {snapPoint === currentSnapPoints.HALF ? 'Half Open' : 'Fully Open'}</h2>
        </div>
        
        {getContentForSnapPoint()}
      </div>
    </>
  );
};

export default BottomSheet;
