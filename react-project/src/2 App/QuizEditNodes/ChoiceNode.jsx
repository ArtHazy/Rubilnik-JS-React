import { Handle, Position } from 'reactflow';
import Terminal from './Terminal';
import { useState } from 'react';

const ChoiceNode = ({ data }) => {
  const {choice,upd} = data

  const [title, setTitle] = useState(choice.title)
  choice.title = title

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
            // onBlur={upd()}
            onChange={(e) => {
              choice.title = e.target.value
              setTitle(e.target.value)
            }}
        />
      </div>
    </div>
  );
};

export default ChoiceNode;