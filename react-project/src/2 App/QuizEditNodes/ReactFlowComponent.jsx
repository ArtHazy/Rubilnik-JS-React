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
import throttle from 'lodash/throttle';

import "./styles.scss";

import '@xyflow/react/dist/base.css';

import { PanelControls } from './PanelControls';
import QuestionNode from './QuestionNode';
import ChoiceNode from './ChoiceNode';
import Sidebar from './Sidebar';
import CustomEdge from './CustomEdge';

import { MarkerType } from '@xyflow/react';

import { useNavigate, useParams } from "react-router-dom"
import { limits } from '../../values.mjs';
import { Actions } from '../App';
import { downloadJson, getSelfFromLocalStorage, loadQuizFromFile, putSelfInLocalStorage} from "../../functions.mjs"
import { startRoomAsHost } from "../ViewLibrary"
import { http_post_quiz, http_put_quiz } from "../../HTTP_requests.mjs"

const panOnDrag = [1, 2];

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
    case 'question':
      return '#6ede87';
    case 'choice':
      return '#6865A5';
    default:
      return '#ff0072';
  }
};

const nodeTypes = {
  question: QuestionNode,
  choice: ChoiceNode,
  end: EndNode
};

const edgeTypes = {
  'customEdge': CustomEdge,
}

// const asyncThrottle = (func, wait) => {
//   const throttled = throttle((...args) => {
//     return func(...args);
//   }, wait);
//   return (...args) => new Promise(resolve => {
//     throttled(...args).then(resolve);
//   });
// };

const convertToQuizFormat = (nodes, edges) => {
  const restoreQuestions = [];
  const restoreGraphEdges = "";
  nodes.forEach(node => {
    if (node.type === 'question') {
      restoreQuestions.push(node.question);
    }
  });

  //graphEdges EDIT

  return { restoreQuestions, restoreGraphEdges };
}

const convertToFlowElements = (self, quiz, upd) => {
  const nodes = [];
  const edges = [];

  quiz.questions?.forEach(question => {
    // Основной узел вопроса
    nodes.push({
      id: String(question.id),
      type: 'question',

      //изменяемые поля, должны обновляться в question
      position: {
        x: Number(question.position?.x) || 0,
        y: Number(question.position?.y) || 0
      },
      data: { 
        label: question.title,
        upd: upd,
        updateTitle: (title) => {
          question.title = title;
        },
      },

      //ссылка на quiz.question
      question: question,
    });

    // Узлы для вариантов ответов
    question?.choices?.forEach((choice, index) => {
      nodes.push({
        id: String(choice.id),
        type: 'choice',

        //изменяемые поля, должны обновляться в choice
        position: {
          x: Number(choice.position?.x) || 0, // Гарантируем число
          y: Number(choice.position?.y) || (index+1)*100
        },
        data: {
          label: choice.title,
          value: choice.value
          // targetQuestionId: choice.targetQuestionId
        },
        extent: 'parent',
        parentId: String(question.id),

        //ссылка на quiz.question.choice
        choice: choice,
      });

      // Связь вопрос -> вариант
      // edges.push({
      //   id: `${question.id}-${choice.id}`,
      //   source: question.id,
      //   target: choice.id
      // });

      // Связь вариант -> следующий вопрос (если есть)
      // if(choice.targetQuestionId) {
      //   edges.push({
      //     id: `${choice.id}-${choice.targetQuestionId}`,
      //     source: choice.id,
      //     target: choice.targetQuestionId
      //   });
      // }
    });
  });

  return { nodes, edges };
};

// 1. Добавим хук для автосохранения в БД
// const useAutoSave = (nodes, edges, quizId) => {
//   const saveToDatabase = useCallback(
//     throttle(async (restoredQuiz) => {
//       try {
//         await http_put_quiz(quizId, restoredQuiz);
//         console.log('Автосохранение выполнено');
//       } catch (error) {
//         console.error('Ошибка автосохранения:', error);
//       }
//     }, 5000), // Сохраняем в БД не чаще чем раз в 5 секунд
//     [quizId]
//   );

//   useEffect(() => {
//     const handleBeforeUnload = async (e) => {
//       const restoredQuiz = convertToQuizFormat(nodes, edges);
//       await http_put_quiz(self, restoredQuiz, ()=>{});
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);
//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, [nodes, edges, restoredQuiz]);

  // 3. Основной эффект для периодического сохранения
//   useEffect(() => {
//     if (nodes.length > 0 || edges.length > 0) {
//       const restoredQuiz = convertToQuizFormat(nodes, edges);
//       saveToDatabase(restoredQuiz);
//     }
//   }, [nodes, edges, saveToDatabase]);
// };

const ReactFlowComponent = ({ self, quiz, upd }) => {
  // if (quiz.graphEdges === "") {
  //   quiz.graphEdges = null;
  // } 
  // const str = JSON.parse(quiz.graphEdges);
  // console.log("JSON", str);
  // console.log("initialNodes", initialNodes);
  // console.log("quiz", quiz.questions);

  const { id: quizId } = quiz;
  const {ind} = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [contextMenuNode, setContextMenuNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleAddQuestion = () => {
    quiz.isInDB = false;
    const newNode = {
      id: `${Date.now()}`, // Используем уникальный ID
      title: "Question " + (nodes.length + 1),
      position: { 
        x: 50, 
        y: nodes.length * 100 // Вертикальный отступ для новых нод
      },
      choices: [{ title: "", value: 0 }],
    };
    
    setNodes((nds) => nds.concat(newNode));
  };

  //InitialNodes
  useEffect(() => {
    const { nodes: convertedNodes, edges: convertedEdges  } = convertToFlowElements(self, quiz, upd);
    setNodes(convertedNodes);
    setEdges(convertedEdges);
  }, [quiz.questions]);

  //autoSaveToLocalStorage
  useEffect(() => {
    // const throttledSave = throttle(() => { //IMPORTANT SUPER IMPORTANT оптимизация кол-ва сохранений при обновлении
      const selfOld = getSelfFromLocalStorage();
      const { restoreQuestions, restoreGraphEdges } = convertToQuizFormat(nodes, edges);
      // console.log("restoreQuestions", restoreQuestions);
      const updatedQuiz = {
        id: quiz.id,
        title: quiz.title,
        isInDB: quiz.isInDB, //true
        startEndNodesPositions: "{}",
        dateCreated: quiz.dateCreated,
        dateSaved: Date.now(),
        questions: restoreQuestions,
        graphEdges: restoreGraphEdges,
      };

      selfOld.quizzes[ind] = updatedQuiz;
      putSelfInLocalStorage(selfOld);
      // console.log("initialQUIZ", updatedQuiz);
      // localStorage.setItem('editor', JSON.stringify({ nodes, edges }));
    // }, 0);
    
    // throttledSave();
    // return () => throttledSave.cancel();
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

              return {
                  ...node,
                  question: {
                      ...node.question,
                      position: node.position,
                  }
              };
          });
      }

      return updatedNodes;
    });
  };

  const handleAutoSave = useCallback(
    throttle(() => {
      try {
        const selfOld = getSelfFromLocalStorage();
        const { isOk } = http_put_quiz(selfOld, self.quizzes[ind], ()=>{})
        console.log(self.quizzes[ind]);
        if(isOk){
          //self.quizzes[ind] = responceQuiz;
          upd(true);
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


  // const handleUpdateQuiz = useCallback(() => {
  //   const updatedQuestions = convertToQuestions(nodes, edges);
  //   upd({ ...quiz, questions: updatedQuestions });
  // }, [nodes, edges, quiz, upd]);

  // const handleNodesChange = useCallback(
  //   (changes) => {
  //     changes.forEach(change => {
  //       if (change.type === 'remove') {
  //         const nodeId = change.id;
  //         if (nodeId.startsWith('q')) {
  //           const qIndex = parseInt(nodeId.replace('q', ''));
  //           handleDeleteQuestion(qIndex);
  //         }
  //       } else if (change.type === 'position' && change.dragging) {
  //         const nodeId = change.id;
  //         if (nodeId.startsWith('q')) {
  //           const qIndex = parseInt(nodeId.replace('q', ''));
  //           const question = quiz.questions[qIndex];
  //           if (question) {
  //             question.position = change.position;
  //             quiz.isInDB = false;
  //             upd();
  //           }
  //         }
  //       }
  //     });
      
  //     onNodesChange(changes);
  //   },
  //   [quiz, upd, onNodesChange]
  // );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const position = screenToFlowPosition({ 
        x: event.clientX, 
        y: event.clientY 
      });
      const newNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label: `Новый вопрос` },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition] //setNodes
  );    

  const onConnect = useCallback(
    (connection) => {
        const newEdge = 
        {
          ...connection,
          type: 'customEdge',
          animated: true,
          id: `e${Date.now()}`, //!!!!!!!!!!!!
          //   markerEnd: {
          //     type:MarkerType.ArrowClosed,
          //     width:20,
          //     height:20,
          //     // color
          //   }
        };
        setEdges((eds) => addEdge({ ...newEdge, animated: true }, eds));
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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes} 
          onNodeContextMenu={onNodeContextMenu}
          style={rfStyle}

          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          
          onNodeClick={(e, node) => {
            if (node.type === 'question') {
              setSelectedQuestion(node);
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
              zIndex: 1000,
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
                  ? handleDeleteQuestion(contextMenuNode.id) 
                  : deleteChoice(contextMenuNode);
              }}
            >
              Удалить {contextMenuNode.type === 'question' ? 'вопрос' : 'ответ'}
            </div>
          </div>
        )}

        {selectedQuestion && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>Управление вопросом</h3>
            <button onClick={handleAddQuestion}>Добавить вопрос</button>
            <button onClick={() => deleteQuestion(selectedQuestion.id)}>
              Удалить вопрос
            </button>
            
            <button onClick={() => setSelectedQuestion(null)}>Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactFlowComponent;