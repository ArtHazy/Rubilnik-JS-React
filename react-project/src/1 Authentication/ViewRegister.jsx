import { limits } from '../values.mjs';
import { http_user_register } from '../HTTP_requests.mjs';
import "./ViewAuth.scss"
import { handleEnterKey } from '../functions.mjs';
import {useNotification} from "../Components/ContextNotification.jsx";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../Components/LanguageSwitcher';

export const ViewRegister = () => {
    const { showNotification } = useNotification();
    const { t } = useTranslation(); 

    return (
        <div className='ViewRegister'>
            <LanguageSwitcher />
            
            <div className="form"> 
                <div className={"hstack"}>
                    <div className='log accent'>{t('login.rubil')}</div>
                    <div className='in accent'>{t('login.nik')}</div>
                </div>

                <div className='form'>
                    <input id="username-input" type="text" placeholder={t('register.username')} maxLength={limits.maxNameLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                    <input id="email-input" type="email" placeholder={t('register.email')} maxLength={limits.maxEmailLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                    <input id="password-input" type="password" placeholder={t('register.password')} maxLength={limits.maxPassLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                    <button id='submit' className='big' onClick={() => {
                        let submit = document.getElementById('submit');
                        submit.hidden = true;
                        // let load = document.createElement('div');
                        // load.innerHTML = '/..'
                        // submit.after(load)

                        let name = document.getElementById('username-input').value;
                        let password = document.getElementById('password-input').value;
                        let email = document.getElementById('email-input').value;

                        http_user_register({name,email,password}, (isOk, resText)=>{
                            // load.remove()
                            submit.hidden=false
                            showNotification(resText, isOk? 'success' : 'error')
                            setTimeout(()=>{window.location.href='/login'}, 3000)
                        })
                    }}>{t('register.button')}</button>
                
                    <div className='grid'>
                        <a href="/join"><small>{t('login.quickJoin')}</small></a>
                        {' | '}
                        <a href="/login"><small>{t('register.loginLink')}</small></a>
                    </div>
                </div>
            </div>
        </div>
    )        
}
