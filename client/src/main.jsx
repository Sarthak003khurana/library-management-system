// ============================================
// MAIN.JSX - React DOM Mount Entry Point
// Covers Syllabus:
// - Point 31: React Fundamentals & Application Mounting
// - Point 41: BrowserRouter Entry Point
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
