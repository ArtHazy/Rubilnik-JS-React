export const checkGraphValidity = (nodes, edges) => {
  const violatingEdges = [];

  // Проверка на петли
  const loopEdges = edges.filter(edge => edge.source === edge.target);
  violatingEdges.push(...loopEdges.map(e => e.id));

  // Построение графа для поиска циклов
  const graph = {};
  const edgeMap = {};

  edges.forEach(edge => {
    if (!graph[edge.source]) graph[edge.source] = [];
    graph[edge.source].push(edge.target);
    edgeMap[`${edge.source}-${edge.target}`] = edge.id;
  });

  // Поиск циклов через DFS
  const visited = {};
  const onStack = {};
  const cycleEdges = new Set();

  const detectCycles = (node, path) => {
    if (onStack[node]) {
      const cycleStartIdx = path.indexOf(node);
      const cycle = path.slice(cycleStartIdx);
      for (let i = 0; i < cycle.length; i++) {
        const u = cycle[i];
        const v = cycle[(i + 1) % cycle.length];
        const edgeKey = `${u}-${v}`;
        if (edgeMap[edgeKey]) cycleEdges.add(edgeMap[edgeKey]);
      }
      return;
    }

    if (visited[node]) return;

    visited[node] = true;
    onStack[node] = true;
    path.push(node);

    graph[node]?.forEach(neighbor => {
      detectCycles(neighbor, [...path]);
    });

    onStack[node] = false;
    path.pop();
  };

  Object.keys(graph).forEach(node => {
    if (!visited[node]) detectCycles(node, []);
  });

  violatingEdges.push(...Array.from(cycleEdges));
  return violatingEdges;
};