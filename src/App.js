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
        <button 
          className="open-bottom-sheet-btn"
          onClick={openBottomSheet}
        >
          Open Bottom Sheet
        </button>
      </header>
      
      <BottomSheet 
        isOpen={isBottomSheetOpen}
        onClose={closeBottomSheet}
      />
    </div>
  );
}

export default App;
