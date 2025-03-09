import React, { useState } from "react";
import { ViewJoin } from "./ViewJoin";
import { ViewLibrary } from "./ViewLibrary";
import { ViewSelf } from "./ViewSelf";
import { getSelfFromLocalStorage } from "../functions.mjs"

export const App = () => {
  const [view, setView] = useState(<ViewLibrary/>)

  if ( !getSelfFromLocalStorage()?.id ) window.location.href = "/login"
  else {
    return <div className={"App"}>
      {view}
      <Navigation setView={setView} view={view}/>
    </div>
  }  
}

export default App;

/**
 * 
 * @param {(view: React.JSX.Element)=>{}} setView
 * @param {React.JSX.Element} view current view
 * @returns 
 */
export const Navigation = ({setView, view}) => 
  <div className="Navigation">
      <button className={(view?.type?.name == 'ViewLibrary')? 'active': null} onClick={()=>setView(<ViewLibrary/>)}>
          
          <span className="material-symbols-outlined">home</span>
      </button>
      <button className={(view?.type?.name == 'ViewJoin')? 'active': null} onClick={()=>setView(<ViewJoin/>)}>
      <span className="material-symbols-outlined">hub</span>
      </button>
      <button className={(view?.type?.name == 'ViewSelf')? 'active': null} onClick={()=>setView(<ViewSelf/>)}>
      <span className="material-symbols-outlined">person</span>
      </button>
  </div>

export const Actions = ({children}) => 
  <div className="Actions">
    {children}
  </div>