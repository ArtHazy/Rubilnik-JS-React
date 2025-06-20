import { 
  BaseEdge, 
  getBezierPath, 
  EdgeLabelRenderer,
  useReactFlow 
} from '@xyflow/react';
import { memo } from 'react';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data, selected }) => {
  const { condition, isHighlighted, showConditionInput } = data;

  const { setEdges } = useReactFlow(); 
  const [path, labelX, labelY] = getBezierPath  ({
    sourceX,
    sourceY,
    targetX,
    targetY
  });

  const handleChange = (e) => {
    const value = Math.min(100, Math.max(0, e.target.value)); // Ограничение 0-100
    setEdges(es => es.map(edge => 
      edge.id === id ? { 
        ...edge, 
        data: { ...edge.data, condition: value }
      } : edge
    ));
  };

  return (
    <>
      <BaseEdge 
        id={id} 
        path={path}
        style={{
          stroke: 
            selected ? '#6366f1' : 
            isHighlighted ? '#b1b1b7':
            condition > 0? '#00ff00':  //похоже, не работает, тк condition = 0
            '#888',
          strokeWidth: 2,
          strokeDasharray: data?.value > 50 ? '5 5' : 'none',
        }}
      />
      {showConditionInput && (
        <EdgeLabelRenderer>
          <div
            className="edge-label"
            style={{
              transform: `translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <div className="percentage-input">
              <input
                type="number"
                min="0"
                max="100"
                value={condition ?? 0}
                onChange={handleChange}
                className="input"
                style={{ 
                  borderColor: selected ? '#6366f1' : '#ddd',
                  boxShadow: selected ? '0 0 0 1px #6366f1' : 'none'
                }}
              />
            </div>
          </div>
        </EdgeLabelRenderer>
       )}
    </>
  );
};
  
export default memo(CustomEdge);