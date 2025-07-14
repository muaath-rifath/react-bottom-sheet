import React, { useState, useEffect } from 'react';
import './BottomSheet.css';

const BottomSheet = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Add a small delay to allow for exit animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop/Overlay */}
      <div 
        className={`bottom-sheet-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* Bottom Sheet Content */}
      <div className={`bottom-sheet ${isOpen ? 'open' : ''}`}>
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-handle" />
          <h2>Bottom Sheet Demo</h2>
        </div>
        
        <div className="bottom-sheet-content">
          <p>This is a basic bottom sheet component.</p>
          <p>In the next steps, we'll add:</p>
          <ul>
            <li>Multiple snap points</li>
            <li>Spring animations</li>
            <li>Drag gestures</li>
            <li>Smooth transitions</li>
          </ul>
          
          <button 
            className="close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default BottomSheet;