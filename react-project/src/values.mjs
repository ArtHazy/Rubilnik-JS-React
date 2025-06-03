export const limits = {
    maxEmailLength: 32,
    maxPassLength: 32,
    maxNameLength: 32,
    maxChoicesLength: 4,
    maxQuestionsLength: 20,
    maxQuizzesLength: 20,
    maxQuizFileSize: 1024,
}

// compiled services provider data
export const SERVER = window.server || {label:"debug", LABELS: {desktop:"desktop",local:"local",debug:"debug"}}
console.log("window.server", window.server)
console.log('server', SERVER)
// for docker run on server
const UI_SERVICE_CENTRAL_SERVER_URL = 'http://'+(import.meta.env.VITE_UI_SERVICE_CENTRAL_SERVER_URL_BASE)
const AUTH_SERVICE_CENTRAL_SERVER_URL = 'http://'+(import.meta.env.VITE_AUTH_SERVICE_CENTRAL_SERVER_URL_BASE)
const ROOM_SERVICE_CENTRAL_SERVER_URL = 'ws://'+(import.meta.env.VITE_ROOM_SERVICE_CENTRAL_SERVER_URL_BASE)+'/ws'
// for desktop app run
const AUTH_SERVICE_LOCAL_SERVER_URL = 'http://'+SERVER?.ip+':'+SERVER?.auth_port
const ROOM_SERVICE_LOCAL_SERVER_URL = 'ws://'+SERVER?.ip+':'+SERVER?.room_port+'/ws'

export const UI_SERVICE_URL = SERVER?.label=="local"? AUTH_SERVICE_LOCAL_SERVER_URL : UI_SERVICE_CENTRAL_SERVER_URL
export const AUTH_SERVICE_URL = SERVER?.label=="local"? AUTH_SERVICE_LOCAL_SERVER_URL : AUTH_SERVICE_CENTRAL_SERVER_URL
export const ROOM_SERVICE_URL = SERVER?.label=="local"? ROOM_SERVICE_LOCAL_SERVER_URL : ROOM_SERVICE_CENTRAL_SERVER_URL