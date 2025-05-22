import { getSelfFromLocalStorage } from "../functions.mjs"
import "./ViewLobby.scss"
import {QR} from "./QR.jsx";
import {SERVER} from "../values.mjs";

export const ViewLobby = ({joinLanStr, joinRoomUrl, isHost, roomId, socket, quiz}) => {
  let targetNode;
  if (isHost) {
    // const startNode = JSON.parse(quiz.startEndNodesPositions).start;
    // console.log("s-node", startNode)
    // const graphEdges = JSON.parse(quiz.graphEdges);
    // console.log("g-edges", graphEdges)
    // const startEdge = graphEdges.find(e => e.source === startNode.id);
    // console.log("s-edge", startEdge)
    // console.log("quiz", quiz)
    // targetNode = quiz.questions.find(q => q.tempId === startEdge.target);
    // console.log("t-node", targetNode)

    // Кешируем результат парсинга, если это возможно
    const graphEdges = JSON.parse(quiz.graphEdges);
    const positions = JSON.parse(quiz.startEndNodesPositions);
    
    // Создаем словарь для быстрого доступа к вопросам
    const questionsMap = new Map(quiz.questions.map(q => [q.tempId, q]));
    
    // Используем цепочку опциональных операторов для безопасности
    const startEdge = graphEdges?.find(e => e.source === positions?.start?.id);
    
    targetNode = startEdge?.target ? questionsMap.get(startEdge.target) : null;
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