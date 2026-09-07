// Visual coverage for Naga City content. These assets are copied from the
// existing smart_tourism_dashboard so both apps use the same visual records.
export const placeImages = {
  penafranciaBasilica: require('../../assets/places/dashboard-basilica.jpg'),
  nagaCathedral: require('../../assets/places/dashboard-culture.webp'),
  museo: require('../../assets/places/dashboard-museo.jpg'),
  plazaQuinceMartires: require('../../assets/places/dashboard-plaza-quince.jpg'),
  smCityNaga: require('../../assets/places/dashboard-peoples-mall.jpg'),
  ecologyPark: require('../../assets/places/dashboard-ecopark.jpg'),
  dining: require('../../assets/places/dashboard-food.jpg'),
  diningPizza: require('../../assets/places/dashboard-pizza.jpg'),
  diningCoffee: require('../../assets/places/dashboard-coffee.jpg'),
  diningCake: require('../../assets/places/dashboard-chocolate-cake.jpg'),
  hotelBackground: require('../../assets/places/dashboard-background.jpg'),
  hotel: require('../../assets/places/naga-hotel.png'),
  hotelCozy: require('../../assets/places/dashboard-cozy-ambiance.jpg'),
  hotelCity: require('../../assets/places/dashboard-city.jpg'),
  festival: require('../../assets/places/dashboard-festival.jpg'),
  culturalEvent: require('../../assets/places/dashboard-culture.webp'),
  cityEvent: require('../../assets/places/dashboard-city.jpg'),
};

export function getLegacyDashboardImage(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('attraction-basilica')) return placeImages.penafranciaBasilica;
  if (text.includes('attraction-plaza-quince')) return placeImages.plazaQuinceMartires;
  if (text.includes('attraction-ecopark')) return placeImages.ecologyPark;
  if (text.includes('attraction-museo')) return placeImages.museo;
  if (text.includes('attraction-peoples-mall')) return placeImages.smCityNaga;
  if (text.includes('category-food') || text.includes('beef-salpicao') || text.includes('carbonara')) return placeImages.dining;
  if (text.includes('pizza')) return placeImages.diningPizza;
  if (text.includes('coffee')) return placeImages.diningCoffee;
  if (text.includes('chocolate-cake')) return placeImages.diningCake;
  if (text.includes('category-culture')) return placeImages.nagaCathedral;
  if (text.includes('category-festival') || text.includes('weekend-promo')) return placeImages.festival;
  if (text.includes('background-picture')) return placeImages.hotelBackground;
  if (text.includes('cozy-ambiance')) return placeImages.hotelCozy;
  if (text.includes('category-city')) return placeImages.hotelCity;
  return null;
}

export function getPlaceImage({ name = '', category = '' } = {}) {
  const text = `${name} ${category}`.toLowerCase();

  if (text.includes('penafrancia basilica')) return placeImages.penafranciaBasilica;
  if (text.includes('church') || text.includes('basilica') || text.includes('shrine')) return placeImages.penafranciaBasilica;
  if (text.includes('museo') || text.includes('seminario')) return placeImages.museo;
  if (text.includes('cathedral')) return placeImages.nagaCathedral;
  if (text.includes('culture') || text.includes('museum')) return placeImages.nagaCathedral;
  if (text.includes('plaza quince') || text.includes('plaza rizal')) return placeImages.plazaQuinceMartires;
  if (text.includes('historical') || text.includes('heritage') || text.includes('landmark')) return placeImages.plazaQuinceMartires;
  if (text.includes('mall') || text.includes('shopping') || text.includes('market')) return placeImages.smCityNaga;
  if (text.includes('park') || text.includes('nature') || text.includes('ecological')) return placeImages.ecologyPark;
  if (text.includes('restaurant') || text.includes('food') || text.includes('dining')) return placeImages.dining;
  if (text.includes('cafe') || text.includes('coffee')) return placeImages.diningCoffee;
  if (text.includes('hotel') || text.includes('accommodation') || text.includes('resort') || text.includes('stay')) return placeImages.hotel;
  if (text.includes('cultural')) return placeImages.culturalEvent;
  if (text.includes('event') || text.includes('festival') || text.includes('coliseum') || text.includes('civic')) return placeImages.festival;

  return placeImages.festival;
}
