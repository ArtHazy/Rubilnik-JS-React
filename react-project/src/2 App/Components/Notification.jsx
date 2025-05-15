import { useEffect } from 'react';
import './Notification.scss';

const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <div className="message">{message}</div>
      <button className="close-btn" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Notification;