import "./QR.scss"

export const QR = ({label,data,isSmall})=>{
    const classname = "QR" + (isSmall ? " small" : "");
    return <div className={classname}>
        {/*<img src={"https://api.qrserver.com/v1/create-qr-code/?size=128x128&data="+roomId}/>*/}
        <img src={"https://api.qrserver.com/v1/create-qr-code/?size=128x128&data="+data}/>
        <span>{label}</span>
        {/*{ window.server?.lan_connection_string? <img src={"https://api.qrserver.com/v1/create-qr-code/?size=128x128&data="+window.server.lan_connection_string}/> : null }*/}
    </div>
}