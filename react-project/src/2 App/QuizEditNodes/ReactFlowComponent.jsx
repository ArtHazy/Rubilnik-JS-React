import React, { useCallback, useState, useMemo, useEffect  } from 'react';
import { ReactFlow, useNodesState, useEdgesState, addEdge, Controls,
  Background, useReactFlow, getBezierPath, MiniMap, applyNodeChanges, 
  BaseEdge, Panel, MarkerType, SelectionMode, useOnSelectionChange
} from '@xyflow/react';
import { useParams } from 'react-router-dom';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle'; 
import { useTranslation } from 'react-i18next';

import "./styles.scss";
import '@xyflow/react/dist/base.css';

import { PanelControls } from './PanelControls';
import QuestionNode from './QuestionNode';
import ChoiceNode from './ChoiceNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import Sidebar from './Sidebar';
import CustomEdge from './CustomEdge';
import { checkGraphValidity } from './compiler';
import './ReactFlowComponent.scss';

import { getSelfFromLocalStorage, putSelfInLocalStorage} from "../../functions.mjs"
import { http_put_quiz } from "../../HTTP_requests.mjs"
import { convertToQuizFormat, convertToFlowElements, calculateNewPositionChild, checkMaxChoices, 
  getSourceTargetPosition, getValidSourceNode, parseGraphEdges, serializeGraphEdges, 
  filterEdges, generateNodeId } from "./functionsEditor"
import { useNotification } from '../../Components/ContextNotification';

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

const filterEdgeProps = (props) => {
  const { 
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    sourceHandleId, targetHandleId,
    pathOptions,
    markerStart, markerEnd,
    selectable, deletable,
    reversed,
    ...filteredProps 
  } = props;
  
  return filteredProps;
};

const edgeTypes = {
  customEdge: CustomEdge,
  preview: ({ data, ...rest }) => {
    const filteredProps = filterEdgeProps(rest);
    
    const [path] = getBezierPath({
      sourceX: data?.sourceX || 0,
      sourceY: data?.sourceY || 0,
      targetX: data?.targetX || 0,
      targetY: data?.targetY || 0,
      sourcePosition: data?.sourcePosition,
      targetPosition: data?.targetPosition,
    });

    return (
      <BaseEdge
        {...filteredProps}
        path={path}
        className={`preview-edge ${(data?.reversed || false) ? 'reversed' : 'normal'}`}
      />
    );
  }

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
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const {ind} = useParams();
  const [initialElements] = useState(() => {
    return convertToFlowElements(quiz, onQuizChange, ind);
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);
  const [contextMenu, setContextMenu] = useState(null);
  const { screenToFlowPosition, getNodes, getEdges, getNode, addNodes, addEdges, updateNode } = useReactFlow();
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedElements, setSelectedElements] = useState({ nodes: [], edges: [] });

  const orphans = useMemo(() => 
    nodes.filter(node => 
      node.type === 'choice' && !node.parentId
    ), 
  [nodes]);

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

    onQuizChange(newQuiz);
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
      if (node.type !== 'start') {
        const handler = NODE_DELETE_HANDLERS[node.type];
        if (handler) {
          handler(node.id, { onQuizChange, setNodes });
        }
      }
    });  
  }, [quiz.questions]);

  const deleteSelectedElements = useCallback(() => {
    // console.log("SELECT");    
    // Удаляем выделенные ноды
    if (selectedElements.nodes.length > 0) {
      onNodesDelete(selectedElements.nodes);
    }
    
    // Удаляем выделенные связи
    // if (selectedElements.edges.length > 0) {
    //   onEdgesDelete(selectedElements.edges);
    // }
    
    // Сбрасываем выделение и закрываем меню
    setSelectedElements({ nodes: [], edges: [] });
    setContextMenu(null);
  }, [selectedElements, onNodesDelete, onEdgesDelete]);

  useEffect(() => {
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

    // console.log("quiz", quiz);

    const selfOld = getSelfFromLocalStorage();
    selfOld.quizzes[ind] = quiz;
    putSelfInLocalStorage(selfOld);
  }, [quiz]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          (selectedElements.nodes.length > 0 || selectedElements.edges.length > 0)) {
        deleteSelectedElements();
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, deleteSelectedElements]);

  // Используем хук для отслеживания выделения
  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedElements({
        nodes: nodes.filter(node => node.selected),
        edges: edges.filter(edge => edge.selected)
      });
    }
  });

  const handleNodesChange = useCallback((changes) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onNodeMouseEnter = useCallback((e, node) => {
    setHoveredQuestionId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback((e, node) => {
    setHoveredQuestionId(null);
  }, []);

  const onNodeDragStart = useCallback((event, draggedNode) => {
    setIsDragging(true);

    // for CHOICE
    const targetPosition = getSourceTargetPosition(draggedNode);

    const targetEnd = draggedNode.type === 'end';
    const targetStart = draggedNode.type === 'start';
    // console.log(targetEnd);

    setTempEdge({
      id: `temp-edge`,
      source: (targetEnd)? draggedNode.targetHandleId : draggedNode.id,
      target: (targetStart)? draggedNode.sourceHandleId : draggedNode.id,
      type: 'preview',
      data: {
        sourceX: targetPosition.x,
        sourceY: targetPosition.y,
        targetX: targetPosition.x,
        targetY: targetPosition.y,
        reversed: targetEnd,
        sourcePosition: (targetEnd || targetStart)? 'bottom' : 'top',
        targetPosition: (targetEnd || targetStart)? 'top' : 'bottom',
      }
    });
  }, []);

  const onNodeDrag = useCallback(throttle((event, draggedNode) => {
    if (!tempEdge) return;

    if (draggedNode.parentId || draggedNode.type !== 'choice') {
      setTempEdge(prev => ({ ...prev, hidden: true }));
      return;
    }  

    const targetNode = draggedNode;
    const parentTargetNode = targetNode?.parentId? getNode(targetNode.parentId) : null;
    // console.log("parentTargetNode", parentTargetNode);
    const targetPositionTop = getSourceTargetPosition(targetNode, parentTargetNode);
    const targetPositionBottom = getSourceTargetPosition(targetNode, true, parentTargetNode)

    const sourceNode = getValidSourceNode(targetPositionTop, targetNode, getNodes(), parentTargetNode);
    const parentSourceNode = sourceNode?.parentId? getNode(sourceNode.parentId) : null;
    const sourcePositionTop = getSourceTargetPosition(sourceNode, parentSourceNode);
    const sourcePositionBottom = getSourceTargetPosition(sourceNode, true, parentSourceNode);

    const targetPosition = (sourceNode?.type === 'end')? targetPositionBottom : targetPositionTop
    const sourcePosition = (targetNode?.type === 'start')? sourcePositionTop : sourcePositionBottom

    const targetEnd = targetNode.type === 'end';
    const targetStart = targetNode.type === 'start';

    // console.log("sourceNode", sourceNode);
    if (!sourceNode) {
      setTempEdge(prev => ({
        ...prev,
        // target: targetNode.id,
        hidden: true,
      }));
      return;
    }

    // Обновляем позицию
    setTempEdge(prev => ({
      ...prev,
      target: targetEnd? targetNode?.id : sourceNode?.id,
      source: targetEnd? sourceNode?.id : targetNode?.id,
      hidden: false,
      data: {
        ...prev.data,
        sourceX: targetEnd? sourcePosition.x : targetPosition.x,
        sourceY: targetEnd? sourcePosition.y : targetPosition.y,
        targetX: targetEnd? targetPosition.x : sourcePosition.x,
        targetY: targetEnd? targetPosition.y : sourcePosition.y,
        reversed: targetEnd,
        sourcePosition: (targetEnd || targetStart)? 'bottom' : 'top',
        targetPosition: (targetEnd || targetStart)? 'top' : 'bottom',
      }
    }));
  }, 50), [tempEdge, screenToFlowPosition]);

  const onNodeDragStop = useCallback((event, draggedNode) => { 
    setIsDragging(false);
    setTempEdge(null);

    if (draggedNode.parentId !== null || draggedNode.type !== 'choice')  {
      saveChanges();
      return; //УДАЛИТЬ
    } //ПОТОМ ИСПРАВИТЬ

    const parentNodedragged = getNode(draggedNode.parentId);
    const dropPosition = getSourceTargetPosition(draggedNode, parentNodedragged);
    const targetNode = getValidSourceNode(dropPosition, draggedNode, getNodes(), parentNodedragged);

    if (!targetNode) return;

    const choicesCount = targetNode.data?.question?.choices?.length || 0;
    if (checkMaxChoices(choicesCount)) return;

    // console.log("pos", draggedNode.position);
    const newRelativePosition = calculateNewPositionChild(draggedNode, targetNode, parentNodedragged);
    // console.log("NEW", newRelativePosition);

    // let condition = 0;
    // let isInternal = false;
    // let conn = true;

    onQuizChange(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
          const isTargetQuestion = q.tempId === targetNode.data?.question?.tempId;
          const filteredChoices = q.choices.filter(c => c.tempId !== draggedNode.id);

          if (q.tempId === parentNodedragged?.data?.question?.tempId) {
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
          showNotification(t('editor.graphIssuesAlert', { issues: violatingEdges.join('\n') }));
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
        } else {
          showNotification(t('editor.saveError'), 'error');
        }
      } catch (error) {
        showNotification(t('editor.saveError'), 'error');
      }
    }, 5000),
    [ind, self, quiz]
  );

  useEffect(() => {
    const handleSave = () => {
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
      let newQuestion = {id: null, tempId: id, title: t('editor.newQuestionTitle'), position, choices:[]}
      newNode = { id, type, position, data: { question: newQuestion } };
      onQuizChange(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));  
    } else if (type == "choice") {
      /** @type {Choice} */
      let newChoice = {id: null, tempId: id, title: t('editor.newChoiceTitle'), position, value:0}
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
        ['choice', 'choice'],
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
          showNotification(t('editor.startNodeOnlyOne'));
          return;
        }
      }

      // Случай 2: question -> choice (автоматическое соединение)
      if (sourceNode?.type === 'question' && targetNode?.type === 'choice') {
        condition = -1;
        conn = false;

        const parentNodedragged = getNode(targetNode.parentId);
        const newRelativePosition = calculateNewPositionChild(targetNode, sourceNode, parentNodedragged);

        const choicesCount = sourceNode.data.question.choices.length;
        
        if (checkMaxChoices(choicesCount)) return;  

        quizUpdates.questions = quiz.questions.map(question => 
          question.tempId === sourceNode.id ? {
            ...question,
            choices: [
              ...question.choices,
              {
                ...targetNode.data.choice,
                tempId: targetNode.id,
                position: newRelativePosition
              }
            ]
          } : question
        );  
      }

      // Случай 3: choice -> question
      if (sourceNode?.type === 'choice' && targetNode?.type === 'question') {
        isInternal = sourceNode.parentId === targetNode.id;
        if (isInternal) {
          condition = edges.find(e => e.source === sourceId && e.target === targetId)?.data?.condition ?? 0;
        }  
      }

      // Случай 4: Обработка question -> end
      if (sourceNode.type === 'question' && targetNode.type === 'end') {
        condition = 0;
      }

      // Случай 4: Обработка choice -> end
      if (sourceNode.type === 'choice' && targetNode.type === 'end' && !sourceNode.parentId) {
        showNotification(t('editor.invalidConnectionAlert'));
        return;
      }

      const newEdge = {
        ...connection,
        type: 'customEdge',
        animated: conn,
        id: (conn? 'conn' : 'auto') + `-${sourceNode.id}-${targetNode.id}`,
        data: {
          condition: condition,
        }
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

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    
    // Показываем меню только если есть выделенные элементы
    if (selectedElements.nodes.length > 0 || selectedElements.edges.length > 0) {
      setContextMenu({
        type: 'SELECTION',
        position: { x: event.clientX, y: event.clientY }
      });
    }
  }, [selectedElements]);

  return (
    <div className="react-flow-container">
      <Panel 
        position='top-left' 
        className="sidebar-panel"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <Sidebar />
      </Panel>

      <div className="flow-wrapper"
        onClick={useCallback(() => {
          setContextMenu(null);
        }, [])}
      >
        <ReactFlow
          className="react-flow-styles"
          nodes={highlightedNodes}
          edges={[...highlightedEdges, ...(tempEdge ? [tempEdge] : [])]}
          onNodesChange={handleNodesChange}
          onNodesDelete={onNodesDelete}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          // onReconnect={onReconnect}
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
          onPaneContextMenu={onPaneContextMenu}
          fitView
          panOnScroll
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionMode={SelectionMode.Partial}
        >
          <PanelControls quiz={quiz} ind={ind} onQuizChange={onQuizChange} />
          <Background />
          <Controls 
            showInteractive={false} 
            position="top-right"
            className="controls-panel"            
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
          </Controls>
          <MiniMap 
            className="minimap-styles"
            nodeColor={nodeColor} 
            nodeStrokeWidth={10} 
            // nodeStrokeColor={node => 
            //   node.selected ? 'rgba(255, 165, 0, 0.8)' : nodeColor // Оранжевая обводка для выбранных
            // }            
            nodeBorderRadius="16"     
            zoomable 
            pannable
          />
        </ReactFlow>

        {contextMenu && (
          <div
            className="context-menu"
            style={{
              left: contextMenu.position.x,
              top: contextMenu.position.y,
            }}
    
            onClick={() => setContextMenu(null)}
          >
            {contextMenu.type === 'NODE' && contextMenu.element.type !== 'start' && (
              <div
                className='context-menu-item'
                onClick={() => {
                  const handler = NODE_DELETE_HANDLERS[contextMenu.element.type];
                  if (handler) {
                    handler(contextMenu.element.id, { onQuizChange, setNodes });
                  }
                }}        
              >
                {contextMenu.element.type === 'question' 
                  ? t('editor.contextMenu.deleteQuestion')
                  : contextMenu.element.type === 'choice' 
                    ? t('editor.contextMenu.deleteChoice')
                    : t('editor.contextMenu.deleteEnd')}
              </div>
            )}

            {contextMenu.type === 'SELECTION' && (
              <div
                className='context-menu-item'
                onClick={deleteSelectedElements}
              >
                {t('editor.contextMenu.deleteSelection')}
              </div>
            )}

            {contextMenu.type === 'EDGE' && (
              <div
                className='context-menu-item'
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
                {t('editor.contextMenu.deleteConnection')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactFlowComponent;