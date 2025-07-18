import { getSelfFromLocalStorage } from "../functions.mjs"
import { ViewLobby } from "./ViewLobby";
import { ViewQuestion } from "./ViewQuestion";
import { ViewResult } from "./ViewResult";
import { useEffect, useState, useMemo } from "react";
import { ViewError, ViewLoading } from "../4 Error/ViewError";
import { WSPlayAPI } from "../WS_communication.mjs";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import "./Play.scss"

import { QR } from "./QR.jsx";
import { SERVER, UI_SERVICE_URL } from "../values.mjs";
import { QuizPlayer } from "./QuizPlayer.jsx";

export const Play = () => {
    const { t } = useTranslation();

    const [socket, setSocket] = useState(null)
    const [socketStatus, setSocketStatus] = useState('null')
    const [roommates, setRoommates] = useState({})

    const gameStates = {
        lobby:0, live:1, finished:2
    }
    const socketStates = {
        null: -1, closed: 0, open: 1, inRoom: 2, error:3
    }

    const {state} = useLocation()
    const {roomId} = useParams()

    const [quiz, onQuizChange] = useState(state?.quiz || null);

    const [isHost, setIsHost] = useState( Boolean(state?.quiz) )
    const [gameState, setGameState] = useState(null)
    const [usersChoices, setUsersChoices] = useState({})

    const [quizLength, setQuizLength] = useState(null)
    const [currentQuestionInd, setCurrentQuestionInd] = useState(0)
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [isRoommatesHidden, setIsRoommatesHidden] = useState(true)

    const [results, setResults] = useState(null)

    const [player, setPlayer] = useState(null)
    const [isFinished, setIsFinished] = useState(false)

    // const player = new QuizPlayer(state?.quiz, roomId);
    useEffect(() => {
      if (quiz) {
        const newPlayer = new QuizPlayer(quiz, onQuizChange, roomId);
        setPlayer(newPlayer)
        const { node, isFinished } = newPlayer.getCurrentState();
        setCurrentQuestion(node.data?.question ?? null);
        setIsFinished(isFinished);

        // setQuizLength(newPlayer.getQuizLength())
      }
    }, [quiz, roomId])

    const startQuestionId = useMemo(() => {
      return player?.getCurrentState().node?.data?.question?.id
    }, [player])

    const handleNextQuestion = () => {
      if (!player || !isHost) return
      
      try {
        player.next()
        const newState = player.getCurrentState()
        console.log("test", newState);
        setCurrentQuestion(newState.node?.data?.question ?? null)
        setIsFinished(newState.isFinished)

        const newIndex = currentQuestionInd + 1
        setCurrentQuestionInd(newIndex)

        console.log("111", isFinished, newState.node.type);

        // Синхронизация с сервером
        (isFinished) ? socket.emitEnd() 
          : newState.node.type === 'question' && socket.emitNext(newState.node.data.question.id);
      } catch (error) {
        console.error(t('play.errors.nextQuestion'), error)
      }
    }

    useEffect(() => {
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
      socket.eventActions.close = ()=>{setSocketStatus(socketStates.closed)}
      socket.eventActions.error = ()=>{setSocketStatus(socketStates.error)}
      socket.eventActions.create = ({roommates})=>{
        setRoommates(roommates)
        setSocketStatus(socketStates.inRoom)
        setGameState(gameStates.lobby)
      }
        // TODO
      socket.eventActions.join = ({/*user,*/roommates})=>{
        // const self = getSelfFromLocalStorage()
        //  if ( !self.id ) {self.id = user.id}
        setRoommates(roommates);
        setSocketStatus(socketStates.inRoom)
        setGameState(gameStates.lobby)
      }
      socket.eventActions.joined = ({user, roommates})=>{
        console.log(`${user.id}:${user.name} ${t('play.notifications.joined')}`);
        setRoommates(roommates)
      }
      socket.eventActions.left = ({user, roommates})=>{
        console.log(`${user.id}:${user.name} ${t('play.notifications.left')}`);
        setRoommates(roommates)
      }

      socket.eventActions.start = ({question,index,quizLength})=>{
        setCurrentQuestion(question)
        setCurrentQuestionInd(index)
        setQuizLength(quizLength)
        setGameState(gameStates.live)
      }
      socket.eventActions.end = ({results})=>{
        setResults(results)
        setGameState(gameStates.finished)
      }

      setSocket(socket)
    }, []);

    var join_lan_str = SERVER.lan_connection_string
    //
    if (SERVER.label==SERVER.LABELS.debug){
        join_lan_str = UI_SERVICE_URL
    }
    //
    const join_room_url = UI_SERVICE_URL+"/join?roomkey="+roomId

    return <div className="Play">
      {/* <div>socket: {socketStatus}</div> */}
        {gameState==gameStates.lobby? <div></div> :
            <div className={"status"}>
                {join_lan_str? <QR isSmall={true} data={join_lan_str} label={t('play.qrLabels.joinLan')}/> : <div></div>}
                <div className={"vstack"}>
                    <div className={"id"}>{roomId}</div>
                    <span>{t('play.serverLabel')}: {SERVER.label}</span>
                </div>
                <QR isSmall={true} data={join_room_url} label={t('play.qrLabels.joinRoom')}/>

    
                <div className={"progress-bg"}>
                    <div className={"progress-value"} style={{width: (gameState==gameStates.finished? 1 : currentQuestionInd / quizLength)*100+"%" }} />
                </div>
            </div>
        }

      {socketStatus == socketStates.null? <div/> :null}
      {socketStatus == socketStates.closed? <ViewError text={t('play.errors.connectionLost')}/> : null}
      {socketStatus == socketStates.open? <ViewLoading text={t('play.loading.cantJoinRoom')}/> : null}


      {socketStatus == socketStates.inRoom && gameState === gameStates.lobby ? <ViewLobby joinLanStr={join_lan_str} joinRoomUrl={join_room_url} roomId={roomId} isHost={isHost} socket={socket} 
        startQuestionId={startQuestionId} 
        t={t}/> : null}
      {socketStatus == socketStates.inRoom && gameState === gameStates.live ? <ViewQuestion isHost={isHost} socket={socket} currentQuestion={currentQuestion} setCurrentQuestion={setCurrentQuestion} setCurrentQuestionInd={setCurrentQuestionInd}
        isFinished={isFinished}
        onNext={handleNextQuestion}
        player={player}
        t={t}/> : null}
      {socketStatus == socketStates.inRoom && gameState === gameStates.finished ? <ViewResult isHost={isHost} socket={socket} roomId={roomId} results={results} roommates={roommates} t={t}/> : null}

      {/*<div className="roommates-counter"> connected players: { Object.keys(roommates).length } </div>*/}
      <div className="hscroll">
          <div className="hstack line">
            <button className="roommates-counter" 
              onClick={()=>{
                setIsRoommatesHidden(!isRoommatesHidden)
              }}
              aria-label={t('play.playersCounter')}>
                { Object.keys(roommates).length } 
            </button>
            <div className={"hstack roommates "+(isRoommatesHidden?"hidden":"")}>
              { Object.keys(roommates).map((userId) => <div>{roommates[userId]?.name}</div>) }
            </div>
          </div>
      </div>
    </div>
}