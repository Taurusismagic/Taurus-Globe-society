export const MAJOR_CITIES: Record<string, [number, number]> = {
  "dubai": [25.07725, 55.30927],
  "abu dhabi": [24.45118, 54.39696],
  "buenos aires": [-34.61315, -58.37723],
  "vienna": [48.20849, 16.37208],
  "sydney": [-33.86785, 151.20732],
  "melbourne": [-37.814, 144.96332],
  "london": [51.50853, -0.12574],
  "toronto": [-43.70011, -79.4163],
  "vancouver": [49.24966, -123.11934],
  "paris": [48.85341, 2.3488],
  "berlin": [52.52437, 13.41053],
  "tokyo": [35.6895, 139.69171],
  "new york city": [40.71427, -74.00597],
  "los angeles": [34.05223, -118.24368],
  "chicago": [41.85003, -87.65005],
  "houston": [29.76328, -95.36327],
  "san francisco": [37.77493, -122.41942],
  "seattle": [47.60621, -122.33207],
  "singapore": [1.28967, 103.85007],
  "amsterdam": [52.37403, 4.88969],
  "milan": [45.46427, 9.18951],
  "lisbon": [38.71667, -9.13333],
  "madrid": [40.4165, -3.70256],
  "barcelona": [41.38506, 2.1734],
};

export const getCityCoordinates = (cityName: string): [number, number] | null => {
  return MAJOR_CITIES[cityName.toLowerCase()] || null;
};
