import { limits } from '../values.mjs';
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { http_post_user } from '../HTTP_requests.mjs';
import "./ViewAuth.scss"
import { handleEnterKey } from '../functions.mjs';

export const ViewRegister = () => {
    if ( getSelfFromLocalStorage()?.id ) window.location.href='/'
    else return <div className='ViewRegister'>
        <div className="form">
            
            <hstack style={{gap:0}} ><div className='reg accent'>REG</div><div className='ister accent'>ISTER</div></hstack>

            <div className='form'>
                <input id="username-input" type="text" placeholder='username' maxLength={limits.maxNameLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                <input id="email-input" type="email" placeholder='email' maxLength={limits.maxEmailLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                <input id="password-input" type="password" placeholder='password' maxLength={limits.maxPassLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
                <button id='submit' className='big' onClick={() => {
                    let submit = document.getElementById('submit');
                    submit.hidden = true;
                    let load = document.createElement('div');
                    load.innerHTML = '/..'
                    submit.after(load)

                    let name = document.getElementById('username-input').value;
                    let password = document.getElementById('password-input').value;
                    let email = document.getElementById('email-input').value;

                    let {isOk, userId} = http_post_user({name,email,password}, ()=>{load.remove(), submit.hidden=false})
                    if (isOk) putSelfInLocalStorage({id:userId,name,email,password}), window.location.href='/';
                }}>Register</button>
            </div>
            <a href="/login"><small>Login</small></a>
        </div>
    </div>        
}
