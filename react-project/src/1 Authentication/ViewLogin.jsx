import { CORE_SERVER_URL, limits } from '../values.mjs';
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { http_post_user_get, http_user_verify } from '../HTTP_requests.mjs';
import "./ViewAuth.scss"

export const ViewLogin = () => {

    if ( getSelfFromLocalStorage()?.id ) window.location.href='/'
    else return <div className='ViewLogin'>
        <div className='form'>
            <hstack><div className='log accent'>LOG</div><div className='in accent'>IN</div></hstack>
            <div className='form'>
                <input id="email-input" type="email" placeholder='email' maxLength={limits.maxEmailLength} />
                <input id="password-input" type="password" placeholder='password' maxLength={limits.maxPassLength} />
                <button id='submit' className='big' onClick={() => {
                    let submit = document.getElementById('submit');
                    submit.hidden = true;
                    let load = document.createElement('div')
                    load.innerHTML = '/..'
                    submit.after(load)

                    let email = document.getElementById('email-input').value;
                    let password = document.getElementById('password-input').value;

                    let onLoad = () => {load.remove(), submit.hidden = false}

                    let {isOk, user} = http_post_user_get({email,password}, onLoad);
                    let quizzes = user?.quizzes
                    if (isOk && Array.isArray(quizzes)) {
                        quizzes.forEach((quiz)=>{quiz.isInDB=true;})
                        user.isInDB=true;
                        console.log('user', user), putSelfInLocalStorage(user), window.location.href='/'
                    } else alert('failed to login')
                }}>login</button>
            </div>

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