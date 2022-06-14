import { difference, update } from 'ramda'
import buildWmsLayer from '~/lib/build-wms-layer'
import mapLayerOpacity from '~/lib/map-layer-opacity'
import mapLayersWithFilter from '~/lib/map-layers-with-filter'

export default {
  namespaced: true,

  state: () => ({
    mapLoaded: false,
    rasterLayers: [],
    drawMode: null,
    drawnFeatures: [],
    filtersLayerId: null, // id of active layer to filter
    selectedLayerForSelection: null,
  }),

  getters: {
    mapLoaded: state => state.mapLoaded,
    rasterLayers: state => (state.mapLoaded && state.rasterLayers) || [], //layers that have been added on map
    rasterLayerIds: state => (state.rasterLayers || []).map(({ id }) => id),//id of layers that have been added on map
    rasterLayerWithTimeIds (state, getters) {
      if (!getters.rasterLayers) {
        return []
      }
      return getters.rasterLayers.filter(layer => layer?.timeFilter).map(({ id })=>id)
    },
    wmsLayers (state, getters, rootState)  { // derive from raster layers; mapbox layers format
      
      const { rasterLayers, filtersLayerId } = state
      
      const { selectedTimestamp, cqlFilter } = rootState.data
      if (!rasterLayers) {
        return []
      }
   
      const mappedFilteredLayers = mapLayersWithFilter(rasterLayers, filtersLayerId, selectedTimestamp, cqlFilter)
      const wmsLayers = mappedFilteredLayers.map(layer => buildWmsLayer(layer))
      const mappedWmsLayers = mapLayerOpacity(state.rasterLayers, wmsLayers)
      return mappedWmsLayers
    },
    wmsLayerIds: state => (state.rasterLayers || []).map(({ id }) => id),
    drawMode: state => state.drawMode,
    drawnFeatures: state => state.drawnFeatures,
    filtersLayerId: state => state.filtersLayerId,
    selectedLayerForSelection: state => state.selectedLayerForSelection,
  },

  mutations: {
    SET_MAP_LOADED(state) {
      state.mapLoaded = true
    },
    SET_RASTER_LAYERS(state, { layers }) {
      state.rasterLayers = layers
    },
    ADD_RASTER_LAYER(state, { layer }) {
      state.rasterLayers = [ layer, ...state.rasterLayers ]
    },
    MOVE_RASTER_LAYER(state, { fromIndex, toIndex }) {
      var element = state.rasterLayers[fromIndex]
      state.rasterLayers.splice(fromIndex, 1)
      state.rasterLayers.splice(toIndex, 0, element)
    },
    REMOVE_RASTER_LAYER(state, { layer }) {
      state.rasterLayers = state.rasterLayers.filter(rasterLayer => rasterLayer.id !== layer.id)
    },
    SET_DRAW_MODE(state, { mode }) {
      state.drawMode = mode
    },
    ADD_DRAWN_FEATURE(state, feature) {
      if (!state.drawnFeatures.find(f => f.properties.gebiedid === feature.properties.gebiedid)) {
        state.drawnFeatures = [
          ...state.drawnFeatures,
          feature,
        ]
      }
    },
    REMOVE_DRAWN_FEATURE(state, feature) {
      state.drawnFeatures = state.drawnFeatures.filter(f => f.properties.gebiedid !== feature.properties.gebiedid)
    },
    SET_DRAWN_FEATURES(state, feature) {
      state.drawnFeatures = Object.freeze(feature)
    },
    UPDATE_RASTER_LAYER_OPACITY(state, { id, opacity }) {
      const layerToUpdate = state.rasterLayers.find(layer => layer.id === id)
      const index = state.rasterLayers.findIndex(layer => layer.id === id)

      if (!layerToUpdate) {
        return
      }

      layerToUpdate.opacity = opacity

      state.rasterLayers = update(index, layerToUpdate, state.rasterLayers)
    },
    SET_FILTERS_LAYER_ID(state, id) {
      state.filtersLayerId = id
    },
    REMOVE_FILTERS_LAYER_ID(state) {
      state.filtersLayerId = null
    },
    SET_SELECTED_LAYER_FOR_SELECTION(state, layer) {
      state.selectedLayerForSelection = layer
    },
  },

  actions: {
    setMapLoaded({ commit }) {
      commit('SET_MAP_LOADED')
    },

    setRasterLayers({ commit, state }, { layers }) {
  /*     const wmsLayers = layers.map(layer => buildWmsLayer(layer))
      const mappedWmsLayers = mapLayerOpacity(state.rasterLayers, wmsLayers) */

      //commit('SET_RASTER_LAYERS', { layers: mappedWmsLayers })
      commit('SET_RASTER_LAYERS', { layers: layers })
    },

    addRasterLayer({ commit, state }, { layers }) {
/*       const wmsLayers = layers.map(layer => buildWmsLayer(layer))
     
      const mappedWmsLayers = mapLayerOpacity(state.rasterLayers, wmsLayers)
      const layersToAdd = difference(mappedWmsLayers, state.rasterLayers)
      console.log('layersToAdd', layersToAdd)
      layersToAdd.forEach(layer => {
        commit('ADD_RASTER_LAYER', { layer })
      }) */
      
      const layersToAdd = difference(layers , state.rasterLayers)
     
      layersToAdd.forEach(layer => {
        commit('ADD_RASTER_LAYER', { layer })
      })
    },

    removeRasterLayer({ commit }, { layers }) {
      layers.forEach(layer => commit('REMOVE_RASTER_LAYER', { layer }))
    },
    //TODO: I dont like this implementation 
    removeFiltersLayerId({ commit }) {
      commit('REMOVE_FILTERS_LAYER_ID')
    },

    moveRasterLayer({ commit }, { fromIndex, toIndex }) {
      commit('MOVE_RASTER_LAYER', { fromIndex, toIndex })
    },

    setDrawMode({ commit, state }, { mode }) {
      const modeToCommit = state.drawMode === mode ? null : mode
      commit('SET_DRAW_MODE', { mode: modeToCommit })
    },

    addDrawnFeature({ commit }, feature) {
      commit('ADD_DRAWN_FEATURE', feature)
    },

    removeDrawnFeature({ commit }, feature) {
      commit('REMOVE_DRAWN_FEATURE', feature)
    },

    setDrawnFeatures({ commit }, features) {
      commit('SET_DRAWN_FEATURES', features)
    },

    cleardrawnFeatures({ commit }) {
      commit('SET_DRAWN_FEATURES', [])
    },

    updateRasterLayerOpacity({ commit }, { id, opacity }) {
      commit('UPDATE_RASTER_LAYER_OPACITY', { id, opacity })
    },

    setFiltersLayerId({ commit }, id) {
      commit('SET_FILTERS_LAYER_ID', id)
    },

    setSelectedLayerForSelection({ commit }, layer) {
      commit('SET_SELECTED_LAYER_FOR_SELECTION', layer)
    },
  },
}
