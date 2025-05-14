import { Handle, Position } from 'reactflow';
import Terminal from './Terminal';
import { useState } from 'react';
import { putSelfInDB, putSelfInLocalStorage } from '../../functions.mjs';


/** @param {{data:{choice:Choice,self:User}}} */
const ChoiceNode = ({ data }) => {
  const {choice,self} = data

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(choice.title)
  const [value, setValue] = useState(choice.value)
  const [isImage, setIsImage] = useState(false);

  // Проверка на URL изображения
  const isImageUrl = (url) => {
    return /^(https?:\/\/|data:image\/).+\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(url);
  };

  // Обработчик вставки из буфера
  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    
    // Проверка на вставку изображения
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          setTitle(dataUrl);
          choice.title = dataUrl;
          setIsImage(true);
          putSelfInLocalStorage(self);
        };
        
        reader.readAsDataURL(blob);
        e.preventDefault();
        return;
      }
    }

    // Проверка на текстовый URL
    const text = e.clipboardData.getData('text');
    if (isImageUrl(text)) {
      setTitle(text);
      choice.title = text;
      setIsImage(true);
      putSelfInLocalStorage(self);
      e.preventDefault();
    }
  };

  // Обработчик изменений
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    choice.title = newTitle;
    setTitle(newTitle);
    setIsImage(isImageUrl(newTitle));
  };

  return (
    <div style={{
      background: '#E3F2FD',
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid #64B5F6',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <Terminal type="source" position={ Position.Bottom } />
      <Terminal type="target" position={ Position.Top } />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={title}
            placeholder="Введите текст или вставьте изображение (Ctrl+V)"
            className="nodrag"
            onChange={handleTitleChange}
            // onPaste={handlePaste}
            onKeyDown={(e) => { 
              if (e.key === 'Enter') e.target.blur();
            }}
            onBlur={() => putSelfInLocalStorage(self)}
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
                src={title}
                alt="Вставленное изображение"
                style={{
                  maxWidth: '100%',
                  maxHeight: '150px',
                  display: 'block',
                  margin: '0 auto'
                }}
                onError={() => {
                  setIsImage(false);
                  setTitle('');
                  choice.title = '';
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
          value={value}
          onChange={(e) => {
            const newValue = e.target.valueAsNumber;
            if (newValue >= 0 && newValue <= 1) {
              setValue(newValue);
              choice.value = newValue;
            }
          }}
          onBlur={() => putSelfInLocalStorage(self)}
        />
      </div>
    </div>
  );
};

export default ChoiceNode;