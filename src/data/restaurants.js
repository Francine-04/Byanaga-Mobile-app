import { placeImages } from './placeImages';

export const restaurants = [
  {
    id: 'restaurant-001',
    name: 'Casa Mia Restaurant',
    cuisine: 'Local',
    image: placeImages.diningPizza,
    rating: 4.7,
    distance: '900 m',
    priceRange: 'Moderate',
  },
  {
    id: 'restaurant-002',
    name: 'Crescini Garden',
    cuisine: 'Filipino',
    image: placeImages.dining,
    rating: 4.6,
    distance: '1.6 km',
    priceRange: 'Moderate',
  },
  {
    id: 'restaurant-003',
    name: 'Bob Marlin Restaurant',
    cuisine: 'Seafood',
    image: placeImages.diningCake,
    rating: 4.5,
    distance: '1.9 km',
    priceRange: 'Moderate',
  },
  {
    id: 'restaurant-004',
    name: 'Small Talk Cafe',
    cuisine: 'Cafe',
    image: placeImages.diningCoffee,
    rating: 4.4,
    distance: '2.1 km',
    priceRange: 'Budget',
  },
];
