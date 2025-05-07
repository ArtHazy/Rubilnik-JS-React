import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { ViewLobby } from "./ViewLobby";
import { ViewQuestion } from "./ViewQuestion";
import { ViewResult } from "./ViewResult";
import { useEffect, useState } from "react";
import { ViewError, ViewLoading } from "../4 Error/ViewError";
import { WSPlayAPI } from "../WS_communication.mjs";
import { useLocation, useParams } from "react-router-dom";
import "./Play.scss"

export const Play = () => {
    
    const [socket, setSocket] = useState(null)
    const [socketStatus, setSocketStatus] = useState('null')
    const [roommates, setRoommates] = useState({})

    const gameStates = ['lobby', 'live', 'finished']

    const {state} = useLocation()
    const {roomId} = useParams()
    
    const [isHost, setIsHost] = useState( Boolean(state?.quiz) ) 
    const [gameState, setGameState] = useState(null)
    const [usersChoices, setUsersChoices] = useState({})

    const [quizLength, setQuizLength] = useState(null)
    const [currentQuestionInd, setCurrentQuestionInd] = useState(null)
    const [currentQuestion, setCurrentQuestion] = useState(null)

    const [results, setResults] = useState(null)

    // console.log('state',state);
    
    
    useEffect(() =>{
      const socket = new WSPlayAPI()

      socket.eventActions.open = ()=>{
        setSocketStatus('open')
        console.log('ishost', isHost);
        if (isHost){
          delete state.quiz?.isInDB
          socket.emitCreate(getSelfFromLocalStorage(), state.quiz)
        } else {
          socket.emitJoin(getSelfFromLocalStorage(), roomId)
        } 
      }
      socket.eventActions.close = ()=>{setSocketStatus('closed')}
      socket.eventActions.error = ()=>{setSocketStatus('error')}
      socket.eventActions.create = ({roommates})=>{
        setRoommates(roommates)
        setSocketStatus('in room')
        setGameState('lobby')
      }
      socket.eventActions.join = ({roommates})=>{
        setRoommates(roommates);
        setSocketStatus('in room')
        setGameState('lobby')
      }
      socket.eventActions.joined = ({user, roommates})=>{
        console.log('alert: '+user.id+":"+user.name+" has joined");
        setRoommates(roommates)
      }
      socket.eventActions.left = ({user, roommates})=>{
        console.log('alert: '+user.id+":"+user.name+" left");
        setRoommates(roommates)
      }

      socket.eventActions.start = ({question,index,quizLength})=>{
        setCurrentQuestion(question)
        setCurrentQuestionInd(index)
        setQuizLength(quizLength)
        setGameState('live')
      }
      socket.eventActions.end = ({results})=>{
        setResults(results)
        setGameState('finished')
      }
      
      setSocket(socket)
    }, []);

    
    return <div className="Play">
      <div>socket: {socketStatus}</div>
      {socketStatus == 'null'? <div/> :null}
      {socketStatus == 'closed'? <ViewError text={'connection lost'}/> : null}
      {socketStatus == 'open'? <ViewLoading text={'cant join room'}/> : null}
      

      {socketStatus == 'in room' && gameState === gameStates[0] ? <ViewLobby isHost={isHost} socket={socket} roomId={roomId} /> : null}
      {socketStatus == 'in room' && gameState === gameStates[1] ? <ViewQuestion isHost={isHost} socket={socket} roomId={roomId} setGameState={setGameState} quizLength={quizLength} setQuizLength={setQuizLength} currentQuestionInd={currentQuestionInd} setCurrentQuestionInd={setCurrentQuestionInd} currentQuestion={currentQuestion} setCurrentQuestion={setCurrentQuestion}/> : null} 
      {socketStatus == 'in room' && gameState === gameStates[2] ? <ViewResult isHost={isHost} socket={socket} roomId={roomId} results={results} roommates={roommates} /> : null}
      
      <div className="roommates-counter"> connected players: { Object.keys(roommates).length } </div>
      <div className="hstack roommates">{ Object.keys(roommates).map((userId) => <div> {roommates[userId]?.name}</div>) }</div>
    </div>
}