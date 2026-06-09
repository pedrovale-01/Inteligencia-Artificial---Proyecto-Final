/* Estado global compartido */

const STATE = {
  map: null,
  markers: [],
  polylines: [],
  pathLine: null,
  comparePaths: [],   // rutas coloreadas por algoritmo en modo comparar

  origin: -1,
  dest: -1,
  mode: 'idle',
  selectedAlgo: 'dijkstra',
  activeLayer: 'departamentos',  // 'departamentos' | 'provincias' | 'todos'

  dist: [],
  prev: [],
  visited: new Set(),
  inQueue: new Set(),

  stepQueue: [],
  stepIdx: 0,
  stepMode: false,
  path: [],

  adj: Array.from({ length: NODES.length }, () => [])
};

function initializeGraph() {
  EDGES.forEach(([a, b, w]) => {
    STATE.adj[a].push({ to: b, w });
    STATE.adj[b].push({ to: a, w });
  });
}

initializeGraph();
