import { Handle, Position } from '@xyflow/react';

const StartNode = () => {
  return (
    <div className="start-node">
      <div className="content">
        🚀 Начало викторины
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#709B95', 
          width: 12,
          height: 12,
          bottom: -8,
          borderRadius: '50%',
          // border: '2px solid #709B95',
        }}
      />
    </div>
  );
};

export default StartNode;