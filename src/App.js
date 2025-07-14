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
        <div className="instructions-container">
          <h3>How to use:</h3>
          <ul>
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
