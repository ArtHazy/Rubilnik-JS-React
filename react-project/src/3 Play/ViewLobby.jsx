import { getSelfFromLocalStorage } from "../functions.mjs"
import "./ViewLobby.scss"
import {QR} from "./QR.jsx";
import {SERVER} from "../values.mjs";

export const ViewLobby = ({joinLanStr, joinRoomUrl, isHost, roomId, socket, startQuestionId}) => {

  return <div className="ViewLobby">
    <div className={"hstack"}>
      {joinLanStr? <QR data={joinLanStr} label={"join lan"}/> : <div></div>}
      <QR data={joinRoomUrl} label={"join room"}/>
    </div>
    <div className="id">{roomId}</div>
    <div className="text">connection code</div>
    <span>server : {SERVER.label}</span>
    {isHost? <button className="start big" onClick={() => {socket.emitStart(startQuestionId)}}>START</button> : null} 
    {/* targetNode?.id */}
  </div>
}