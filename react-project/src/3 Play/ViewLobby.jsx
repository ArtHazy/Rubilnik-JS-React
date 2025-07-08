import "./ViewLobby.scss"
import {QR} from "./QR.jsx";
import {SERVER} from "../values.mjs";

export const ViewLobby = ({joinLanStr, joinRoomUrl, isHost, roomId, socket, startQuestionId, t}) => {

  return <div className="ViewLobby">
    <div className={"hstack"}>
      {joinLanStr? <QR data={joinLanStr} label={t('lobby.qrLabels.joinLan')}/> : <div></div>}
      <QR data={joinRoomUrl} label={t('lobby.qrLabels.joinRoom')}/>
    </div>
    <div className="id">{roomId}</div>
    <div className="text">{t('lobby.connectionCode')}</div>
    <span>{t('lobby.serverLabel')}: {SERVER.label}</span>
    {isHost? <button className="start big" onClick={() => {socket.emitStart(startQuestionId)}} aria-label={t('lobby.startButton')}
      >{t('lobby.startButton')}</button> : null} 
    {/* targetNode?.id */}
  </div>
}