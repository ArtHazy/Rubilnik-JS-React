import { useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import Terminal from './Terminal';

const QuestionNode = ({ id, type, data }) => {
  
  let { question, upd} = data

  const [title, setTitle] = useState(question.title)
  question.title = title

  // const onChange = useCallback((evt) => {
  //   console.log(evt.target.value);
  // }, []);

  // const groupArea = {
  //   x: Position.x - 200,  // Расширяем область на 200px в каждую сторону
  //   y: Position.y - 200,
  //   // width: (200) + 400,
  //   // height: (200) + 400
  // };

  return (
    <div style={{
      // position: 'absolute',
      //   left: groupArea.x,
      //   top: groupArea.y,
      //   width: groupArea.width,
      //   height: groupArea.height,
      background: '#FFF5CC',
      padding: '20px',
      borderRadius: '10px',
      border: '2px solid #FFD700',
      minWidth: '200px',
      minHeight: '300px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <Terminal type="target" position={ Position.Top } />
      ❓
      <input 
        id="text" 
        name="text" 
        className="nodrag" 
        placeholder="Enter your question"
        // value={data.title}
        value={question.title}
        onBlur={() => upd()}
        // onChange={(e) => data.updateTitle(e.target.value)}
        onChange={(e) => {
          question.title = e.target.value // из "self"
          setTitle(e.target.value) // локальное
          // question.title=e.target.value 
          // upd()
        }} //question.title = e.target.value; upd();
      />
      <div style={{ fontSize: '0.8em', color: '#666' }}>
        {data.choices?.map((choice, i) => (
          <div key={i} style={{ margin: '5px 0' }}>➥ {choice.text}</div>
        ))}
      </div>
    </div>
  );
};

export default QuestionNode;