import React from 'react';
import { useTranslation } from 'react-i18next';
import './Sidebar.scss';

const Sidebar = () => {
  const { t } = useTranslation();

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
        aria-label={t('quizFlow.addQuestion')}
      >
        <span>{t('quizFlow.questionNode')}</span>
      </div>

      {/* Кнопка ответа */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'choice')}
        className="sidebar-button choice-button"
        role="button"
        aria-label={t('quizFlow.addChoice')}
      >
        <span>{t('quizFlow.choiceNode')}</span> 
      </div>
      {/* Кнопка финиша */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'end')}
        className="sidebar-button end-button"
        role="button"
        aria-label={t('quizFlow.addEnd')}
      >
        <span>{t('quizFlow.endNode')}</span>
      </div>
    </div>
  );
};

export default Sidebar;