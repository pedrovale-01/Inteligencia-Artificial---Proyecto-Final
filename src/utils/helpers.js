/* Utilidades */

const Utils = {

  fmt(v) {
    if (v === Infinity || v === undefined) return '∞';
    return v >= 1000 ? (v / 1000).toFixed(1) + ' km' : v + ' km';
  },

  haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  setInfo(html) {
    document.getElementById('stepInfo').innerHTML = html;
    const ts = document.getElementById('topbarStatus');
    if (ts) ts.innerHTML = html.replace(/<[^>]*>/g,'');
  },

  showDist(txt) {
    const el = document.getElementById('distInfo');
    if (txt) {
      el.textContent = '📍 ' + txt;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  },

  updatePills() {
    const po = document.getElementById('pillOriginLabel');
    const pd = document.getElementById('pillDestLabel');
    const bo = document.getElementById('btnOrigin');
    const bd = document.getElementById('btnDest');

    if (STATE.origin >= 0) {
      po.textContent = NODES[STATE.origin].name.split('(')[0].trim();
      bo.classList.add('set');
    } else {
      po.textContent = 'Seleccionar origen';
      bo.classList.remove('set');
    }

    if (STATE.dest >= 0) {
      pd.textContent = NODES[STATE.dest].name.split('(')[0].trim();
      bd.classList.add('set');
    } else {
      pd.textContent = 'Seleccionar destino';
      bd.classList.remove('set');
    }
  },

  // Filtra los nodos visibles según la capa activa
  visibleNodes() {
    if (STATE.activeLayer === 'departamentos') return NODES.filter(n => n.type === 'capital');
    if (STATE.activeLayer === 'provincias')    return NODES.filter(n => n.type === 'provincia');
    return NODES;
  },

  isNodeVisible(idx) {
    const n = NODES[idx];
    if (STATE.activeLayer === 'departamentos') return n.type === 'capital';
    if (STATE.activeLayer === 'provincias')    return n.type === 'provincia';
    return true;
  }
};
