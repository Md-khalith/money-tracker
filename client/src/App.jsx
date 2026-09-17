import React from 'react';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
