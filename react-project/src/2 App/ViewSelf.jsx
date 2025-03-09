import { useState } from "react";
import { limits } from "../values.mjs";
import { getSelfFromLocalStorage, putSelfInLocalStorage, removeSelfFromLocalStorage } from "../functions.mjs"
import { http_put_user } from "../HTTP_requests.mjs";

export const ViewSelf = () => {
    const [flag,setFlag] = useState(false);
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
                id:<input id='id' type="text" value={self.id} onChange={(e)=>{e.target.value=self.id}}/>
            </vstack>
            <vstack>
                name:<input id='name' type="text" value={self?.name} maxLength={limits.maxNameLength} onChange={(e)=>{self.name = e.target.value, upd()}}/>
            </vstack>
            <vstack>
                email:<input id='email' type="text" value={self?.email} maxLength={limits.maxEmailLength} onChange={(e)=>{self.email = e.target.value, upd()}}/>
            </vstack>
            <vstack>
                password:<input id='password' type="password" value={self?.password} maxLength={limits.maxPassLength} onChange={(e)=>{self.password = e.target.value, upd()}}/>
            </vstack>
            <vstack>
                <button className="big" onClick={()=>{
                    let name = document.querySelector("#name").value;
                    let email = document.querySelector("#email").value;
                    let password = document.querySelector("#password").value;

                    if (http_put_user(self, {name,email,password}, ()=>{})) {removeSelfFromLocalStorage(), window.location='/'}
                    else {confirm("Failed to save changes\nLog out without saving?")? (removeSelfFromLocalStorage(), window.location='/') : null}
                }}>log out</button>
            </vstack>
        </div>
    </div>
}