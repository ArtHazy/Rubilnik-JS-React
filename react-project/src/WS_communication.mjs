import { onerror } from "./HTTP_requests.mjs";
import { CORE_SERVER_URL_WS } from "./values.mjs";


export class WSPlayAPI{
    ws
    eventActions = {
        'open': (roommates)=>{},
        
        'close': ()=>{},
        'error': ()=>{},
        'create': ({roommates})=>{},
        /** 
         * @param { [{id,name}] } roommates 
        */
        'join': ({roommates})=>{},
        'joined': ({user, roommates})=>{},
        /** 
         * @param { {id,name} } user
         * @param { [{id,name}] } roommates 
        */
        'left': ({user, roommates})=>{},
        /** 
         * @param { {id,name} } user
        */
        'bark': (user)=>{},
        'start': ({question,index,quizLength})=>{},
        'next': ({question,index,quizLength})=>{},
        /** 
         * @param { {id,name} } user 
        */
        'choice': ({user,questionInd,choiceInd})=>{},
        'reveal': (correctChoiceInd)=>{},
        /** 
         * @param { [{}] } results 
        */
        'end': ()=>{results},
    }

    constructor(){
        this.ws = new WebSocket(CORE_SERVER_URL_WS+"");
        this.ws.onopen = (ev)=>{
            this._log_event("open",ev)
            this.eventActions.open()
        }

        this.ws.onclose = (ev)=>{
            this._log_event("close",ev)
            this.eventActions.close();
        }

        this.ws.onerror = (ev)=>{
            this._log_event("error", ev)
            this.eventActions.error();
        }

        this.ws.onmessage = (ev)=>{
            console.log('ws message', ev.data);
            
            let wsMessageData= JSON.parse(ev.data)
            let event = wsMessageData.event
            let eventData = wsMessageData.data
            this._log_event(event,eventData)
            this.eventActions[event](eventData)
        }
    }
    _log_event(name,data){
        console.log({eventName:name,data});
        if (name=='error') alert(data.message)
    }

    isOpen(){
        let res = this.ws?.readyState == WebSocket.OPEN
        if (!res) console.log("websocket isn't open");
        return res;
    }

    emitJoin(validation_={id, password},roomId, onopen){
        console.log('emitJoin');
        let validation = {id:validation_.id, password:validation_.password}
        this.ws.send(JSON.stringify({event:"join",data:{validation,roomId}}) )
        return this
    }
    emitCreate(validation_={id,password},quiz){
        console.log('emitCreate');
        let validation = {id:validation_.id, password:validation_.password}
        this.ws.send(JSON.stringify({event:"create",data:{validation,quiz}}) )
        return this
    }
    emitBark(){
        if (this.isOpen()){
            console.log('emitBark');
            this.ws.send(JSON.stringify({event:"bark",data:{}}) )
        }
    }
    emitChoice(questionInd, choiceInd){
        if (this.isOpen()){
            console.log('emitChoice');
            this.ws.send(JSON.stringify({event:"choice",data:{questionInd, choiceInd}}))
        }
    }
    emitStart(){
        if (this.isOpen()){
            console.log('emitStart');
            this.ws.send(JSON.stringify({event:"start",data:{}}) )
        }
    }
    emitNext(){
        if (this.isOpen()){
            console.log('emitNext');
            this.ws.send(JSON.stringify({event:"next",data:{}}) )
        }
    }
    emitReveal(){
        if (this.isOpen()){
            console.log('emitReveal');
            this.ws.send(JSON.stringify({event:"reveal",data:{}}) )
        }
    }
    emitEnd(){
        if (this.isOpen()){
            console.log('emitEnd');
            this.ws.send(JSON.stringify({event:"end",data:{}}) )
        }
    }
}