import { Handle, Position } from '@xyflow/react';

const EndNode = ({ id, data, selected }) => {
  const { isHighlighted } = data;

  // Выносим стили в отдельный объект
  const nodeStyle = {
    background: '#FFEBEE',
    padding: '15px',
    borderRadius: '8px',
    border: selected 
      ? '2px solid #2196F3'
      : isHighlighted  
      ? '2px solid #FF6D00' 
      : '2px solid #EF5350',
    minWidth: '120px',
    boxShadow: selected 
      ? '0 0 8px rgba(33,150,243,0.3)' 
      : isHighlighted  
      ? '0 0 6px rgba(255,109,0,0.2)'
      : '0 2px 4px rgba(0,0,0,0.1)',
  };

  const handleStyle = {
    background: selected 
      ? '#2196F3' 
      : isHighlighted 
      ? '#FF6D00' 
      : '#EF5350',
    width: 10,
    height: 10,
    top: -5,
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
          fontSize: '14px',
          color: '#D32F2F',
          textAlign: 'center',
          fontWeight: 500,
          letterSpacing: '0.5px'
        }}
      >
        🏁 Конец викторины
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle} // Правильное применение стилей
      />
    </div>
  );
};

export default EndNode;