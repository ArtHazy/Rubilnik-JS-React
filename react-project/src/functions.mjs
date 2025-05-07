import { CORE_SERVER_URL, limits } from "./values.mjs";

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
    req.open('PUT', CORE_SERVER_URL+'/user', false);
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

/**
 * @param {File} file 
 * @param {Quiz} quiz 
 * @param {()=>void} upd 
 * @returns {void} 
 */
export function loadQuizFromFile(file, quiz, upd){
    console.log("upd", upd);
    console.log(file);
    if (file instanceof File) {
        if (file.size>limits.maxQuizFileSise) { alert('file size is too big') }
        else {
            let fr = new FileReader();
            fr.readAsText(file)
            fr.onload = (e)=>{
                let ft = e.target.result
                console.log(file.size, ft.byteLength);
                let loadedQuiz = JSON.parse(ft)

                loadedQuiz.id = quiz.id;

                replaceValues(quiz, loadedQuiz)
                upd()
            }
        }
    }
}
