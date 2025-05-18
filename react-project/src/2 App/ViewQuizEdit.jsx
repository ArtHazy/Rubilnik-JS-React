import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getSelfFromLocalStorage } from "../functions.mjs"
import { ReactFlowProvider } from '@xyflow/react';

import ReactFlowComponent from "./QuizEditNodes/ReactFlowComponent"

//new imports
import 'reactflow/dist/style.css';
import './index.css';
import "./ViewQuizEdit.scss"

// Иконки
const rem = <span className="material-symbols-outlined">remove</span>;
const del = <span className="material-symbols-outlined">delete</span>;
const drop_down = <span className="material-symbols-outlined">arrow_drop_down</span>;
const drop_up = <span className="material-symbols-outlined">arrow_drop_up</span>;

export const ViewQuizEdit = () => {
    const {ind} = useParams()

    const self = useMemo(() => getSelfFromLocalStorage(), [localStorage.getItem('self')]);
    const [quiz, setQuiz] = useState(self.quizzes[ind] ?? []);

    const navigate = useNavigate()

    useEffect(() => {
        const handleBackButton = (e) => {
            alert('Вы покидаете страницу редактирования!')
            // Блокировка стандартного поведения истории
            window.history.pushState(null, '', window.location.href)
        }

        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = '' // Требуется для Chrome
            alert('Страница будет перезагружена!')
        }

        // Добавляем начальное состояние в историю
        window.history.pushState(null, '', window.location.href)

        window.addEventListener('popstate', handleBackButton)
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('popstate', handleBackButton)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [navigate])



    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <ReactFlowProvider>
                <ReactFlowComponent self={self} quiz={quiz} onQuizChange={setQuiz} />
            </ReactFlowProvider>
        </div>
    );
}