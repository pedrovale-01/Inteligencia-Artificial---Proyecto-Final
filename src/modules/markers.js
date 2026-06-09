/* Módulo: marcadores, aristas y visualización */

const MarkerModule = {

  nodeColor(i) {
    if (i === STATE.origin)    return CONFIG.colors.origin;
    if (i === STATE.dest)      return CONFIG.colors.dest;
    if (STATE.visited.has(i))  return CONFIG.colors.visited;
    if (STATE.inQueue.has(i))  return CONFIG.colors.queue;
    const n = NODES[i];
    return n.type === 'capital' ? CONFIG.colors.default : CONFIG.colors.provincia;
  },

  createMarkers() {
    STATE.markers.forEach(m => m.setMap(null));
    STATE.markers = [];

    NODES.forEach((n, i) => {
      const isCapital   = n.type === 'capital';
      const isSelected  = (i === STATE.origin || i === STATE.dest);
      const isVisible   = Utils.isNodeVisible(i);

      const scale = isSelected ? (isCapital ? 14 : 11) : isCapital ? 11 : 6;

      const m = new google.maps.Marker({
        position: { lat: n.lat, lng: n.lng },
        map: isVisible ? STATE.map : null,
        title: n.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor: this.nodeColor(i),
          fillOpacity: isCapital ? 1 : 0.85,
          strokeColor: isCapital ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
          strokeWeight: isCapital ? 2 : 1,
        },
        label: isCapital ? {
          text: n.name.split(' ')[0].substring(0, 6),
          color: 'rgba(255,255,255,0.85)',
          fontSize: '7px',
          fontWeight: '700',
          fontFamily: 'Inter, system-ui, sans-serif',
        } : null,
        zIndex: isSelected ? 30 : isCapital ? 10 : 3,
      });

      const iwContent = `
        <div style="font-family:'Inter',system-ui;padding:6px 2px;min-width:140px;background:transparent">
          <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:3px">${n.name}</div>
          <div style="font-size:11px;color:#8892a4">
            ${n.type === 'capital' ? '🏛 Capital' : '📍 Provincia'} · <b style="color:#60a5fa">${n.dept}</b>
          </div>
          ${STATE.dist[i] !== undefined && STATE.dist[i] !== Infinity && STATE.visited.has(i)
            ? `<div style="font-size:11px;color:#10b981;margin-top:4px;font-weight:600">Dist: ${Utils.fmt(STATE.dist[i])}</div>`
            : ''}
        </div>`;

      const iw = new google.maps.InfoWindow({
        content: iwContent,
        disableAutoPan: false,
      });

      m.addListener('click', () => {
        if (STATE.mode === 'origin') {
          STATE.origin = i;
          STATE.mode   = 'idle';
          document.getElementById('btnOrigin').classList.remove('active-mode');
          Utils.updatePills();
          Utils.setInfo(`<b>Origen</b>: ${n.name}. Selecciona el destino.`);
        } else if (STATE.mode === 'dest') {
          STATE.dest = i;
          STATE.mode = 'idle';
          document.getElementById('btnDest').classList.remove('active-mode');
          Utils.updatePills();
          Utils.setInfo(`<b>Destino</b>: ${n.name}. Presiona Ejecutar.`);
        } else {
          iw.open(STATE.map, m);
        }
        this.refreshMarkers();
      });

      STATE.markers.push(m);
    });
  },

  refreshMarkers() {
    STATE.markers.forEach((m, i) => {
      const n = NODES[i];
      const isCapital  = n.type === 'capital';
      const isSelected = (i === STATE.origin || i === STATE.dest);
      const isVisible  = Utils.isNodeVisible(i);
      const scale = isSelected ? (isCapital ? 15 : 12) : isCapital ? 11 : 6;

      m.setMap(isVisible ? STATE.map : null);
      m.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale,
        fillColor: this.nodeColor(i),
        fillOpacity: isCapital ? 1 : 0.85,
        strokeColor: isSelected ? '#fff' : isCapital ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
        strokeWeight: isSelected ? 2.5 : isCapital ? 1.5 : 1,
      });
      m.setZIndex(isSelected ? 30 : STATE.visited.has(i) ? 15 : isCapital ? 10 : 3);
    });
  },

  drawEdges() {
    STATE.polylines.forEach(p => p.setMap(null));
    STATE.polylines = [];

    EDGES.forEach(([a, b, w]) => {
      const isVisited = STATE.visited.has(a) && STATE.visited.has(b);
      const isProvEdge = NODES[a].type === 'provincia' || NODES[b].type === 'provincia';
      const isVisible = Utils.isNodeVisible(a) && Utils.isNodeVisible(b);

      // Edge opacity/weight based on visibility layer
      let opacity, weight, color;
      if (isVisited) {
        opacity = 0.7; weight = 2.5; color = CONFIG.colors.visitedEdge;
      } else if (isProvEdge) {
        opacity = 0.18; weight = 0.7; color = CONFIG.colors.edge;
      } else {
        opacity = 0.35; weight = 1.2; color = CONFIG.colors.edgeCapital;
      }

      const pl = new google.maps.Polyline({
        path: [
          { lat: NODES[a].lat, lng: NODES[a].lng },
          { lat: NODES[b].lat, lng: NODES[b].lng }
        ],
        map: isVisible ? STATE.map : null,
        strokeColor: color,
        strokeOpacity: opacity,
        strokeWeight: weight,
        zIndex: isVisited ? 5 : 1,
      });

      STATE.polylines.push(pl);
    });
  },

  drawPath(color) {
    if (STATE.pathLine) {
      STATE.pathLine.setMap(null);
      STATE.pathLine = null;
    }
    if (STATE.path.length < 2) return;

    const pathColor = color || CONFIG.colors.path;

    STATE.pathLine = new google.maps.Polyline({
      path: STATE.path.map(i => ({ lat: NODES[i].lat, lng: NODES[i].lng })),
      map: STATE.map,
      strokeColor: pathColor,
      strokeOpacity: 0,
      strokeWeight: 0,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 3,
          strokeColor: pathColor,
          strokeOpacity: 1,
          fillColor: pathColor,
          fillOpacity: 1,
        },
        offset: '100%',
        repeat: '0'
      }],
      zIndex: 50,
    });

    // Solid path underneath
    new google.maps.Polyline({
      path: STATE.path.map(i => ({ lat: NODES[i].lat, lng: NODES[i].lng })),
      map: STATE.map,
      strokeColor: pathColor,
      strokeOpacity: 0.9,
      strokeWeight: 5,
      zIndex: 40,
    });
  },

  // Dibuja múltiples rutas con colores distintos (modo comparación)
  drawComparePaths(results) {
    // Limpiar rutas previas
    STATE.comparePaths.forEach(lines => lines.forEach(p => p.setMap(null)));
    STATE.comparePaths = [];

    results.forEach((r, idx) => {
      if (!r.shown || r.path.length < 2) return;

      const color  = CONFIG.algoColors[r.algoKey] || '#fff';
      const offset = idx * 0.0003; // pequeño desplazamiento para rutas superpuestas

      const lines = [];

      const solidPath = new google.maps.Polyline({
        path: r.path.map((i, pi) => ({
          lat: NODES[i].lat + Math.sin(pi) * offset,
          lng: NODES[i].lng + Math.cos(pi) * offset,
        })),
        map: STATE.map,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        zIndex: 40 + idx,
      });
      lines.push(solidPath);

      // Flecha al final
      const arrowPath = new google.maps.Polyline({
        path: r.path.slice(-2).map((i, pi) => ({
          lat: NODES[i].lat + Math.sin(pi) * offset,
          lng: NODES[i].lng + Math.cos(pi) * offset,
        })),
        map: STATE.map,
        strokeColor: color,
        strokeOpacity: 0,
        strokeWeight: 0,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: color,
            strokeOpacity: 1,
            fillColor: color,
            fillOpacity: 1,
          },
          offset: '100%',
        }],
        zIndex: 50 + idx,
      });
      lines.push(arrowPath);

      STATE.comparePaths.push(lines);
    });
  },

  clearComparePaths() {
    STATE.comparePaths.forEach(lines => lines.forEach(p => p.setMap(null)));
    STATE.comparePaths = [];
  }
};
