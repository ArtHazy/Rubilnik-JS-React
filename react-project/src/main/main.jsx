import React, {lazy} from 'react'
import ReactDOM from 'react-dom/client'
import './main.scss'
import { App } from '../2 App/App.jsx';
import { createBrowserRouter,RouterProvider} from "react-router-dom";
import { ViewLogin } from '../1 Authentication/ViewLogin.jsx';
import { ViewRegister } from '../1 Authentication/ViewRegister.jsx';
import { ViewQuizEdit } from "../2 App/ViewQuizEdit.jsx";
import { ViewJoin } from '../2 App/ViewJoin.jsx';
import { ViewError } from '../4 Error/ViewError.jsx';
import { NotificationProvider } from '../2 App/ContextNotification.jsx';
import { Play } from '../3 Play/Play.jsx'
import LanguageSwitcher from '../Components/LanguageSwitcher.jsx';

// const Play = lazy(() => import('../3 Play/Play.jsx'));

const router = createBrowserRouter([
  { path: "/", element: <App/> },
  { path: "/login", element: <ViewLogin/> },
  { path: "/register", element: <ViewRegister/> },
  { path: "/edit-quiz/:ind", element: <ViewQuizEdit/> },
  { path: "/play/:roomId", element: <Play/> },
  { path: "/play/", element: <Play/> },
  { path: "/join", element: <ViewJoin/>},
  { path: "*", element: <ViewError code={404} text={'resource not found'}/>} 
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <NotificationProvider>
    <RouterProvider router={router} />
    <LanguageSwitcher />
  </NotificationProvider>
)