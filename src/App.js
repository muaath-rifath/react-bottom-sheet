import React, { useState } from 'react';
import './App.css';
import BottomSheet from './components/BottomSheet';

function App() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const openBottomSheet = () => {
    setIsBottomSheetOpen(true);
  };

  const closeBottomSheet = () => {
    setIsBottomSheetOpen(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Bottom Sheet Demo</h1>
        <p>
          A React application with a bottom sheet component featuring multiple snap points and spring animations.
        </p>
        <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '30px' }}>
          ✨ Features: Three snap points (closed, half-open, fully open) • Drag gestures • Smooth transitions
        </p>
        <button 
          className="open-bottom-sheet-btn"
          onClick={openBottomSheet}
        >
          Open Bottom Sheet
        </button>
        
        {/* Instructions */}
        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '12px',
          maxWidth: '500px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>How to use:</h3>
          <ul style={{ 
            textAlign: 'left', 
            margin: 0, 
            padding: '0 0 0 20px',
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}>
            <li>Click the button to open the bottom sheet</li>
            <li>Drag the handle up and down to resize</li>
            <li>Use the buttons to snap to specific positions</li>
            <li>Click the backdrop to close</li>
          </ul>
        </div>
      </header>
      
      <BottomSheet 
        isOpen={isBottomSheetOpen}
        onClose={closeBottomSheet}
      />
    </div>
  );
}

export default App;
