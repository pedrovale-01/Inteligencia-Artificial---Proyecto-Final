/* Módulo: algoritmos de pathfinding */

const AlgorithmModule = {

  dijkstra() {
    const N = NODES.length;
    STATE.dist = Array(N).fill(Infinity);
    STATE.prev = Array(N).fill(-1);
    STATE.dist[STATE.origin] = 0;
    const steps = [], pq = [[0, STATE.origin]], vis = new Set();

    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, u] = pq.shift();
      if (vis.has(u)) continue;
      vis.add(u);

      steps.push({ type:'visit', node:u, dist:d, vis:new Set(vis), queue:new Set(pq.map(x=>x[1])) });

      for (const { to:v, w } of STATE.adj[u]) {
        if (!vis.has(v) && STATE.dist[u]+w < STATE.dist[v]) {
          STATE.dist[v] = STATE.dist[u]+w;
          STATE.prev[v] = u;
          pq.push([STATE.dist[v], v]);
          steps.push({ type:'relax', from:u, to:v, newDist:STATE.dist[v], vis:new Set(vis), queue:new Set(pq.map(x=>x[1])) });
        }
      }
    }
    return steps;
  },

  bfs() {
    const N = NODES.length;
    let distBFS = Array(N).fill(Infinity), prevBFS = Array(N).fill(-1);
    distBFS[STATE.origin] = 0;
    const steps = [], queue = [STATE.origin], visited = new Set();

    while (queue.length) {
      const u = queue.shift();
      if (visited.has(u)) continue;
      visited.add(u);

      steps.push({ type:'visit', node:u, dist:distBFS[u], vis:new Set(visited), queue:new Set(queue) });

      for (const { to:v, w } of STATE.adj[u]) {
        if (!visited.has(v) && distBFS[u]+w < distBFS[v]) {
          distBFS[v] = distBFS[u]+w;
          prevBFS[v] = u;
          if (!queue.includes(v)) queue.push(v);
          steps.push({ type:'relax', from:u, to:v, newDist:distBFS[v], vis:new Set(visited), queue:new Set(queue) });
        }
      }
    }
    STATE.dist = distBFS; STATE.prev = prevBFS;
    return steps;
  },

  greedy() {
    const N = NODES.length;
    let d = Array(N).fill(Infinity), p = Array(N).fill(-1);
    d[STATE.origin] = 0;
    const steps = [], visited = new Set();
    const dLat = NODES[STATE.dest].lat, dLng = NODES[STATE.dest].lng;
    let pq = [[0, STATE.origin]];

    while (pq.length) {
      pq.sort((a, b) => {
        const hA = Utils.haversineDistance(NODES[a[1]].lat, NODES[a[1]].lng, dLat, dLng);
        const hB = Utils.haversineDistance(NODES[b[1]].lat, NODES[b[1]].lng, dLat, dLng);
        return hA - hB;
      });
      const [dist, u] = pq.shift();
      if (visited.has(u)) continue;
      visited.add(u);

      steps.push({ type:'visit', node:u, dist, vis:new Set(visited), queue:new Set(pq.map(x=>x[1])) });

      for (const { to:v, w } of STATE.adj[u]) {
        if (!visited.has(v) && d[u]+w < d[v]) {
          d[v] = d[u]+w; p[v] = u;
          pq.push([d[v], v]);
          steps.push({ type:'relax', from:u, to:v, newDist:d[v], vis:new Set(visited), queue:new Set(pq.map(x=>x[1])) });
        }
      }
    }
    STATE.dist = d; STATE.prev = p;
    return steps;
  },

  astar() {
    const N = NODES.length;
    let d = Array(N).fill(Infinity), p = Array(N).fill(-1);
    d[STATE.origin] = 0;
    const steps = [], visited = new Set();
    const dLat = NODES[STATE.dest].lat, dLng = NODES[STATE.dest].lng;
    let pq = [[0, STATE.origin]];

    while (pq.length) {
      pq.sort((a, b) => {
        const fA = a[0] + Utils.haversineDistance(NODES[a[1]].lat, NODES[a[1]].lng, dLat, dLng);
        const fB = b[0] + Utils.haversineDistance(NODES[b[1]].lat, NODES[b[1]].lng, dLat, dLng);
        return fA - fB;
      });
      const [dist, u] = pq.shift();
      if (visited.has(u)) continue;
      visited.add(u);

      steps.push({ type:'visit', node:u, dist, vis:new Set(visited), queue:new Set(pq.map(x=>x[1])) });

      for (const { to:v, w } of STATE.adj[u]) {
        if (!visited.has(v) && d[u]+w < d[v]) {
          d[v] = d[u]+w; p[v] = u;
          pq.push([d[v], v]);
          steps.push({ type:'relax', from:u, to:v, newDist:d[v], vis:new Set(visited), queue:new Set(pq.map(x=>x[1])) });
        }
      }
    }
    STATE.dist = d; STATE.prev = p;
    return steps;
  },

  genetic() {
    const N = NODES.length, steps = [];
    const popSize = 10, gens = 20;

    const routeDistance = (route) => {
      let total = 0;
      for (let i = 0; i < route.length-1; i++) {
        const a = route[i], b = route[i+1];
        for (const [ea, eb, w] of EDGES) {
          if ((ea===a&&eb===b)||(ea===b&&eb===a)) { total+=w; break; }
        }
      }
      return total;
    };

    const genPop = () => {
      const pop = [];
      for (let i = 0; i < popSize; i++) {
        const route = [STATE.origin];
        const visited = new Set([STATE.origin]);
        let cur = STATE.origin;
        while (visited.size < N) {
          const nbrs = STATE.adj[cur].filter(e => !visited.has(e.to)).map(e => e.to);
          if (!nbrs.length) break;
          const next = nbrs[Math.floor(Math.random()*nbrs.length)];
          route.push(next); visited.add(next); cur = next;
        }
        pop.push({ route, fitness: routeDistance(route) });
      }
      return pop;
    };

    const crossover = (p1, p2) => {
      const child = [], visited = new Set();
      for (let i = 0; i < Math.min(3, p1.length); i++) { child.push(p1[i]); visited.add(p1[i]); }
      while (child.length < N && visited.size < N) {
        const cur = child[child.length-1];
        const cands = STATE.adj[cur].filter(e => !visited.has(e.to))
          .sort((a,b) => a.w - b.w).map(e => e.to);
        if (!cands.length) break;
        child.push(cands[0]); visited.add(cands[0]);
      }
      return { route: child, fitness: routeDistance(child) };
    };

    let pop = genPop();
    for (let g = 0; g < gens; g++) {
      pop.sort((a,b) => a.fitness-b.fitness);
      steps.push({ type:'visit', node: pop[0].route[Math.min(1,pop[0].route.length-1)], dist: pop[0].fitness, vis: new Set(pop[0].route), queue: new Set() });
      const next = pop.slice(0, Math.ceil(popSize/2));
      while (next.length < popSize) {
        next.push(crossover(pop[Math.floor(Math.random()*popSize)].route, pop[Math.floor(Math.random()*popSize)].route));
      }
      pop = next;
    }

    pop.sort((a,b) => a.fitness-b.fitness);
    const best = pop[0].route;
    STATE.dist = Array(N).fill(Infinity);
    STATE.prev = Array(N).fill(-1);
    STATE.dist[STATE.origin] = 0;
    for (let i = 0; i < best.length-1; i++) STATE.prev[best[i+1]] = best[i];
    return steps;
  },

  minimax() {
    const N = NODES.length;
    let d = Array(N).fill(Infinity), p = Array(N).fill(-1);
    d[STATE.origin] = 0;
    const steps = [], visited = new Set(), pq = [[0, STATE.origin]];

    while (pq.length) {
      pq.sort((a,b) => a[0]-b[0]);
      const [dist, u] = pq.shift();
      if (visited.has(u)) continue;
      visited.add(u);

      steps.push({ type:'visit', node:u, dist, vis:new Set(visited), queue:new Set(pq.map(x=>x[1])) });

      for (const { to:v, w } of STATE.adj[u]) {
        if (!visited.has(v) && d[u]+w < d[v]) {
          d[v] = d[u]+w; p[v] = u;
          pq.push([d[v], v]);
          steps.push({ type:'relax', from:u, to:v, newDist:d[v], vis:new Set(visited), queue:new Set(pq.map(x=>x[1])) });
        }
      }
    }
    STATE.dist = d; STATE.prev = p;
    return steps;
  },

  bruteForce() {
    const N = NODES.length;
    STATE.dist = Array(N).fill(Infinity);
    STATE.prev = Array(N).fill(-1);
    const steps = [];
    let bestDist = Infinity, bestPath = [];

    const dfs = (cur, visited, dist, path) => {
      if (dist >= bestDist) return;
      visited.add(cur); path.push(cur);
      if (cur === STATE.dest) {
        if (dist < bestDist) { bestDist = dist; bestPath = [...path]; }
      } else if (path.length < N) {
        for (const { to:v, w } of STATE.adj[cur]) {
          if (!visited.has(v)) dfs(v, new Set(visited), dist+w, [...path]);
        }
      }
    };

    dfs(STATE.origin, new Set(), 0, []);

    if (bestPath.length > 0) {
      for (let i = 1; i < bestPath.length; i++) STATE.prev[bestPath[i]] = bestPath[i-1];
      STATE.dist[STATE.origin] = 0;
      STATE.dist[STATE.dest]   = bestDist;
      for (let i = 1; i < bestPath.length; i++) {
        steps.push({ type:'visit', node:bestPath[i], dist:bestDist, vis:new Set(bestPath.slice(0,i+1)), queue:new Set() });
      }
    }
    return steps;
  },

  dynamicProgramming() {
    const N = NODES.length;
    STATE.dist = Array(N).fill(Infinity);
    STATE.prev = Array(N).fill(-1);
    STATE.dist[STATE.origin] = 0;
    const steps = [];

    for (let iter = 0; iter < N-1; iter++) {
      for (let u = 0; u < N; u++) {
        if (STATE.dist[u] === Infinity) continue;
        for (const { to:v, w } of STATE.adj[u]) {
          if (STATE.dist[u]+w < STATE.dist[v]) {
            STATE.dist[v] = STATE.dist[u]+w;
            STATE.prev[v] = u;
            steps.push({ type:'relax', from:u, to:v, newDist:STATE.dist[v], vis:new Set(), queue:new Set() });
          }
        }
      }
    }
    return steps;
  },

  compareAll() {
    if (STATE.origin < 0 || STATE.dest < 0) {
      Utils.setInfo('⚠ Selecciona <b>origen</b> y <b>destino</b> primero.');
      return null;
    }
    if (STATE.origin === STATE.dest) {
      Utils.setInfo('⚠ Origen y destino son el mismo nodo.');
      return null;
    }

    const algos = ['dijkstra','bfs','greedy','astar','genetic','minimax','bruteforce','dynamic'];
    const results = [];

    for (const algo of algos) {
      STATE.selectedAlgo = algo;
      STATE.dist = Array(NODES.length).fill(Infinity);
      STATE.prev = Array(NODES.length).fill(-1);

      const t0    = performance.now();
      const steps = this.run();
      const t1    = performance.now();

      const path  = this.extractPath();
      const dist  = STATE.dist[STATE.dest];
      const time  = (t1 - t0).toFixed(2);

      results.push({
        algoKey:       algo,
        name:          ALGORITHM_NAMES[algo],
        distance:      dist === Infinity ? '∞' : Utils.fmt(dist),
        distanceValue: dist,
        time,
        steps:         steps.length,
        path,
        shown:         false,
      });
    }

    // Restaurar algo seleccionado en chips
    const activeChip = document.querySelector('.algo-chip.active');
    STATE.selectedAlgo = activeChip ? activeChip.dataset.algo : 'dijkstra';

    return results.sort((a, b) => a.distanceValue - b.distanceValue);
  },

  run() {
    switch (STATE.selectedAlgo) {
      case 'bfs':        return this.bfs();
      case 'greedy':     return this.greedy();
      case 'astar':      return this.astar();
      case 'genetic':    return this.genetic();
      case 'minimax':    return this.minimax();
      case 'bruteforce': return this.bruteForce();
      case 'dynamic':    return this.dynamicProgramming();
      default:           return this.dijkstra();
    }
  },

  extractPath() {
    if (STATE.dest < 0 || STATE.dist[STATE.dest] === Infinity) return [];
    const p = [];
    let cur = STATE.dest;
    while (cur !== -1) { p.unshift(cur); cur = STATE.prev[cur]; }
    return p;
  },

  resetAll() {
    STATE.origin = -1; STATE.dest = -1;
    STATE.mode   = 'idle'; STATE.path = [];
    STATE.dist   = []; STATE.prev = [];
    STATE.visited = new Set(); STATE.inQueue = new Set();
    STATE.stepQueue = []; STATE.stepIdx = 0; STATE.stepMode = false;

    document.getElementById('btnOrigin').classList.remove('active-mode');
    document.getElementById('btnDest').classList.remove('active-mode');

    if (STATE.pathLine) { STATE.pathLine.setMap(null); STATE.pathLine = null; }

    MarkerModule.drawEdges();
    MarkerModule.createMarkers();
    Utils.setInfo('Selecciona <b>Origen</b> y haz clic en el mapa.');
    Utils.showDist('');
    Utils.updatePills();
  }
};
