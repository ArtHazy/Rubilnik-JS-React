import { Panel } from 'reactflow';
import { http_put_quiz } from '../../HTTP_requests.mjs';
import { getSelfFromLocalStorage, putSelfInLocalStorage, loadQuizFromFile, downloadJson } from '../../functions.mjs';
import { startRoomAsHost } from '../ViewLibrary';
import { useNavigate } from 'react-router-dom';

/**
 * 
 * @param {{quiz:Quiz, ind:number}} param0 
 * @returns 
 */
export const PanelControls = ({ quiz, ind }) => {
    const navigate = useNavigate()
    return (
        <Panel 
            position='top-left' 
            className='panel'
        >
        <button id="save" onClick={()=>{ 
            let self = getSelfFromLocalStorage();
            const { isOk, quiz: quizNew } = http_put_quiz(self, quiz, ()=>{});
            if (isOk) {
                self.quizzes[ind] = quizNew;
                console.log("SRLF", self.quizzes[ind]);
                putSelfInLocalStorage(self);
            }

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

            <input style={{display:"none"}} id="file-input" type="file" 
                onChange={(e) => {
                    loadQuizFromFile(e.target.files[0], quiz, ind); 
                    // putSelfInLocalStorage(getSelfFromLocalStorage().quizzes[ind] = quiz)
                }
            }/>

            <button onClick={()=>{console.log("test", quiz); startRoomAsHost(navigate, quiz)}}>
                <span className="material-symbols-outlined">
                    play_arrow
                </span>
            </button>
        </Panel>
    );
}