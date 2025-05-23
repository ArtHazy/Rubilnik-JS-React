import { convertToFlowElements } from "../2 App/QuizEditNodes/ReactFlowComponent";

export class QuizPlayer {
    constructor(quiz, ind) {
        const { nodes: initialNodes, edges: initialEdges } = convertToFlowElements(quiz, ind);
        this.nodes = initialNodes;
        this.edges = initialEdges;
        this.currentNode = this.findStartNode();
        this.history = [];
    }
  
    // Находим стартовую ноду
    findStartNode() {
        const startNode = this.nodes.find(n => n.type === 'start');
        if (!startNode) throw new Error('Start node not found');
        const startEdge = this.edges.find(e => e.source === startNode.id);
        if (!startEdge) throw Error('Initial question missing');
        return this.getNodeById(startEdge.target);
    }

    getChildChoices(questionId) {
        return this.edges
            .filter(e => e.source === questionId && e.condition === -1)
            .map(e => this.getNodeById(e.target));
    }

    next() {
        if (this.currentNode.type === 'end') return;

        if (this.currentNode.type === 'choice') {
            const nextEdge = this.edges.find(e => 
              e.source === this.currentNode.id && 
              e.condition !== -1
            );
            
            this.currentNode = nextEdge 
              ? this.getNodeById(nextEdge.target) 
              : { type: 'end' };
            return;
        }
        
        if (this.currentNode.type === 'question') {
            const choices = this.getChildChoices(this.currentNode.id);
            const nextNodes = this.collectNextNodes(choices);

            if (nextNodes.size === 0) {
                this.currentNode = { type: 'end' };
            } else if (nextNodes.size === 1) {
                this.history.push(this.currentNode);
                this.currentNode = nextNodes.values().next().value;
            } else {
                throw new Error('Неоднозначный переход. Требуется обработка условий');
            }
        }
    }

    collectNextNodes(choices) {
        const targets = new Set();
        
        for (const choice of choices) {
            const edgesFromChoice = this.edges.filter(e => 
                e.source === choice.id && 
                e.condition !== -1
            );
            
            // Для будущей обработки условий
            const validEdges = edgesFromChoice.filter(e => 
                this.checkCondition(e.condition) // Заглушка для будущей логики
            );
            
            validEdges.forEach(e => targets.add(this.getNodeById(e.target)));
        }
        
        return targets;
    }

    checkCondition(condition) {
        return true; // Всегда true для текущей реализации
    }
  
    getNodeById(id) {
        return this.nodes.find(n => n.id === id);
    }

    getCurrentState() {
        const isEnd = this.currentNode.type === 'end';
        let isDeadEnd = false;

        if (this.currentNode.type === 'question') {
            const childChoices = this.getChildChoices(this.currentNode.id);
            if (childChoices.length === 0) {
                isDeadEnd = true; // Нет choice — тупик
            } else {
                // Проверяем, все ли choice ведут только в end
                let allPathsLeadToEnd = true;
                
                for (const choice of childChoices) {
                    const edgesFromChoice = this.edges.filter(e => 
                        e.source === choice.id && e.condition !== -1
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
            }    
        } else if (this.currentNode.type === 'choice') {
            const nextEdges = this.edges.filter(e => 
                e.source === this.currentNode.id && e.condition !== -1
            );
            isDeadEnd = nextEdges.length === 0;
        }

        return {
            node: this.currentNode,
            isFinished: isEnd || isDeadEnd
        };
    }
  }