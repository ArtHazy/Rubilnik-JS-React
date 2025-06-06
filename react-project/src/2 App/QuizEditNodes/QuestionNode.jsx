import { useState } from 'react';
import { Position } from '@xyflow/react';
import Terminal from './Terminal';
import "../../main/mixin.scss";

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

  const inputStyle = {
    padding: '4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    outline: 'none',
    color: "#242424"
  };

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
        borderRadius: '12px',
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
      <Terminal type="source" position={ Position.Bottom } 
        style={{ 
          background: '#898176',
          width: 12,
          height: 12,
          borderRadius: 4,
          border: selected 
            ? '2px solid #2196F3' 
            : isHighlighted  
              ? '2px solid #5A534C' 
              : '2px solid #F5F3F0',
        }}
      />
      <Terminal type="target" position={ Position.Top } 
        style={{ 
          background: '#898176',
          width: 12,
          height: 12,
          borderRadius: 4,
          border: selected 
            ? '2px solid #2196F3' 
            : isHighlighted  
              ? '2px solid #5A534C' 
              : '2px solid #F5F3F0',
        }}
      />

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
          style={{
            ...inputStyle,
            width: '100%'
          }}
        />
      ) : (
        <div style={{ 
          minHeight: '1.5em',
          padding: '2px 4px',
          whiteSpace: 'pre-wrap',
          cursor: 'pointer',
          color: '#242424', // Основной цвет текста
        }}>
          {question.title || 'Дважды кликните для редактирования'}
        </div>
      )}

      <div style={{ fontSize: '0.8em', color: '#666' }}>
        {data.choices?.map((choice, i) => (
          <div key={i} style={{ margin: '5px 0', color: '#444' }}> {choice.text}</div>
        ))}
      </div>
    </div>
  );
};

export default QuestionNode;