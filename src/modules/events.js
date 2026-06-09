/* Módulo: eventos del DOM */

const ALGO_META = {
  dijkstra:   { complexity: 'O((V+E) log V)', complexityLevel: 'medium', optimal: true,  category: 'Exacto' },
  bfs:        { complexity: 'O(V + E)',        complexityLevel: 'low',    optimal: false, category: 'Búsqueda' },
  greedy:     { complexity: 'O(E log V)',      complexityLevel: 'medium', optimal: false, category: 'Heurístico' },
  astar:      { complexity: 'O(E log V)',      complexityLevel: 'medium', optimal: true,  category: 'Heurístico' },
  genetic:    { complexity: 'O(G · P · E)',    complexityLevel: 'high',   optimal: false, category: 'Evolutivo' },
  minimax:    { complexity: 'O(b^d)',          complexityLevel: 'high',   optimal: false, category: 'Adversarial' },
  bruteforce: { complexity: 'O(V!)',           complexityLevel: 'expo',   optimal: true,  category: 'Exhaustivo' },
  dynamic:    { complexity: 'O(V²)',           complexityLevel: 'medium', optimal: true,  category: 'Exacto' },
};

// Estado de comparación con rutas mostradas
let compareResults = [];

const EventHandlers = {
  init() {
    this.setupSidebar();
    this.setupLayerTabs();
    this.setupAlgoChips();
    this.setupOriginButton();
    this.setupDestButton();
    this.setupResetButton();
    this.setupRunButton();
    this.setupStepButton();
    this.setupCompareButton();
    this.setupCompareClose();
  },

  setupSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const toggle   = document.getElementById('sidebarToggle');
    const topbar   = document.getElementById('mapTopbar');
    const expand   = document.getElementById('topbarExpand');

    toggle.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
      topbar.classList.remove('hidden');
    });

    expand.addEventListener('click', () => {
      sidebar.classList.remove('collapsed');
      topbar.classList.add('hidden');
    });
  },

  setupLayerTabs() {
    document.querySelectorAll('.layer-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.layer-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        STATE.activeLayer = tab.dataset.layer;

        // Si origin/dest no son visibles en esta capa, resetear
        if (STATE.origin >= 0 && !Utils.isNodeVisible(STATE.origin)) {
          STATE.origin = -1;
        }
        if (STATE.dest >= 0 && !Utils.isNodeVisible(STATE.dest)) {
          STATE.dest = -1;
        }

        Utils.updatePills();
        MarkerModule.drawEdges();
        MarkerModule.createMarkers();
        Utils.setInfo('Capa actualizada. Selecciona <b>origen</b> y <b>destino</b>.');
      });
    });
  },

  setupAlgoChips() {
    document.querySelectorAll('.algo-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.algo-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        STATE.selectedAlgo = chip.dataset.algo;
        Utils.setInfo(`Algoritmo: <b>${ALGORITHM_NAMES[STATE.selectedAlgo]}</b>`);
      });
    });
  },

  setupOriginButton() {
    document.getElementById('btnOrigin').addEventListener('click', () => {
      STATE.mode = 'origin';
      document.getElementById('btnOrigin').classList.add('active-mode');
      document.getElementById('btnDest').classList.remove('active-mode');
      Utils.setInfo('Haz clic en el <b>nodo origen</b> en el mapa.');
    });
  },

  setupDestButton() {
    document.getElementById('btnDest').addEventListener('click', () => {
      STATE.mode = 'dest';
      document.getElementById('btnDest').classList.add('active-mode');
      document.getElementById('btnOrigin').classList.remove('active-mode');
      Utils.setInfo('Haz clic en el <b>nodo destino</b> en el mapa.');
    });
  },

  setupResetButton() {
    document.getElementById('btnReset').addEventListener('click', () => {
      AlgorithmModule.resetAll();
      document.getElementById('compareOverlay').classList.add('hidden');
      MarkerModule.clearComparePaths();
      compareResults = [];
    });
  },

  setupRunButton() {
    document.getElementById('btnRun').addEventListener('click', () => {
      if (!this._checkSelection()) return;
      MarkerModule.clearComparePaths();

      STATE.stepMode = false;
      STATE.visited  = new Set();
      STATE.inQueue  = new Set();

      const steps    = AlgorithmModule.run();
      const algoName = ALGORITHM_NAMES[STATE.selectedAlgo] || 'Dijkstra';

      steps.forEach(s => { STATE.visited = s.vis; STATE.inQueue = s.queue; });

      STATE.path = AlgorithmModule.extractPath();
      MarkerModule.drawEdges();
      MarkerModule.refreshMarkers();
      MarkerModule.drawPath(CONFIG.algoColors[STATE.selectedAlgo]);

      const d = STATE.dist[STATE.dest];
      if (d === Infinity) {
        Utils.setInfo(`✗ Sin ruta disponible [${algoName}]`);
        Utils.showDist('');
      } else {
        const routeNames = STATE.path.map(i => `<b>${NODES[i].name.split('(')[0].trim()}</b>`).join(' → ');
        Utils.setInfo(`[${algoName}] ${routeNames}`);
        Utils.showDist(Utils.fmt(d));
        STATE.map.panTo({ lat: NODES[STATE.origin].lat, lng: NODES[STATE.origin].lng });
      }
    });
  },

  setupStepButton() {
    document.getElementById('btnStep').addEventListener('click', () => {
      if (!this._checkSelection()) return;

      if (!STATE.stepMode) {
        STATE.stepMode = true;
        STATE.visited  = new Set();
        STATE.inQueue  = new Set();
        STATE.path     = [];
        STATE.dist     = Array(NODES.length).fill(Infinity);
        STATE.prev     = Array(NODES.length).fill(-1);
        STATE.dist[STATE.origin] = 0;
        STATE.stepQueue = AlgorithmModule.run();
        STATE.stepIdx   = 0;
        MarkerModule.drawEdges();
        MarkerModule.refreshMarkers();
        const algoName = ALGORITHM_NAMES[STATE.selectedAlgo] || 'Dijkstra';
        Utils.setInfo(`Modo <b>paso a paso</b> [${algoName}] — ${STATE.stepQueue.length} pasos.`);
        return;
      }

      if (STATE.stepIdx >= STATE.stepQueue.length) {
        STATE.path = AlgorithmModule.extractPath();
        MarkerModule.drawPath(CONFIG.algoColors[STATE.selectedAlgo]);
        const d = STATE.dist[STATE.dest];
        Utils.setInfo(d === Infinity
          ? '✗ Sin ruta.'
          : '✓ Completado → ' + STATE.path.map(i => `<b>${NODES[i].name.split('(')[0].trim()}</b>`).join(' → '));
        Utils.showDist(d === Infinity ? '' : Utils.fmt(d));
        return;
      }

      const s = STATE.stepQueue[STATE.stepIdx++];
      STATE.visited = s.vis;
      STATE.inQueue = s.queue;

      if (s.type === 'visit')
        Utils.setInfo(`[${STATE.stepIdx}/${STATE.stepQueue.length}] Visitando: <b>${NODES[s.node].name}</b> · ${Utils.fmt(s.dist)}`);
      else
        Utils.setInfo(`[${STATE.stepIdx}/${STATE.stepQueue.length}] Relajando: <b>${NODES[s.from].name}</b> → <b>${NODES[s.to].name}</b> · ${Utils.fmt(s.newDist)}`);

      MarkerModule.drawEdges();
      MarkerModule.refreshMarkers();
    });
  },

  setupCompareButton() {
    document.getElementById('btnCompare').addEventListener('click', () => {
      const results = AlgorithmModule.compareAll();
      if (!results) return;

      compareResults = results;
      this._renderCompareTable(results);
      document.getElementById('compareOverlay').classList.remove('hidden');
      Utils.setInfo('✓ <b>Comparación completada</b>.');
    });
  },

  setupCompareClose() {
    document.getElementById('compareClose').addEventListener('click', () => {
      document.getElementById('compareOverlay').classList.add('hidden');
    });
  },

  _checkSelection() {
    if (STATE.origin < 0 || STATE.dest < 0) {
      Utils.setInfo('⚠ Selecciona <b>origen</b> y <b>destino</b> primero.');
      return false;
    }
    if (STATE.origin === STATE.dest) {
      Utils.setInfo('⚠ Origen y destino son el mismo nodo.');
      return false;
    }
    return true;
  },

  _renderCompareTable(results) {
    const from = STATE.origin >= 0 ? NODES[STATE.origin].name.split('(')[0].trim() : '—';
    const to   = STATE.dest   >= 0 ? NODES[STATE.dest].name.split('(')[0].trim()   : '—';

    document.getElementById('compareSubtitle').textContent = `${from} → ${to}`;

    const finite   = results.filter(r => r.distanceValue !== Infinity).map(r => r.distanceValue);
    const minDist  = Math.min(...finite);
    const maxDist  = Math.max(...finite) || 1;
    const maxTime  = Math.max(...results.map(r => parseFloat(r.time))) || 1;
    const maxSteps = Math.max(...results.map(r => r.steps)) || 1;

    const rankClasses = ['gold','silver','bronze','other','other','other','other','other'];

    let rows = '';
    results.forEach((r, idx) => {
      const isInf   = r.distanceValue === Infinity;
      const barPct  = isInf ? 0 : Math.round((r.distanceValue / maxDist) * 100);
      const bestBar = r.distanceValue === minDist && !isInf;
      const meta    = ALGO_META[r.algoKey] || {};
      const timePct = Math.round((parseFloat(r.time) / maxTime) * 100);
      const stepPct = Math.round((r.steps / maxSteps) * 100);
      const rowCls  = idx === 0 && !isInf ? 'winner' : '';
      const color   = CONFIG.algoColors[r.algoKey] || '#888';

      rows += `
        <tr class="${rowCls}" data-algo="${r.algoKey}">
          <td>
            <div class="algo-name-cell">
              <span class="rank-badge ${rankClasses[idx] || 'other'}">${idx+1}</span>
              <span class="algo-color-dot" style="background:${color}"></span>
              ${r.name}
            </div>
          </td>
          <td><span class="cat-badge">${meta.category || '—'}</span></td>
          <td>
            <div class="mini-bar-wrap">
              <span class="mini-bar-val" style="color:${isInf?'#ef4444':'inherit'}">${r.distance}</span>
              <div class="mini-bar"><div class="mini-bar-fill${bestBar?' best':''}" style="width:${barPct}%;background:${bestBar?'#22c55e':color}"></div></div>
            </div>
          </td>
          <td>
            <div class="mini-bar-wrap">
              <span class="mini-bar-val" style="font-size:10px">${r.time}ms</span>
              <div class="mini-bar"><div class="mini-bar-fill" style="width:${timePct}%;opacity:0.5;background:${color}"></div></div>
            </div>
          </td>
          <td>
            <div class="mini-bar-wrap">
              <span class="mini-bar-val" style="font-size:10px">${r.steps}</span>
              <div class="mini-bar"><div class="mini-bar-fill" style="width:${stepPct}%;opacity:0.4;background:${color}"></div></div>
            </div>
          </td>
          <td><span class="cpx ${meta.complexityLevel || 'medium'}">${meta.complexity || '—'}</span></td>
          <td><span class="opt-tag ${meta.optimal?'yes':'no'}">${meta.optimal?'✓ Sí':'✗ No'}</span></td>
          <td>
            <div class="route-indicator" data-idx="${idx}" title="Mostrar/ocultar ruta en mapa" onclick="EventHandlers._toggleRoute(this,${idx})">
              <span class="route-dot" style="background:${color}"></span>
              <span>Ruta</span>
            </div>
          </td>
        </tr>`;
    });

    document.getElementById('compareBody').innerHTML = `
      <table class="cmp-table">
        <thead>
          <tr>
            <th>Algoritmo</th>
            <th>Categoría</th>
            <th>Distancia</th>
            <th>Tiempo</th>
            <th>Pasos</th>
            <th>Complejidad</th>
            <th>Óptimo</th>
            <th>Ver ruta</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  _toggleRoute(el, idx) {
    const r = compareResults[idx];
    if (!r) return;

    r.shown = !r.shown;
    el.classList.toggle('shown', r.shown);
    el.querySelector('span:last-child').textContent = r.shown ? 'Ocultar' : 'Ruta';

    // Redibujar todas las rutas activas
    MarkerModule.drawComparePaths(compareResults);
  }
};
