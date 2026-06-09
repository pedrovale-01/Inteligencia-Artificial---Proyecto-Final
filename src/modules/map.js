/* Módulo: mapa de Google Maps */

const MapModule = {
  init() {
    STATE.map = new google.maps.Map(document.getElementById('map'), {
      center: CONFIG.map.center,
      zoom: CONFIG.map.zoom,
      mapTypeId: CONFIG.map.mapTypeId,
      backgroundColor: '#0f1117',
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      gestureHandling: 'greedy',
      styles: [
        { elementType: 'geometry',              stylers: [{ color: '#141824' }] },
        { elementType: 'labels.text.fill',      stylers: [{ color: '#6b7a99' }] },
        { elementType: 'labels.text.stroke',    stylers: [{ color: '#0f1117' }] },
        { featureType: 'administrative',        elementType: 'geometry', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative.country',elementType: 'geometry.stroke', stylers: [{ color: '#2d3655' }, { visibility: 'on' }, { weight: 1.5 }] },
        { featureType: 'administrative.province',elementType: 'geometry.stroke', stylers: [{ color: '#1e2540' }, { visibility: 'on' }, { weight: 0.7 }] },
        { featureType: 'landscape',             elementType: 'geometry', stylers: [{ color: '#161d2e' }] },
        { featureType: 'landscape.natural.terrain', elementType: 'geometry', stylers: [{ color: '#121a28' }] },
        { featureType: 'poi',                   stylers: [{ visibility: 'off' }] },
        { featureType: 'road',                  elementType: 'geometry', stylers: [{ color: '#1e2640' }] },
        { featureType: 'road',                  elementType: 'geometry.stroke', stylers: [{ color: '#131a2a' }] },
        { featureType: 'road',                  elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'road.highway',          elementType: 'geometry', stylers: [{ color: '#243050' }] },
        { featureType: 'transit',               stylers: [{ visibility: 'off' }] },
        { featureType: 'water',                 elementType: 'geometry', stylers: [{ color: '#0d1520' }] },
        { featureType: 'water',                 elementType: 'labels.text.fill', stylers: [{ color: '#3a5070' }] },
      ]
    });

    MarkerModule.drawEdges();
    MarkerModule.createMarkers();
  }
};
