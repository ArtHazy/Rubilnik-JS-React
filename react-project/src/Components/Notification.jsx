import { useEffect, useState } from 'react';
import './Notification.scss';

const Notification = ({ message, type = 'info', isClosing, onClose }) => {
  useEffect(() => {
    if (!isClosing) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  return (
    <div className={`notification ${type} ${isClosing ? 'closing' : ''}`}>
      <div className="message">{message}</div>
      <button className="close-btn" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Notification;