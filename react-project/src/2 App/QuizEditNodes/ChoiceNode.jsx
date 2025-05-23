import { Handle, Position } from '@xyflow/react';
import Terminal from './Terminal';
import { useState, useEffect } from 'react';
import { putSelfInDB, putSelfInLocalStorage } from '../../functions.mjs';

const isImageUrl = (url) => {
  return /^(https?:\/\/|data:image\/).+\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(url);
};

/** @param {{data:{choice:Choice}}} */
const ChoiceNode = ({ data, onUpdate }) => {
  const { choice, isHighlighted } = data


  const [inputTitle, setInputTitle] = useState(choice.title)
  const [inputValue, setInputValue] = useState(choice.value)
  const [isImage, setIsImage] = useState(() => isImageUrl(choice.title)); 
  
  useEffect(() => {
    // Синхронизация состояния при внешних изменениях
    setInputTitle(choice.title);
    setIsImage(isImageUrl(choice.title));
  }, [choice.title]);

  const updateChoice = () => {
    choice.title = inputTitle;
    if (inputValue >= 0 && inputValue <= 1)
      choice.value = inputValue;
    setIsImage(isImageUrl(inputTitle));
    
    // if (typeof onUpdate === 'function') {
    //   onUpdate(choice);
    // }
    if (onUpdate) {
      onUpdate(choice);
    }
  };

  const handleInputChange = (e) => {
    const newTitle = e.target.value;
    setInputTitle(newTitle);
    setIsImage(isImageUrl(newTitle));
  };

  const handleSaveTitle = () => {
    updateChoice();
    // choice.title = inputTitle;
  };

  const handleSaveValue = () => {
    updateChoice();
    // if (inputValue >= 0 && inputValue <= 1)
    //   choice.value = inputValue;
  };

  return (
    <div style={{
      background: isHighlighted ? '#E3F2FD' : '#FFFFFF',
      padding: '15px',
      borderRadius: '8px',
      border: `2px solid ${isHighlighted ? '#64B5F6' : '#E0E0E0'}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <Terminal type="source" position={ Position.Bottom } />
      <Terminal type="target" position={ Position.Top } />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={inputTitle}
            placeholder="Введите текст или вставьте изображение (Ctrl+V)"
            className="nodrag"
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            onBlur={handleSaveTitle}
            style={{
              width: '100%',
              padding: '4px',
              border: `1px solid ${isImage ? '#81C784' : '#ddd'}`,
              borderRadius: '4px'
            }}
          />
          
          {isImage && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              padding: '8px',
              zIndex: 10,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '4px'
            }}>
              <img
                src={inputTitle}
                alt="Вставленное изображение"
                style={{
                  maxWidth: '100%',
                  maxHeight: '150px',
                  display: 'block',
                  margin: '0 auto'
                }}
                onError={() => {
                  setIsImage(false);
                }}
              />
            </div>
          )}
        </div>

        <input 
          style={{ marginLeft: 8, width: "3rem" }}
          type='number'
          min={0} 
          max={1}
          step={0.01} 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSaveValue}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveValue()}
        />
      </div>
    </div>
  );
};

export default ChoiceNode;