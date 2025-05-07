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

const convertToQuizFormat = (nodes, edges) => {
  const restoreQuestions = nodes
    .filter(n => n.type === 'question')
    .map(n => n.data.question);

  return {
    restoreQuestions,
    restoreGraphEdges: "" // placeholder // TODO
  };
};

/** 
 * @param {User} self  
 * @param {Quiz} quiz  
 * @param {()=>void} upd  
*/
const convertToFlowElements = (self, quiz, upd) => {
  const nodes = [];
  const edges = [];
  // QuestionNode component params
  quiz.questions?.forEach((question) => {
    nodes.push({
      id: String(question.id),
      type: 'question',
      data: { question, upd, self },
      //
      position: {
        x: Number(question.position?.x) || 0,
        y: Number(question.position?.y) || 0
      },
      // question
    });
    // ChoiceNode component params
    question.choices?.forEach((choice, index) => {
      nodes.push({
        id: String(choice.id),
        type: 'choice',
        data: { choice, upd, self },
        //
        position: {
          x: Number(choice.position?.x) || 0,
          y: Number(choice.position?.y) || (index + 1) * 100
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

  return { nodes, edges: [] }; // edges are not reconstructed in this version
};


/** 
 * @param {{self:User,quiz:Quiz,upd:()=>{}}} param0  
*/
const ReactFlowComponent = ({ self, quiz, upd }) => {
  // if (quiz.graphEdges === "") {
  //   quiz.graphEdges = null;
  // } 
  // const str = JSON.parse(quiz.graphEdges);
  // console.log("JSON", str);
  // console.log("initialNodes", initialNodes);
  // console.log("quiz", quiz.questions);

  const {ind} = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenuNode, setContextMenuNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleAddQuestion = () => {
    quiz.isInDB = false;
    const newNode = {
      id: Date.now(), // Используем уникальный ID
      title: "Question " + (nodes.length + 1),
      position: { 
        x: 50, 
        y: nodes.length * 100 // Вертикальный отступ для новых нод
      },
      choices: [{ title: "", value: 0 }],
    };
    
    setNodes((nds) => nds.concat(newNode));
  };

  /** @param {number} id */
  const deleteQuestion = (id)=>{
    // console.log("!01!!",nodes);
    // quiz.questions.forEach((question)=>{
    //   console.log("!!!",question.id!=Number(id));
    // })
    quiz.questions = quiz.questions.filter( (question)=>question.id!=Number(id) ) 
    putSelfInLocalStorage(self)
  }
  /** @param {number} id */
  const deleteChoice = (id)=>{
    quiz.questions.forEach( (question)=>{
      question.choices.filter( (choice)=>(choice.id != id) )
    })
  }

  //InitialNodes
  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = convertToFlowElements(self, quiz, upd);
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [quiz.questions]);

  useEffect(() => {
    const selfOld = getSelfFromLocalStorage();
    const { restoreQuestions, restoreGraphEdges } = convertToQuizFormat(nodes, edges);
    // console.log("!!", restoreQuestions);
    
    const updatedQuiz = {
      ...quiz,
      questions: restoreQuestions,
      graphEdges: restoreGraphEdges,
      startEndNodesPositions: "{}",
      dateSaved: Date.now()
    };
    selfOld.quizzes[ind] = updatedQuiz;
    putSelfInLocalStorage(selfOld);
  }, [nodes, edges]);

  const handleNodesChange = (changes) => {
    // console.log("change");
    
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
                node.data.question.position=node.position
                return node
                // {
                //     ...node,
                //     data: {
                //       question: {
                //         ...node.data.question,
                //         position: node.position,
                //       }
                //     }
                // };
              } else {
                node.data.choice.position=node.position
                return node
                // {
                //   ...node,
                //   data: {
                //     choice: {
                //       ...node.data.choice,
                //       position: node.position,
                //     }
                //   }
                // };
              }

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


  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const position = screenToFlowPosition({ 
      x: event.clientX, 
      y: event.clientY 
    });
    const id = Date.now().toString()
    let newNode

    if (type=="question"){
      /** @type {Question} */
      let newQuestion = {id,title:"new",position,choices:[]}
      quiz.questions.push(newQuestion)
      newNode = { id, type, position, data: { question:newQuestion, self } };
    } else if (type=="choice") {
      /** @type {Choice} */
      let newChoice = {id,title:"new",position,value:0}
      newNode = { id, type, position, data: { choice:newChoice, self } };
    }
    putSelfInLocalStorage(self)
    setNodes((nds) => nds.concat(newNode));
  },[screenToFlowPosition] );    //setNodes


  const onConnect = useCallback(
    (connection) => {
        const newEdge = 
        {
          ...connection,
          type: 'customEdge',
          animated: true,
          id: Date.now(), //!!!!!!!!!!!!
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
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
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
      </div>
    </div>
  );
};

export default ReactFlowComponent;
