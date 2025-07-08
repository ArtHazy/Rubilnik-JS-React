import { limits } from '../values.mjs';
import { putSelfInLocalStorage } from "../functions.mjs"
import { http_user_login } from '../HTTP_requests.mjs';
import "./ViewAuth.scss"
import { handleEnterKey } from '../functions.mjs';
import { useNotification } from '../Components/ContextNotification';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../Components/LanguageSwitcher';

export const ViewLogin = () => {
    const { t } = useTranslation();
    const { showNotification } = useNotification();

    return <div className='ViewLogin'>
        <div className='form'>
            <LanguageSwitcher />
            
            <div className={"hstack"}>
                <div className='log accent'>{t('login.rubil')}</div>
                <div className='in accent'>{t('login.nik')}</div>
            </div>
            
            <div className='form'>
                <input id="email-input" type="email" placeholder={t('login.emailPlaceholder')} maxLength={limits.maxEmailLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                <input id="password-input" type="password" placeholder={t('login.passwordPlaceholder')} maxLength={limits.maxPassLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                <button id='submit' className='big' onClick={() => {
                    let submit = document.getElementById('submit');
                    submit.hidden = true;
                    // let load = document.createElement('div')
                    // load.innerHTML = '/..'
                    // submit.after(load)

                    let email = document.getElementById('email-input').value;
                    let password = document.getElementById('password-input').value;

                    http_user_login({email,password}, (isOk,user)=>{
                        // load.remove()
                        submit.hidden = false
                        let quizzes = user?.quizzes
                        if (isOk && Array.isArray(quizzes)) {
                            quizzes.forEach((quiz)=>{quiz.isInDB=true;})
                            user.password=password;
                            user.isInDB=true;
                            putSelfInLocalStorage(user)
                            console.log('user', user)
                            window.location.href='/'
                        } else showNotification(t('notifications.loginFailed'), 'error')
                    });
                    showNotification(t('notifications.loginFailed'), 'error')
                }}>{t('login.loginButton')}</button>

                <div className='grid'>
                    <a href="/join"><small>{t('login.quickJoin')}</small></a>
                    {' | '}
                    <a href="/register"><small>{t('login.registerLink')}</small></a>
                </div>
            </div>
        </div>
    </div>
}