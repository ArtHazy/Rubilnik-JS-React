import { limits } from '../values.mjs';
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { http_user_register } from '../HTTP_requests.mjs';
import "./ViewAuth.scss"
import { handleEnterKey } from '../functions.mjs';
import {useNotification} from "../2 App/ContextNotification.jsx";

export const ViewRegister = () => {
    const { showNotification } = useNotification();

    if ( getSelfFromLocalStorage()?.id ) window.location.href='/'
    else return <div className='ViewRegister'>
        <div className="form">
            
            <div className={"hstack"} style={{gap:0}} ><div className='reg accent'>REG</div><div className='ister accent'>ISTER</div></div>

            <div className='form'>
                <input id="username-input" type="text" placeholder='username' maxLength={limits.maxNameLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                <input id="email-input" type="email" placeholder='email' maxLength={limits.maxEmailLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                <input id="password-input" type="password" placeholder='password' maxLength={limits.maxPassLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
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
                }}>Register</button>
            </div>
            <a href="/login"><small>Login</small></a>
        </div>
    </div>        
}
