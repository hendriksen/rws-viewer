import buildGeoServerUrl from './build-geoserver-url'
import _ from 'lodash'
//https://gis.stackexchange.com/questions/79201/lat-long-values-in-a-wms-getfeatureinfo-request

//Aquadesk
function extractFeatureId(feature) {
  
  const properties = _.get(feature, 'properties')
  const measurementobject = _.get(properties, 'measurementobject')
  
  let id
  if (measurementobject) {
    id = measurementobject
  } else {
    id = feature.id
  }
  return id
  
  
}
export default async function getFeatureInfo({ url, lng, lat,  layer, x=50, y=50, bounds, width=110, height=110 }) {
  let bbox = null
  // Bounding box used with area selection.
 
  if (bounds) {
    bbox = [
      bounds._sw.lng,
      bounds._sw.lat,
      bounds._ne.lng,
      bounds._ne.lat,
    ].join()
  }

  // Bounding box used with single point selection.
  if (lng && lat) {
    bbox = [
      (lng - 0.001),
      (lat - 0.001),
      (lng + 0.001),
      (lat + 0.001),
    ].join(',')
  }
  
  const geoServerUrl = await buildGeoServerUrl({
    url,
    request: 'GetFeatureInfo',
    service: 'WMS',
    version: '1.1.1',
    info_format: 'application/json',
    crs: 'EPSG:4326',
    layers: layer,
    query_layers: layer,
    width,
    height,
    x,
    y,
    bbox,
  })
  
  return fetch(geoServerUrl)
    .then(response => response.json())
    .then(({ features }) => features[0])
    .then((feature) => ({
      ...feature,
      id: extractFeatureId(feature),
    }))
    .catch(() => undefined)
}
