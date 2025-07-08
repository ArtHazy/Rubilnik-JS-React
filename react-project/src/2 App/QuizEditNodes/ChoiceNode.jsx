import { Position } from '@xyflow/react';
import Terminal from './Terminal';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const isImageUrl = (url) => {
  return /^(https?:\/\/|data:image\/).+\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(url);
};

/** @param {{data:{choice:Choice}}} */
const ChoiceNode = ({ data, onUpdate }) => {
  const { t } = useTranslation();
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
    <div style={{
      background: isHighlighted ? '#E3F2FD' : '#FFFFFF',
      padding: '15px',
      borderRadius: '12px',
      border: `2px solid ${isHighlighted ? '#64B5F6' : '#E0E0E0'}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <Terminal type="source" position={ Position.Bottom } 
        style={{ 
          background: '#B0B0B0',
          width: 12,
          height: 12,
          borderRadius: 4,
          border: isHighlighted  
              ? '2px solid #7A7A7A' 
              : '2px solid #E0E0E0',
        }}
      />
      <Terminal type="target" position={ Position.Top } 
        style={{ 
          background: '#B0B0B0',
          width: 12,
          height: 12,
          borderRadius: 4,
          border: isHighlighted  
              ? '2px solid #7A7A7A' 
              : '2px solid #E0E0E0',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={inputTitle}
            placeholder={t('quizFlow.choicePlaceholder')}
            className="nodrag"
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            onBlur={handleSaveTitle}
            style={{
              ...inputStyle,
              width: '100%',
              border: `1px solid ${isImage ? '#81C784' : '#ddd'}`,
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
                alt={t('quizFlow.imageAlt')}
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
          type='number'
          min={0} 
          max={1}
          step={0.01} 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSaveValue}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveValue()}
          style={{
            ...inputStyle,
            marginLeft: 8,
            width: '3rem',
            textAlign: 'center',
          }}      
        />
      </div>
    </div>
  );
};

export default ChoiceNode;