import {useEffect, useMemo, useRef, useState} from "react"
import { getSelfFromLocalStorage } from "../functions.mjs";
import { WSPlayAPI } from "../WS_communication.mjs";
import "./ViewQuestion.scss"

let self = getSelfFromLocalStorage()

export const ViewQuestion = ({isHost, socket, currentQuestion, isFinished, onNext}) => {

  const [revealedChoices, setrevealedChoices] = useState([])

  // let isLastQuestion;
  // let node = null;
  // isHost && (player.next(), ({ node, isFinished: isLastQuestion } = player.getCurrentState()));
  // const questionId = node?.data?.question?.id;
  // console.log("isLastQuestion", isLastQuestion);
  // console.log("questionId", node);

  useEffect(() => {
    console.log(socket);

    if (socket instanceof WSPlayAPI){
      socket.eventActions.next = ({question,index,quizLength})=>{
        console.log(question);
        
        // setCurrentQuestion(question)
        // setCurrentQuestionInd(index)
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
    

    return choicesToRender?.map((choice,ind) => 
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
        {isHost? <button className="question_next_btn" onClick={onNext}> {isFinished ? 'end' : 'next'} </button> 
        : null}
      </div>
    </div>
  ) 
  else return <div>Failed to connect socket</div>
}