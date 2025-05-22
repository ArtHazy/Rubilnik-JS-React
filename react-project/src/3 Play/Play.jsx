import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { ViewLobby } from "./ViewLobby";
import { ViewQuestion } from "./ViewQuestion";
import { ViewResult } from "./ViewResult";
import { useEffect, useState } from "react";
import { ViewError, ViewLoading } from "../4 Error/ViewError";
import { WSPlayAPI } from "../WS_communication.mjs";
import { useLocation, useParams } from "react-router-dom";
import "./Play.scss"
import {QR} from "./QR.jsx";
import {AUTH_SERVICE_URL, SERVER, UI_SERVICE_URL} from "../values.mjs";
export const Play = () => {

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

    const [isHost, setIsHost] = useState( Boolean(state?.quiz) )
    const [gameState, setGameState] = useState(null)
    const [usersChoices, setUsersChoices] = useState({})

    const [quizLength, setQuizLength] = useState(null)
    const [currentQuestionInd, setCurrentQuestionInd] = useState(null)
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [isRoommatesHidden, setIsRoommatesHidden] = useState(true)

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
                {join_lan_str? <QR isSmall={true} data={join_lan_str} label={"join lan"}/> : <div></div>}
                <div className={"vstack"}>
                    <div className={"id"}>{roomId}</div>
                    <span>server : {SERVER.label}</span>
                </div>
                <QR isSmall={true} data={join_room_url} label={"join room"}/>
                <div className={"progress-bg"}>
                    <div className={"progress-value"} style={{width: (gameState==gameStates.finished? 1 : currentQuestionInd / quizLength)*100+"%" }} />
                </div>
                {/*<progress value={ gameState==gameStates.finished? 1 : currentQuestionInd / quizLength}></progress>*/}
            </div>
        }

      {socketStatus == socketStates.null? <div/> :null}
      {socketStatus == socketStates.closed? <ViewError text={'connection lost'}/> : null}
      {socketStatus == socketStates.open? <ViewLoading text={'cant join room'}/> : null}


      {socketStatus == socketStates.inRoom && gameState === gameStates.lobby ? <ViewLobby joinLanStr={join_lan_str} joinRoomUrl={join_room_url} roomId={roomId} isHost={isHost} socket={socket} quiz={state?.quiz} /> : null}
      {socketStatus == socketStates.inRoom && gameState === gameStates.live ? <ViewQuestion isHost={isHost} socket={socket} roomId={roomId} setGameState={setGameState} quizLength={quizLength} setQuizLength={setQuizLength} currentQuestionInd={currentQuestionInd} setCurrentQuestionInd={setCurrentQuestionInd} currentQuestion={currentQuestion} setCurrentQuestion={setCurrentQuestion}/> : null}
      {socketStatus == socketStates.inRoom && gameState === gameStates.finished ? <ViewResult isHost={isHost} socket={socket} roomId={roomId} results={results} roommates={roommates} /> : null}

      {/*<div className="roommates-counter"> connected players: { Object.keys(roommates).length } </div>*/}
      <div className="hscroll">
          <div className="hstack line">
            <button className="roommates-counter" onClick={()=>{
                setIsRoommatesHidden(!isRoommatesHidden)
            }}> { Object.keys(roommates).length } </button>
            <div className={"hstack roommates "+(isRoommatesHidden?"hidden":"")}>
              { Object.keys(roommates).map((userId) => <div>{roommates[userId]?.name}</div>) }
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
              <div>placeholder</div>
            </div>
          </div>
      </div>
    </div>
}