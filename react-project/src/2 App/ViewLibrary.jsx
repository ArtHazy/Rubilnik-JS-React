import { useState, useRef } from "react";
import { limits } from "../values.mjs";
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { http_delete_quiz, http_post_quiz, http_put_quiz } from "../HTTP_requests.mjs";
import { useNavigate } from "react-router-dom";
import "./ViewLibrary.scss"

export const ViewLibrary = () => {
  let self = getSelfFromLocalStorage();
  let quizzes = self?.quizzes
  const [flag, setFlag] = useState(false);
  
  function upd() { putSelfInLocalStorage(self), setFlag(!flag) }    

  return <div className="ViewLibrary">
    <header>Your library</header>
    <div className="grid">
      {Array.isArray(quizzes)? quizzes.map((q,i)=>
        <QuizTile quiz={q} ind={i} upd={upd} self={self} quizzes={quizzes}/>
      ): null}
      
      {(!quizzes || quizzes.length<limits.maxQuizzesLength)? <button id="add" onClick={()=>{
        let newQuiz = {title:'new quiz', questions:[]}
        let {isOk, quiz} = http_post_quiz(self,newQuiz,()=>{});
        if (isOk) {
          if (!Array.isArray(quizzes)) quizzes = [];
          quizzes.push({...quiz, isInDB:true}), upd()
        }
      }}><span className="material-symbols-outlined">add</span></button>
      : null}
    </div>
  </div>
}

export const QuizTile = ({quiz, ind, upd, self, quizzes}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(quiz.title);
  const clickTimeoutRef = useRef(null);
  const isPreloadedRef = useRef(false); // Флаг предзагрузки

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  };

  const handleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    if (!isPreloadedRef.current) {
      console.log("Начало предзагрузки компонента");
      import("./QuizEditNodes/ReactFlowComponent").then(module => {
        console.log("Компонент предзагружен");
        isPreloadedRef.current = true;
      }).catch(error => {
        console.error("Ошибка предзагрузки:", error);
      });
    }

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      return;
    }

    const timeout = setTimeout(() => {
      console.log("Одинарный клик");
      // Если в режиме редактирования - не переходим
      if (!isEditing) {
        navigate(`/edit-quiz/${ind}`);
      }
      clickTimeoutRef.current = null;
    }, 300);
  };

  const handleDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    setIsEditing(true);
  };

  const handleTitleSave = () => {
    if (newTitle.trim() !== quiz.title) {
      const updatedQuiz = {...quiz, title: newTitle.trim()};
      
      // Отправляем на сервер
      const { isOk, quiz: serverQuiz } = http_put_quiz(self, updatedQuiz, () => {});
      
      if (isOk) {
        // Обновляем локальное состояние
        quizzes[ind] = serverQuiz;
        self.quizzes = quizzes;
        putSelfInLocalStorage(self);
        upd();
      } else {
        // Если ошибка - возвращаем оригинальное название
        setNewTitle(quiz.title);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className='quiz-tile-container' onDoubleClick={handleDoubleClick}>
      <button 
        className="delete-btn" 
        onClick={() => {
          if (Array.isArray(quizzes) && confirm("Delete quiz?")) {
            if (http_delete_quiz(self, quiz.id, () => {})) {
              localStorage.setItem(`quiz_orphans_${ind}`, '[]'); 
              console.log('Deleted:', quizzes.splice(ind, 1), upd());
            }
          }
        }}
      >
        <span className="material-symbols-outlined">delete</span>
      </button>

      <button 
        className="edit-btn" 
        key={ind}
        style={{ '--index': ind }}
        onClick={handleClick}  
        onMouseMove={handleMouseMove}
      >
        {isEditing ? (
          <input
            className="edit-input"
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setNewTitle(quiz.title);
                setIsEditing(false);
              }
            }}
            autoFocus
            style={{
              width: '50%',
              padding: '8px',
              fontSize: '1em',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              borderBottom: '2px solid #4285f4',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span>
            {quiz.title}
            <br />
            {quiz.isInDB ? null : "unsaved"}
          </span>
        )}
      </button>

      <button 
        className="run-btn" 
        onClick={() => startRoomAsHost(navigate, quiz)}
      >
        <span className="material-symbols-outlined">play_arrow</span>
      </button>
    </div>
  );
}

/**
 * @param {NavigateFunction} reactNavigateHookFunction
 */
export function startRoomAsHost(reactNavigateHookFunction, quiz){
  reactNavigateHookFunction("/play/"+getSelfFromLocalStorage().id, {state:{quiz}})
}