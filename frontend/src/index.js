import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // этот импорт должен указывать на новый App.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);