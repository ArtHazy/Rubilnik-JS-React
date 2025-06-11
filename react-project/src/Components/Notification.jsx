import { useEffect, useState } from 'react';
import './Notification.scss';

const Notification = ({ message, type = 'info', onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const startClosing = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Должно совпадать с длительностью анимации
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startClosing();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type} ${isClosing ? 'closing' : ''}`}>
      <div className="message">{message}</div>
      <button className="close-btn" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Notification;