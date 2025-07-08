import { convertToFlowElements } from "../2 App/QuizEditNodes/functionsEditor";
import { useNotification } from "../Components/ContextNotification";

export class QuizPlayer {
    constructor(quiz, onQuizChange, ind) {
        const { nodes: initialNodes, edges: initialEdges } = convertToFlowElements(quiz, onQuizChange, ind);
        this.nodes = initialNodes;
        this.edges = initialEdges;
        this.currentNode = this.findStartNode();
        this.history = [];

        this.userAnswers = new Map(); // questionId -> Map(userId -> choiceInd)
        this.choiceCounts = new Map(); // questionId -> Map(choiceInd -> count)
        const { showNotification } = useNotification();
    }

    getNodeById(id) {
        console.log(`[getNodeById] Looking for node with ID: ${id}`);
        const node = this.nodes.find(n => n.id === id);
        console.log(`[getNodeById] Found node:`, node);
        return node;
    }

    getChildChoices(questionId) {
        console.groupCollapsed(`[getChildChoices] For question node: ${questionId}`);
        
        const choiceEdges = this.edges.filter(e => 
            e.source === questionId && e.data.condition === -1
        );
        console.log("Found choice edges:", choiceEdges);
        
        const choices = choiceEdges.map(e => this.getNodeById(e.target));
        console.log("Child choices nodes:", choices);
        
        console.groupEnd();
        return choices;
    }

    getQuestionAnswers(questionId) {
        return this.userAnswers.get(questionId) || new Map();
    }

    getCurrentQuestionDbId() {
        if (this.currentNode.type === 'question') {
            const dbId = this.currentNode.data.question.id;
            console.log(`[getCurrentQuestionDbId] Current question DB ID: ${dbId}`);
            return dbId;
        }
        console.log("[getCurrentQuestionDbId] Current node is not a question");
        return null;
    }

    getTotalAnswers(questionDbId) {
        console.groupCollapsed(`[getTotalAnswers] For question DB ID: ${questionDbId}`);

        if (!this.userAnswers.has(questionDbId)) {
            console.warn(`No answers found for Q${questionDbId}`);
            return 0;
        }
        
        // Суммируем все ответы (может быть >1 ответа на пользователя в разных версиях)
        let total = 0;
        const counts = this.choiceCounts.get(questionDbId);

        console.log("Counts map:", counts);

        for (const count of counts.values()) {
            total += count;
        }
        
        console.log(`Total answers: ${total}`);
        console.groupEnd();

        return total;
    }

    getAllAnswers() {
        return this.userAnswers;
    }

    getChoiceCount(questionDbId, choiceInd) {
        console.groupCollapsed(`[getChoiceCount] For Q${questionDbId}, choice index ${choiceInd}`);
        
        if (!this.choiceCounts.has(questionDbId)) {
            console.log("No counts found, returning 0");
            console.groupEnd();
            return 0;
        }
        
        const count = this.choiceCounts.get(questionDbId).get(choiceInd) || 0;
        console.log(`Count: ${count}`);
        console.groupEnd();
        return count;
    }

    getChoiceDistribution(questionDbId) {
        if (!this.choiceCounts.has(questionDbId)) return new Map();
        return new Map(this.choiceCounts.get(questionDbId));
    }

    // Находим стартовую ноду
    findStartNode() {
        const startNode = this.nodes.find(n => n.type === 'start');
        if (!startNode) throw new Error('Start node not found');
        const startEdge = this.edges.find(e => e.source === startNode.id);
        if (!startEdge) throw Error('Initial question missing');
        return this.getNodeById(startEdge.target);
    }

    recordUserChoice(user, questionDbId, choiceInd) {
        console.groupCollapsed(`[recordUserChoice] User ${user.name} answers to Q${questionDbId}: choice ${choiceInd}`);
        
        // Initialize storage if needed
        if (!this.userAnswers.has(questionDbId)) {
            console.log(`Creating new storage for Q${questionDbId}`);
            this.userAnswers.set(questionDbId, new Map());
            this.choiceCounts.set(questionDbId, new Map());
        }
        
        const questionAnswers = this.userAnswers.get(questionDbId);
        const countsMap = this.choiceCounts.get(questionDbId);
        
        if (questionAnswers.has(user.id)) {
            const prevChoice = questionAnswers.get(user.id).choiceInd;
            console.log(`Removing previous choice ${prevChoice} for user ${user.id}`);

            countsMap.set(prevChoice, (countsMap.get(prevChoice) || 1) - 1);
        }
        
        questionAnswers.set(user.id, {
            user,
            choiceInd,
            timestamp: Date.now()
        });
        
        const newCount = (countsMap.get(choiceInd) || 0) + 1;
        countsMap.set(choiceInd, newCount);
        
        console.log("Updated answers:", questionAnswers);
        console.log("Updated counts:", countsMap);
        console.groupEnd();
    }

    next() {
        console.log("next");
        console.log("Current node:", this.currentNode);

        if (this.currentNode.type === 'end') return;

        if (this.currentNode.type === 'choice') {
            console.log("Processing choice node");

            const nextEdge = this.edges.find(e => 
              e.source === this.currentNode.id
            );
            console.log("Found next edge:", nextEdge);
            
            if (nextEdge) {
                this.currentNode = this.getNodeById(nextEdge.target);
                console.log("Moving to node:", this.currentNode);
            } else {
                this.currentNode = { type: 'end' };
                console.log("No edge found, moving to end");
            }

            console.groupEnd();
            return;
        }
        
        if (this.currentNode.type === 'question') {
            console.log("Processing question node");

            const nextNodeId = this.calculateNextNode();
            console.log("Calculated next node ID:", nextNodeId);
            
            if (nextNodeId) {
                this.history.push(this.currentNode);
                this.currentNode = this.getNodeById(nextNodeId);
                console.log("Moving to node:", this.currentNode);
            } else {
                this.currentNode = { type: 'end' };
            }
        }
    }

    calculateNextNode() {
        console.groupCollapsed("[calculateNextNode]");

        // Получаем ID вопроса в БД из текущего узла
        const questionDbId = this.getCurrentQuestionDbId();
        if (!questionDbId) {
            console.log("No question DB ID, returning null");
            showNotification("No question DB ID, returning null", 'error') //БЕЗ ПЕРЕВОДА
            console.groupEnd();
            return null;
        }
        
        console.log(`Processing question DB ID: ${questionDbId}`);
        const choices = this.getChildChoices(this.currentNode.id);
        console.log("Child choices:", choices);

        // 1. Проверка на единственный путь к следующему вопросу
        const questionEdges = [];
        for (const choice of choices) {
            // Находим все ребра, исходящие из этого choice
            const edgesFromChoice = this.edges.filter(e => e.source === choice.id);
            
            // Проверяем каждое ребро на подключение к вопросу
            for (const edge of edgesFromChoice) {
                const targetNode = this.getNodeById(edge.target);
                if (targetNode.type === 'question') {
                    questionEdges.push({
                        choice,
                        edge,
                        targetNode
                    });
                }
            }
        }
        
        console.log("Edges leading to questions:", questionEdges);
        
        // Если только одно ребро ведет к вопросу
        if (questionEdges.length === 1) {
            console.log("Single path to next question found");
            console.groupEnd();
            return questionEdges[0].edge.target;
        }

        // 2. Продолжаем стандартную логику

        const totalAnswers = this.getTotalAnswers(questionDbId);
        console.log(`Total answers: ${totalAnswers}`);
        
        if (totalAnswers === 0) {
            console.log("No answers available, returning null");
            console.groupEnd();

            return null;
        }

        // Собираем данные о всех вариантах
        const choicesData = choices.map((choice, index) => {
            const count = this.getChoiceCount(questionDbId, index);
            const percentage = (totalAnswers <= 0)? 0 : count / totalAnswers * 100;
            
            // Находим ребро для этого варианта
            const edge = this.edges.find(e => e.source === choice.id);
            const condition = edge ? edge.data.condition : -1;
            
            return {
                index,
                choice,
                percentage,
                condition,
                edge
            };
        });

        // 1. Найти вариант с максимальным процентом голосов
        const maxPercentage = Math.max(...choicesData.map(c => c.percentage));
    
        // Фильтруем варианты с максимальным процентом
        const bestChoices = choicesData.filter(c => 
            Math.abs(c.percentage - maxPercentage) < 0.01 // учет погрешности
        );
        
        // Сортируем лучшие варианты по условию (по убыванию)
        bestChoices.sort((a, b) => b.condition - a.condition);
        
        console.log("Best choices:", bestChoices);

        // Перебираем варианты от самого высокого условия к самому низкому
        for (const choice of bestChoices) {
            if (!choice.edge) continue;
            
            console.log(`Checking choice ${choice.index} with condition ${choice.condition}%`);
            
            if (choice.condition === -1 || choice.percentage >= choice.condition) {
                console.log("Condition met, moving to next node");
                console.groupEnd();
                return choice.edge.target;
            }
        }
        
        console.log("No valid choice found");
        console.groupEnd();
        return null;
    }

    getCurrentState() {
        console.groupCollapsed("[getCurrentState]");

        const isEnd = this.currentNode.type === 'end';
        let isDeadEnd = false;
        console.log(`Current node type: ${this.currentNode.type}, isEnd: ${isEnd}`);

        if (this.currentNode.type === 'question') {
            console.log("Processing question node for dead end");

            const childChoices = this.getChildChoices(this.currentNode.id);
            console.log("Child choices:", childChoices);

            if (childChoices.length === 0) {
                isDeadEnd = true; // Нет choice — тупик
                console.log("No child choices - dead end");
            } else {
                // Проверяем, все ли choice ведут только в end
                let allPathsLeadToEnd = true;
                console.log("Checking if all paths lead to end");
                
                for (const choice of childChoices) {
                    const edgesFromChoice = this.edges.filter(e => 
                        e.source === choice.id
                    );
    
                    // Если у choice нет переходов — считаем тупиком (как end)
                    if (edgesFromChoice.length === 0) continue;
    
                    // Проверяем, все ли переходы choice ведут в end
                    const hasNonEndPath = edgesFromChoice.some(edge => {
                        const targetNode = this.getNodeById(edge.target);
                        return targetNode.type !== 'end';
                    });
    
                    if (hasNonEndPath) {
                        allPathsLeadToEnd = false;
                        break;
                    }
                }
    
                isDeadEnd = allPathsLeadToEnd;
                console.log(`All paths lead to end: ${allPathsLeadToEnd}`);
            }    
        } else if (this.currentNode.type === 'choice') {
            console.log("Processing choice node for dead end");

            const nextEdges = this.edges.filter(e => 
                e.source === this.currentNode.id
            );
            console.log("Outgoing edges:", nextEdges);

            isDeadEnd = nextEdges.length === 0;
            console.log(`No outgoing edges: ${isDeadEnd}`);
        }

        const result = {
            node: this.currentNode,
            isFinished: isEnd || isDeadEnd
        };
        
        console.log("Returning state:", result);
        console.groupEnd();
        return result;
    }
}