import { limits } from "../../values.mjs";
import i18next from 'i18next';

const SAFE_ZONE_RADIUS = 100;

export function loadQuizFromFile(file, quiz, onQuizChange, showNotification) {

    if (!(file instanceof File)) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
        showNotification(i18next.t('notifications.fileNotJSON'), 'error');
        return;
    }

    if (file.size > limits.maxQuizFileSize) {
        showNotification(i18next.t('notifications.fileTooBig'), 'error');
        return;
    }

    const fr = new FileReader();
    fr.readAsText(file);
    fr.onload = (e) => {
        try {
            const fileContent = e.target.result;
            
            // Парсим и обновляем ID
            const loadedQuiz = JSON.parse(fileContent);
            loadedQuiz.id = quiz.id;  // Сохраняем оригинальный ID
            loadedQuiz.dateSaved = Date.now();
            
            // Передаем обновленную викторину через колбэк
            onQuizChange(loadedQuiz);
        } catch (error) {
            showNotification(i18next.t('notifications.invalidQuizFile'), 'error');
        }
    };
    
    fr.onerror = () => {
        showNotification(i18next.t('notifications.fileReadError'), 'error');
    };
}

/**
 * Вычисляет новую позицию перетаскиваемого узла относительно целевого родителя
 * 
 * @param {Object} draggedNode - Перетаскиваемый узел { id, parentId, position: {x, y} }
 * @param {Array} nodes - Массив всех узлов
 * @param {Object} targetNode - Целевой родительский узел { id, position: {x, y} }
 * @returns {{x: number, y: number}} Новая относительная позиция
 */
export const calculateNewPositionChild = (draggedNode, targetNode, originalParent = null) => {
    // Вычисляем абсолютную позицию на холсте
    const absolutePosition = {
        x: originalParent 
        ? draggedNode.position.x + originalParent.position.x 
        : draggedNode.position.x,
        y: originalParent 
        ? draggedNode.position.y + originalParent.position.y 
        : draggedNode.position.y
    };

    // Рассчитываем позицию относительно нового родителя
    return {
        x: absolutePosition.x - targetNode.position.x,
        y: absolutePosition.y - targetNode.position.y
    };
};

export const checkMaxChoices = (count) => {
    if (count >= limits.maxChoicesLength) {
        alert(i18next.t('notifications.maxChoicesReached', { max: limits.maxChoicesLength }));
        return true;
    }
    return false;
};

export const getSourceTargetPosition = (node, source = false, parentNode = null) => {
    if (!node) return { x: 0, y: 0 };
  
    if (node.type === 'end') source = false;
    if (node.type === 'start') source = true;
  
    const offset = parentNode?.position || {x: 0, y: 0};
  
    return {
        x: (node?.position?.x || 0) + offset.x + (node?.measured?.width || 0) / 2,
        y: (node?.position?.y || 0) + offset.y + (source ? (node?.measured?.height || 0) : 0)
    }
};
  
const getDetectionArea = (node, parentNode = null) => ({
    x: node.position.x - (parentNode?.position.x || 0) - SAFE_ZONE_RADIUS,
    y: node.position.y - (parentNode?.position.y || 0) - SAFE_ZONE_RADIUS,
    width: (node.measured?.width || 0) + SAFE_ZONE_RADIUS * 2,
    height: (node.measured?.height || 0) + SAFE_ZONE_RADIUS * 2
});
  
export const getValidSourceNode = (targetPosition, targetNode, nodes, parentNode = null) => {
    const forbiddenConnections = [
      ['start', 'end'],
      ['start', 'choice'],
      ['question', 'question'],
      ['choice', 'choice'],
      ['choice', 'question'],
    ];
  
    const sourceNode = nodes.find(node => {
      if (
            node.id === targetNode.id ||         // Нельзя к себе
            node.id === targetNode.parentId //||       // Нельзя к родителю
            // (node.type === 'choice' && node.parentId === null)
      ) return false;
  
      const area = getDetectionArea(node, parentNode);
  
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
        console.log("!!!!!!!!!!!!!", targetNode);
        const choicesCount = sourceNode.data?.question?.choices?.length || 0;
        return checkMaxChoices(choicesCount) ? null : sourceNode;
    }
    if (sourceNode.type === 'choice' && targetNode.type === 'question') {
      
    }
    
    return sourceNode;
};
  
export const parseGraphEdges = (edgesString) => {
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
                condition: e.condition ?? 0,
            }));
    } catch (e) {
        console.error('Error parsing graph edges:', e);
        return [];
    }
};
  
  
 export const serializeGraphEdges = edges => JSON.stringify(
    (edges || [])
      .filter(
        e => e.source != null && 
        e.target != null && 
        e.id !== 'temp-edge')
      .map(({ id, source, target, data }) => ({
        id: id ?? `edge-${source}-${target}`,
        source: source,
        target: target,
        condition: data?.condition ?? 0,
    }))
);
  
export const filterEdges = (edgesString, predicate) => {
    const edges = parseGraphEdges(edgesString);
    return serializeGraphEdges(edges.filter(predicate));
};

export const createEdgeLookup = (edges) => {
    const lookup = {};
    
    edges.forEach(edge => {
        lookup[edge.source] = true;
    });
    
    return lookup;
};
  
export const generateNodeId = () => 
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
        deletable: false
    }; 
    
    initialNodes.push(startNode);
    tempIdMap.set(startNode.id, startNode.id);
    
    // Добавляем конечные ноды
    startEndData.ends?.forEach(end => {
        const endNode = {
            id: end.id ?? generateNodeId(),
            type: 'end',
            position: end.position || { x: 0, y: 100}
        };
        initialNodes.push(endNode);
        tempIdMap.set(endNode.id, endNode.id);
    });

    const parsedGraphEdges = parseGraphEdges(quiz.graphEdges);
    const outgoingEdgeLookup = createEdgeLookup(parsedGraphEdges);
    const questionWithOutgoingMap = {}; // Карта для хранения withOutgoing по ID вопроса
    const choiceToQuestionMap = {}; // Карта для связи choice с родительским вопросом

    // QuestionNode component params
    quiz.questions?.forEach((question) => {
        const questionNodeId = question.tempId ?? generateNodeId();
    
        if(question.tempId) {
            tempIdMap.set(question.tempId, questionNodeId);
        }

        let withOutgoing = 0;  // Счетчик choice с исходящими ребрами
    
        initialNodes.push({
            id: questionNodeId,
            type: 'question',
            data: { 
                question: {
                    ...question,
                    tempId: questionNodeId,
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

            if (outgoingEdgeLookup[choiceNodeId]) withOutgoing++;
        
            choiceToQuestionMap[choiceNodeId] = questionNodeId;
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
                data: {
                    condition: -1,
                },
                type: 'customEdge',
                animated: false,
            });
        });

        questionWithOutgoingMap[questionNodeId] = withOutgoing;
    });
    
    parsedGraphEdges.forEach(edge => {
        if (edge.condition !== -1) {
            const sourceId = tempIdMap.get(edge.source) //|| edge.source;
            const targetId = tempIdMap.get(edge.target) //|| edge.target;

            if (sourceId || targetId) {
                const parentQuestionId = choiceToQuestionMap[sourceId];
                const withOutgoing = parentQuestionId 
                    ? questionWithOutgoingMap[parentQuestionId] 
                    : 0;
                
                const showConditionInput = withOutgoing >= 2;

                edges.push({
                    id: `conn-${sourceId}-${targetId}`,
                    source: sourceId,
                    target: targetId,
                    type: 'customEdge',
                    animated: true,
                    data: {
                        condition: showConditionInput? edge.condition : 0,
                        showConditionInput, // Передаем булево значение
                    }
                    // markerEnd: {
                    //   type: MarkerType.ArrowClosed,
                    //   width: 20,
                    //   height: 20,
                    // }
                });
            }
        }
    });
    
    const initialNodeIds = new Set(initialNodes.map(n => n.id));
    const orphans = JSON.parse(localStorage.getItem(`quiz_orphans_${ind}`) || '[]');
    const filteredOrphans = orphans.filter(node => !initialNodeIds.has(node.id));
    const nodes = initialNodes.concat( filteredOrphans );
    
    return { nodes, edges };
};      

export const convertToQuizFormat = (nodes, edges) => {
    console.log("convertToQuizFormat");
    const startNode = nodes.find(n => n.type === 'start');
    const endNodes = nodes.filter(n => n.type === 'end');
  
    const startEndData = {
      start: startNode ? {
        id: startNode.id,
        position: startNode.position,
        deletable: false
      } : null,
      ends: endNodes.map(endNode => ({
        id: endNode.id,
        position: endNode.position
      }))
    };
  
    const restoreQuestions = nodes
      .filter(node => node.type === 'question')
      .map(questionNode => ({
        ...questionNode.data.question,
        position: questionNode.position,
        tempId: questionNode.id,
        choices: nodes
          .filter(choiceNode => 
            choiceNode.type === 'choice' && 
            choiceNode.parentId === questionNode.id
          )
          .map(choiceNode => ({
            ...choiceNode.data.choice,
            tempId: choiceNode.id,
            position: choiceNode.position,
          }))
      }));
  
    const graphEdges = edges
      .filter((e) => e.data?.condition !== -1)
      .map((e) => ({
        id: e.id ?? `conn-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        data: {
            condition: e.data?.condition ?? 0,
        }
      }));
    
    return {
      restoreQuestions,
      graphEdgesJSON: serializeGraphEdges(graphEdges),
      startEndNodesPositions: JSON.stringify(startEndData)
    };
};