import axios from 'axios'
import { map, uniq, pipe, find, propEq } from 'ramda'


import {
  WCS_LAYER_TYPE,
  WFS_LAYER_TYPE,
} from '~/lib/constants'


const getTagContent = tag => tag.textContent
const getParentNode = tag => tag.parentNode
const textToArray = text => text.split(',') //split at comma


const getTags = tagName => root =>
  [ ...root ]
    .map(el => [ ...el.getElementsByTagName(tagName) ])
    .flat()

const findLayer = id => (layers) => {
  
  let layer = layers.find(layer => layer.textContent === id)
  if (layer) {
    return layer
  } else {
    const idWithoutWorkspace = id.split(':')[1]
    layer = layers.find(layer => layer.textContent === idWithoutWorkspace)
    return layer
  } 
}

function readBbox(bboxElement) {
  const bbox = [ [ bboxElement.getElementsByTagName('westBoundLongitude')[0].textContent,
  bboxElement.getElementsByTagName('southBoundLatitude')[0].textContent ], 
  [ bboxElement.getElementsByTagName('eastBoundLongitude')[0].textContent,
  bboxElement.getElementsByTagName('northBoundLatitude')[0].textContent ] ]
  return bbox
}

function createParameters(type) {
  if (type === WCS_LAYER_TYPE) {
    return 'service=WCS&request=GetCapabilities'
  }
  if (type === WFS_LAYER_TYPE) {
    return 'service=WFS&request=GetCapabilities'
  }
}


 
export async function getCapabilities(service, type) {
  /**
   * GetCapabilities wfs or wcs based on the input type
   * create parameters and make the request
   * parse it as a dom element
   */
  const _type = type
  const serviceUrl = new URL(service)
  const servicePath = `${ serviceUrl.origin }${ serviceUrl.pathname }`
  const { data } = await axios(`${ servicePath }?${ createParameters(_type) }`)
  return new DOMParser().parseFromString(data, 'text/xml')
}

export async function getWmsCapabilities(service) {
  /** 
 * The getWmsCapabilitis is made when a layer is clicked.  
 * 
 * */ 
  //the getcapabilities returns the capabilities of the layers in the workspace. need to search for the layer first
  const serviceUrl = new URL(service)
  const servicePath = `${ serviceUrl.origin }${ serviceUrl.pathname }`
  
  const { data } = await axios(`${ servicePath }?service=WMS&request=GetCapabilities`)

  return new DOMParser().parseFromString(data, 'text/xml')

}

export function getSupportedOutputFormats(type, capabilities) {
  
  //wfs
  const outputFormats = pipe(
      () => [ ...capabilities.querySelectorAll('[name="outputFormat"]') ],
      getTags('ows:AllowedValues'),
      getTags('ows:Value'),
      map(getTagContent),
      uniq,
    )
  //wcs
  const formatSupported = pipe(
      () => capabilities,
      el => el.getElementsByTagName('wcs:Capabilities'),
      getTags('wcs:ServiceMetadata'),
      getTags('wcs:formatSupported'),
      map(getTagContent),
    )

  if (type === WCS_LAYER_TYPE) {
    return formatSupported()
  }
  if (type === WFS_LAYER_TYPE) {
    return outputFormats()
  }

}

export function getLayerProperties(capabilities, layer) {
/**
 * function that reads the wms capabilities response of the workpspace
 * 1. find the given layer
 * 2. extracts:   
 *    -wmsVersion
 *    -bbox of layer
 *    -keywords (that contain the service type)
 *    -service type of layer (wfs or wcs)
 *    -time extent of layer
 *  
 *  * */

  const wmsVersion = pipe(
    () => capabilities.querySelector('WMS_Capabilities'),
    el => el.getAttribute('version'),
  )()

  const bbox = pipe(
    () => [ ...capabilities.querySelectorAll('[queryable="1"], [queryable="0"], [opaque="0"]') ],
    getTags('Name'),
    findLayer(layer),
    getParentNode,
    el => el.querySelector('EX_GeographicBoundingBox'),
    readBbox,
  )()
  
  const keywords = pipe(
    () => [ ...capabilities.querySelectorAll('[queryable="1"], [queryable="0"], [opaque="0"]')],
    getTags('Name'),
    findLayer(layer),
    getParentNode,
    el => el.getElementsByTagName('KeywordList'),
    getTags('Keyword'),
    map(getTagContent),  
  )()
  const serviceType = [ 'features', 'wfs', 'FEATURES', 'WFS' ].some(val => keywords.includes(val)) ? 'wfs' 
        :[ 'WCS', 'GeoTIFF', 'wcs' ].some(val => keywords.includes(val)) ? 'wcs' 
        : null

  const timeExtent = pipe(
    () => [ ...capabilities.querySelectorAll('[queryable="1"], [queryable="0"], [opaque="0"]') ],
    getTags('Name'),
    findLayer(layer),
    getParentNode,
    el =>[ ...el.getElementsByTagName('Dimension') ],
    map(getTagContent),
    map(textToArray),
    (array) => array.flat(),
  )()
 
  return { serviceType, timeExtent, wmsVersion, bbox }
}


