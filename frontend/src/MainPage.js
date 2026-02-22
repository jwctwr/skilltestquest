import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import ModulePage from './pages/ModulePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/module/:id" element={<ModulePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;