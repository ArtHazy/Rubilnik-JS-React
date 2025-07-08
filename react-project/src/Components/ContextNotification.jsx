import { createContext, useContext, useState } from 'react';
import Notification from './Notification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            closeNotification(id);
        }, duration);
    };

    const closeNotification = (id) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? {...n, isClosing: true} : n)
        );
        
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 300);
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
                isClosing={notification.isClosing || false}
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