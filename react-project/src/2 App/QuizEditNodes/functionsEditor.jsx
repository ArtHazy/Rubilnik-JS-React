/** 
 * @param {User} self  
 * @param {Quiz} quiz  
*/
export const convertToFlowElements = (quiz, ind) => {
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
    initialNodes.push({
      id: startEndData.start?.id ?? generateNodeId(),
      type: 'start',
      position: startEndData.start?.position || { x: 0, y: 0},
      data: startEndData.start?.data
    }); 
  
    // Добавляем конечные ноды
    startEndData.ends?.forEach(end => {
      initialNodes.push({
        id: end.id ?? generateNodeId(),
        type: 'end',
        position: end.position || { x: 0, y: 100},
        data: end.data
      });
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
      parsedEdges.forEach(edge => {
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
  
    const initialNodeIds = new Set(initialNodes.map(n => n.id));
    const orphans = JSON.parse(localStorage.getItem(`quiz_orphans_${ind}`) || '[]');
    const filteredOrphans = orphans.filter(node => !initialNodeIds.has(node.id));
    const nodes = initialNodes.concat( filteredOrphans );
  
    return { nodes, edges };
  };

  export const convertToQuizFormat = (nodes, edges) => {
    const startNode = nodes.find(n => n.type === 'start');
    const endNodes = nodes.filter(n => n.type === 'end');
  
    const startEndData = {
      start: startNode ? {
        id: startNode.id,
        position: startNode.position,
        data: startNode.data
      } : null,
      ends: endNodes.map(endNode => ({
        id: endNode.id,
        position: endNode.position,
        data: endNode.data
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
      graphEdgesJSON,
      startEndNodesPositions: JSON.stringify(startEndData)
    };
  };

  export const checkMaxChoices = (count) => {
    if (count >= MAX_CHOICES_PER_QUESTION) {
      alert(`Максимальное количество ответов в одном вопросе — ${MAX_CHOICES_PER_QUESTION}`);
      return true;
    }
    return false;
  };

  export const generateNodeId = () => 
    // crypto.randomUUID();
    `${Date.now() * 1000000 + Math.floor(Math.random() * 10000)}`;