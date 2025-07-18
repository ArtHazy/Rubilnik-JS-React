import { Panel } from '@xyflow/react';
import { downloadJson } from '../../functions.mjs';
import { startRoomAsHost } from '../ViewLibrary';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { loadQuizFromFile } from './functionsEditor';
import { useNotification } from "../../Components/ContextNotification";
import { useTranslation } from 'react-i18next';

import './PanelControls.scss';

/**
 * 
 * @param {{quiz:Quiz, ind:number}} param0 
 * @returns 
 */
export const PanelControls = ({ quiz, ind, onQuizChange }) => {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [title, setTitle] = useState(quiz.title);

    useEffect(() => {
        setTitle(quiz.title);
    }, [quiz.title]);

    const handleTitleSave = () => {
        if (title.trim() !== quiz.title) {
            onQuizChange({ ...quiz, title: title.trim() });
        }
    };

    return (
        <Panel position='top-left' className="panel-controls-container">
            <div className="title-container">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    placeholder={t('library.quizTitlePlaceholder')}
                />
            </div>

            <div className="buttons-block">
                <button className="control-button" 
                    onClick={()=>{downloadJson(quiz, quiz.title)}}
                    title={t('library.downloadButton')} // Всплывающая подсказка !!!!!
                >
                    <span className="material-symbols-outlined">download</span>
                </button>

                <label htmlFor="file-input">
                    <button className="control-button" 
                        onClick={()=>{document.getElementById("file-input").click()}}
                        title={t('library.uploadButton')} // Всплывающая подсказка !!!!!
                    >
                        <span className="material-symbols-outlined">upload</span>
                    </button>
                </label>

                <input className="file-input" id="file-input" type="file" 
                    onChange={(e) => { 
                        const inputElement = e.target
                        loadQuizFromFile(e.target.files[0], quiz, onQuizChange, showNotification); 
                        inputElement.value = null;
                    }
                }/>

                <button className="control-button" 
                    onClick={()=>{console.log("test", quiz); 
                    startRoomAsHost(navigate, quiz)}}
                    title={t('library.playButton')} // Всплывающая подсказка !!!!!
                >
                    <span className="material-symbols-outlined">
                        play_arrow
                    </span>
                </button>
            </div>
        </Panel>
    );
};