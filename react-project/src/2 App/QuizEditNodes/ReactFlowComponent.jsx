import React, { useCallback, useState, useRef, useMemo, useEffect  } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  useReactFlow,
  MiniMap, ControlButton, SelectionMode, applyEdgeChanges, applyNodeChanges, ReactFlowProvider, BaseEdge, Panel
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


import { MarkerType } from '@xyflow/react';

import { limits } from '../../values.mjs';
import { Actions } from '../App';
import { downloadJson, getSelfFromLocalStorage, loadQuizFromFile, putSelfInLocalStorage} from "../../functions.mjs"
import { startRoomAsHost } from "../ViewLibrary"
import { http_post_quiz, http_put_quiz } from "../../HTTP_requests.mjs"

const rfStyle = {
  //backgroundColor: '#D0C0F7',
};

// Компонент конечной ноды
const EndNode = () => (
  <div className="end">
    <div className="content">🏁 Конец викторины</div>
    <Handle type="target" position={Position.Top} />
  </div>
);

const nodeColor = (node) => {
  switch (node.type) {
    case 'question': return '#6ede87';
    case 'choice': return '#6865A5';
    default: return '#ff0072';
  }
};

const nodeTypes = {
  question: QuestionNode,
  choice: ChoiceNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

const panOnDrag = [1, 2];
const SAFE_ZONE_RADIUS = 100; 

const generateNodeId = () => 
  `${Date.now() * 1000000 + Math.floor(Math.random() * 10000)}`;

const convertToQuizFormat = (nodes, edges) => {
  const restoreQuestions = nodes
    .filter(node => node.type === 'question')
    .map(questionNode => ({
      ...questionNode.data.question,
      position: questionNode.position,
      tempId: questionNode.id, //!!
      choices: nodes
        .filter(choiceNode => 
          choiceNode.type === 'choice' && 
          choiceNode.parentId === questionNode.id
        )
        .map(choiceNode => ({
          ...choiceNode.data.choice,
          tempId: choiceNode.id, //!!
          position: choiceNode.position,
        }))
    }));
    

  const graphEdges = edges
    .filter((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source);
      const targetNode = nodes.find((n) => n.id === e.target);
      return (
        sourceNode?.type === 'choice' &&
        targetNode?.type === 'question' &&
        e.data?.condition !== -1
      );
    })
    .map((e) => ({
      source: e.source,
      target: e.target,
      conditional: e.data?.condition || 0,
    }));

    const graphEdgesJSON = JSON.stringify(graphEdges);
  
  return {
    // title: "quiz",
    restoreQuestions,
    graphEdgesJSON
  };
};

/** 
 * @param {User} self  
 * @param {Quiz} quiz  
*/
const convertToFlowElements = (self, quiz) => {
  const nodes = [];
  const edges = [];
  const tempIdMap = new Map();

  // QuestionNode component params
  quiz.questions?.forEach((question) => {
    const questionNodeId = question.tempId ?? generateNodeId();

    if(question.tempId) {
      tempIdMap.set(question.tempId, questionNodeId);
    }

    nodes.push({
      id: questionNodeId, //String(question.id)
      type: 'question',
      data: { 
        question: {
          ...question,
          tempId: questionNodeId
        }, 
        self 
      },
      position: question.position || { x: 0, y: 0 },
    });

    // ChoiceNode component params
    question.choices?.forEach((choice, index) => {
      const choiceNodeId = choice.tempId ?? generateNodeId();

      if(choice.tempId) {
        tempIdMap.set(choice.tempId, choiceNodeId);
      }

      console.log("ID", choice.tempId);
      nodes.push({
        id: choiceNodeId, //String(choice.id)
        type: 'choice',
        data: { 
          choice: {
            ...choice,
            tempId: choiceNodeId
          }, 
          self 
        },
        position: choice.position || {x: 0, y: (index + 1) * 100},
        parentId: questionNodeId,
      });

      edges.push({
        id: `auto-${questionNodeId}-${choiceNodeId}`,
        source: questionNodeId,
        target: choiceNodeId,
        data: { condition: -1 },
        type: 'customEdge',
        animated: false,
      });
    });
  });

  try {
    console.log("ZZZZZZ", quiz.graphEdges);
    const parsedEdges = JSON.parse(quiz.graphEdges || '[]');
    console.log("???", parsedEdges);
    parsedEdges.forEach(edge => {
      console.log("EDGE", edge);
      if (edge.conditional !== -1) {
        const sourceId = tempIdMap.get(edge.source);
        const targetId = tempIdMap.get(edge.target);

        edges.push({
          id: `conn-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          data: { condition: edge.conditional },
          type: 'customEdge',
          animated: true
        });
      }
    });
  } catch (e) {
    console.error('Error parsing graph edges:', e);
  }

  console.log("WWWW", edges)

  return { nodes, edges };
};


/** 
 * @param {{self:User,quiz:Quiz}} param0  
*/
const ReactFlowComponent = ({ self, quiz }) => {
  const { project, getNodes } = useReactFlow();
  const {ind} = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenuNode, setContextMenuNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  // const [activeConnection, setActiveConnection] = useState(null);


  /** @param {number} id */
  const deleteQuestion = (id)=>{
    quiz.questions = quiz.questions.filter( (question)=>question.tempId != id ) 
    putSelfInLocalStorage(self)
  }
  /** @param {number} id */
  const deleteChoice = (id)=>{
    quiz.questions.forEach( (question)=>{
      question.choices.filter( (choice)=>(choice.tempId != id) )
    })
  }

  // // Эффект для синхронизации с localStorage
  // useEffect(() => {
  //   const storedSelf = getSelfFromLocalStorage();
  //   if (storedSelf) {
  //     setSelf(storedSelf);
  //     setQuiz(storedSelf.quizzes[ind]);
  //   }
  // }, [ind]);

  //InitialNodes
  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = convertToFlowElements(self, quiz);
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [quiz.questions]);

  useEffect(() => {
    const selfOld = getSelfFromLocalStorage();
    const { restoreQuestions, graphEdgesJSON } = convertToQuizFormat(nodes, edges);
    const updatedQuiz = {
      ...quiz,
      questions: restoreQuestions,
      graphEdges: graphEdgesJSON,
      startEndNodesPositions: "{}",
      dateSaved: Date.now()
    };
    selfOld.quizzes[ind] = updatedQuiz;
    putSelfInLocalStorage(selfOld);
  }, [nodes, edges]);

  const handleNodesChange = (changes) => {   
    // Фильтруем изменения позиции
    const finishedPositionChanges = changes.filter(
      change => change.type === 'position' && !change.dragging // Обновляем только когда закончили перетаскивание
    );
    
    setNodes(nds => {
      let updatedNodes = applyNodeChanges(changes, nds);

      if (finishedPositionChanges.length > 0) {
          quiz.isInDB = false;
          updatedNodes = updatedNodes.map(node => {
              const wasMoved = finishedPositionChanges.some(c => c.id === node.id);
              if (!wasMoved) return node;

              if (node.type=="question") {
                node.data.question.position = node.position;
                return node;
              } else {
                node.data.choice.position = node.position;
                return node;
              }

          });
      }
      return updatedNodes;
    });
  };

  const onNodeMouseEnter = useCallback((e, node) => {
    // console.log("Enter");
    // добавить выделение/обводку/тень ноды
    // мб реализовать selected
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
  }, []);

  const onNodeDragStart = useCallback((e, node) => {
  }, []);

  const onNodeDrag = useCallback((event, node) => {
    if (node.type !== 'choice') return;

    const dropPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });
  }, [screenToFlowPosition]);

  const onNodeDragStop = useCallback((event, draggedNode) => {
    if (draggedNode.type !== 'choice') return;
    
    const dropPosition = screenToFlowPosition({ 
      x: event.clientX, 
      y: event.clientY 
    });

    // Находим ноду под курсором
    const targetNode = getNodes().find(node => {
      const nodeRect = {
        x: node.position.x,
        y: node.position.y,
        width: node.width || 0,
        height: node.height || 0
      };

      return (
        node.id !== draggedNode.id &&
        dropPosition.x >= nodeRect.x &&
        dropPosition.x <= nodeRect.x + nodeRect.width &&
        dropPosition.y >= nodeRect.y &&
        dropPosition.y <= nodeRect.y + nodeRect.height
      );
    });

    if (targetNode?.type === 'question') {
      const choicesInTarget = nodes.filter(n => 
        n.parentId === targetNode.id && 
        n.type === 'choice'
      );

      console.log("check", targetNode);
      
      if (choicesInTarget.length >= 4) {
        alert('Максимальное количество ответов в одном вопросе — 4');
        return;
      }

      const oldEdge = edges.filter(edge => 
        edge.source === draggedNode.parentId && 
        edge.target === draggedNode.id
      );

      if (oldEdge) {
        setEdges(eds => eds.filter(edge => edge.id !== oldEdge.id));
      }  

      setNodes(nds => nds.map(node => {
        if (node.id !== draggedNode.id) return node;
        
        // Обновляем позицию относительно родителя
        const newPosition = {
          x: dropPosition.x - targetNode.position.x,
          y: dropPosition.y - targetNode.position.y
        };

        return {
          ...node,
          position: newPosition,
          parentId: targetNode.id,
        };
      }));

      const newEdge = {
        id: `${targetNode}-${draggedNode.id}`,
        source: targetNode.id,
        target: draggedNode.id,
        type: "customEdge",
        condition: -1,
      };

      console.log("DROP", newEdge);

      setEdges((eds) => addEdge(newEdge, eds));
    } 
  }, [getNodes, project, setNodes, setEdges]);

  const handleAutoSave = useCallback(
    throttle(() => {
      try {
        const selfOld = getSelfFromLocalStorage();
        const { isOk } = http_put_quiz(selfOld, self.quizzes[ind], ()=>{})
        // console.log(self.quizzes[ind]);
        if(isOk){
          //self.quizzes[ind] = responceQuiz;
          //putSelfInLocalStorage(self)
        }
      } catch (error) {
        console.error('Ошибка сохранения:', error);
      }
    }, 5000),
    [ind, self, quiz.id]
  );

  // useEffect(() => {
  //   // Сохраняем при размонтировании компонента
  //   return () => handleAutoSave();
  // }, [handleAutoSave]);

  // useEffect(() => {
  //   handleAutoSave();
  // }, [nodes, edges, handleAutoSave]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');

    if (!type) { return; }

    const position = screenToFlowPosition({ 
      x: event.clientX, 
      y: event.clientY 
    });
    const id = generateNodeId();
    let newNode;

    if (type == "question"){
      /** @type {Question} */
      let newQuestion = {id: null, tempId: id, title:"new", position, choices:[]}
      quiz.questions.push(newQuestion)
      newNode = { id, type, position, data: { question: newQuestion, self } };
    } else if (type == "choice") {
      /** @type {Choice} */
      let newChoice = {id: null, tempId: id, title:"new", position, value:0}
      newNode = { id, type, position, data: { choice: newChoice, self } };
    }
    putSelfInLocalStorage(self)
    setNodes((nds) => nds.concat(newNode));
  }, [screenToFlowPosition] );    //setNodes

  const onConnect = useCallback(
    (connection) => {
      // const nodes = getNodes();
      // const sourceNode = nodes.find((n) => n.id === connection.source);
      // const targetNode = nodes.find((n) => n.id === connection.target);

      // let condition = -1;
      // if (sourceNode?.type === 'question' && targetNode?.type === 'question') {
      //   const userInput = prompt('Введите условие перехода (число):', '0');
      //   condition = parseInt(userInput) || 0;
      // }

      const newEdge = {
        ...connection,
        type: 'customEdge',
        animated: true,
        // id: `edge-${connection.source}-${connection.target}-${Date.now()}`, //!!!!!!!!!!!!
        //   markerEnd: {
        //     type:MarkerType.ArrowClosed,
        //     width:20,
        //     height:20,
        //     // color
        //   }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault();
    setContextMenuNode(node);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

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
          onDragOver={onDragOver}
          
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onNodeDrag={onNodeDrag}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}

          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeContextMenu={onNodeContextMenu}
          style={rfStyle}
          fitView
          panOnScroll
          selectionOnDrag
          panOnDrag={panOnDrag}
          selectionMode={SelectionMode.Partial}
        >
          <PanelControls quiz={quiz} ind={ind} />
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
                '&:hover': { background: '#f5f5f5' }
              }}
              onClick={() => {
                contextMenuNode.type === 'question' 
                  ? deleteQuestion(contextMenuNode.id) 
                  : deleteChoice(contextMenuNode.id)
              }}
            >
              Удалить {contextMenuNode.type === 'question' ? 'вопрос' : 'ответ'}
            </div>
          </div>
        )}
        {/* {activeConnection && (
          <svg style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}>
            <line
              x1={activeConnection.x}
              y1={activeConnection.y}
              x2={activeConnection.targetX}
              y2={activeConnection.targetY}
              stroke="#ff0000"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </svg>
        )} */}
      </div>
    </div>
  );
};

export default ReactFlowComponent;