import { useState, useRef, useEffect } from "react";
import { limits } from "../values.mjs";
import { getSelfFromLocalStorage, putSelfInLocalStorage } from "../functions.mjs"
import { http_delete_quiz, http_post_quiz, http_put_quiz } from "../HTTP_requests.mjs";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useNotification } from "../Components/ContextNotification";
import { Header } from '../Components/Header';
import "./ViewLibrary.scss"

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.screen.width <= 1024 || window.screen.height <= 768;
      
      setIsMobile(isMobileUA && isTouchDevice && isSmallScreen);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
};

export const ViewLibrary = () => {
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const [self, setSelf] = useState(() => getSelfFromLocalStorage());
  const quizzes = self?.quizzes;
  const isMobile = useIsMobile();

  const updateSelf = (newSelf) => {
    putSelfInLocalStorage(newSelf);
    setSelf(newSelf);
  };

  return <div className="ViewLibrary">
    <Header title={t('library.title')}/>
    <div className="grid">
      {Array.isArray(quizzes)? quizzes.map((q,i)=>
        <QuizTile quiz={q} ind={i} self={self} setSelf={setSelf} updateSelf={updateSelf} t={t} isMobile={isMobile} showNotification={showNotification}/>
      ): null}
      
      {((isMobile === false) && (!quizzes || quizzes.length<limits.maxQuizzesLength))? 
        <button id="add" onClick={()=>{
          let newQuiz = {title: t('library.newQuizTitle'), questions:[]}
          let {isOk, quiz} = http_post_quiz(self,newQuiz,()=>{});
          if (isOk) {
            const newSelf = {...self};
            if (!Array.isArray(quizzes)) newSelf.quizzes = [];
            newSelf.quizzes.push({...quiz, isInDB:true});
            updateSelf(newSelf);
          }
        }}><span className="material-symbols-outlined">add</span></button>
      : null}
    </div>
  </div>
}

export const QuizTile = ({quiz, ind, self, setSelf, updateSelf, t, isMobile, showNotification}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(quiz.title);
  const clickTimeoutRef = useRef(null);
  const isPreloadedRef = useRef(false); // Флаг предзагрузки
  const clickCountRef = useRef(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  };

  const handleClick = () => {
    // Предзагрузка компонента
    if (!isPreloadedRef.current && !isMobile) {
      import("./QuizEditNodes/ReactFlowComponent").then(module => {
        isPreloadedRef.current = true;
      });
    }

    clickCountRef.current++;
    
    if (clickCountRef.current === 1) {
      // Первый клик - устанавливаем таймер
      clickTimeoutRef.current = setTimeout(() => {
        if (isMobile) {
          showNotification(t('library.mobileEditorDisabled'));
        } 
        else if (clickCountRef.current === 1 && !isEditing) {
          console.log("Одинарный клик");
          navigate(`/edit-quiz/${ind}`);
        }
        clickCountRef.current = 0;
      }, 300);
    } else if (clickCountRef.current === 2) {
      // Второй клик - обрабатываем как двойной
      clearTimeout(clickTimeoutRef.current);
      clickCountRef.current = 0;
      setIsEditing(true);
    }
  };

  const handleTitleSave = () => {
    if (!isEditing) return;
    if (newTitle.trim() !== quiz.title) {
      const updatedQuiz = {...quiz, title: newTitle.trim()};
      
      // Отправляем на сервер
      const { isOk, quiz: serverQuiz } = http_put_quiz(self, updatedQuiz, () => {});
      
      if (isOk) {
        const newSelf = {...self};
        newSelf.quizzes = [...newSelf.quizzes];
        newSelf.quizzes[ind] = serverQuiz;
        updateSelf(newSelf);
      } else {
        setNewTitle(quiz.title);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (Array.isArray(self.quizzes) && confirm(t('library.deleteConfirm'))) {
      if (http_delete_quiz(self, quiz.id, () => {})) {
        localStorage.setItem(`quiz_orphans_${ind}`, '[]');
        const newSelf = {...self};
        newSelf.quizzes = [
          ...newSelf.quizzes.slice(0, ind),
          ...newSelf.quizzes.slice(ind + 1)
        ];
        updateSelf(newSelf);
      }
    }
  };


  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className='quiz-tile-container'>
      <button 
        className="delete-btn" 
        onClick={handleDelete}
        aria-label={t('library.deleteButton')}
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
            onClick={(e) => e.stopPropagation()}
            placeholder={t('library.editPlaceholder')}
          />
        ) : (
          <span>
            {quiz.title}
            <br />
            {quiz.isInDB ? null : t('library.unsavedLabel')}
          </span>
        )}
      </button>

      <button 
        className="run-btn" 
        onClick={() => startRoomAsHost(navigate, quiz)}
        aria-label={t('library.playButton')}
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