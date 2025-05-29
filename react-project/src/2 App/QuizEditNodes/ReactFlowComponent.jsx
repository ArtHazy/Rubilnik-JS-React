import React, { useCallback, useState, useRef, useMemo, useEffect  } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  useReactFlow,
  getBezierPath,
  MiniMap, ControlButton, SelectionMode, applyEdgeChanges, applyNodeChanges, ReactFlowProvider, BaseEdge, Panel, reconnectEdge, MarkerType, getConnectedEdges
} from '@xyflow/react';
import { useParams } from 'react-router-dom';
import { debounce, throttle, cloneDeep } from 'lodash';

import "./styles.scss";
import '@xyflow/react/dist/base.css';

import { PanelControls } from './PanelControls';
import QuestionNode from './QuestionNode';
import ChoiceNode from './ChoiceNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import Sidebar from './Sidebar';
import CustomEdge from './CustomEdge';
// import { convertToFlowElements } from './functionsEditor';
import { checkGraphValidity } from './compiler';
import './ReactFlowComponent.scss';

import { downloadJson, getSelfFromLocalStorage, putSelfInLocalStorage} from "../../functions.mjs"
import { http_post_quiz, http_put_quiz } from "../../HTTP_requests.mjs"

const rfStyle = {
  //backgroundColor: '#D0C0F7',
};

const nodeColor = (node) => {
  switch (node.type) {
    case 'start': return '#709B95';
    case 'end': return '#EF5350';
    case 'question': return '#898176';
    case 'choice': return '#B0B0B0';
    default: return '#B83B5E';
  }
};

const nodeTypes = {
  question: (props) => <QuestionNode {...props} onUpdate={props.data?.onUpdate} />,
  choice: (props) => <ChoiceNode {...props} onUpdate={props.data?.onUpdate} />,
  start: StartNode,
  end: EndNode,
};

const initialEdgeTypes = {
  customEdge: CustomEdge,
};

const panOnDrag = [1, 2];
const SAFE_ZONE_RADIUS = 100; 
const MAX_CHOICES_PER_QUESTION = 4;

const checkMaxChoices = (count) => {
  if (count >= MAX_CHOICES_PER_QUESTION) {
    alert(`Максимальное количество ответов в одном вопросе — ${MAX_CHOICES_PER_QUESTION}`);
    return true;
  }
  return false;
};

const getSourceTargetPosition = (node, source = false) => ({
  x: (node?.position?.x || 0) + (node?.measured?.width || 0) / 2,
  y: (node?.position?.y || 0) + (source ? node?.measured?.height || 0 : 0)
});

// const getSourceTargetPosition = (node, getNode, source = false) => {
//   // Вычисляем абсолютную позицию с учетом всех родителей
//   let globalX = 0;
//   let globalY = 0;
//   let current = node;
  
//   while (current) {
//       globalX += current.position?.x || 0;
//       globalY += current.position?.y || 0;
//       current = current.parentId ? getNode(current.parentId) : null;
//   }

//   // Вычисляем координаты точки соединения
//   return {
//       x: globalX + (node?.measured?.width || 0) / 2,
//       y: globalY + (source ? (node?.measured?.height || 0) : 0)
//   };
// };

const getDetectionArea = (node) => ({
  x: node.position.x - SAFE_ZONE_RADIUS,
  y: node.position.y - SAFE_ZONE_RADIUS,
  width: (node.measured?.width || 0) + SAFE_ZONE_RADIUS * 2,
  height: (node.measured?.height || 0) + SAFE_ZONE_RADIUS * 2
});

const getValidSourceNode = (targetPosition, targetNode, nodes) => {
  const forbiddenConnections = [
    ['start', 'end'],
    ['start', 'choice'],
    ['question', 'question'],
    ['choice', 'choice']
  ];

  const sourceNode = nodes.find(node => {
    if (
      node.id === targetNode.id ||         // Нельзя к себе
      node.id === targetNode.parentId       // Нельзя к родителю
    ) return false;

    if (targetNode.type === 'choice' && targetNode.parentId) {
      // const originalParent = targetNode.parentId 
      //   ? nodes.find(n => n.id === targetNode.parentId) 
      //   : null;

      // const absolutePosition = {
      //   x: originalParent 
      //     ? targetNode.position.x + originalParent.position.x 
      //     : targetNode.position.x,
      //   y: originalParent 
      //     ? targetNode.position.y + originalParent.position.y 
      //     : targetNode.position.y
      // };
      // // Calculate new relative position for target parent
      // const newRelativePosition = {
      //   x: absolutePosition.x - targetNode.position.x,
      //   y: absolutePosition.y - targetNode.position.y
      // };

      // console.log("!", targetNode.position);
      // targetPosition = absolutePosition      
      // console.log(targetNode.position);
    }

    const area = getDetectionArea(node);
    return (
      targetPosition.x >= area.x &&
      targetPosition.x <= area.x + area.width &&
      targetPosition.y >= area.y &&
      targetPosition.y <= area.y + area.height
    )? node : null;
  });

  const isForbidden = forbiddenConnections.some(
    ([srcType, tgtType]) => 
      sourceNode?.type === srcType && targetNode.type === tgtType &&
      sourceNode?.type === tgtType && targetNode.type === srcType
  );

  if (!sourceNode || isForbidden) return null;

  // Проверка на максимальное кол-во ответов
  if (sourceNode.type === 'question' && targetNode.type === 'choice') {
    const choicesCount = sourceNode.data?.question?.choices?.length || 0;
    return checkMaxChoices(choicesCount) ? null : sourceNode;
  }
  if (sourceNode.type === 'choice' && targetNode.type === 'question') {
    
  }
  
  return sourceNode;
};

const parseGraphEdges = (edgesString) => {
  try {
    const edges = edgesString ? JSON.parse(edgesString) : [];
    // Генерируем id, если его нет
    return edges
      .filter(
        e => e.source != null && 
        e.target != null && 
        e.id !== 'temp-edge')
      .map(e => ({
        id: e.id ?? `edge-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        condition: e.condition || 0,
      }));
  } catch (e) {
      console.error('Error parsing graph edges:', e);
      return [];
  }
};


const serializeGraphEdges = edges => JSON.stringify(
  (edges || [])
    .filter(
      e => e.source != null && 
      e.target != null && 
      e.id !== 'temp-edge')
    .map(({ id, source, target, condition }) => ({
      id: id ?? `edge-${source}-${target}`,
      source: source,
      target: target,
      condition: condition || 0,
    }))
);

const filterEdges = (edgesString, predicate) => {
  const edges = parseGraphEdges(edgesString);
  return serializeGraphEdges(edges.filter(predicate));
};

const generateNodeId = () => 
  `${Date.now() * 10000 + Math.floor(Math.random() * 10000)}`;

export const convertToFlowElements = (quiz, onQuizChange, ind) => {
  console.log("convertToFlowElements");
  const initialNodes = [];
  const edges = [];
  const tempIdMap = new Map();

  let startEndData = { start: null, ends: [] };
  try {
    startEndData = JSON.parse(quiz.startEndNodesPositions || '{}');
  } catch (e) {
    console.error('Error parsing startEndNodesPositions:', e);
  }

  // Добавляем стартовую ноду
  const startNode = {
    id: startEndData.start?.id ?? `START_NODE_${ind}`,
    type: 'start',
    position: startEndData.start?.position || { x: 0, y: 0},
    deletable: false,
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
        onUpdate: (updatedQuestion) => {
          onQuizChange(prev => ({
            ...prev,
            questions: prev.questions.map(q => 
              q.tempId === questionNodeId ? {...q, ...updatedQuestion} : q
            )
          }));
        }    
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
          onUpdate: (updatedChoice) => {
            onQuizChange(prev => ({
              ...prev,
              questions: prev.questions.map(q => ({
                ...q,
                choices: q.choices.map(c => 
                  c.tempId === choiceNodeId ? {...c, ...updatedChoice} : c
                )
              }))
            }));
          }
        },
        position: choice.position || {x: 0, y: (index + 1) * 100},
        parentId: questionNodeId,
      });

      edges.push({
        id: `auto-${questionNodeId}-${choiceNodeId}`,
        source: questionNodeId,
        target: choiceNodeId,
        condition: -1,
        type: 'customEdge',
        animated: false,
      });
    });
  });

  try {
    const parsedEdges = parseGraphEdges(quiz.graphEdges);
    parsedEdges.forEach(edge => {
      if (edge.condition !== -1) {
        const sourceId = tempIdMap.get(edge.source) //|| edge.source;
        const targetId = tempIdMap.get(edge.target) //|| edge.target;

        if (sourceId || targetId) {
          edges.push({
            id: `conn-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            condition: edge.condition,
            type: 'customEdge',
            animated: true,
            // markerEnd: {
            //   type: MarkerType.ArrowClosed,
            //   width: 20,
            //   height: 20,
            // }
          });
        }
      }
    });
  } catch (e) {
    console.error('Error parsing graph edges:', e);
  }

  const initialNodeIds = new Set(initialNodes.map(n => n.id));
  const orphans = JSON.parse(localStorage.getItem(`quiz_orphans_${ind}`) || '[]');
  const filteredOrphans = orphans.filter(node => !initialNodeIds.has(node.id));
  const nodes = initialNodes.concat( filteredOrphans );

  // //EDIT STARTEDGE
  // const startEdgeIndex = edges.findIndex(edge => edge.source === startNode.id);
  // if (startEdgeIndex) {
  //   const [startEdge] = edges.splice(startEdgeIndex, 1);
  //   edges.unshift(startEdge);
  // }

  return { nodes, edges };
};

const convertToQuizFormat = (nodes, edges) => {
  console.log("convertToQuizFormat");
  const startNode = nodes.find(n => n.type === 'start');
  const endNodes = nodes.filter(n => n.type === 'end');

  const startEndData = {
    start: startNode ? {
      id: startNode.id,
      position: startNode.position,
      deletable: false,
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

  const graphEdges = edges
    .filter((e) => e.condition !== -1)
    .map((e) => ({
      id: e.id ?? `conn-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      condition: e.condition || 0,
    }));
  
  return {
    // title: "quiz",
    restoreQuestions,
    graphEdgesJSON: serializeGraphEdges(graphEdges),
    startEndNodesPositions: JSON.stringify(startEndData)
  };
};

const NODE_DELETE_HANDLERS = {
  question: (id, { onQuizChange }) => {
    onQuizChange(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.tempId !== id),
      graphEdges: filterEdges(prev.graphEdges, edge => edge.source !== id && edge.target !== id)
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

function updateQuizIds(responceQuiz, quiz) {
  // Создаем глубокую копию, чтобы избежать мутации исходного объекта
  const updatedResponceQuiz = JSON.parse(JSON.stringify(responceQuiz));

  // Обновляем вопросы
  updatedResponceQuiz.questions = quiz.questions.map(question => {
      // Ищем вопрос в quiz с таким же tempId
      const matchingQuizQuestion = responceQuiz.questions.find(q => q.tempId === question.tempId);
      if (matchingQuizQuestion) {
          // Обновляем id вопроса
          const updatedQuestion = { ...question, id: matchingQuizQuestion.id };

          // Обновляем варианты выбора внутри вопроса
          updatedQuestion.choices = question.choices.map(respChoice => {
              const matchingQuizChoice = matchingQuizQuestion.choices.find(c => c.tempId === respChoice.tempId);
              return matchingQuizChoice 
                  ? { ...respChoice, id: matchingQuizChoice.id } 
                  : respChoice;
          });

          return updatedQuestion;
      }
      return question;
  });

  return updatedResponceQuiz;
}

const handleEdgeRemoval = (deletedEdges, currentNodes, currentEdges, questions) => {
  // 1. Собираем информацию об отвязываемых выборах
  const choicesWithParent = [];
  const choiceIdsToUnlink = new Set();

  deletedEdges.forEach(edge => {
    const targetNode = currentNodes.find(n => n.id === edge.target);
    if (targetNode?.type === 'choice' && targetNode.parentId) {
      const parentNode = currentNodes.find(n => n.id === targetNode.parentId);
      if (parentNode) {
        choicesWithParent.push({
          choiceNode: targetNode,
          parentNode: parentNode
        });
        choiceIdsToUnlink.add(targetNode.id);
      }
    }
  });

  // 2. Обновляем узлы (выносим выборы из вопросов)
  const updatedNodes = currentNodes.map(node => {
    const choiceData = choicesWithParent.find(c => c.choiceNode.id === node.id);
    return choiceData ? {
      ...node,
      parentId: null,
      position: {
        x: choiceData.choiceNode.position.x + choiceData.parentNode.position.x,
        y: choiceData.choiceNode.position.y + choiceData.parentNode.position.y
      }
    } : node;
  });

  // 3. Удаляем выборы из вопросов
  const updatedQuestions = questions.map(question => ({
    ...question,
    choices: question.choices.filter(choice => !choiceIdsToUnlink.has(choice.tempId))
  }));

  // 4. Фильтруем рёбра (удаляем связанные с отвязанными выборами)
  const updatedEdges = currentEdges.filter(edge => {
    const isDeleted = deletedEdges.some(de => de.id === edge.id);
    const isConnectedToUnlinked = choiceIdsToUnlink.has(edge.source) || choiceIdsToUnlink.has(edge.target);
    return !isDeleted && !isConnectedToUnlinked;
  });

  return { updatedNodes, updatedQuestions, updatedEdges };
};

/** 
 * @param {{self:User,quiz:Quiz}} param0  
*/
const ReactFlowComponent = ({ self, quiz, onQuizChange }) => {
  const {ind} = useParams();
  const [initialElements] = useState(() => {
    return convertToFlowElements(quiz, onQuizChange, ind);
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);
  const [contextMenu, setContextMenu] = useState(null);
  const { screenToFlowPosition, getNodes, getEdges, addNodes, addEdges, getNode, updateNode } = useReactFlow();
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const orphans = useMemo(() => 
    nodes.filter(node => 
      node.type === 'choice' && !node.parentId
    ), 
  [nodes]);

  const [activeDragConnection, setActiveDragConnection] = useState(null);
  const [tempEdge, setTempEdge] = useState(null);

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

    const newQuiz = {
      ...quiz,
      questions: restoreQuestions,
      graphEdges: graphEdgesJSON,
      startEndNodesPositions,
      dateSaved: Date.now()
    };

    // console.log("SAVE", newQuiz);

    onQuizChange(newQuiz);
  }, []);

  useEffect(() => {
    console.log("START START START", quiz.startEndNodesPositions);
    if (!quiz.startEndNodesPositions) {
      const newStartNode = {
        id: `START_NODE_${ind}`,
        type: 'start',
        position: { x: 0, y: 0 },
        deletable: false,
      };

      onQuizChange(prev => ({
        ...prev,
        startEndNodesPositions: JSON.stringify({
          start: newStartNode,
          ends: []
        })
      }));
    }
  }, []);

  useEffect(() => {
    if (!isDragging) {
      // console.log("orphans 2", orphans); //дважды сохраняет
      localStorage.setItem(`quiz_orphans_${ind}`, JSON.stringify(orphans)); 
    } 
  }, [orphans, isDragging]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertToFlowElements(quiz, onQuizChange, ind);
    setNodes(newNodes);
    setEdges(newEdges);

    console.log("quiz", quiz);

    const selfOld = getSelfFromLocalStorage();
    selfOld.quizzes[ind] = quiz;
    putSelfInLocalStorage(selfOld);
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

  // Кастомный рендер для preview edge
  const edgeTypes = useMemo(() => ({
    ...initialEdgeTypes,
    preview: ({ data, ...props }) => {
      const [path] = getBezierPath({
        sourceX: data.sourceX,
        sourceY: data.sourceY,
        targetX: data.targetX,
        targetY: data.targetY,
        sourcePosition: 'top',
        targetPosition: 'bottom',
      });
      return (
        <BaseEdge
          {...props}
          path={path}
          style={{
            stroke: '#00ff88',
            strokeWidth: 2,
            strokeDasharray: '5 5',
            animation: 'dashdraw 0.5s linear infinite',
            zIndex: 9999
          }}
        />
      )
    }
  }), []);

  const onNodeDragStart = useCallback((event, draggedNode) => {
    setIsDragging(true);

    // for CHOICE
    const targetPosition = getSourceTargetPosition(draggedNode);

    setTempEdge({
      id: `temp-edge`,
      source: draggedNode.id,
      target: draggedNode.id,
      type: 'preview',
      data: {
        sourceX: targetPosition.x,
        sourceY: targetPosition.y,
        targetX: targetPosition.x,
        targetY: targetPosition.y,
        sourcePosition: 'top',
        targetPosition: 'bottom',
      }
    });
  }, []);

  const onNodeDrag = useCallback((event, draggedNode) => {
    if (!tempEdge) return;

    const targetNode = draggedNode;
    const targetPosition = getSourceTargetPosition(targetNode);
    const sourceNode = getValidSourceNode(targetPosition, targetNode, getNodes());
    const sourcePosition = getSourceTargetPosition(sourceNode, true);

    console.log("sourceNode", sourceNode);
    if (!sourceNode) {
      setTempEdge(prev => ({
        ...prev,
        target: draggedNode.id, // Цель = сам узел (ребро не будет отрисовываться)
        data: {
          ...prev.data,
          sourceX: targetPosition.x,
          sourceY: targetPosition.y,
          targetX: targetPosition.x,
          targetY: targetPosition.y,
        }
      }));
      return;
    }

    // Обновляем позицию
    setTempEdge(prev => ({
      ...prev,
      target: sourceNode?.id,
      data: {
        ...prev.data,
        sourceX: targetPosition.x,
        sourceY: targetPosition.y,
        targetX: sourcePosition.x,
        targetY: sourcePosition.y,
        sourcePosition: 'top',
        targetPosition: 'bottom',
      }
    }));
  }, [tempEdge, screenToFlowPosition]);

  const onNodeDragStop = useCallback((event, draggedNode) => { 
    setIsDragging(false);
    setTempEdge(null);

    if (draggedNode.parentId !== null) saveChanges(); 
    
    const dropPosition = getSourceTargetPosition(draggedNode);

    // Находим ноду под курсором
    const nodes = getNodes();
    const targetNode = getValidSourceNode(dropPosition, draggedNode, getNodes());

    console.log("RRRRRRR", targetNode, draggedNode);

    if (!targetNode) return;

    console.log("check");

    const choicesCount = targetNode.data?.question?.choices?.length || 0;
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

    // let condition = 0;
    // let isInternal = false;
    // let conn = true;

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
                  // parentId: draggedNode.id,
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
        const violatingEdges = checkGraphValidity(getNodes(), getEdges());
      
        if (violatingEdges.length > 0) {
          alert(`Обнаружены проблемы в графе:\n${violatingEdges.join('\n')}`);
          return;
        }

        const selfOld = getSelfFromLocalStorage();
        self.quizzes[ind] = quiz;
        const { quiz: responceQuiz, isOk } = http_put_quiz(selfOld, self.quizzes[ind], ()=>{})
        if(isOk){
          const updatedResponceQuiz = updateQuizIds(responceQuiz, quiz);
          // console.log('updatedResponceQuiz',responceQuiz);
          self.quizzes[ind] = updatedResponceQuiz;
          putSelfInLocalStorage(self);
          onQuizChange(updatedResponceQuiz);
        }
      } catch (error) {
        console.error('Ошибка сохранения:', error);
      }
    }, 5000),
    [ind, self, quiz]
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

      const forbiddenConnections = [
        ['start', 'end'],
        ['start', 'choice'],
        ['question', 'question'],
        ['choice', 'choice']
      ];

      const isInvalidConnection = forbiddenConnections.some(([a, b]) => sourceNode.type === a && targetNode.type === b);
    
      if (isInvalidConnection) {
        // Создаём временное красное соединение
        const tempEdge = {
          id: `invalid-${Date.now()}`,
          source: connection.source,
          target: connection.target,
          style: {
            stroke: '#ff0000',
            strokeWidth: 2,
          },
          className: 'animated-flash',
        };
        
        // Добавляем временное соединение в список
        setEdges((eds) => [...eds, tempEdge]);
        
        // Удаляем через 1 секунду
        setTimeout(() => {
          setEdges((eds) => eds.filter((e) => e.id !== tempEdge.id));
        }, 900);
        
        return;
      }  

      let condition = 0;
      let isInternal = false;
      let conn = true;
      const quizUpdates = {
        questions: [...quiz.questions],
        graphEdges: parseGraphEdges(quiz.graphEdges)
      };

      // Случай 1: start -> question
      if (sourceNode.type === 'start' && targetNode.type === 'question') {
        const existingStartEdges = getEdges().filter(e => e.source === sourceNode.id);
        if (existingStartEdges.length > 0) {
          alert('Стартовая нода может быть соединена только с одним вопросом');
          return;
        }
        // sourceNode.childId = targetNode.id;
        // return;
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
          condition = edges.find(e => e.source === sourceId && e.target === targetId)?.condition || 0;
        }  
      }

      // Случай 4: Обработка question -> end
      if (sourceNode.type === 'question' && targetNode.type === 'end') {
        condition = 0;
      }

      // Случай 4: Обработка choice -> end
      if (sourceNode.type === 'choice' && targetNode.type === 'end' && !sourceNode.parentId) {
        alert('Недопустимое соединение');
        return;
      }

      const newEdge = {
        ...connection,
        type: 'customEdge',
        animated: conn,
        id: (conn? 'conn' : 'auto') + `-${sourceNode.id}-${targetNode.id}`,
        condition: condition,
        // markerEnd: {
        //   type: MarkerType.ArrowClosed,
        //   width: 20,
        //   height: 20,
        // }  
      };

      if (condition !== -1) {;
        quizUpdates.graphEdges = [
          ...quizUpdates.graphEdges,
          newEdge
        ];
      }

      setEdges((eds) => addEdge(newEdge, eds));

      onQuizChange(prevQuiz => ({
        ...prevQuiz,
        questions: quizUpdates.questions,
        graphEdges: serializeGraphEdges(quizUpdates.graphEdges) 
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
    setContextMenu({
      type: 'NODE',
      element: node,
      position: { x: e.clientX, y: e.clientY }
    });
  }, []);

  const onEdgeContextMenu = useCallback((e, edge) => {
    e.preventDefault();
    setContextMenu({
      type: 'EDGE',
      element: edge,
      position: { x: e.clientX, y: e.clientY }
    });
  }, []);  

  const onEdgesDelete = useCallback((deletedEdges) => {
    const result = handleEdgeRemoval(
      deletedEdges,
      getNodes(),
      getEdges(),
      quiz.questions
    );
  
    setNodes(result.updatedNodes);
    
    onQuizChange(prev => ({
      ...prev,
      questions: result.updatedQuestions,
      graphEdges: serializeGraphEdges(result.updatedEdges)
    }));

  }, [quiz.questions]);

  const onNodesDelete = useCallback((deletedNodes) => {
    deletedNodes.forEach((node) => {
      
      if (node.type === 'start') return;
      console.log("DELETE", node.type);

      const handler = NODE_DELETE_HANDLERS[node.type];
      if (handler) {
        handler(node.id, { onQuizChange, setNodes });
      }
    });  
  }, [quiz.questions]);

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
          setContextMenu(null);
        }, [])}
      >
        {/* <ReactFlowProvider> */}
          <ReactFlow
            nodes={highlightedNodes}
            edges={[...highlightedEdges, ...(tempEdge ? [tempEdge] : [])]}
            onNodesChange={handleNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onEdgesDelete={onEdgesDelete}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onNodeDrag={onNodeDrag}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}

            onMove={() => setContextMenu(null)}

            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
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
                gap: 8,
                padding: 8,
                background: 'transparent', // Полупрозрачный светлый фон
                border: `2px dashed #B0B0B0`,
                boxShadow: `0 4px 20px rgba(36, 36, 36, 0.12)`,
                borderRadius: 12,
                backdropFilter: 'blur(4px)',
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 1000,
            
                // Стили для hover-эффекта
                ':hover': {
                  background: 'rgba(#D9D9D9, 0.98)',
                  boxShadow: `0 6px 24px rgba(#242424, 0.16)`,
                  transform: 'translateY(-50%) scale(1.02)'
                }
              }}
            >
            </Controls>
            <MiniMap 
              nodeColor={nodeColor} 
              nodeStrokeWidth={10} 
              // nodeStrokeColor={node => 
              //   node.selected ? 'rgba(255, 165, 0, 0.8)' : nodeColor // Оранжевая обводка для выбранных
              // }            
              nodeBorderRadius="16"
              style={{
                borderRadius: '12px', // Закругление углов всей карты
                overflow: 'hidden', // Обрезает содержимое по границам радиуса
              }}        
              // bgColor=""
              // maskColor=""
              zoomable 
              pannable
            />
          </ReactFlow>
        {/* </ReactFlowProvider> */}

        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.position.x,
              top: contextMenu.position.y,
              background: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              borderRadius: '8px',
              zIndex: 1000
            }}
            onClick={() => setContextMenu(null)}
          >
            {contextMenu.type === 'NODE' && contextMenu.element.type !== 'start' && (
              <div
                style={{ 
                  padding: '8px 16px',
                  cursor: 'pointer',
                  '&:hover': { background: '#f5f5f5' }
                }}
                onClick={() => {
                  const handler = NODE_DELETE_HANDLERS[contextMenu.element.type];
                  if (handler) {
                    handler(contextMenu.element.id, { onQuizChange, setNodes });
                  }
                }}        
              >
                Удалить {contextMenu.element.type === 'question' ? 'вопрос' : 'ответ'}
              </div>
            )}

            {contextMenu.type === 'EDGE' && (
              <div
                style={{ 
                  padding: '8px 16px',
                  cursor: 'pointer',
                  ':hover': { background: '#f5f5f5' }
                }}
                onClick={() => {
                  const result = handleEdgeRemoval(
                    [contextMenu.element],
                    getNodes(),
                    getEdges(),
                    quiz.questions
                  );
                  
                  setNodes(result.updatedNodes);
                  onQuizChange(prev => ({
                    ...prev,
                    questions: result.updatedQuestions,
                    graphEdges: serializeGraphEdges(result.updatedEdges)
                  }));                
                }}
              >
                Удалить соединение
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactFlowComponent;