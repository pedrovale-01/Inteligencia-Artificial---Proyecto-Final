# Pathfinding · Perú

Visualizador de algoritmos de búsqueda de rutas sobre el grafo de departamentos y provincias del Perú.

## Algoritmos incluidos

| Algoritmo | Categoría | 
|-----------|-----------|
| Dijkstra | Exacto | 
| BFS | Búsqueda | 
| Greedy | Heurístico | 
| A* | Heurístico |
| Genético | Evolutivo | 
| Minimax | Adversarial | 
| Fuerza Bruta | Exhaustivo | 
| Prog. Dinámica | Exacto | 

## Uso

1. Abre `index.html` en un navegador
2. Elige la capa de nodos: **Departamentos**, **Provincias** o **Todos**
3. Pulsa **Origen** y haz clic en un nodo del mapa
4. Pulsa **Destino** y selecciona otro nodo
5. Selecciona el algoritmo y pulsa **Ejecutar** o **Paso a paso**
6. Usa **Comparar todos** para ver los 8 algoritmos juntos con rutas coloreadas

## Estructura

```
IA_new/
├── index.html
├── styles.css
└── src/
    ├── config/constants.js     — nodos, aristas, colores
    ├── state/appState.js       — estado global
    ├── utils/helpers.js        — utilidades
    ├── modules/
    │   ├── map.js              — inicialización del mapa
    │   ├── markers.js          — marcadores y aristas
    │   └── events.js           — manejo de eventos y comparación
    └── algorithms/algorithms.js — 8 algoritmos de pathfinding
```
