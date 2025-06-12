import { limits } from '../values.mjs';
import { putSelfInLocalStorage } from "../functions.mjs"
import { http_user_login } from '../HTTP_requests.mjs';
import "./ViewAuth.scss"
import { handleEnterKey } from '../functions.mjs';
import { useNotification } from '../Components/ContextNotification';

export const ViewLogin = () => {
    const { showNotification } = useNotification();

    // if ( getSelfFromLocalStorage()?.id ) window.location.href='/'
    /*else*/ return <div className='ViewLogin'>
        <div className='form'>
            <div className={"hstack"}>
                <div className='log accent'>LOG</div>
                <div className='in accent'>IN</div>
            </div>
            
            <input id="email-input" type="email" placeholder='email' maxLength={limits.maxEmailLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
            <input id="password-input" type="password" placeholder='password' maxLength={limits.maxPassLength} onKeyDown={(e) => handleEnterKey(e, '.form', 'submit')} />
            <button id='submit' className='big' onClick={() => {
                let submit = document.getElementById('submit');
                submit.hidden = true;
                // let load = document.createElement('div')
                // load.innerHTML = '/..'
                // submit.after(load)

                showNotification('failed to login', 'error')

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
                    } else showNotification('failed to login', 'error')
                });
            }}>login</button>

            <div className='grid'>
                {/* <a style={{color:"GrayText"}}><small>join the game</small></a> */}
                {/* TODO войти как гость */}
                <a href="/join"><small>quick join</small></a>
                {' | '}
                <a href="/register"><small>register</small></a>
            </div>
        </div>
    </div>
}