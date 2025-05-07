import { getSelfFromLocalStorage } from "../functions.mjs"
import "./ViewLobby.scss"
import {QR} from "./QR.jsx";

export const ViewLobby = ({isHost, roomId, socket}) => {
  return <div className="ViewLobby">
    <QR roomId={roomId}/>
    <div className="id">{roomId}</div>
    <div className="text">connection code</div>
    {isHost? <button className="start big" onClick={() => {socket.emitStart()}}>START</button> : null} 
  </div>
}