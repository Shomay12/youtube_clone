import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import './Toast.css';

const Toast = () => {
  const { toast, clearToast } = useStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className={`toast-container ${toast.type}`}>
      <span className="material-symbols-outlined toast-icon">
        {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={clearToast}>
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
};

export default Toast;
