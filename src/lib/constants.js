export const VALID_VIEWER_CONFIGS = require('../../public/data/available-configs-viewers.json')

export const VALID_VIEWER_NAMES =  VALID_VIEWER_CONFIGS.map(({ name }) => name)

export const CATEGORIES = require('../../public/data/app.json').categories

export const COORDINATES_HANDLE = '[[COORDINATES]]'

// Layer types
export const OWS_LAYER_TYPE = 'ows'
export const WCS_LAYER_TYPE = 'wcs'
export const WMS_LAYER_TYPE = 'wms'
export const WFS_LAYER_TYPE = 'wfs'
