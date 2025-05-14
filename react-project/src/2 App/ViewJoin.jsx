import { useState, useEffect } from "react"
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { limits } from "../values.mjs"
import "./ViewJoin.scss"

export const ViewJoin = () => {
    const [roomkey, setRoomkey] = useState("")
    let self = getSelfFromLocalStorage() || {};

    const handleEnterPress = () => {
        console.log("enter");
        navigatePlay(roomkey)
    }

    return <div className="ViewJoin">
        <header>Join the game</header>
        <div className="form">
            <vstack>name:<input 
                id='name' 
                type="text" 
                value={self.name || ""} 
                maxLength={limits.maxNameLength} 
                onChange={(e)=>{self.name = e.target.value, putSelfInLocalStorage(self)}} />
            </vstack>
            <vstack>key:<RoomKeyInput roomkey={roomkey} onRoomkeyChange={setRoomkey} onEnterPress={handleEnterPress}/></vstack>
            <button className="big" style={{width:"100%"}} onClick={(e)=>{navigatePlay(roomkey)}}>join</button>
        </div>
    </div>

    function navigatePlay(roomkey){
        putSelfInLocalStorage(self);
        window.location = '/play/' + roomkey.toUpperCase().padEnd(4, " ").substring(0, 4);
    }

    // function navigatePlay(){
    //     putSelfInLocalStorage(self)
    //     let inputs = document.querySelector('.RoomKeyInput')
    //     let roomkey = ''
    //     inputs.childNodes.forEach((child)=>{
    //         roomkey += child.value
    //     })
    //     roomkey=roomkey.toUpperCase()
    //     // alert(roomkey)
    //     window.location = '/play/'+roomkey
    // }

}

const RoomKeyInput = ({ roomkey, onRoomkeyChange, onEnterPress }) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const keyParts = Array.from({length: 4}, (_, i) => roomkey[i] || '')
    
    useEffect(() => {
        const element = document.getElementById(`roomkey-input-${activeIndex}`)
        element?.focus()
    }, [activeIndex])

    const handleChange = (index, value) => {
        const newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (!newValue) return
        
        const newKeyParts = [...keyParts]
        newKeyParts[index] = newValue.slice(-1)
        const newRoomkey = newKeyParts.join('').substring(0, 4)
        onRoomkeyChange(newRoomkey)
        
        if (newValue && index < 3) setActiveIndex(index + 1)
    }

    const handleKeyDown = (index, e) => {
        e.preventDefault()
        const deleteParts = [...keyParts];
        switch(e.key) {
            case "Backspace":
                deleteParts[index] = ''
                onRoomkeyChange(deleteParts.join(''))
                
                if (index > 0 && (!deleteParts[index] || deleteParts[index] === '')) {
                    setActiveIndex(index - 1)
                }
                break
                
            case "Delete":
                for (let i = index; i < 3; i++) {
                    deleteParts[i] = deleteParts[i + 1]
                }
                deleteParts[3] = ''
                onRoomkeyChange(deleteParts.join(''))
                break
                
            case "ArrowLeft":
            case "ArrowDown":
            case "PageDown":
                if (index > 0) setActiveIndex(index - 1)
                break
                
            case "ArrowRight":
            case "ArrowUp":
            case "PageUp":
                if (index < 3) setActiveIndex(index + 1)
                break

            case "Home":
                setActiveIndex(0);
                break;

            case "End":
                setActiveIndex(3);
                break;

            case "Enter":
                onEnterPress();
                break    
                
            default:
                if (e.key.match(/^[a-z0-9]$/i)) {
                    handleChange(index, e.key)
                }
                break
        }
    }

    return <div className="RoomKeyInput">
        {keyParts.map((part, index) => (
            <input
                key={index}
                id={`roomkey-input-${index}`}
                type="text"
                autoComplete="off"
                inputMode="none"
                maxLength={1}
                value={part}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onClick={() => setActiveIndex(index)}
            />
        ))}
    </div>
}