import { Panel } from '@xyflow/react';
import { downloadJson } from '../../functions.mjs';
import { startRoomAsHost } from '../ViewLibrary';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

/**
 * 
 * @param {{quiz:Quiz, ind:number}} param0 
 * @returns 
 */
export const PanelControls = ({ quiz, ind, onQuizChange }) => {
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
        <Panel 
            position='top-left' 
            style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
                padding: 8,
                border: `2px dashed #B0B0B0`,
                boxShadow: `0 4px 20px rgba(36, 36, 36, 0.12)`,
                borderRadius: 12,
                backdropFilter: 'blur(4px)',
                position: 'absolute',
                zIndex: 1000,
            }}
        >
            {/* <button id="save" onClick={()=>{ 
                let self = getSelfFromLocalStorage();
                const { isOk, quiz: quizNew } = http_put_quiz(self, quiz, ()=>{});
                if (isOk) {
                    self.quizzes[ind] = quizNew;
                    console.log("SRLF", self.quizzes[ind]);
                    putSelfInLocalStorage(self);
                }

            }}> save </button> */}

            <div style={{ 
                marginBottom: 8,
                paddingBottom: 4,
                borderBottom: '1px solid #e0e0e0'
            }}>
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

            <button onClick={()=>{downloadJson(quiz, quiz.title)}}>
                <span className="material-symbols-outlined">download</span>
            </button>

            <label htmlFor="file-input">
                <button onClick={()=>{document.getElementById("file-input").click()}}>
                    <span className="material-symbols-outlined">upload</span>
                </button>
            </label>

            <input style={{display:"none"}} id="file-input" type="file" 
                onChange={(e) => {
                    loadQuizFromFile(e.target.files[0]); 
                    // putSelfInLocalStorage(getSelfFromLocalStorage().quizzes[ind] = quiz)
                }
            }/>

            <button onClick={()=>{console.log("test", quiz); startRoomAsHost(navigate, quiz)}}>
                <span className="material-symbols-outlined">
                    play_arrow
                </span>
            </button>
        </Panel>
    );
};