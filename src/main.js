/* Punto de entrada */

function initMap() {
  MapModule.init();
  EventHandlers.init();
  Utils.setInfo('Selecciona <b>Origen</b> y haz clic en el mapa.');
  Utils.updatePills();
}
