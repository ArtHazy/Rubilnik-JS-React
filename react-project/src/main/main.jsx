import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '../2 App/App.jsx';
import { createBrowserRouter,RouterProvider} from "react-router-dom";
import { ViewLogin } from '../1 Authentication/ViewLogin.jsx';
import { ViewRegister } from '../1 Authentication/ViewRegister.jsx';
import { ViewQuizEdit } from "../2 App/ViewQuizEdit.jsx";
import { ViewJoin } from '../2 App/ViewJoin.jsx';
import { ViewError } from '../4 Error/ViewError.jsx';
import { NotificationProvider } from '../Components/ContextNotification.jsx';
import { Play } from '../3 Play/Play.jsx'
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

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
  <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
    </I18nextProvider>
  </React.StrictMode>
)