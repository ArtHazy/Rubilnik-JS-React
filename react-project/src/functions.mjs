import {AUTH_SERVICE_URL, limits} from "./values.mjs";

/**
 * @param {{}} json 
 * @param {string} filename 
 * @returns {void} 
 */
export function downloadJson(json, filename){
    let file = new File([JSON.stringify(json)],'load.json');
    let fileURL = window.URL.createObjectURL(file);

    var fileLink = document.createElement('a');
    fileLink.href = fileURL;
    fileLink.download = filename+'.json';
    fileLink.click();
}
/** @param {User} self */
export const putSelfInLocalStorage = (self)=>{localStorage.setItem('self', JSON.stringify(self))}
/** @param {User} self */
export const removeSelfFromLocalStorage = (self)=>{localStorage.removeItem('self')}
/** @returns {User} */
export const getSelfFromLocalStorage = ()=>JSON.parse(localStorage.getItem('self'));

/**
 * 
 * @param {User} self 
 * @returns {void} 
 */
export function putSelfInDB(self){
    // self.quizzes[0].name
    let isOk
    let req = new XMLHttpRequest();
    req.open('PUT', AUTH_SERVICE_URL+'/user', false);
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ isOk=req.status==200 }
    req.send(JSON.stringify(self))
    console.log('putSelfInDB', isOk);
    return isOk
}


/**
 * @param {{}} objReceiver 
 * @param {{}} objGiver 
 * @returns {void} 
 */
export function replaceValues(objReceiver, objGiver){
    Object.keys(objReceiver).forEach((key)=>{ delete objReceiver[key]; })
    Object.keys(objGiver).forEach((key)=>{ objReceiver[key] = objGiver[key]; })
}

export const handleEnterKey = (event, formSelector, submitButtonId = null, cycleMode = false) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const form = event.currentTarget.closest(formSelector);
    if (!form) return;

    const inputs = Array.from(form.querySelectorAll('input:not([readonly])'));
    const currentIndex = inputs.indexOf(event.currentTarget);
    
    if (currentIndex === -1) return;

    // Режим циклического переключения
    if (cycleMode) {
        const nextIndex = (currentIndex + 1) % inputs.length;
        inputs[nextIndex].focus();
        return;
    }

    // Оригинальная логика для других случаев
    let checked = 0;
    let nextIndex = (currentIndex + 1) % inputs.length;
    
    while (checked < inputs.length) {
        if (inputs[nextIndex].value.trim() === '') {
            inputs[nextIndex].focus();
            return;
        }
        nextIndex = (nextIndex + 1) % inputs.length;
        checked++;
    }

    if (submitButtonId) {
        document.getElementById(submitButtonId)?.click();
    }
};
/** 
 * @param {string} name
 * @returns {string,null}
 * */
export function getCookie(name){
    const val = `; ${document.cookie}`
    const parts = val.split(`; ${name}=`);
    if (parts.length===2) return parts.pop().split(';').shift();
    return null;
}
/**
 * @param {string} name
 * @returns {boolean}
 * */
export function checkValidationCookie(){
    alert(getCookie('Authorization'))
    if (!getCookie('Authorization')) {
        window.location.href = "/login"
        return false
    }
    return true
}