import {useEffect, useState, useMemo } from "react"
import { WSPlayAPI } from "../WS_communication.mjs";
import "./ViewQuestion.scss"

const isImageUrl = (url) => {
  return /^(https?:\/\/|data:image\/).+\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(url);
};

const extractMedia = (text) => {
  if (!text) return { cleanText: '', mediaUrl: null };
  
  // Ищем все вхождения [url]
  const matches = [...text.matchAll(/\[(.*?)\]/g)];
  let cleanText = text;
  let mediaUrl = null;
  
  // Обрабатываем только первое валидное изображение
  for (const match of matches) {
    const url = match[1].trim();
    if (!mediaUrl && isImageUrl(url)) {
      mediaUrl = url;
      cleanText = cleanText.replace(match[0], '');
    }
  }
  
  return { cleanText, mediaUrl };
};

export const ViewQuestion = ({isHost, socket, currentQuestion, setCurrentQuestion, setCurrentQuestionInd, isFinished, onNext, player, t}) => {

  const [revealedChoices, setrevealedChoices] = useState([])

  useEffect(() => {
    console.log(socket);

    if (socket instanceof WSPlayAPI){
      socket.eventActions.next = ({question, index})=>{ //,,quizLength
        console.log(question);
        setCurrentQuestion(question)
        setCurrentQuestionInd(index)
        setrevealedChoices([]); // setIsRevealed(false)
      }
      socket.eventActions.reveal = ({revealedChoices})=>{
        console.log('alert: revealed correct choices:', revealedChoices);
        setrevealedChoices(revealedChoices)
      }
      socket.eventActions.choice = ({user,questionId,choiceInd})=>{
        player.recordUserChoice(user, questionId, choiceInd);
      }
    }
  },[])

  const questionMedia = useMemo(() => {
    return extractMedia(currentQuestion?.title || '');
  }, [currentQuestion]);

  function renderChoices() {
    const letters = ["A", "B", "C", "D"]
    const isRevealed = revealedChoices.length > 0

    let choicesToRender = isRevealed ? revealedChoices : currentQuestion?.choices;

    return choicesToRender?.map((choice,ind) => {
      const { cleanText, mediaUrl } = extractMedia(choice.title);
      
      const choiceContent = (
        <div>
          <div className="choice-text">{cleanText}</div>
          {mediaUrl && (
            <div className="choice-media">
              <img 
                src={mediaUrl} 
                alt={t('quizFlow.imageAlt')} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  borderRadius: '8px',
                  marginTop: '8px'
                }}
              />
            </div>
          )}
          <div className="letter">{letters[ind]}</div>
        </div>
      );

      return isHost? 
        <div className={"choice _"+ind+" "+(choice.correct?"correct ":" ")+(isRevealed?"revealed ":" ")} key={JSON.stringify(choice)}>
          {choiceContent}
          <div className="letter">{letters[ind]}</div>
        </div>
      : 
        <div className={"choice _"+ind+" "+(choice.correct?"correct ":" ")+(isRevealed?"revealed ":" ")} key={JSON.stringify(choice)} 
          onClick={ (!isHost && !isRevealed)? ()=>socket.emitChoice(currentQuestion.id, ind) : null }
          disabled={isRevealed}
          aria-label={t('question.choiceLabel', { letter: letters[ind] })}
        >
          {choiceContent}
          <div className="letter">{letters[ind]}</div>
        </div>
    })
  }
  if (socket instanceof WSPlayAPI && socket.isOpen()) return (
    <div className="ViewQuestion">
      <div className="head">
        <div className="title">{questionMedia.cleanText}</div>
        {questionMedia.mediaUrl && (
          <div className="question-media">
            <img 
              src={questionMedia.mediaUrl} 
              alt={t('quizFlow.imageAlt')} 
            />
          </div>
        )}
      </div>
      <div className="body">
        <div className="choices">{ renderChoices() }</div>
      </div>
      <div className="controls">
        {/* {isHost? <button onClick={()=>socket.emitReveal() }>{t('question.revealButton')}</button> : null} */}
        {isHost? <button className="question_next_btn" onClick={onNext} aria-label={isFinished ? t('question.endButton') : t('question.nextButton')}>
          {isFinished ? t('question.endButton') : t('question.nextButton')} </button> 
        : null}
      </div>
    </div>
  ) 
  else return <div>{t('question.connectionError')}</div>
}