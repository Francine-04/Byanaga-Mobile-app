import { getPlaceImage } from './placeImages';

const rawNagaPlaces = [
  {
    id: 'penafrancia-basilica-minore',
    name: 'Penafrancia Basilica Minore',
    aliases: ['penafrancia basilica', 'basilica grounds'],
    category: 'Church',
    latitude: 13.6366,
    longitude: 123.1932,
  },
  {
    id: 'plaza-quince-martires',
    name: 'Plaza Quince Martires',
    category: 'Historical',
    latitude: 13.6218,
    longitude: 123.1948,
  },
  {
    id: 'naga-metropolitan-cathedral',
    name: 'Naga Metropolitan Cathedral',
    category: 'Church',
    latitude: 13.6261,
    longitude: 123.1851,
  },
  {
    id: 'naga-city-peoples-mall',
    name: "Naga City People's Mall",
    category: 'Shopping',
    latitude: 13.6194,
    longitude: 123.1902,
  },
  {
    id: 'san-francisco-church',
    name: 'San Francisco Church',
    category: 'Church',
    latitude: 13.6216,
    longitude: 123.1908,
  },
  {
    id: 'naga-city-hall',
    name: 'Naga City Hall',
    category: 'Government',
    latitude: 13.621,
    longitude: 123.1939,
  },
  {
    id: 'naga-ecological-park',
    name: 'Naga Ecological Park',
    aliases: ['ecological park'],
    category: 'Nature',
    latitude: 13.6523,
    longitude: 123.2092,
  },
  {
    id: 'magsaysay-park',
    name: 'Magsaysay Park',
    category: 'Nature',
    latitude: 13.6285,
    longitude: 123.1992,
  },
  {
    id: 'museo-del-seminario',
    name: 'Museo del Seminario Conciliar de Nueva Caceres',
    aliases: ['museo del seminario'],
    category: 'Culture',
    latitude: 13.6259,
    longitude: 123.1843,
  },
  {
    id: 'our-lady-penafrancia-shrine',
    name: 'Our Lady of Penafrancia Shrine',
    category: 'Church',
    latitude: 13.6296,
    longitude: 123.1968,
  },
  {
    id: 'jesse-robredo-coliseum',
    name: 'Jesse M. Robredo Coliseum',
    category: 'Events',
    latitude: 13.625,
    longitude: 123.1915,
  },
  {
    id: 'casa-mia-restaurant',
    name: 'Casa Mia Restaurant',
    aliases: ['casa mia'],
    category: 'Food',
    latitude: 13.6284,
    longitude: 123.1986,
  },
  {
    id: 'crescini-garden',
    name: 'Crescini Garden',
    aliases: ["crescini's garden", "conching's garden", 'conchings garden'],
    category: 'Food',
    latitude: 13.6252,
    longitude: 123.1938,
  },
  {
    id: 'bob-marlin-restaurant',
    name: 'Bob Marlin Restaurant',
    aliases: ['bob marlin'],
    category: 'Food',
    latitude: 13.6288,
    longitude: 123.1982,
  },
  {
    id: 'small-talk-cafe',
    name: 'Small Talk Cafe',
    aliases: ['small talk'],
    category: 'Food',
    latitude: 13.6281,
    longitude: 123.199,
  },
  {
    id: 'villa-caceres-hotel',
    name: 'Villa Caceres Hotel',
    category: 'Accommodation',
    latitude: 13.6279,
    longitude: 123.1995,
  },
  {
    id: 'the-avenue-plaza-hotel',
    name: 'The Avenue Plaza Hotel',
    aliases: ['avenue plaza hotel'],
    category: 'Accommodation',
    latitude: 13.629,
    longitude: 123.1979,
  },
  {
    id: 'villa-isabel-hotel',
    name: 'Villa Isabel Hotel',
    category: 'Accommodation',
    latitude: 13.6231,
    longitude: 123.1914,
  },
  {
    id: 'el-sancho-hotel',
    name: 'El Sancho Hotel',
    category: 'Accommodation',
    latitude: 13.6225,
    longitude: 123.1909,
  },
  {
    id: 'plaza-rizal',
    name: 'Plaza Rizal',
    category: 'Historical',
    latitude: 13.6211,
    longitude: 123.1942,
  },
  {
    id: 'naga-city-civic-center',
    name: 'Naga City Civic Center',
    category: 'Events',
    latitude: 13.6247,
    longitude: 123.1912,
  },
  {
    id: 'sm-city-naga',
    name: 'SM City Naga',
    aliases: ['cwc mall'],
    category: 'Shopping',
    latitude: 13.6192,
    longitude: 123.1829,
  },
  {
    id: 'robinsons-place-naga',
    name: 'Robinsons Place Naga',
    category: 'Shopping',
    latitude: 13.6175,
    longitude: 123.1987,
  },
  {
    id: 'concepcion-grande',
    name: 'Concepcion Grande',
    category: 'Barangay',
    latitude: 13.6364,
    longitude: 123.2042,
  },
  {
    id: 'sabang',
    name: 'Sabang',
    category: 'Barangay',
    latitude: 13.6219,
    longitude: 123.1999,
  },
];

export const nagaPlaces = rawNagaPlaces.map((place) => ({
  ...place,
  image: getPlaceImage(place),
}));

export function findKnownPlace(value) {
  const normalized = normalizePlaceKey(value);
  if (!normalized) {
    return null;
  }

  return (
    nagaPlaces.find((place) => normalizePlaceKey(place.id) === normalized) ||
    nagaPlaces.find((place) => normalizePlaceKey(place.name) === normalized) ||
    nagaPlaces.find((place) => place.aliases?.some((alias) => normalizePlaceKey(alias) === normalized)) ||
    nagaPlaces.find((place) => normalizePlaceKey(place.name).includes(normalized) || normalized.includes(normalizePlaceKey(place.name))) ||
    null
  );
}

export function normalizePlaceKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('\u00e3\u00b1', 'n')
    .replaceAll('\u00f1', 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
