import React, { useMemo } from 'react';

const findViolatingEdges = (edges) => {
  const violatingEdges = [];

  // 1. Проверка на петли
  const loops = edges.filter(edge => edge.source === edge.target);
  violatingEdges.push(...loops.map(edge => edge.id));

  // 2. Построение графа и маппинга (source -> target) -> edge.id
  const graph = {};
  const edgeMap = {}; // Ключ: "source-target", значение: id ребра

  edges.forEach(edge => {
    if (!graph[edge.source]) graph[edge.source] = [];
    graph[edge.source].push(edge.target);
    edgeMap[`${edge.source}-${edge.target}`] = edge.id;
  });

  // 3. Поиск циклов через DFS
  const visited = {};
  const onStack = {};
  const cycleEdges = new Set();

  const dfs = (node, path) => {
    if (visited[node]) return false;
    visited[node] = true;
    onStack[node] = true;
    path.push(node);

    for (const neighbor of graph[node] || []) {
      const edgeKey = `${node}-${neighbor}`;
      if (onStack[neighbor]) {
        // Найден цикл: извлекаем ребра из пути
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycle.push(neighbor); // Замыкаем цикл

        for (let i = 0; i < cycle.length - 1; i++) {
          const u = cycle[i];
          const v = cycle[i + 1];
          const key = `${u}-${v}`;
          if (edgeMap[key]) cycleEdges.add(edgeMap[key]);
        }
        return true;
      }
      if (dfs(neighbor, [...path])) return true;
    }

    onStack[node] = false;
    return false;
  };

  Object.keys(graph).forEach(node => {
    if (!visited[node]) dfs(node, []);
  });

  violatingEdges.push(...Array.from(cycleEdges));
  return [...new Set(violatingEdges)]; // Удаляем дубликаты
};

// Пример использования в React-компоненте
const GraphValidator = () => {
  const edges = [
    { id: 'id1', source: '1', target: '2' },
    { id: 'id2', source: '2', target: '4' },
    { id: 'id3', source: '1', target: '3' },
    { id: 'id4', source: '3', target: '4' },
    { id: 'id5', source: '4', target: '1' }, // Цикл 1->2->4->1
    { id: 'id6', source: '5', target: '5' }, // Петля
  ];

  const violatingEdges = useMemo(() => findViolatingEdges(edges), [edges]);

  return (
    <div>
      <h3>Нарушающие ребра:</h3>
      <ul>
        {violatingEdges.map(id => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </div>
  );
};

export default GraphValidator;