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
          background: '#ff9900',
          width: 12,
          height: 12,
          bottom: -6 
        }}
      />
    </div>
  );
};

export default StartNode;