import React from 'react';
import './Sidebar.scss';

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="sidebar-container">      
      {/* Кнопка вопроса */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'question')}
        className="sidebar-button question-button"
        role="button"
      >
        <span>Вопрос</span>
      </div>

      {/* Кнопка ответа */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'choice')}
        className="sidebar-button choice-button"
        role="button"
      >
        <span>Ответ</span> 
      </div>
      {/* Кнопка финиша */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'end')}
        className="sidebar-button end-button"
        role="button"
      >
        <span>Конец</span>
      </div>
    </div>
  );
};

export default Sidebar;