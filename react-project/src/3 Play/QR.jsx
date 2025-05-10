import "./QR.scss"

export const QR = ({isSmall, roomId})=>{
    const classname = "QR" + (isSmall ? " small" : "");
    const isLocal = Boolean(window.localIP) && Boolean(window.serverPort)
    const localUrl = "http://"+window.localIP+":"+window.serverPort+"/join?roomkey="+roomId
    const remoteUrl = "http://rubilnik.ddns.net"+"/join?roomkey="+roomId
    return <div className={classname}>
        <img src={"https://api.qrserver.com/v1/create-qr-code/?size=128x128&data="+(isLocal? localUrl:remoteUrl )}/>
    </div>
}