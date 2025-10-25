import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NotificationProvider } from './context/NotificationContext';
import NotificationManager from './utils/NotificationManager';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <App />
      <NotificationManager />
    </NotificationProvider>
  </StrictMode>,
)
