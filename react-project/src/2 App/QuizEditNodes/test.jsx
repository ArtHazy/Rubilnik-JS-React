import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, MiniMap, applyNodeChanges } from '@xyflow/react';

import { PanelControls } from './PanelControls';

const Editor = ( { quiz, upd } ) => {
  const {ind} = useParams();
  // console.log(ind);
  const [questions, setQuestions] = useState(quiz.questions);

  // console.log(questions);

  const handleAddObject = () => {
    quiz.isInDB = false;
    const newQuestion = {
      id: Date.now(), // Используем уникальный ID
      title: "Question " + (questions.length + 1),
      nodePosition: { 
        x: 50, 
        y: questions.length * 100 // Вертикальный отступ для новых нод
      },
      choices: [{ title: "", value: 0 }],
    };
    
    setQuestions(prev => [...prev, newQuestion]);
  };

  useEffect(() => {
    quiz.questions = questions;
    quiz.isInDB = false; // Помечаем квиз как изменённый
  }, [questions]); 

  const nodes = useMemo(() => {
    return questions.map(question => ({
      id: String(question.id), // РеактФлоу требует строковые ID
      data: { label: question.title },
      position: question.nodePosition || { x: 0, y: 0 }, //question.nodePosition
      style: { // Стили для лучшей видимости
        background: '#fff',
        border: '1px solid #222',
        padding: 10,
        borderRadius: 5,
      },
    }));
  }, [questions]);

  const handleNodesChange = (changes) => {
    setQuestions(prevQuestions => {    const updatedNodes = applyNodeChanges(changes, prevQuestions.map(q => ({
        id: String(q.id),      position: q.nodePosition,
        data: { label: q.title }    })));
      return updatedNodes.map(node => {
        const original = prevQuestions.find(q => String(q.id) === node.id);      return {
          ...original,
          nodePosition: node.position
        };
      });
    });
  };




  // console.log(nodes);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <button 
        onClick={handleAddObject} 
        style={{ 
          position: 'absolute', 
          zIndex: 10, 
          bottom: 10, 
          left: 10, 
          padding: '8px 15px',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        Добавить вопрос
      </button>
      
      <ReactFlow 
        nodes={nodes}
        onNodesChange={handleNodesChange}
        fitView
        style={{ background: '#f0f2f5' }}
      >
        <PanelControls quiz={quiz} ind={ind} upd={upd} />
        <MiniMap />
        <Controls />
        <Background gap={20} />
      </ReactFlow>
    </div>
  );
};

export default Editor;