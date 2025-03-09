import { CORE_SERVER_URL, limits } from "./values.mjs";

export function downloadJson(json, filename){
    let file = new File([JSON.stringify(json)],'load.json');
    let fileURL = window.URL.createObjectURL(file);

    var fileLink = document.createElement('a');
    fileLink.href = fileURL;
    fileLink.download = filename+'.json';
    fileLink.click();
}

export const putSelfInLocalStorage = (self)=>{localStorage.setItem('self', JSON.stringify(self))}
export const removeSelfFromLocalStorage = (self)=>{localStorage.removeItem('self')}
export const getSelfFromLocalStorage = ()=>JSON.parse(localStorage.getItem('self'));

export function putSelfInDB(self){
    let isOk
    let req = new XMLHttpRequest();
    req.open('PUT', CORE_SERVER_URL+'/user', false);
    req.setRequestHeader('Content-Type', 'application/json');
    req.onload = ()=>{ isOk=req.status==200 }
    req.send(JSON.stringify(self))
    console.log('putSelfInDB', isOk);
    return isOk
}



export function replaceValues(objReceiver, objGiver){
    Object.keys(objReceiver).forEach((key)=>{ delete objReceiver[key]; })
    Object.keys(objGiver).forEach((key)=>{ objReceiver[key] = objGiver[key]; })
}

export function loadQuizFromFile(file, quiz, upd){
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
                replaceValues(quiz, loadedQuiz)
                upd()
            }
        }
    }
}
