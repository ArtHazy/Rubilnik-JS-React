// CustomEdge.jsx
import { 
    BaseEdge, 
    getStraightPath, 
    EdgeLabelRenderer, 
    useReactFlow 
  } from '@xyflow/react';
  import { memo } from 'react';
  
  const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY }) => {
    // const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  
    return (
      <>
        <BaseEdge 
          id={id} 
          path={edgePath}
          //markerEnd={markerEnd} 
        />
        {/* <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <button
              onClick={() => setEdges(es => es.filter(e => e.id !== id))}
              style={{ 
                padding: '2px 8px',
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Удалить
            </button>
          </div>
        </EdgeLabelRenderer> */}
      </>
    );
  };
  
  export default memo(CustomEdge);