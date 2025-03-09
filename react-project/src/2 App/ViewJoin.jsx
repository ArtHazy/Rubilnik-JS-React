import { useState } from "react"
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { limits } from "../values.mjs"

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
    function switchTarget(e){
        e.target.value.length==1? e.target.nextElementSibling?.focus() : null
        // e.target.value.length==0? e.target.previousElementSibling?.focus() : null
    }
    function switchTarget_(e){
        // alert(e.key);
        e.target.value.length==0 && e.key=='Backspace'? e.target.previousElementSibling?.focus():null
    }
    return <div className="RoomKeyInput">
        {new Array(4).fill(<input type="text" maxLength={1} onChange={(e)=>switchTarget(e)} onKeyDown={(e)=>switchTarget_(e)} />)}
    </div>
}



