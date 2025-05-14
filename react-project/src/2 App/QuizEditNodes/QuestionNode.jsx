import { useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import Terminal from './Terminal';
import { putSelfInLocalStorage } from '../../functions.mjs';

/**
 * 
 * @param {{id:string, type:string, data:{question:Question, self:User} }} param0 
 * @returns 
 */
const QuestionNode = ({ id, type, data }) => {
  
  let { question, self} = data;

  // const [title, setTitle] = useState(question.title);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(question.title);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    question.title = inputValue;
    putSelfInLocalStorage(self);
    setIsEditing(false);
  };


  // const groupArea = {
  //   x: Position.x - 200,  // Расширяем область на 200px в каждую сторону
  //   y: Position.y - 200,
  //   // width: (200) + 400,
  //   // height: (200) + 400
  // };

  return (
    <div 
      style={{
        // position: 'absolute',
        //   left: groupArea.x,
        //   top: groupArea.y,
        //   width: groupArea.width,
        //   height: groupArea.height,
        background: '#FFF5CC',
        padding: '20px',
        borderRadius: '10px',
        border: '2px solid #FFD700',
        minWidth: '200px',
        minHeight: '300px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Terminal type="source" position={ Position.Bottom } />
      <Terminal type="target" position={ Position.Top } />

      {isEditing ? (
        <input 
          autoFocus
          id="text" 
          name="text" 
          className="nodrag"
          placeholder="Enter your question"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          style={{ width: '100%' }}
        />
      ) : (
        <div style={{ 
          minHeight: '1.5em',
          padding: '2px 4px',
          whiteSpace: 'pre-wrap',
          cursor: 'pointer'
        }}>
          {question.title || 'Дважды кликните для редактирования'}
        </div>
      )}

      <div style={{ fontSize: '0.8em', color: '#666' }}>
        {data.choices?.map((choice, i) => (
          <div key={i} style={{ margin: '5px 0' }}>➥ {choice.text}</div>
        ))}
      </div>
    </div>
  );
};

export default QuestionNode;