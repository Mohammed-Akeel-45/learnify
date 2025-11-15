// src/services/course.js
import api from './api'
export const courseService = {
// Get all courses
getAllCourses: async (filters = {}) => {
const { data } = await api.get('/courses', { params: filters })
return data
},
// Get single course
getCourse: async (id) => {
const { data } = await api.get(`/courses/${id}`)
return data
},
// Get enrolled courses
getEnrolledCourses: async () => {
const { data } = await api.get('/courses/my/enrolled')
return data
},
// Enroll in course
enrollCourse: async (id) => {
const { data } = await api.post(`/courses/${id}/enroll`)
return data
}
}