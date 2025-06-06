import { useState, useMemo, lazy } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getSelfFromLocalStorage } from "../functions.mjs"
import { ReactFlowProvider } from '@xyflow/react';

// import ReactFlowComponent from "./QuizEditNodes/ReactFlowComponent"
const ReactFlowComponent = lazy(() => import("./QuizEditNodes/ReactFlowComponent"))

//new imports
import '@xyflow/react/dist/base.css';
import './index.css';

export const ViewQuizEdit = () => {
    const {ind} = useParams()

    const self = useMemo(() => getSelfFromLocalStorage(), [localStorage.getItem('self')]);
    const [quiz, setQuiz] = useState(self.quizzes[ind] ?? []);

    const navigate = useNavigate()

    // useEffect(() => {
    //     const handleBackButton = (e) => {
    //         alert('Вы покидаете страницу редактирования!')
    //         // Блокировка стандартного поведения истории
    //         window.history.pushState(null, '', window.location.href)
    //     }

    //     const handleBeforeUnload = (e) => {
    //         e.preventDefault()
    //         e.returnValue = '' // Требуется для Chrome
    //         alert('Страница будет перезагружена!')
    //     }

    //     // Добавляем начальное состояние в историю
    //     window.history.pushState(null, '', window.location.href)

    //     window.addEventListener('popstate', handleBackButton)
    //     window.addEventListener('beforeunload', handleBeforeUnload)

    //     return () => {
    //         window.removeEventListener('popstate', handleBackButton)
    //         window.removeEventListener('beforeunload', handleBeforeUnload)
    //     }
    // }, [navigate])

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <ReactFlowProvider>
                <ReactFlowComponent self={self} quiz={quiz} onQuizChange={setQuiz} />
            </ReactFlowProvider>
        </div>
    );
}