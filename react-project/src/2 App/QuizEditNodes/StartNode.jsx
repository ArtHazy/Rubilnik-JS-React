import { Position } from '@xyflow/react';
import Terminal from './Terminal';

const StartNode = () => {
  return (
    <div className="start-node" tabIndex={-1}>
      <div className="content">
        🚀 Начало викторины
      </div>
      <Terminal
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#709B95', 
          width: 12,
          height: 12,
          bottom: -8,
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export default StartNode;