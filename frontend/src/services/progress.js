
// src/services/progress.js
import api from './api'
export const progressService = {
// Get course progress
getCourseProgress: async (courseId) => {
const { data } = await api.get(`/progress/course/${courseId}`)
return data
},
// Update lesson progress
updateProgress: async (courseId, lessonIndex, completed = true) => {
const { data } = await api.post(`/progress/course/${courseId}/update`, {
lessonIndex,
completed
})
return data
},
// Get all progress
getAllProgress: async () => {
const { data } = await api.get('/progress/all')
return data
},
// Update time spent
updateTimeSpent: async (courseId, minutes) => {
const { data } = await api.post(`/progress/course/${courseId}/time`, { minutes })
return data
}
}