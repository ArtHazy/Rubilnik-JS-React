import { Panel } from '@xyflow/react';
import { downloadJson } from '../../functions.mjs';
import { startRoomAsHost } from '../ViewLibrary';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { loadQuizFromFile } from './functionsEditor';
import { useNotification } from "../ContextNotification";

import './PanelControls.scss';

/**
 * 
 * @param {{quiz:Quiz, ind:number}} param0 
 * @returns 
 */
export const PanelControls = ({ quiz, ind, onQuizChange }) => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [title, setTitle] = useState(quiz.title);
    const [isTitleFocused, setIsTitleFocused] = useState(false);

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
                    onFocus={() => setIsTitleFocused(true)}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    style={{
                        width: '100%',
                        padding: '4px 0',
                        fontSize: 14,
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        borderBottom: isTitleFocused 
                            ? '2px solid #4285f4' 
                            : '1px solid transparent',
                        transition: 'border-bottom 0.2s ease',
                    }}
                    placeholder="Название викторины..."
                />
            </div>

            <button className="control-button" onClick={()=>{downloadJson(quiz, quiz.title)}}>
                <span className="material-symbols-outlined">download</span>
            </button>

            <label htmlFor="file-input">
                <button className="control-button" onClick={()=>{document.getElementById("file-input").click()}}>
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

            <button className="control-button" onClick={()=>{console.log("test", quiz); startRoomAsHost(navigate, quiz)}}>
                <span className="material-symbols-outlined">
                    play_arrow
                </span>
            </button>
        </Panel>
    );
};