import { useContext } from 'react';
import NotificationContext from '../context/NotificationContext';

export function useNotification() {
  const ctx = useContext(NotificationContext);
  // Avoid noisy logs by default. Enable detailed notification hook logging by
  // setting `window.__ram_debug_notifications = true` in the browser console.
  try {
    if (typeof window !== 'undefined' && window.__ram_debug_notifications) {
      console.info('[useNotification] hook called, has ctx?', !!ctx);
    }
  } catch (e) {
    // ignore logging errors
    void e;
  }
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

export function useNotificationSafe() {
  return useContext(NotificationContext) || null;
}

export default useNotification;
