import React, { useCallback, useState, useRef, useMemo, useEffect  } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  useReactFlow,
  MiniMap, ControlButton, SelectionMode, applyEdgeChanges, applyNodeChanges, ReactFlowProvider, BaseEdge, Panel, reconnectEdge, MarkerType
} from '@xyflow/react';
import { useParams } from 'react-router-dom';
import { debounce, throttle, isEqual } from 'lodash';

import "./styles.scss";

import '@xyflow/react/dist/base.css';
import './styles.scss';

import { PanelControls } from './PanelControls';
import QuestionNode from './QuestionNode';
import ChoiceNode from './ChoiceNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import Sidebar from './Sidebar';
import CustomEdge from './CustomEdge';
// import { convertToFlowElements } from './functionsEditor';

import { downloadJson, getSelfFromLocalStorage, putSelfInLocalStorage} from "../../functions.mjs"
import { http_post_quiz, http_put_quiz } from "../../HTTP_requests.mjs"

const rfStyle = {
  //backgroundColor: '#D0C0F7',
};

// Компонент конечной ноды
// const EndNode = () => (
//   <div className="end">
//     <div className="content">🏁 Конец викторины</div>
//     <Handle type="target" position={Position.Top} />
//   </div>
// );

const nodeColor = (node) => {
  switch (node.type) {
    case 'start': return '#ff9900';
    case 'end': return '#ff0000';
    case 'question': return '#6ede87';
    case 'choice': return '#6865A5';
    default: return '#ff0072';
  }
};

const nodeTypes = {
  question: QuestionNode,
  choice: ChoiceNode,
  start: StartNode,
  end: EndNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

const panOnDrag = [1, 2];
const SAFE_ZONE_RADIUS = 100; 
const MAX_CHOICES_PER_QUESTION = 4; // Выносим в константу

const checkMaxChoices = (count) => {
  if (count >= MAX_CHOICES_PER_QUESTION) {
    alert(`Максимальное количество ответов в одном вопросе — ${MAX_CHOICES_PER_QUESTION}`);
    return true;
  }
  return false;
};

const getRelativePosition = (childNode, parentNode) => ({
  x: childNode.position.x - parentNode.position.x,
  y: childNode.position.y - parentNode.position.y
});

const parseGraphEdges = (edgesString) => {
  try {
    return edgesString ? JSON.parse(edgesString) : [];
  } catch (e) {
    console.error('Error parsing graph edges:', e);
    return [];
  }
};

const serializeGraphEdges = (edges) => JSON.stringify(edges || []);

const filterEdges = (edgesString, predicate) => {
  const edges = parseGraphEdges(edgesString);
  return serializeGraphEdges(edges.filter(predicate));
};

const generateNodeId = () => 
  // crypto.randomUUID();
  `${Date.now() * 10000 + Math.floor(Math.random() * 10000)}`;

const convertToFlowElements = (quiz, ind) => {
  const initialNodes = [];
  const edges = [];
  const tempIdMap = new Map();

  let startEndData = { start: null, ends: [] };
  try {
    startEndData = JSON.parse(quiz.startEndNodesPositions || '{}');
  } catch (e) {
    console.error('Error parsing startEndNodesPositions:', e);
  }

  // console.log("SSS", startEndData);

  // Добавляем стартовую ноду
  const startNode = {
    id: startEndData.start?.id ?? generateNodeId(),
    type: 'start',
    position: startEndData.start?.position || { x: 0, y: 0},
    // data: startEndData.start?.data
  }; 

  initialNodes.push(startNode);
  tempIdMap.set(startNode.id, startNode.id);

  // Добавляем конечные ноды
  startEndData.ends?.forEach(end => {
    const endNode = {
      id: end.id ?? generateNodeId(),
      type: 'end',
      position: end.position || { x: 0, y: 100},
      // data: end.data
    };
    initialNodes.push(endNode);
    tempIdMap.set(endNode.id, endNode.id);
  });

  // QuestionNode component params
  quiz.questions?.forEach((question) => {
    const questionNodeId = question.tempId ?? generateNodeId();

    if(question.tempId) {
      tempIdMap.set(question.tempId, questionNodeId);
    }

    initialNodes.push({
      id: questionNodeId,
      type: 'question',
      data: { 
        question: {
          ...question,
          tempId: questionNodeId
        },
      },
      position: question.position || { x: 0, y: 0 },
    });

    // ChoiceNode component params
    question.choices?.forEach((choice, index) => {
      const choiceNodeId = choice.tempId ?? generateNodeId();

      if(choice.tempId) {
        tempIdMap.set(choice.tempId, choiceNodeId);
      }

      initialNodes.push({
        id: choiceNodeId,
        type: 'choice',
        data: { 
          choice: {
            ...choice,
            tempId: choiceNodeId
          }, 
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
    const parsedEdges = JSON.parse(quiz.graphEdges || '[]');
    console.log("parsedEdges", parsedEdges);
    parsedEdges.forEach(edge => {
      console.log("PPPPPPPPPPP", edge);
      if (edge.condition !== -1) {
        const sourceId = tempIdMap.get(edge.source) //|| edge.source;
        const targetId = tempIdMap.get(edge.target) //|| edge.target;

        edges.push({
          id: `conn-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          data: { condition: edge.condition },
          type: 'customEdge',
          animated: true,
          // markerEnd: {
          //   type: MarkerType.ArrowClosed,
          //   width: 20,
          //   height: 20,
          // }
        });

        console.log("CHECK edges", edges);
      }
    });
  } catch (e) {
    console.error('Error parsing graph edges:', e);
  }

  const initialNodeIds = new Set(initialNodes.map(n => n.id));
  const orphans = JSON.parse(localStorage.getItem(`quiz_orphans_${ind}`) || '[]');
  const filteredOrphans = orphans.filter(node => !initialNodeIds.has(node.id));
  const nodes = initialNodes.concat( filteredOrphans );

  return { nodes, edges };
};

const convertToQuizFormat = (nodes, edges) => {
  const startNode = nodes.find(n => n.type === 'start');
  const endNodes = nodes.filter(n => n.type === 'end');

  const startEndData = {
    start: startNode ? {
      id: startNode.id,
      position: startNode.position,
      // data: startNode.data
    } : null,
    ends: endNodes.map(endNode => ({
      id: endNode.id,
      position: endNode.position,
      // data: endNode.data
    }))
  };

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

  console.log("xxxx", edges);

  const graphEdges = edges
    .filter((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source);
      const targetNode = nodes.find((n) => n.id === e.target);
      return (
        // sourceNode?.type === 'choice' &&
        // targetNode?.type === 'question' &&
        e.data?.condition !== -1
      );
    })
    .map((e) => ({
      source: e.source,
      target: e.target,
      condition: e.data?.condition || 0,
    }));

    const graphEdgesJSON = JSON.stringify(graphEdges);
  
  return {
    // title: "quiz",
    restoreQuestions,
    graphEdgesJSON,
    startEndNodesPositions: JSON.stringify(startEndData)
  };
};

const NODE_DELETE_HANDLERS = {
  question: (id, { onQuizChange }) => {
    onQuizChange(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.tempId !== id),
      graphEdges: filterEdges(prev.graphEdges, 
        edge => edge.source !== id && edge.target !== id
      )
    }));
  },
  
  choice: (id, { onQuizChange, setNodes }) => {
    setNodes(prev => prev.filter(node => node.id !== id));
    onQuizChange(prev => ({
      ...prev,
      questions: prev.questions.map(q => ({
        ...q,
        choices: q.choices.filter(c => c.tempId !== id)
      })),
      graphEdges: filterEdges(prev.graphEdges, edge => edge.source !== id)
    }));
  },

  end: (id, { onQuizChange }) => {
    onQuizChange(prev => {
      const currentData = JSON.parse(prev.startEndNodesPositions || '{}');
      return {
        ...prev,
        startEndNodesPositions: JSON.stringify({
          ...currentData,
          ends: (currentData.ends || []).filter(end => end.id !== id)
        }),
        graphEdges: filterEdges(prev.graphEdges, edge => edge.target !== id)
      };
    });
  }
};

// const getFlowLocalStorage = () => {
//   const savedData = localStorage.getItem(`reactFlowData`);
//   const { nodes, edges } = JSON.parse(savedData);
//   return { nodes, edges };
// }


/** 
 * @param {{self:User,quiz:Quiz}} param0  
*/
const ReactFlowComponent = ({ self, quiz, onQuizChange }) => {
  const {ind} = useParams();
  // const { nodes: initialNodes, edges: initialEdges } = convertToFlowElements(quiz, ind);
  // const { nodes: initialNodes, edges: initialEdges } = getFlowLocalStorage();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenuNode, setContextMenuNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  const { screenToFlowPosition, getNodes, getEdges, addNodes, addEdges } = useReactFlow();
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const orphans = useMemo(() => 
    nodes.filter(node => 
      node.type === 'choice' && !node.parentId
    ), 
  [nodes]);
  // const [activeConnection, setActiveConnection] = useState(null);

  // Мемоизированные ноды с подсветкой
  const highlightedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: hoveredQuestionId 
          ? (node.id === hoveredQuestionId || node.parentId === hoveredQuestionId)
          : false
      }
    }));
  }, [nodes, hoveredQuestionId]);

  // Мемоизированные edges с подсветкой
  const highlightedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: hoveredQuestionId 
          ? (edge.source === hoveredQuestionId || edge.target === hoveredQuestionId)
          : false
      }
    }));
  }, [edges, hoveredQuestionId]);

  const saveChanges = useCallback(() => {
    const { restoreQuestions, graphEdgesJSON, startEndNodesPositions } = convertToQuizFormat(getNodes(), getEdges());

    console.log("FFFFFFFFFFFFFFFFFFFFF", graphEdgesJSON);

    const newQuiz = {
      ...quiz,
      questions: restoreQuestions,
      graphEdges: graphEdgesJSON,
      startEndNodesPositions,
      dateSaved: Date.now()
    };

    console.log("SAVE", newQuiz);

    onQuizChange(newQuiz);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      // console.log("orphans"); //дважды сохраняет
      localStorage.setItem(`quiz_orphans_${ind}`, JSON.stringify(orphans)); 
    } 
  }, [orphans, isDragging]);

  useEffect(() => {
    // console.log("Local");
    const selfOld = getSelfFromLocalStorage();
    selfOld.quizzes[ind] = quiz;
    putSelfInLocalStorage(selfOld);

    // const flowData = {
    //   nodes: getNodes(),
    //   edges: getEdges(),
    // };
    
    // localStorage.setItem(`reactFlowData`, JSON.stringify(flowData));
  }, [quiz]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertToFlowElements(quiz, ind);
    setNodes(newNodes);
    setEdges(newEdges);
    console.log("quiz", quiz);
  }, [quiz]);

  const handleNodesChange = useCallback((changes) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onNodeMouseEnter = useCallback((e, node) => {
    setHoveredQuestionId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback((e, node) => {
    setHoveredQuestionId(null);
  }, []);

  const onNodeDragStart = useCallback((event) => {
    setIsDragging(true);
  }, []);

  const onNodeDrag = useCallback((event, node) => {
  }, []);

  const onNodeDragStop = useCallback((event, draggedNode) => { 
    setIsDragging(false);

    if (draggedNode.parentId !== null) saveChanges(); 

    if (draggedNode.type !== 'choice' || !screenToFlowPosition || !onQuizChange) return;
    
    const dropPosition = screenToFlowPosition({ 
      x: event.clientX, 
      y: event.clientY 
    });

    // Находим ноду под курсором
    const nodes = getNodes();
    let targetNode = null;

    // Ищем целевую ноду и сразу считаем ответы
    for (const node of nodes) {
      // Проверяем только вопросы
      if (node.type === 'question' && node.id !== draggedNode.parentId) {
        // Проверка попадания курсора в ноду
        const nodeRect = {
          x: node.position.x,
          y: node.position.y,
          width: node.measured?.width,
          height: node.measured?.height
        };
        
        const isCursorInside = 
          dropPosition.x >= nodeRect.x &&
          dropPosition.x <= nodeRect.x + nodeRect.width &&
          dropPosition.y >= nodeRect.y &&
          dropPosition.y <= nodeRect.y + nodeRect.height;

        if (isCursorInside) {
          targetNode = node;
          break;
        }
      }
    }

    if (!targetNode) return;

    const choicesCount = targetNode.data?.question?.choices?.length;
    
    if (checkMaxChoices(choicesCount)) return;

    const originalParent = draggedNode.parentId 
      ? nodes.find(n => n.id === draggedNode.parentId) 
      : null;

    const absolutePosition = {
      x: originalParent 
        ? draggedNode.position.x + originalParent.position.x 
        : draggedNode.position.x,
      y: originalParent 
        ? draggedNode.position.y + originalParent.position.y 
        : draggedNode.position.y
    };

    // Calculate new relative position for target parent
    const newRelativePosition = {
      x: absolutePosition.x - targetNode.position.x,
      y: absolutePosition.y - targetNode.position.y
    };

    onQuizChange(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
          const isTargetQuestion = q.tempId === targetNode.data?.question?.tempId;
          const filteredChoices = q.choices.filter(c => c.tempId !== draggedNode.id);

          if (q.tempId === originalParent?.data?.question?.tempId) {
            return {
                ...q,
                choices: q.choices.filter(c => c.tempId !== draggedNode.id)
            };
          }
          
          return isTargetQuestion ? {
              ...q,
              choices: [
                ...filteredChoices, 
                {
                  ...draggedNode.data.choice,
                  tempId: draggedNode.id,
                  position: newRelativePosition
              }]
          } : q;
      })
    })); 
  }, [onQuizChange, screenToFlowPosition]);

  ////////////////////////

  const handleAutoSave = useCallback(
    throttle(() => {
      try {
        const selfOld = getSelfFromLocalStorage();
        self.quizzes[ind] = quiz;
        const { quiz: responceQuiz, isOk } = http_put_quiz(selfOld, self.quizzes[ind], ()=>{})
        if(isOk){
          self.quizzes[ind] = responceQuiz;
          putSelfInLocalStorage(self)
        }
      } catch (error) {
        console.error('Ошибка сохранения:', error);
      }
    }, 5000),
    [ind, self, quiz.id]
  );

  useEffect(() => {
    const handleSave = () => {
      console.log("qweertyBD");
      // saveChanges();
      handleAutoSave();
    };
    
    const debouncedSave = debounce(handleSave, 5000);
    debouncedSave();
    
    return () => debouncedSave.cancel();
  }, [nodes, edges, handleAutoSave, saveChanges]);

  ///////////////////////////

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
      newNode = { id, type, position, data: { question: newQuestion } };
      onQuizChange(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));  
    } else if (type == "choice") {
      /** @type {Choice} */
      let newChoice = {id: null, tempId: id, title:"new temp", position, value:0}
      newNode = { id, type, position, parentId: null, data: { choice: newChoice } };
      setNodes((nds) => nds.concat(newNode));
    } else if (type === "end") {
    // Создаем конечную ноду
      newNode = { id, type, position, data: {} };
      onQuizChange(prev => {
        const currentData = JSON.parse(prev.startEndNodesPositions || '{}');
        return {
          ...prev,
          startEndNodesPositions: JSON.stringify({
            ...currentData,
            ends: [...(currentData.ends || []), newNode]
          })
        };
      });
    }
  }, [screenToFlowPosition] );

  const onConnect = useCallback(
    (connection) => {
      const { sourceNode, targetNode } = getNodes().reduce((acc, node) => {
        if (node.id === connection.source) acc.sourceNode = node;
        if (node.id === connection.target) acc.targetNode = node;
        return acc;
      }, { sourceNode: null, targetNode: null });

      console.log("QQQQQQQ", quiz);

      const forbiddenConnections = [
        ['start', 'end'],
        ['start', 'choice'],
        ['question', 'question'],
        ['choice', 'choice']
      ];

      const checkConnect = forbiddenConnections.some(([a, b]) => sourceNode.type === a && targetNode.type === b);
    
      if (checkConnect) {
        alert('Недопустимое соединение');
        return;
      }    

      let condition = 0;
      let isInternal = false;
      let conn = true;
      const quizUpdates = {
        questions: [...quiz.questions],
        graphEdges: JSON.parse(quiz.graphEdges) ?? []
      };

      console.log("CONNECT", quizUpdates.graphEdges);

      // Случай 1: start -> question
      if (sourceNode.type === 'start' && targetNode.type === 'question') {
        // Проверка на существующие соединения из старта
        const existingStartEdges = getEdges().filter(e => e.source === sourceNode.id);
        if (existingStartEdges.length > 0) {
          alert('Стартовая нода может быть соединена только с одним вопросом');
          return;
        }
      }

      // Случай 2: question -> choice (автоматическое соединение)
      if (sourceNode?.type === 'question' && targetNode?.type === 'choice') {
        condition = -1;
        conn = false;

        const choicesCount = sourceNode.data.question.choices.length;
        
        if (checkMaxChoices(choicesCount)) return;  

        // targetNode.data.choice.position -= sourceNode.data.question.position;
        quizUpdates.questions = quiz.questions.map(question => 
          question.tempId === sourceNode.id ? {
            ...question,
            choices: [
              ...question.choices,
              {
                ...targetNode.data.choice,
                tempId: targetNode.id,
                position: {
                  x: targetNode.position.x - sourceNode.position.x,
                  y: targetNode.position.y - sourceNode.position.y
                }
              }
            ]
          } : question
        );  
      }

      // Случай 3: choice -> question
      if (sourceNode?.type === 'choice' && targetNode?.type === 'question') {
        isInternal = sourceNode.parentId === targetNode.id;
        if (isInternal) {
          condition = edges.find(e => e.source === sourceId && e.target === targetId)?.data?.condition || 0;
          console.log("condition", condition);
        }  
      }

      // Случай 4: Обработка question -> end
      if (sourceNode.type === 'question' && targetNode.type === 'end') {
        condition = 0;
      }

      const newEdge = {
        ...connection,
        type: 'customEdge',
        animated: conn,
        id: (conn? 'conn' : 'auto') + `-${sourceNode.id}-${targetNode.id}`,
        condition,
        // markerEnd: {
        //   type: MarkerType.ArrowClosed,
        //   width: 20,
        //   height: 20,
        // }  
      };

      if (condition !== -1) {
        console.log("EEEEE", newEdge);
        quizUpdates.graphEdges = [
          ...quizUpdates.graphEdges,
          newEdge
        ];
      }

      setEdges((eds) => addEdge(newEdge, eds));

      console.log("!!!!!!!!!!!!!!! quiz", quiz.graphEdges, condition);

      onQuizChange(prevQuiz => ({
        ...prevQuiz,
        questions: quizUpdates.questions,
        graphEdges: JSON.stringify(quizUpdates.graphEdges) 
      }));
    },
    [quiz, onQuizChange, checkMaxChoices]
  );

  const onReconnect = useCallback(
    (oldEdge, newConnection) =>
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
    [],
  );
  

  const reconnectEdge = (oldEdge, newConnection, edges) => {
    // Фильтруем старый edge из списка
    const updatedEdges = edges.filter(edge => edge.id !== oldEdge.id);
    
    // Создаем новое соединение с обновленными source/target
    const newEdge = {
      ...oldEdge,
      source: newConnection.source,
      target: newConnection.target,
      id: `conn-${newConnection.source}-${newConnection.target}-${Date.now()}`
    };
  
    return [...updatedEdges, newEdge];
  };

  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault();
    setContextMenuNode(node);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  //delete
  const handleContextMenuAction = useCallback(() => {
    if (!contextMenuNode) return;

    const handler = NODE_DELETE_HANDLERS[contextMenuNode.type];
    if (handler) {
      handler(contextMenuNode.id, { onQuizChange, setNodes });
    }
    
    setContextMenuNode(null);
  }, [contextMenuNode, onQuizChange, setNodes]);


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
        {/* <ReactFlowProvider> */}
          <ReactFlow
            nodes={highlightedNodes}
            edges={highlightedEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onNodeDrag={onNodeDrag}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}

            onMove={() => setContextMenuNode(null)}

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
            <MiniMap 
              nodeColor={nodeColor} 
              nodeStrokeWidth={3} 
              nodeBorderRadius="16"
              // bgColor=""
              // maskColor=""
              zoomable 
              pannable
            />
          </ReactFlow>
        {/* </ReactFlowProvider> */}

        {contextMenuNode && contextMenuNode.type !== 'start' && (
          <div
            ref={contextMenuRef}
            style={{
              position: 'fixed',
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              background: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              borderRadius: '8px',
              zIndex: 1000
            }}
          >
            <div
              style={{ 
                padding: '8px 16px',
                cursor: 'pointer',
                '&:hover': { background: '#f5f5f5' }
              }}
              onClick={handleContextMenuAction}
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