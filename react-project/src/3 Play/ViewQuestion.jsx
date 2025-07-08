import {useEffect, useState} from "react"
import { WSPlayAPI } from "../WS_communication.mjs";
import "./ViewQuestion.scss"

export const ViewQuestion = ({isHost, socket, currentQuestion, setCurrentQuestion, setCurrentQuestionInd, isFinished, onNext, player, t}) => {

  const [revealedChoices, setrevealedChoices] = useState([])

  useEffect(() => {
    console.log(socket);

    if (socket instanceof WSPlayAPI){
      socket.eventActions.next = ({question, index})=>{ //,,quizLength
        console.log(question);
        setCurrentQuestion(question)
        setCurrentQuestionInd(index)
        setrevealedChoices([]); // setIsRevealed(false)
      }
      socket.eventActions.reveal = ({revealedChoices})=>{
        console.log('alert: revealed correct choices:', revealedChoices);
        setrevealedChoices(revealedChoices)
      }
      socket.eventActions.choice = ({user,questionId,choiceInd})=>{
        player.recordUserChoice(user, questionId, choiceInd);
        // console.log('alert: choice from '+user.id+":"+user.name+" Q:"+questionId+" C:"+choiceInd);
      }
    }
  },[])

  function renderChoices() {
    const letters = ["A", "B", "C", "D"]
    const isRevealed = revealedChoices.length > 0
    let choicesToRender=[]
    if (isRevealed) choicesToRender = revealedChoices;
    else            choicesToRender = currentQuestion?.choices;
    
    // console.log('revealedChoices', revealedChoices);
    // console.log('choicestorender', choicesToRender);
    

    return choicesToRender?.map((choice,ind) => 
      isHost? 
        <div className={"choice _"+ind+" "+(choice.correct?"correct ":" ")+(isRevealed?"revealed ":" ")} key={JSON.stringify(choice)}>
          {choice.title}
          <div className="letter">{letters[ind]}</div>
        </div>
      : 
        <button className={"choice _"+ind+" "+(choice.correct?"correct ":" ")+(isRevealed?"revealed ":" ")} key={JSON.stringify(choice)} 
          onClick={ (!isHost && !isRevealed)? ()=>socket.emitChoice(currentQuestion.id, ind) : null }
          disabled={isRevealed}
          aria-label={t('question.choiceLabel', { letter: letters[ind] })}
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
        {isHost? <button onClick={()=>socket.emitReveal() }>{t('question.revealButton')}</button> : null}
        {isHost? <button className="question_next_btn" onClick={onNext} aria-label={isFinished ? t('question.endButton') : t('question.nextButton')}>
          {isFinished ? t('question.endButton') : t('question.nextButton')} </button> 
        : null}
      </div>
    </div>
  ) 
  else return <div>{t('question.connectionError')}</div>
}