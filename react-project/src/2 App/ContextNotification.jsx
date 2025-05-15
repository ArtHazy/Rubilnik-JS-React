import { createContext, useContext, useState } from 'react';
import Notification from './Components/Notification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
        closeNotification(id);
        }, 3000);
    };

    const closeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
        {children}
        <div className="notification-wrapper">
            {notifications.map(notification => (
            <Notification
                key={notification.id}
                message={notification.message}
                type={notification.type}
                onClose={() => closeNotification(notification.id)}
            />
            ))}
        </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};