import { useState } from "react";
import { limits } from "../values.mjs";
import { getSelfFromLocalStorage, putSelfInLocalStorage, removeSelfFromLocalStorage, handleEnterKey } from "../functions.mjs"
import {http_put_user, http_user_logout} from "../HTTP_requests.mjs";
import { useTranslation } from 'react-i18next';
import { Header } from '../Components/Header';
import "./ViewSelf.scss"

export const ViewSelf = () => {
    const { t } = useTranslation();
    const [flag, setFlag] = useState(false);
    const self = getSelfFromLocalStorage();

    function upd(isInDB){ self.isInDB = isInDB? true:false, putSelfInLocalStorage(self), setFlag(!flag) }

    return <div className="ViewSelf">
        <Header title={t('profile.title')}/>
        <div className="form">
            
            {!self.isInDB? <button onClick={()=>{
                let isOk = http_put_user(self,self,()=>{});
                if (isOk) upd(true)
            }}>{t('profile.saveButton')}</button> : null}

            <div className="form-field">
                {t('profile.idLabel')}<input id='id' type="text" value={self?.id} readonly="true" onChange={(e)=>{e.target.value=self.id}}/>
            </div>
            <div className="form-field">
                {t('profile.emailLabel')}<input id='email' type="text" value={self?.email} maxLength={limits.maxEmailLength} onChange={(e)=>{self.email = e.target.value, upd()}} onKeyDown={(e) => handleEnterKey(e, '.form', null, true)}/>
            </div>
            <div className="form-field">
                {t('profile.passwordLabel')}
                <div className="password-container">
                    <input 
                        id='password' 
                        type="password" 
                        value={self?.password} 
                        maxLength={limits.maxPassLength} 
                        onChange={(e)=>{self.password = e.target.value; upd()}}
                        onKeyDown={(e) => handleEnterKey(e, '.form', null, true)}
                    />
                </div>
            </div>
            <button className="big" onClick={()=>{
                let name = self.name;
                let email = document.querySelector("#email").value;
                let password = document.querySelector("#password").value;

                if (http_put_user(self, {name, email, password}, ()=>{})) {removeSelfFromLocalStorage(), http_user_logout(), window.location.href="/login"}
                else {confirm(`${t('profile.logoutConfirm.title')}\n${t('profile.logoutConfirm.message')}`)? (removeSelfFromLocalStorage(), http_user_logout(), window.location.href="/login") : null}
            }}>{t('profile.logoutButton')}</button>
        </div>
    </div>
}