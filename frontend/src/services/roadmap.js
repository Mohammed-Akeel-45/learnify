
// src/services/roadmap.js
import api from './api'
export const roadmapService = {
// Generate new roadmap
generateRoadmap: async (topic, level, duration) => {
const { data } = await api.post('/roadmaps/generate', { topic, level, duration })
return data
},
// Get all user roadmaps
getAllRoadmaps: async () => {
const { data } = await api.get('/roadmaps')
return data
},
// Get single roadmap
getRoadmap: async (id) => {
const { data } = await api.get(`/roadmaps/${id}`)
return data
},
// Update roadmap
updateRoadmap: async (id, updates) => {
const { data } = await api.put(`/roadmaps/${id}`, updates)
return data
},
// Generate course from module
generateCourse: async (roadmapId, moduleIndex) => {
const { data } = await api.post(`/roadmaps/${roadmapId}/generate-course`, { moduleIndex })
return data
},
// Delete roadmap
deleteRoadmap: async (id) => {
const { data } = await api.delete(`/roadmaps/${id}`)
return data
}
}
