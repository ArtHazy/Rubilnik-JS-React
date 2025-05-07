import { useEffect, useState, useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { limits } from "../values.mjs"
import { Actions } from "./App"
import { downloadJson, getSelfFromLocalStorage, loadQuizFromFile, putSelfInLocalStorage} from "../functions.mjs"
import { startRoomAsHost } from "./ViewLibrary"
import { http_post_quiz, http_put_quiz } from "../HTTP_requests.mjs"

import ReactFlow, {
  useNodesState, Handle, Position,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  MiniMap, ControlButton, SelectionMode, applyEdgeChanges, applyNodeChanges, ReactFlowProvider, BaseEdge, Panel
} from 'reactflow';

import ReactFlowComponent from "./QuizEditNodes/ReactFlowComponent"

//new imports
import 'reactflow/dist/style.css';
import './index.css';
import "./ViewQuizEdit.scss"

import Editor from "./QuizEditNodes/test"

// Иконки
const rem = <span className="material-symbols-outlined">remove</span>;
const del = <span className="material-symbols-outlined">delete</span>;
const drop_down = <span className="material-symbols-outlined">arrow_drop_down</span>;
const drop_up = <span className="material-symbols-outlined">arrow_drop_up</span>;

export const ViewQuizEdit = () => {
    const {ind} = useParams()

    // const self = getSelfFromLocalStorage()
    const self = useMemo(() => getSelfFromLocalStorage(), [localStorage.getItem('self')]);
    let quiz = self.quizzes[ind]
    Array.isArray(quiz.questions)? null : quiz.questions = []
    const questions = quiz.questions
    const [focus, set_focus] = useState(-1) // question focus
    const [flag,setFlag] = useState(false)
    const navigate = useNavigate()

    function upd(isInDB){ quiz.isInDB=isInDB?true:false, putSelfInLocalStorage(self), setFlag(!flag)}

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <ReactFlowProvider>
                <ReactFlowComponent self={self} quiz={quiz} upd={upd} />
                {/* <Editor quiz={quiz} upd={upd} /> */}
            </ReactFlowProvider>
        </div>
    );
}

// export const ViewQuizEdit = () => {
//     const {ind} = useParams()
//     const self = getSelfFromLocalStorage()
//     let quiz = self.quizzes[ind]
//     Array.isArray(quiz.questions)? null : quiz.questions = []
//     const questions = quiz.questions
//     const [focus, set_focus] = useState(-1) // question focus
//     const [flag,setFlag] = useState(false)
//     const navigate = useNavigate()

//     function upd(isInDB){ quiz.isInDB=isInDB?true:false, putSelfInLocalStorage(self), setFlag(!flag)}

//     return <div className="ViewQuizEdit">
//         <div className="header">
//             <input placeholder="quiz title" type="text" value={quiz?.title} onChange={e=>{ quiz.title = e.target.value ,upd() }}/>
//             <div className="data">
//                 <div className="dateCreated">
//                     { new Date(quiz.dateCreated).toLocaleString() }
//                 </div>
//                 <div className="dateLastSaved">
//                     { quiz.dateCreated==quiz.dateSaved? null : new Date(quiz.dateSaved).toLocaleString() }
//                 </div>

//             </div>
            
//             {quiz.isInDB? null: <button id="save" onClick={()=>{
//                 const {isOk, quiz:responceQuiz} = http_put_quiz(self,quiz,()=>{})
                
//                 if(isOk){
//                     self.quizzes[ind] = responceQuiz
//                     upd(true)
//                 }}}> save </button>}
//             <div>questions:</div>
//         </div>
//         <div className="grid">
//             {questions.map((q,i)=>{
//                 Array.isArray(q.choices)? null : q.choices = []
//                 const choices = q.choices
//                 return [
//                     <Question quiz={quiz} questions={questions} key={i*2} question={q} ind={i} upd={upd} isFocus={focus==i} set_focus={set_focus}/>,
//                     <Choices quiz={quiz} choices={choices} upd={upd} isFocus={focus==i}/>
//                 ]
//             })}
//             {questions.length<limits.maxQuestionsLength? <button id="add" onClick={()=>{questions.push({title:'new'}), upd()}}><span className="material-symbols-outlined">add</span></button>:null}
//         </div>

//         <Actions>
//             <button onClick={()=>{downloadJson(quiz, quiz.title)}}><span class="material-symbols-outlined">download</span></button>
//             <label htmlFor="file-input"><button onClick={()=>{document.getElementById("file-input").click()}} ><span class="material-symbols-outlined">upload</span></button></label>
//             <input style={{display:"none"}} id="file-input" type="file" onChange={(e)=>loadQuizFromFile(e.target.files[0], quiz, upd)}/>
//             <button onClick={()=>startRoomAsHost(navigate,quiz)}><span class="material-symbols-outlined">play_arrow</span></button>
//         </Actions>
        
//     </div>
// }

// const Question = ({quiz, questions, question, ind, isFocus, set_focus, upd}) => 
//     <div className="question">
//         <div>{ind}</div>
//         <input type="text" value={question.title} onChange={(e)=>{ question.title = e.target.value; upd(); }}/>
//         <button className="remove"onClick={()=>{Array.isArray(questions)? (console.log('delete: ', questions.splice(ind,1)), upd()) : null}}>{del}</button>
//         <button className="question" onClick={()=>{isFocus? set_focus(-1):set_focus(ind)}}> {isFocus? drop_up : drop_down } </button>
        
//     </div>

// const Choices = ({quiz,choices,upd,isFocus}) => 
//     <div className={"choices "+(isFocus? 'focus' : null)}>
//         <div className="grid">
//             {choices.map((c,i) => {
//                 typeof c.title == 'string'? null : c.title = ''
//                 return <div className="choice">
//                     <input type="checkbox" checked={c.correct} onChange={(e)=>{c.correct? c.correct = e.target.value : c.correct = false, c.correct=!c.correct ,upd()}} />
//                     <input type="text" value={c.title} onChange={(e)=>{c.title=e.target.value, upd()}}/>
//                     <button className="remove" onClick={()=>{console.log(choices.splice(i,1)), upd()}}>{rem}</button>
                    
//                 </div>
//             })}
//             {choices.length<limits.maxChoicesLength? <button id="add" onClick={ ()=>{Array.isArray(choices)? choices.push({title:'',correct:false}):null, upd()} }>add</button>: null}
//         </div>
        
//     </div>