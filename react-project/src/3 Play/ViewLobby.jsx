import { getSelfFromLocalStorage } from "../functions.mjs"
import "./ViewLobby.scss"
import {QR} from "./QR.jsx";
import {SERVER} from "../values.mjs";

export const ViewLobby = ({joinLanStr, joinRoomUrl, isHost, roomId, socket, quiz}) => {
  let targetNode;
  if (isHost) {
    const startNode = JSON.parse(quiz.startEndNodesPositions).start;
    const graphEdges = JSON.parse(quiz.graphEdges);
    const startEdge = graphEdges.find(e => e.source === startNode.id);
    targetNode = quiz.questions.find(q => q.tempId === startEdge.target);
  }

  return <div className="ViewLobby">
    <div className={"hstack"}>
      {joinLanStr? <QR data={joinLanStr} label={"join lan"}/> : <div></div>}
      <QR data={joinRoomUrl} label={"join room"}/>
    </div>
    <div className="id">{roomId}</div>
    <div className="text">connection code</div>
    <span>server : {SERVER.label}</span>
    {isHost? <button className="start big" onClick={() => {socket.emitStart(targetNode?.id)}}>START</button> : null} 
  </div>
}