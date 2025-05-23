import {useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import Terminal from './Terminal';

/**
 * 
 * @param {{id:string, type:string, data:{question:Question} }} param0 
 * @returns 
 */
const QuestionNode = ({ id, data, selected, onUpdate }) => {
  let { question, isHighlighted } = data;

  const [isEditing, setIsEditing] = useState(false);
  const [inputTitle, setInputTitle] = useState(question.title);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    console.log("TEST", inputTitle);
    question.title = inputTitle;
    setIsEditing(false);

    if (onUpdate) {
      onUpdate(question);
    }
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
        border: selected 
          ? '2px solid #2196F3' 
          : isHighlighted  
            ? '2px solid #FFA000' 
            : '2px solid #FFD700',
        boxShadow: selected 
          ? '0 0 10px rgba(33,150,243,0.5)' 
          : isHighlighted  
            ? '0 0 8px rgba(255,160,0,0.3)'
            : '0 4px 6px rgba(0,0,0,0.1)',
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
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
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
          <div key={i} style={{ margin: '5px 0' }}> {choice.text}</div>
        ))}
      </div>
    </div>
  );
};

export default QuestionNode;