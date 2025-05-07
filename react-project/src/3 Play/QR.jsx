import "./QR.scss"

export const QR = ({isSmall, roomId})=>{
    const classname = "QR" + (isSmall ? " small" : "");
    return <div className={classname}>
        <img src={"https://api.qrserver.com/v1/create-qr-code/?size=128x128&data="+roomId}/>
    </div>
}