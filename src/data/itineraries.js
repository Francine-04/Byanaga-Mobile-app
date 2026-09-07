import { placeImages } from './placeImages';

export const smartItineraryStops = [
  {
    id: 'stop-001',
    time: '8:00 AM',
    title: 'Penafrancia Basilica',
    subtitle: 'Visit time: 1 hr',
    crowd: 'Moderate',
    image: placeImages.penafranciaBasilica,
  },
  {
    id: 'stop-002',
    time: '9:45 AM',
    title: 'Museo del Seminario',
    subtitle: 'Visit time: 45 min',
    crowd: 'Low',
    image: placeImages.museo,
  },
  {
    id: 'stop-003',
    time: '12:00 PM',
    title: 'Casa Mia Restaurant',
    subtitle: 'Lunch break',
    crowd: 'Busy',
    image: placeImages.diningPizza,
  },
  {
    id: 'stop-004',
    time: '2:00 PM',
    title: 'Naga Ecological Park',
    subtitle: 'Visit time: 2 hrs',
    crowd: 'Low',
    image: placeImages.ecologyPark,
  },
];

export const trips = [
  {
    id: 'trip-001',
    name: 'Naga Culture Day',
    date: 'Sample travel date',
    places: 4,
    status: 'Upcoming',
    image: placeImages.plazaQuinceMartires,
  },
  {
    id: 'trip-002',
    name: 'Nature and Food Route',
    date: 'Draft itinerary',
    places: 3,
    status: 'Drafts',
    image: placeImages.diningCoffee,
  },
];
