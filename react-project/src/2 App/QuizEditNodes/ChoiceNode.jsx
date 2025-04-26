import { Handle, Position } from 'reactflow';
import Terminal from './Terminal';

const ChoiceNode = ({ data }) => {
  return (
    <div style={{
      background: '#E3F2FD',
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid #64B5F6',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <Terminal type="source" position={ Position.Bottom } />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span>💡 {data.label}</span>
        <button 
          onClick={data.deleteChoice}
          style={{ 
            marginLeft: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ff4444'
          }}
        >
          {/* {rem} */}
          ×
        </button>
        <input
            value={data.title}
            placeholder="Enter your choice"
            className="nodrag" 
            onChange={(e) => data.updateTitle(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ChoiceNode;