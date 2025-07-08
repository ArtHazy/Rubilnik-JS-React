import { Position } from '@xyflow/react';
import Terminal from './Terminal';
import { useTranslation } from 'react-i18next';

const EndNode = ({ id, data, selected }) => {
  const { t } = useTranslation();
  const { isHighlighted } = data;

  // Выносим стили в отдельный объект
  const nodeStyle = {
    background: '#FFEBEE',
    padding: '15px',
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: selected 
      ? '2px solid #2196F3'
      : isHighlighted  
      ? '2px solid #FF6D00' 
      : '2px solid #EF5350',
    boxShadow: selected 
      ? '0 0 8px rgba(33,150,243,0.3)' 
      : isHighlighted  
      ? '0 0 6px rgba(255,109,0,0.2)'
      : '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  };

  const handleStyle = {
    background: selected 
      ? '#2196F3' 
      : isHighlighted 
      ? '#FF6D00' 
      : '#EF5350',
    width: 12,
    height: 12,
    borderRadius: '50%',
    top: 0,
    transition: 'background 0.2s ease'
  };

  return (
    <div 
      className="end-node"
      style={nodeStyle} // Правильное применение стилей
    >
      <div 
        className="content" 
        style={{ 
          fontSize: 'inherit',
          color: '#D32F2F',
          textAlign: 'center',
          fontWeight: 500,
          letterSpacing: '0.5px'
        }}
      >
        {t('quizFlow.endNode')}
      </div>
      
      <Terminal
        type="target"
        position={Position.Top}
        style={handleStyle} // Правильное применение стилей
      />
    </div>
  );
};

export default EndNode;