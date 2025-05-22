/* eslint-disable react/prop-types */

import {useEffect, useMemo, useRef, useState} from "react"
import { getSelfFromLocalStorage } from "../functions.mjs";
import { WSPlayAPI } from "../WS_communication.mjs";
import "./ViewQuestion.scss"

let self = getSelfFromLocalStorage()

export const ViewQuestion = ({isHost, socket, roomId, quizLength, setQuizLength, currentQuestionInd, setCurrentQuestionInd, currentQuestion, setCurrentQuestion, quiz}) => {

  const [revealedChoices, setrevealedChoices] = useState([])
  const isLastQuestion = (currentQuestionInd==quizLength-1)

  const [navigationGraph, setNavigationGraph] = useState({})
  const [currentTempId, setCurrentTempId] = useState(null)

  // let targetNode;
  // if (isHost) {
  //   console.log("currentQuestionInd", currentQuestionInd)
  //   const startNode = JSON.parse(quiz.startEndNodesPositions).start;
  //   console.log("s-node", startNode)
  //   const graphEdges = JSON.parse(quiz.graphEdges).filter(e=>e.source!==startNode.id);
  //   console.log("g-edges", graphEdges)
  //   let questionTempId = graphEdges[1].target
  //   console.log("quiz", quiz)
  //   targetNode =  quiz.questions.find(q => q.tempId === questionTempId);
  //   console.log("t-node", targetNode)
  // }

  useEffect(() => {
    if (!isHost || !quiz) return
    
    const edges = JSON.parse(quiz.graphEdges)
    const graph = edges.reduce((acc, edge) => {
      if (!acc[edge.source]) acc[edge.source] = []
      acc[edge.source].push(edge.target)
      return acc
    }, {})
    
    setNavigationGraph(graph)
    const startId = JSON.parse(quiz.startEndNodesPositions).start.id
    setCurrentTempId(startId)
  }, [quiz, isHost])

  useEffect(() => {
    if (!currentTempId || !quiz) return
    
    const nextQuestion = quiz.questions.find(q => q.tempId === currentTempId)
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion)
      setCurrentQuestionInd(prev => prev + 1)
    }
  }, [currentTempId])

  // Логика перехода к следующему вопросу
  const getNextQuestionId = (choiceId) => {
    const nextIds = navigationGraph[choiceId]
    if (!nextIds || nextIds.length === 0) return null
    return nextIds[0] // Простейший вариант - берем первый доступный
  }

  const handleNextQuestion = () => {
    if (!revealedChoices.length) return
    
    // Находим корректный выбор для перехода
    const correctChoice = currentQuestion.choices.find(c => c.correct)
    const nextId = getNextQuestionId(correctChoice.tempId)
    
    if (nextId) {
      setCurrentTempId(nextId)
      socket.emitNext(1)
    } else {
      socket.emitEnd()
    }
    setRevealedChoices([])
  }



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
        {isHost && (
          <>
            <button onClick={() => socket.emitReveal()}>Reveal</button>
            <button 
              className="question_next_btn" 
              onClick={() => socket.emitNext(2)}
            >
              {!isLastQuestion ? 'Next' : 'End'}
            </button>
          </>
        )}
      </div>
    </div>
  ) 
  else return <div>Failed to connect socket</div>
}