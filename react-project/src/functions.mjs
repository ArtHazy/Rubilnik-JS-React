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
 * @returns {void} 
 */
export function loadQuizFromFile(file, quiz, ind){
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

                let self = getSelfFromLocalStorage();
                self.quizzes[ind] = quiz;

                putSelfInLocalStorage(self);
                window.location.reload();
            }
            // return true;
        }
    }
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