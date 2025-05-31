import React, {lazy} from 'react'
import ReactDOM from 'react-dom/client'
//lazy import, separate build .js chunk
import './main.scss'
//scss
import { App } from '../2 App/App.jsx';
import { createBrowserRouter,RouterProvider} from "react-router-dom";
import { ViewLogin } from '../1 Authentication/ViewLogin.jsx';
import { ViewRegister } from '../1 Authentication/ViewRegister.jsx';
// import {ViewQuizEdit} from "../2 App/ViewQuizEdit.jsx";
// import { Play } from '../3 Play/Play.jsx';
import { ViewJoin } from '../2 App/ViewJoin.jsx';
import { ViewError } from '../4 Error/ViewError.jsx';
import { NotificationProvider } from '../2 App/ContextNotification.jsx';

// const App = lazy(() => import('../2 App/App.jsx'));
// const ViewLogin = lazy(() => import('../1 Authentication/ViewLogin.jsx'));
// const ViewRegister = lazy(() => import('../1 Authentication/ViewRegister.jsx'));
const ViewQuizEdit = lazy(() => import('../2 App/ViewQuizEdit.jsx'));
const Play = lazy(() => import('../3 Play/Play.jsx'));
// const ViewJoin = lazy(() => import('../2 App/ViewJoin.jsx'));
// const ViewError = lazy(() => import('../4 Error/ViewError.jsx'));
// const NotificationProvider = lazy(() => import('../2 App/ContextNotification.jsx'));



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
  </NotificationProvider>
)