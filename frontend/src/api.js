import axios from "axios";

const API_BASE = "http://localhost:5001/api";

export const api = {
  register: (payload) => axios.post(`${API_BASE}/register`, payload),
  login: (payload) => axios.post(`${API_BASE}/login`, payload),
  submitHealth: (payload) => axios.post(`${API_BASE}/health-record`, payload),
  getHealthRecords: (employeeId) =>
    axios.get(`${API_BASE}/health-records/${employeeId}`),
  listDoctors: () => axios.get(`${API_BASE}/doctors`),
  bookAppointment: (payload) =>
    axios.post(`${API_BASE}/appointments`, payload),
  getEmployeeAppointments: (employeeId) =>
    axios.get(`${API_BASE}/appointments/employee/${employeeId}`),
  getHighRisk: () => axios.get(`${API_BASE}/query/high-risk`),
    runQueryDoctorByEmployee: (payload) => axios.post(`${API_BASE}/query/doctor-by-employee`, payload),
  runQueryAppointmentsByDoctor: (payload) => axios.post(`${API_BASE}/query/appointments-by-doctor`, payload),
  runQueryHealthByEmployee: (payload) => axios.post(`${API_BASE}/query/health-by-employee`, payload),
};
