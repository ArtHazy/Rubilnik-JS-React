import { CORE_SERVER_URL } from "./values.mjs";

export const onerror = (e) => {alert(e.message);}

export function http_user_verify({email, password}, onload){
    let isOk, id;
    const req = new XMLHttpRequest();
    req.open('POST', CORE_SERVER_URL+"/user/verify", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ onload(); isOk=req.status==200; id = JSON.parse(req.responseText).id;}
    req.onerror = onerror;
    req.send(JSON.stringify( {validation:{email, password}} ));
    console.log('isOk',isOk);
    return {isOk, id};
}
export function http_post_user({name, email, password}, onload){
    let isOk, id;

    const req = new XMLHttpRequest();
    req.open('POST', CORE_SERVER_URL+"/user", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ onload(); isOk=req.status==200; console.log('req',req);  id = JSON.parse(req.responseText).id; }
    req.onerror = onerror;
    req.send(JSON.stringify({ user:{name, email, password} }));
    console.log('isOk',isOk);
    return {isOk, id};
}
export function http_post_user_get({email, password}, onload){
    let isOk, user;
    const req = new XMLHttpRequest();
    req.open('POST', CORE_SERVER_URL+"/user/get", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ onload(); isOk=req.status==200; console.log('req',req);  user = JSON.parse(req.responseText); }
    req.onerror = onerror;
    req.send(JSON.stringify( {validation:{email, password}} ));
    console.log('isOk',isOk);
    console.log('user',user);
    return {isOk, user};
}
// export function http_delete_user({id}, onload){
//     let isOk;
//     const req = new XMLHttpRequest();
//     req.open('DELETE', CORE_SERVER_URL+"/user", false)
//     req.setRequestHeader('Content-Type', 'application/json');
//     req.onload = ()=>{ onload(); isOk=req.status==200 }
//     req.onerror = onerror;
//     req.send(JSON.stringify({id}));
//     console.log('isOk',isOk);
//     return isOk;
// }

/**
 * 
 * @param { {id:{name:string},password:string} } validation 
 * @param { {name,email,password} } user 
 * @param {*} onload 
 * @returns 
 */
export function http_put_user(validation,user,onload){
    validation = {id: validation.id, password: validation.password}
    user = {name:user.name, email: user.email, password: user.password}

    let isOk;
    const req = new XMLHttpRequest();
    req.open('PUT', CORE_SERVER_URL+"/user", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ onload(); isOk=req.status==200 }
    req.onerror = onerror;
    req.send( JSON.stringify( {validation,user} ) );
    console.log('isOk',isOk);
    return isOk;
}

/**
 * @param { {id:string, password:string} } validation 
 * @param { {title:string, questions:[{title:string,choices:[{title:string,correct:boolean}]}]} } quiz 
 * @param {Function} onload
 * @returns
 */
export function http_post_quiz(validation,quiz, onload){
    validation = {id:validation.id, password:validation.password}
    delete quiz.isInDB
    let isOk, quizResponce;
    const req = new XMLHttpRequest();
    req.open('POST', CORE_SERVER_URL+"/quiz", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ onload(); isOk=req.status==200; quizResponce = JSON.parse(req.responseText);  }
    req.onerror = onerror;
    req.send(JSON.stringify( {validation,quiz} ));
    console.log('isOk', isOk);
    quizResponce.isInDB = true;
    return {isOk, quiz: quizResponce};
}

/**
 * @param { {id:string, title:string, questions:[{title:string,choices:[{title:string,correct:boolean}]}]} } quiz 
 * @param {Function} onload
 */
export function http_put_quiz(validation, quiz, onload){
    console.log("qqq",quiz);
    console.log(validation);
    let isOk, quizRes;
    delete quiz.isInDB
    validation = {id:validation.id, password:validation.password}
    const req = new XMLHttpRequest();
    req.open('PUT', CORE_SERVER_URL+"/quiz", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ onload(); isOk=req.status==200; quizRes=JSON.parse(req.responseText)}
    req.onerror = onerror;
    req.send(JSON.stringify( {validation,quiz} ));
    console.log('isOk',isOk);
    console.log('req.responseText',req.responseText);
    quizRes.isInDB = true;
    return {isOk, quiz: quizRes};
}
export function http_delete_quiz(validation, id, onload){
    let isOk;
    validation = {id:validation.id, password:validation.password}
    const req = new XMLHttpRequest();
    req.open('DELETE', CORE_SERVER_URL+"/quiz", false)
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ onload(); isOk=req.status==200; }
    req.onerror = onerror;
    req.send(JSON.stringify( {validation,id} ));
    console.log('isOk',isOk);
    return isOk;
}







