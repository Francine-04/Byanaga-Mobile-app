import { placeImages } from './placeImages';

export const photoCategories = ['All', 'Exterior', 'Interior', 'Events', 'Nearby'];
export const destinationPhotos = ['Exterior', 'Exterior', 'Interior', 'Interior', 'Events', 'Events', 'Nearby', 'Nearby', 'Exterior']
  .map((category, index) => ({
    id: 'photo-' + index,
    category,
    image: [
      placeImages.penafranciaBasilica,
      placeImages.museo,
      placeImages.plazaQuinceMartires,
      placeImages.ecologyPark,
      placeImages.festival,
      placeImages.diningPizza,
      placeImages.diningCoffee,
      placeImages.hotelCozy,
      placeImages.penafranciaBasilica,
    ][index],
  }));

export const sampleReviews = [
  { id: 'review-1', destinationId: 'destination-001', name: 'Maria Santos', image: null, rating: 5, helpful: 12, date: '2026-08-15', text: 'Beautiful and peaceful. A lovely stop during our day in Naga City.' },
  { id: 'review-2', destinationId: 'destination-001', name: 'John Dela Cruz', image: null, rating: 5, helpful: 8, date: '2026-08-10', text: 'A memorable visit with the family. We enjoyed taking our time here.' },
  { id: 'review-3', destinationId: 'destination-001', name: 'Anna Reyes', image: null, rating: 4, helpful: 10, date: '2026-08-02', text: 'A meaningful place to include in a heritage trip around the city.' },
];

export const sampleRatingCounts = { 5: 108, 4: 14, 3: 4, 2: 1, 1: 1 };
