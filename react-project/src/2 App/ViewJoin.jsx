import { useState } from "react"
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { limits } from "../values.mjs"
import "./ViewJoin.scss"

export const ViewJoin = () => {
    let self = getSelfFromLocalStorage();
    if (!self) self = {}
    console.log(self);

    return <div className="ViewJoin">
        <header>Join the game</header>
        <div className="form">
            <vstack>name:<input id='name' type="text" value={self.name} maxLength={limits.maxNameLength} onChange={(e)=>{self.name = e.target.value, putSelfInLocalStorage(self)}} /></vstack>
            <vstack>key:<RoomKeyInput/></vstack>
            <button className="big" style={{width:"100%"}} onClick={(e)=>{navigatePlay()}}>join</button>
        </div>
    </div>

    function navigatePlay(){
        putSelfInLocalStorage(self)
        let inputs = document.querySelector('.RoomKeyInput')
        let roomkey = ''
        inputs.childNodes.forEach((child)=>{
            roomkey += child.value
        })
        roomkey=roomkey.toUpperCase()
        // alert(roomkey)
        window.location = '/play/'+roomkey
    }
}

const RoomKeyInput = () => {
    const params = new URLSearchParams(window.location.search);
    var roomKey = params.get("roomkey") || '';
    function switchTarget(e){
        e.target.value.length==1? e.target.nextElementSibling?.focus() : null
        // e.target.value.length==0? e.target.previousElementSibling?.focus() : null
    }
    function switchTarget_(e){
        // alert(e.key);
        e.target.value.length==0 && e.key=='Backspace'? e.target.previousElementSibling?.focus():null
    }

    var arr = new Array(4).fill(0)
    console.log("roomKey", roomKey)
    arr = arr.map((val,ind)=><input key={ind} type="text" value={roomKey[ind]} maxLength={1} onChange={(e)=>switchTarget(e)} onKeyDown={(e)=>switchTarget_(e)} />)

    return <div className="RoomKeyInput">
        {arr}
    </div>
}



