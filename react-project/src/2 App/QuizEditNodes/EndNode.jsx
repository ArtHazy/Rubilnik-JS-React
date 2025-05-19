import { Handle, Position } from '@xyflow/react';

const EndNode = () => {
  return (
    <div className="end-node">
      <div className="content">
        🏁 Конец викторины
      </div>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#ff0000',
          width: 12,
          height: 12,
          top: -6 
        }}
      />
    </div>
  );
};

export default EndNode;