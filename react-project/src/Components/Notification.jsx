import { useEffect } from 'react';
import './Notification.scss';

const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      startClosing();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const startClosing = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Должно совпадать с длительностью анимации
  };

  return (
    <div className={`notification ${type} ${isClosing ? 'closing' : ''}`}>
      <div className="message">{message}</div>
      <button className="close-btn" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Notification;