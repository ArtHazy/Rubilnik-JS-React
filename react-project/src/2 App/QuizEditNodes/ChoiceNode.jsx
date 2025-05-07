import { Handle, Position } from 'reactflow';
import Terminal from './Terminal';
import { useState } from 'react';
import { putSelfInDB, putSelfInLocalStorage } from '../../functions.mjs';


/** @param {{data:{choice:Choice,upd:()=>{},self:User}}} */
const ChoiceNode = ({ data }) => {
  const {choice,upd,self} = data

  const [title, setTitle] = useState(choice.title)
  const [value, setValue] = useState(choice.value)
  // choice.title = title

  return (
    <div style={{
      background: '#E3F2FD',
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid #64B5F6',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <Terminal type="source" position={ Position.Bottom } />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        💡
        <input
          value={choice.title}
          placeholder="Enter your choice"
          className="nodrag" 
          onKeyDown={(e)=>{if (e.key=='Enter') e.target.blur()}}
          onBlur={()=>{
            console.log('blur!')
            putSelfInLocalStorage(self)
          }}
          onChange={(e) => {
            console.log('change!');
            choice.title = e.target.value
            setTitle(e.target.value)
          }}
        />
        <input 
          style={{width:"3rem"}}
          type='number'
          min={0} 
          max={1}
          step={0.01} 
          value={choice.value}
          onKeyDown={(e)=>{if (e.key=='Enter') e.target.blur()}}
          onBlur={()=>{
            console.log('blur!')
            putSelfInLocalStorage(self)
          }}
          onChange={(e)=>{
            if (value>=0 && value<=1) {
              console.log("valuechange");
              choice.value = e.target.valueAsNumber
            }
            // setValue(e.target.valueAsNumber)
          }}
        ></input>
      </div>
    </div>
  );
};

export default ChoiceNode;