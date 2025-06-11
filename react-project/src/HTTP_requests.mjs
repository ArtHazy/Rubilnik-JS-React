import { AUTH_SERVICE_URL } from "./values.mjs";
import { useNotification } from "./Components/ContextNotification";

export const onerror = (e) => {const { showNotification } = useNotification(); showNotification(e.message, error);}

// export function http_user_verify({email, password}, onload){
//     let isOk, id;
//     const req = new XMLHttpRequest();
//     req.open('POST', AUTH_SERVICE_URL+"/user/verify", false)
//     req.setRequestHeader('Content-Type', 'application/json');
//     req.onload = ()=>{ onload(); isOk=req.status==200; id = JSON.parse(req.responseText).id;}
//     req.onerror = onerror;
//     req.send(JSON.stringify( {validation:{email, password}} ));
//     console.log('isOk',isOk);
//     return {isOk, id};
// }

/**
 * @param { (isOk:boolean, resText:string )=>void } onload
 * */
export function http_user_register({name, email, password}, onload){
    // fetch(AUTH_SERVICE_URL+'/user', {
    //     method: 'POST',
    //     headers: {'Content-Type': 'application/json'},
    //     body: {user:{name, email, password}},
    // }).then(res => {
    //     onload(res.ok,res.json().id)
    // }).catch(onerror)

    let isOk;
    const req = new XMLHttpRequest();
    req.timeout = 2000
    req.open('POST', AUTH_SERVICE_URL+"/user", true)
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true
    req.onload = ()=>{ isOk=req.status==200; console.log('req',req); onload(isOk, req.responseText);}
    req.onerror = onerror;
    req.send(JSON.stringify({ user:{name, email, password} }));
    console.log('isOk',isOk);
}

/**
 * @param {(isOk:boolean, user:User)=>void} onload
 * */
export function http_user_login({email, password}, onload){
    let isOk, user;
    const req = new XMLHttpRequest();
    // req.timeout = 2000
    req.open('POST', AUTH_SERVICE_URL+"/user/login", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true
    req.onload = ()=>{
        console.log(req.status); isOk=req.status==200; console.log('req',req);  user = JSON.parse(req.responseText); onload(isOk,user);
    }
    req.onerror = onerror;
    req.send(JSON.stringify( {validation:{email, password}} ));
    console.log('http_user_login isOk:',isOk);
    console.log('user',user);
    return {isOk, user};
}
/**
 * @param {(isOk:boolean)=>void} onload
 * */
export function http_user_logout(onload){
    let isOk;
    const req = new XMLHttpRequest();
    req.timeout = 2000
    req.open('GET', AUTH_SERVICE_URL+"/logout", true)
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true
    req.onload = ()=>{ isOk=req.status==200; console.log('req',req); onload(isOk);}
    req.onerror = onerror;
    req.send();
    console.log('isOk',isOk);
}

/**
 * 
 * @param { {id:string,password:string} } validation
 * @param { {name,email,password} } user 
 * @param {*} onload 
 * @returns 
 */
export function http_put_user({id, email, password},user,onload){
    user = {name:user.name, email: user.email, password: user.password}
    let isOk;
    const req = new XMLHttpRequest();
    req.open('PUT', AUTH_SERVICE_URL+"/user", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true
    req.onload = ()=>{ onload(); isOk=req.status==200 }
    req.onerror = onerror;
    req.send( JSON.stringify( {validation:{id, email, password},user} ) );
    console.log('http_put_user isOk:',isOk);
    return isOk;
}

/**
 * @param { {id:string, password:string} } validation 
 * @param { {title:string, questions:[{title:string,choices:[{title:string,correct:boolean}]}]} } quiz 
 * @param {Function} onload
 * @returns
 */
export function http_post_quiz({id, email, password},quiz, onload){
    delete quiz.isInDB
    let isOk, quizResponce;
    const req = new XMLHttpRequest();
    req.open('POST', AUTH_SERVICE_URL+"/quiz", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true
    req.onload = ()=>{ onload(); isOk=req.status==200; quizResponce = JSON.parse(req.responseText);  }
    req.onerror = onerror;
    req.send(JSON.stringify( {validation:{id, email, password},quiz} ));
    console.log('isOk', isOk);
    quizResponce.isInDB = true;
    return {isOk, quiz: quizResponce};
}

/**
 * @param { {id:string, title:string, questions:[{title:string,choices:[{title:string,correct:boolean}]}]} } quiz 
 * @param {Function} onload
 */
export function http_put_quiz({id, email, password}, quiz, onload){
    console.log("qqq",quiz);
    console.log({id, email, password});
    let isOk, quizRes;
    delete quiz.isInDB
    const req = new XMLHttpRequest();
    req.open('PUT', AUTH_SERVICE_URL+"/quiz", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true
    req.onload = ()=>{ onload(); isOk=req.status==200; quizRes=JSON.parse(req.responseText)}
    req.onerror = onerror;
    req.send(JSON.stringify( {validation:{id, email, password},quiz} ));
    console.log('isOk',isOk);
    console.log('req.responseText',req.responseText);
    quizRes.isInDB = true;
    return {isOk, quiz: quizRes};
}
export function http_delete_quiz({id, email, password}, quizId, onload){
    let isOk;
    const req = new XMLHttpRequest();
    req.open('DELETE', AUTH_SERVICE_URL+"/quiz", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.withCredentials = true
    req.onload = ()=>{ onload(); isOk=req.status==200; }
    req.onerror = onerror;
    req.send(JSON.stringify( {validation:{id, email, password},id:quizId} ));
    console.log('isOk',isOk);
    return isOk;
}







