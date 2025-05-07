// Измените расширение файла на .tsx и добавьте типы

import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  NodeMouseHandler,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  useReactFlow,
  MiniMap,
  ControlButton,
  SelectionMode,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowProvider,
  BaseEdge,
  Panel,
  Node,
  Edge,
  Position,
  Handle,
  NodeTypes,
  EdgeTypes,
  Connection,
  XYPosition,
  ReactFlowInstance,
  GetMiniMapNodeAttribute,
  OnNodesChange
} from 'reactflow';
import { useParams } from 'react-router-dom';
import throttle from 'lodash/throttle';

import "./styles.scss";
import '@xyflow/react/dist/base.css';
import './styles.scss';

import { PanelControls } from './PanelControls';
import QuestionNode from './QuestionNode';
import ChoiceNode from './ChoiceNode';
import Sidebar from './Sidebar';
import CustomEdge from './CustomEdge';

import { MarkerType, NodePositionChange } from '@xyflow/react';
import { limits } from '../../values.mjs';
import { Actions } from '../App';
import { downloadJson, getSelfFromLocalStorage, loadQuizFromFile, putSelfInLocalStorage } from "../../functions.mjs"
import { startRoomAsHost } from "../ViewLibrary"
import { http_post_quiz, http_put_quiz } from "../../HTTP_requests.mjs"

// Типы для пропсов компонента
interface ReactFlowComponentProps {
  self: User;
  quiz: Quiz;
  upd: (value: boolean) => void;
}



type NodeData = {
  question?: Question;
  choice?: Choice;
  upd?: (value: boolean) => void;
};

// Типы для нод и ребер
type CustomNode = Node & {
  data: {
    question?: Question;
    choice?: Choice;
    upd?: (value: boolean) => void;
  };
  type?: 'question' | 'choice';
};

type CustomEdge = Edge & {
  animated?: boolean;
};

const rfStyle: React.CSSProperties = {
  // backgroundColor: '#D0C0F7',
};

const EndNode = () => (
  <div className="end">
    <div className="content">🏁 Конец викторины</div>
    <Handle type="target" position={Position.Top} />
  </div>
);

const nodeColor:GetMiniMapNodeAttribute  = (node): string => {
  switch (node.type) {
    case 'question': return '#6ede87';
    case 'choice': return '#6865A5';
    default: return '#ff0072';
  }
};

const nodeTypes: NodeTypes = {
  question: QuestionNode,
  choice: ChoiceNode,
};

const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

const panOnDrag = [1, 2];

// Функции с добавленными типами
const convertToQuizFormat = (nodes: CustomNode[], edges: CustomEdge[]): { restoreQuestions: Question[], restoreGraphEdges: string } => {
  const restoreQuestions = nodes
    .filter(n => n.type === 'question')
    .map(n => n.data.question!) as Question[];

  return {
    restoreQuestions,
    restoreGraphEdges: "" // TODO
  };
};

const convertToFlowElements = (self: any, quiz: Quiz, upd: (value: boolean) => void): { nodes: CustomNode[], edges: CustomEdge[] } => {
  const nodes: CustomNode[] = [];
  
  quiz.questions?.forEach((question) => {
    nodes.push({
      id: String(question.id),
      type: 'question',
      data: { question: { ...question, position: question.position }, upd },
      position: {
        x: Number(question.position?.x) || 0,
        y: Number(question.position?.y) || 0
      },
    });

    question.choices?.forEach((choice, index) => {
      nodes.push({
        id: String(choice.id),
        type: 'choice',
        data: { choice: { ...choice, position: choice.position }, upd },
        position: {
          x: Number(choice.position?.x) || 0,
          y: Number(choice.position?.y) || (index + 1) * 100
        },
        extent: 'parent',
        parentId: String(question.id),
      });
    });
  });

  return { nodes, edges: [] };
};

const ReactFlowComponent: React.FC<ReactFlowComponentProps> = ({ self, quiz, upd }) => {
  const { ind } = useParams<{ ind: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomNode | null>(null);
  const [contextMenuNode, setContextMenuNode] = useState<CustomNode | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleNodesChange:OnNodesChange = (changes) => {    
    // Фильтруем изменения позиции
    const nodeChanges = changes.filter(
      (change): change is NodePositionChange => change.type === 'position' && !change.dragging // Обновляем только когда закончили перетаскивание
    );
    
    setNodes(nds => {
      let updatedNodes = applyNodeChanges(changes, nds) as CustomNode[];;
      if (nodeChanges.length > 0) {
        quiz.isInDB = false;
        updatedNodes = updatedNodes.map(node => {
          const wasMoved = nodeChanges.some(c => c.id === node.id);
          if (!wasMoved) return node;
          return {
            ...node,
            data: {
              question: {
                ...node.data.question,
                position: node.position,
              }
            }
          } as CustomNode;
        });
      }
      return updatedNodes;
    });
  };

  // const handleAutoSave = useCallback(
  //   throttle(() => {
  //     // ... (реализация с типами)
  //   }, 5000),
  //   [ind, self, quiz.id]
  // );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      // ... (реализация с типами)
    },
    [screenToFlowPosition, self, setNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // ... (реализация с типами)
    },
    [setEdges]
  );

  const onNodeContextMenu:NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault();
    setContextMenuNode(node as CustomNode);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  },[])

  // JSX остается практически без изменений
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Panel 
        position='top-left' 
        style={{
          padding:12, 
          borderRadius:12, 
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
        }}>
        <Sidebar />
      </Panel>

      <div style={{ flex: 1, position: 'relative' }}
        onClick={useCallback(() => {
          setContextMenuNode(null);
        }, [])}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeContextMenu={onNodeContextMenu}
          style={rfStyle}
          onNodeClick={(e, node) => {
            if (node.type === 'question') {
              setSelectedQuestion(node as CustomNode);
            }
          }}
          fitView
          panOnScroll
          selectionOnDrag
          panOnDrag={panOnDrag}
          selectionMode={SelectionMode.Partial}
        >
          <PanelControls quiz={quiz} ind={ind} upd={upd} />
          <Background />
          <Controls 
            showInteractive={false} 
            position="top-right"
            
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '6px',
              background: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: '8px',

              top: '50%',
              transform: 'translateY(-50%)',
            }}>
          </Controls>
          <MiniMap nodeColor={nodeColor} nodeStrokeWidth={3} zoomable pannable/>
        </ReactFlow>

        {contextMenuNode && (
          <div
            ref={contextMenuRef}
            style={{
              position: 'fixed',
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              background: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              borderRadius: '4px',
              zIndex: 1000
            }}
          >
            <div
              style={{ 
                padding: '8px 16px',
                cursor: 'pointer',
              }}
              
            >
              Удалить {contextMenuNode.type === 'question' ? 'вопрос' : 'ответ'}
            </div>
          </div>
        )}

        {selectedQuestion && (
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'white',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>Управление вопросом</h3>
            <button onClick={() => setSelectedQuestion(null)}>Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactFlowComponent;