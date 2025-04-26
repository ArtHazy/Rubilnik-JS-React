import { Panel } from 'reactflow';
import { http_put_quiz } from '../../HTTP_requests.mjs';
import { getSelfFromLocalStorage, putSelfInLocalStorage, loadQuizFromFile } from '../../functions.mjs';

export const PanelControls = ({ quiz, ind, upd }) => {
    return (
        <Panel 
            position='top-left' 
            className='panel'
        >
        {/* {quiz.isInDB? null: */}<button id="save" onClick={()=>{ 
            console.log("QUIIIIZ",quiz);
            // quiz.graphEdges = JSON.stringify(quiz.graphEdges);\
            quiz.graphEdges = "";
            // let self = getSelfFromLocalStorage();
            // const {isOk} = http_put_quiz(self,quiz,()=>{})
            
            // if(isOk){
            //     // self.quizzes[ind] = responceQuiz;
            //     // console.log("!!!!!!!!!!!!!",ind, " ", self.quizzes);
            //     // putSelfInLocalStorage(self);
            //     upd(true);
            // }
            let self = getSelfFromLocalStorage();
            //putSelfInLocalStorage(self);
            http_put_quiz(self, quiz, ()=>{});

        }}> save </button>

            <button onClick={()=>{downloadJson(quiz, quiz.title)}}>
                <span className="material-symbols-outlined">
                    download
                </span>
            </button>

            <label htmlFor="file-input">
                <button onClick={()=>{document.getElementById("file-input").click()}} >
                    <span className="material-symbols-outlined">upload</span>
                </button>
            </label>

            <input style={{display:"none"}} id="file-input" type="file" onChange={(e)=>loadQuizFromFile(e.target.files[0], quiz, upd)}/>

            <button onClick={()=>{console.log("test",quiz); startRoomAsHost(navigate, quiz)}}>
                <span className="material-symbols-outlined">
                    play_arrow
                </span>
            </button>
        </Panel>
    );
}