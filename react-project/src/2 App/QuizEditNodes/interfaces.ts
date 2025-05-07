interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    quizzes: Quiz[];
    isInDB: boolean;
}

interface Quiz {
    id: number;
    title: string;
    isInDB: boolean;
    startEndNodesPositions: string;
    dateCreated: string | number;
    dateSaved: string | number;
    questions: Question[];
    graphEdges: string;
}

interface Question {
    id: number;
    title: string;
    position: PositionXY;
    choices: Choice[];
}

interface Choice {
    id: number;
    title: string;
    position: PositionXY;
    value: number;
}

interface PositionXY {
    x: number;
    y: number;
}


// interface MouseEvent<T = Element, E = NativeMouseEvent> extends UIEvent<T, E> {
//     altKey: boolean;
//     button: number;
//     buttons: number;
//     clientX: number;
//     clientY: number;
//     ctrlKey: boolean;
//     /**
//      * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
//      */
//     getModifierState(key: string): boolean;
//     metaKey: boolean;
//     movementX: number;
//     movementY: number;
//     pageX: number;
//     pageY: number;
//     relatedTarget: EventTarget | null;
//     screenX: number;
//     screenY: number;
//     shiftKey: boolean;
// }