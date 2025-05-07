/* eslint-disable react/prop-types */

import { useEffect, useState } from "react"
import { getSelfFromLocalStorage } from "../functions.mjs";
import { WSPlayAPI } from "../WS_communication.mjs";
import "./ViewQuestion.scss"

let self = getSelfFromLocalStorage()

export const ViewQuestion = ({isHost, socket, roomId, quizLength, setQuizLength, currentQuestionInd, setCurrentQuestionInd, currentQuestion, setCurrentQuestion}) => {

  const [revealedChoices, setrevealedChoices] = useState([])

  const isLastQuestion = (currentQuestionInd==quizLength-1)

  const [flag, setFlag] = useState(false)
  function upd(){setFlag(!flag)}

  useEffect(() => {
    console.log(socket);

    if (socket instanceof WSPlayAPI){
      socket.eventActions.next = ({question,index,quizLength})=>{
        console.log(question);
        
        setCurrentQuestion(question)
        setCurrentQuestionInd(index)
        setQuizLength(quizLength)
        setrevealedChoices([]); // setIsRevealed(false)
      }
      socket.eventActions.reveal = ({revealedChoices})=>{
        console.log('alert: revealed correct choices:', revealedChoices);
        setrevealedChoices(revealedChoices)
      }
      socket.eventActions.choice = ({user,questionInd,choiceInd})=>{
        console.log('alert: choice from '+user.id+":"+user.name+" Q:"+questionInd+" C:"+choiceInd);
      }
    }
  },[])

  function renderChoices() {
    const letters = ["A", "B", "C", "D"]
    const isRevealed = revealedChoices.length > 0
    let choicesToRender=[]
    if (isRevealed) choicesToRender = revealedChoices;
    else            choicesToRender = currentQuestion?.choices;
    
    console.log('revealedChoices', revealedChoices);
    console.log('choicestorender', choicesToRender);
    

    return choicesToRender.map((choice,ind) => 
      isHost? 
        <div className={"choice _"+ind+" "+(choice.correct?"correct ":" ")+(isRevealed?"revealed ":" ")} key={JSON.stringify(choice)}>
          {choice.title}
          <div className="letter">{letters[ind]}</div>
        </div>
      : 
        <button className={"choice _"+ind+" "+(choice.correct?"correct ":" ")+(isRevealed?"revealed ":" ")} key={JSON.stringify(choice)} 
          onClick={ (!isHost && !isRevealed)? ()=>socket.emitChoice(currentQuestionInd, ind) : null }
        >
          {choice.title}
          <div className="letter">{letters[ind]}</div>
        </button>
    )
  }
  if (socket instanceof WSPlayAPI && socket.isOpen()) return (
    <div className="ViewQuestion">
      <div className="head">
        <div className="title">{currentQuestion?.title}</div>
      </div>
      <div className="body">
        <div className="choices">{ renderChoices() }</div>
      </div>
      <div className="controls">
        {isHost? <button onClick={()=>socket.emitReveal() }>reveal</button> : null}
        {isHost? <button className="question_next_btn" onClick={()=>{
          !isLastQuestion? socket.emitNext() : socket.emitEnd()
        }}> {!isLastQuestion? 'next' : 'end'} </button> 
        : null}
      </div>
    </div>
  ) 
  else return <div>Failed to connect socket</div>
}