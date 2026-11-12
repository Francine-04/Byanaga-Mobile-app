# Supplied place photos

## Second import — 2026-11-03

Added all 46 images from Downloads/Places again-20261103T072820Z-1-001/Places again; total 235 assets. Original files and existing photos are preserved. Filename counters are gallery variants, not new places. Explicit spelling aliases include Fieste → Fiesta Hotel, Beloved Hotel → Beloved, and MJJM (Former Sampaguita Department Store). Prime Hotel is not assumed to mean Primus Hotel.

Sunny View_ Tabuco Travel Lodge remains in the collection pending clarification of which of the two destinations it depicts.

Catalog and Explore deduplication now share src/utils/dedupePlaces.js. It compares IDs, business IDs, normalized names and known aliases, and checks coordinates (100m) or differing addresses to preserve distinct branches. Only display lists change; database records, bookmarks, trips and visitor histories are not deleted.

Validation: 46 image headers decoded; 16 focused photo, deduplication and Geoapify tests passed.

Imported on 2026-10-27 (Asia/Manila) from the user's Downloads/Places-20261026T160220Z-1-001/Places folder. The originals were not changed.

## Coverage

- All 189 files are bundled and available in Explore → Browse photo collection.
- 146 photos match names or explicit aliases in the public destination registry at import time.
- 33 dish photos appear in the food collection and the Restaurants screen's food gallery. They are not restaurant exterior photos and do not assert menu availability.
- 6 named venue photos have no matching current registry name; they remain available in the collection and automatically attach if a matching catalog record appears.
- Four abbreviated church filenames remain unassigned pending full-name confirmation. They are visible in the collection, clearly marked.
- Multiple photos for a destination remain available in its Photos gallery.
- Cards use centered cover images; opening a gallery image uses contain to show the entire image. No synthetic locations, ratings, or GPS coordinates were created.

## Names to confirm

- Church/HCPC.jpg
- Church/INC-CSDO.png
- Church/NCSDAC.png
- Church/OLoMCPC.png

The user confirmed these are initials, but did not supply the four expanded names. Do not guess between similarly named churches or branches.

## Not in current registry

- Accommodation/Hacienda-de-Naga-Resort.webp
- Culture/University of Nueva Caceres Museum.jpg
- Nature/Naga Central School 1.jpg
- Restaurant/Cocina-de-Bambu-Naga-City-food.jpg
- Shopping/lcc cbd 2.jfif
- Shopping/snr.jfif

## Implementation

- src/data/suppliedPlacePhotos.js: static Metro asset requires, original filenames, explicit aliases.
- src/utils/suppliedPlaceImages.js: punctuation/accent normalization, exact alias matching, catalog decoration, gallery collection.
- AppContext applies photos after merging live/cached catalogs; no API request, Firebase record, permission, or visit tracking behavior was changed.
- Four unclear initial names are flagged pending; matching code will not assign them.
- JFIF files use a .jpg asset extension (same JPEG bytes); the AVIF dish photo was converted to JPEG for compatibility.
- assets/places/supplied contains local copies. Existing app assets were preserved.
- Keep ownership/usage permissions for the user-supplied source photos; any visible credits/watermarks remain intact.

## Checks

- node --test tests/suppliedPlaceImages.test.cjs tests/geoapifyPlaces.test.cjs
- All 189 asset headers decode successfully.
- Expo web bundle returns HTTP 200.

