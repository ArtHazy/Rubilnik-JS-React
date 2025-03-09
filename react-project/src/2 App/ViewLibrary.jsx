import { useState } from "react";
import { limits } from "../values.mjs";
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { http_delete_quiz, http_post_quiz } from "../HTTP_requests.mjs";
import { WSPlayAPI } from "../WS_communication.mjs";
import { useNavigate } from "react-router-dom";


export const ViewLibrary = () => {
    let self = getSelfFromLocalStorage();
    let quizzes = self?.quizzes
    const [flag,setFlag] = useState(false);
    function upd(){ putSelfInLocalStorage(self), setFlag(!flag) }

    return <div className="ViewLibrary">
        <header>Your library</header>
        <div className="grid">
            {Array.isArray(quizzes)? quizzes.map((q,i)=>
                <QuizTile quiz={q} ind={i} upd={upd} self={self} quizzes={quizzes}/>
            ): null}
            
            {(!quizzes || quizzes.length<limits.maxQuizzesLength)? <button id="add" onClick={()=>{
                let newQuiz = {title:'new quiz', questions:[]}
                let {isOk, quiz} = http_post_quiz(self,newQuiz,()=>{});
                if (isOk) {
                    if (!Array.isArray(quizzes)) quizzes = [];
                    quizzes.push({...quiz, isInDB:true}), upd()
                }
            }}><span className="material-symbols-outlined">add</span></button>
            : null}
        </div>
    </div>
}

export const QuizTile = ({quiz, ind, upd, self, quizzes}) => {
    const navigate = useNavigate()

    return <div className='QuizTile'>
        <button id="del" onClick={()=>{ 
            if (Array.isArray(quizzes) && confirm("delete?")){
                if (http_delete_quiz(self,quiz.id,()=>{})) console.log('deleted: ',quizzes.splice(ind,1) , upd())
            }
        }}><span className="material-symbols-outlined">delete</span></button>
        <button id="edit" onClick={()=>{console.log(quiz), window.location='/edit-quiz/'+ind}}> {quiz.title}<br/>{quiz.isInDB? null:"unsaved"}</button>
        <button id="run" onClick={()=>{console.log("test",quiz); startRoomAsHost(navigate, quiz)}} ><span className="material-symbols-outlined">play_arrow</span></button>
    </div>
}

/**
 * @param {NavigateFunction} reactNavigateHookFunction
 */
export function startRoomAsHost(reactNavigateHookFunction, quiz){
    // reactNavigateHookFunction("/play/"+getSelfFromLocalStorage().id, {state:{quiz}})
    reactNavigateHookFunction("/play/"+getSelfFromLocalStorage().id, {state:{quiz}})
    // window.location.href= "/play"
}