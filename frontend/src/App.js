import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import ModulePage from './pages/ModulePage';
import TaskPage from './pages/TaskPage';
import LoginPage from './pages/LoginPage';     
import RegisterPage from './pages/RegisterPage'; 
import ProfilePage from './pages/ProfilePage';
import ForumPage from './pages/ForumPage';
import TheoryPage from './pages/TheoryPage';
import './App.css';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/module/:id" element={<ModulePage />} />
        <Route path="/task/:id" element={<TaskPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/theory" element={<TheoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;