import { useState } from "react";
import { limits } from "../values.mjs";
import { getSelfFromLocalStorage, putSelfInLocalStorage, removeSelfFromLocalStorage, handleEnterKey } from "../functions.mjs"
import {http_put_user, http_user_logout} from "../HTTP_requests.mjs";
import "./ViewSelf.scss"

export const ViewSelf = () => {
    const [flag, setFlag] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 
    const self = getSelfFromLocalStorage();

    function upd(isInDB){ self.isInDB = isInDB? true:false, putSelfInLocalStorage(self), setFlag(!flag) }

    return <div className="ViewSelf">
        <header>Profile</header>
        <div className="form">
            
            {!self.isInDB? <button onClick={()=>{
                let isOk = http_put_user(self,self,()=>{});
                if (isOk) upd(true)
            }}>save</button> : null}

            <vstack>
                id:<input id='id' type="text" value={self?.id} readonly="true" onChange={(e)=>{e.target.value=self.id}}/>
            </vstack>
            <vstack>
                email:<input id='email' type="text" value={self?.email} maxLength={limits.maxEmailLength} onChange={(e)=>{self.email = e.target.value, upd()}} onKeyDown={(e) => handleEnterKey(e, '.form', null, true)}/>
            </vstack>
            <vstack>
                password:
                <div className="password-container">
                    <input 
                        id='password' 
                        type={showPassword ? "text" : "password"} 
                        value={self?.password} 
                        maxLength={limits.maxPassLength} 
                        onChange={(e)=>handleInputChange(passwordRef, 'password', e.target.value)}
                        onKeyDown={(e) => handleEnterKey(e, '.form', null, true)}
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? '👁️' : '🗨️'}
                    </button>
                </div>
            </vstack>
            <vstack>
                <button className="big" onClick={()=>{
                    let name = self.name;
                    let email = document.querySelector("#email").value;
                    let password = document.querySelector("#password").value;

                    if (http_put_user(self, {name, email, password}, ()=>{})) {removeSelfFromLocalStorage(), http_user_logout(), window.location.href="/login"}
                    else {confirm("Failed to save changes\nLog out without saving?")? (removeSelfFromLocalStorage(), http_user_logout(), window.location.href="/login") : null}
                }}>log out</button>
            </vstack>
        </div>
    </div>
}