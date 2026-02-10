declare module "@mapbox/mapbox-sdk/services/geocoding" {
  type GeocodingClient = (...args: never[]) => unknown;
  const geocoding: GeocodingClient;
  export default geocoding;
}
