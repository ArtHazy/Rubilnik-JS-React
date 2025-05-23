import React from 'react';
//import { FaQuestionCircle, FaComment } from 'react-icons/fa'; // Импорт иконок

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Общие стили для кнопок
  const buttonStyle = {
    width: '80px',
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '2px dashed',
    cursor: 'grab',
    transition: 'all 0.2s',
    margin: "5px auto",
    color: "#525252"
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>      
      {/* Кнопка вопроса */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'question')}
        style={{
          ...buttonStyle,
          background: '#FFF5CC',
          borderColor: '#FFD700',
          // ':hover': {
          //   background: '#FFE082',
          // }
        }}
        role="button"
      >
        {/* <FaQuestionCircle size={24} color="#FFB300" /> */}
        <span style={{ fontSize: '16px' }}>Вопрос</span>
      </div>

      {/* Кнопка ответа */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'choice')}
        style={{
          ...buttonStyle,
          background: '#E3F2FD',
          borderColor: '#64B5F6',
          // ':hover': {
          //   background: '#BBDEFB',
          // }
        }}
        role="button"
      >
        {/* <FaComment size={24} color="#2196F3" /> */}
        <span style={{ fontSize: '16px' }}>Ответ</span>
      </div>
      {/* Кнопка финиша */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'end')}
        style={{
          ...buttonStyle,
          background: '#FFEBEE',
          borderColor: '#EF5350',
        }}
        role="button"
      >
        <span style={{ fontSize: '16px' }}>Конец</span>
      </div>
    </div>
  );
};

export default Sidebar;