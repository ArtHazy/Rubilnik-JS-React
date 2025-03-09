export const limits = {
    maxEmailLength: 32,
    maxPassLength: 32,
    maxNameLength: 32,
    maxChoicesLength: 4,
    maxQuestionsLength: 20,
    maxQuizzesLength: 20,
    maxQuizFileSise: 1024,
}
export const CORE_SERVER_URL = 'http://'+(import.meta.env.VITE_BACKEND_URL)
export const CORE_SERVER_URL_WS = 'ws://'+(import.meta.env.VITE_BACKEND_URL)+'/socket'