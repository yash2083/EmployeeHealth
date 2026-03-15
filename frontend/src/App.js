import React, { useState, useEffect } from "react";
import { api } from "./api";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);


function App() {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });

  const [healthForm, setHealthForm] = useState({
    age: "",
    blood_pressure: "",
    cholesterol: "",
    heart_rate: "",
  });
  const [healthHistory, setHealthHistory] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [apptForm, setApptForm] = useState({
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
  });
  const [appointments, setAppointments] = useState([]);
  const [highRiskList, setHighRiskList] = useState([]);
  
  const [queryType, setQueryType] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [queryResults, setQueryResults] = useState([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    api.listDoctors().then((res) => setDoctors(res.data)).catch(() => {});
    api.getEmployeeAppointments(user.user_id).then((res) => setAppointments(res.data)).catch(() => {});
    api.getHighRisk().then((res) => setHighRiskList(res.data)).catch(() => {});
    api.getHealthRecords(user.user_id).then((res) => setHealthHistory(res.data)).catch(() => {});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(loginForm);
      setUser(res.data);
      setMode("dashboard");
    } catch {
      alert("Login failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.register({
        ...regForm,
        age: parseInt(regForm.age || "0", 10),
      });
      alert("Registered! Now login.");
      setMode("login");
    } catch {
      alert("Register failed");
    }
  };

  const handleSubmitHealth = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = {
        employee_id: user.user_id,
        age: parseInt(healthForm.age || "0", 10),
        blood_pressure: parseInt(healthForm.blood_pressure || "0", 10),
        cholesterol: parseInt(healthForm.cholesterol || "0", 10),
        heart_rate: parseInt(healthForm.heart_rate || "0", 10),
      };
      const res = await api.submitHealth(payload);
      alert("Health data submitted! Risk: " + res.data.risk_level);
      loadData();
      setHealthForm({ age: "", blood_pressure: "", cholesterol: "", heart_rate: "" });
    } catch {
      alert("Error submitting health data");
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = {
        employee_id: user.user_id,
        doctor_id: parseInt(apptForm.doctor_id, 10),
        appointment_date: apptForm.appointment_date,
        appointment_time: apptForm.appointment_time,
      };
      await api.bookAppointment(payload);
      alert("Appointment booked!");
      loadData();
      setApptForm({ doctor_id: "", appointment_date: "", appointment_time: "" });
    } catch {
      alert("Could not book appointment");
    }
  };

  const handleRunQuery = async () => {
    try {
      let res;
      if (queryType === "high-risk") {
        res = await api.getHighRisk();
      } else if (queryType === "doctor-by-employee") {
        res = await api.runQueryDoctorByEmployee({ employee_name: queryInput });
      } else if (queryType === "appointments-by-doctor") {
        res = await api.runQueryAppointmentsByDoctor({ doctor_name: queryInput });
      } else if (queryType === "health-by-employee") {
        res = await api.runQueryHealthByEmployee({ employee_name: queryInput });
      }
      setQueryResults(res.data);
    } catch (error) {
      alert("Error executing query");
      setQueryResults([]);
    }
  };

  const getQuerySQL = () => {
    const queries = {
      "high-risk": `SELECT DISTINCT e.name, e.email, hr.risk_level
FROM health_record hr
JOIN employee e ON hr.employee_id = e.employee_id
WHERE hr.risk_level = 'High'`,
      "doctor-by-employee": `SELECT e.name AS employee_name, d.name AS doctor_name, 
       d.specialization, a.appointment_date, a.appointment_time
FROM appointment a
JOIN employee e ON a.employee_id = e.employee_id
JOIN doctor d ON a.doctor_id = d.doctor_id
WHERE e.name LIKE '%${queryInput}%'`,
      "appointments-by-doctor": `SELECT d.name AS doctor_name, e.name AS employee_name, 
       e.email, a.appointment_date, a.appointment_time
FROM appointment a
JOIN doctor d ON a.doctor_id = d.doctor_id
JOIN employee e ON a.employee_id = e.employee_id
WHERE d.name LIKE '%${queryInput}%'`,
      "health-by-employee": `SELECT e.name, e.email, hr.blood_pressure, hr.cholesterol,
       hr.heart_rate, hr.risk_level, hr.record_date
FROM health_record hr
JOIN employee e ON hr.employee_id = e.employee_id
WHERE e.name LIKE '%${queryInput}%'`
    };
    return queries[queryType] || "Select a query type";
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px",
    },
    card: {
      background: "rgba(255, 255, 255, 0.95)",
      padding: "40px",
      borderRadius: "20px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      minWidth: "400px",
      maxWidth: "400px",
    },
    dashboardContainer: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
    },
    dashboardCard: {
      maxWidth: "1200px",
      margin: "0 auto",
      background: "rgba(255,255,255,0.95)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    },
    header: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      padding: "30px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    nav: {
      display: "flex",
      gap: "0",
      background: "#f5f5f5",
      borderBottom: "2px solid #ddd",
    },
    navButton: {
      flex: 1,
      padding: "20px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      transition: "all 0.3s",
    },
    content: {
      padding: "30px",
    },
    input: {
      width: "100%",
      padding: "15px",
      margin: "10px 0",
      border: "2px solid #e1e5e9",
      borderRadius: "10px",
      fontSize: "16px",
      boxSizing: "border-box",
      outline: "none",
    },
    button: {
      width: "100%",
      padding: "15px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "18px",
      fontWeight: "600",
      cursor: "pointer",
      margin: "10px 0",
    },
    switchButton: {
      background: "transparent",
      color: "#667eea",
      border: "2px solid #667eea",
      padding: "10px 20px",
      borderRadius: "25px",
      cursor: "pointer",
      fontWeight: "500",
    },
    logoutButton: {
      background: "rgba(255,255,255,0.2)",
      color: "white",
      border: "2px solid white",
      padding: "10px 30px",
      borderRadius: "25px",
      cursor: "pointer",
      fontWeight: "600",
    },
    riskBadge: (level) => ({
      padding: "20px",
      background: level === "High" ? "#ff4757" : level === "Medium" ? "#ffa502" : "#26de81",
      color: "white",
      borderRadius: "10px",
      textAlign: "center",
      fontSize: "20px",
      fontWeight: "bold",
      margin: "20px 0",
    }),
    sectionTitle: {
      color: "#667eea",
      borderBottom: "3px solid #667eea",
      paddingBottom: "10px",
      marginBottom: "20px",
      fontSize: "24px",
    },
  };

  const globalStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    input:focus { border-color: #667eea !important; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important; }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 15px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #667eea; color: white; font-weight: 600; }
    tr:hover { background: #f9f9f9; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; margin: 10px 0; }
    .stat-card h3 { font-size: 36px; margin: 10px 0; }
    .stat-card p { opacity: 0.9; }
  `;

  // Get latest risk level
  const latestRisk = healthHistory.length > 0 ? healthHistory[0].risk_level : null;

  if (mode === "login") {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={{ textAlign: "center", color: "#333", marginBottom: "30px", fontSize: "28px", fontWeight: "700" }}>
              👨‍⚕️ Employee Health System
            </h2>
            <form onSubmit={handleLogin}>
              <input placeholder="📧 Email" style={styles.input} value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
              <input placeholder="🔒 Password" type="password" style={styles.input} value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              <button type="submit" style={styles.button}>🚀 Login</button>
            </form>
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              New Employee? <button style={styles.switchButton} onClick={() => setMode("register")}>Create Account</button>
            </p>
          </div>
        </div>
      </>
    );
  }

  if (mode === "register") {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={{ textAlign: "center", color: "#333", marginBottom: "30px", fontSize: "28px", fontWeight: "700" }}>
              👤 Employee Registration
            </h2>
            <form onSubmit={handleRegister}>
              <input placeholder="👤 Full Name" style={styles.input} value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
              <input placeholder="📧 Email" style={styles.input} value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
              <input placeholder="🔒 Password" type="password" style={styles.input} value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
              <input placeholder="🎂 Age" type="number" style={styles.input} value={regForm.age} onChange={(e) => setRegForm({ ...regForm, age: e.target.value })} />
              <input placeholder="⚧️ Gender" style={styles.input} value={regForm.gender} onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })} />
              <button type="submit" style={styles.button}>✅ Create Account</button>
            </form>
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              Already have account? <button style={styles.switchButton} onClick={() => setMode("login")}>Go to Login</button>
            </p>
          </div>
        </div>
      </>
    );
  }

  // DASHBOARD WITH TABS
  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.dashboardContainer}>
        <div style={styles.dashboardCard}>
          <div style={styles.header}>
            <div>
              <h2 style={{ margin: 0, fontSize: "28px" }}>👋 Welcome, {user?.name}</h2>
              <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>Employee Health Management Portal</p>
            </div>
            <button style={styles.logoutButton} onClick={() => { setUser(null); setMode("login"); setActiveTab("dashboard"); }}>Logout</button>
          </div>

          <div style={styles.nav}>
            {["dashboard", "health", "appointments", "queries"].map((tab) => (
              <button
                key={tab}
                style={{
                  ...styles.navButton,
                  background: activeTab === tab ? "white" : "transparent",
                  color: activeTab === tab ? "#667eea" : "#666",
                  borderBottom: activeTab === tab ? "3px solid #667eea" : "none",
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={styles.content}>
            {activeTab === "dashboard" && (
  <div>
    <h3 style={styles.sectionTitle}>📊 Dashboard Overview</h3>
    
    {/* Stats Cards */}
    <div className="grid-2">
      <div className="stat-card">
        <p>Total Health Records</p>
        <h3>{healthHistory.length}</h3>
      </div>
      <div className="stat-card">
        <p>Total Appointments</p>
        <h3>{appointments.length}</h3>
      </div>
    </div>

    {/* Latest Risk Badge */}
    {latestRisk && (
      <div style={styles.riskBadge(latestRisk)}>
        Latest Risk Level: {latestRisk}
      </div>
    )}

    {/* Upcoming Appointments */}
    <h4 style={{ marginTop: "40px", color: "#333", fontSize: "22px", marginBottom: "20px" }}>
      📅 Upcoming Appointments
    </h4>
    {appointments.filter(a => new Date(a.appointment_date + " " + a.appointment_time) >= new Date()).length === 0 ? (
      <div style={{ background: "#f9f9f9", padding: "30px", borderRadius: "10px", textAlign: "center" }}>
        <p style={{ color: "#999" }}>No upcoming appointments</p>
      </div>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Specialization</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {appointments
            .filter(a => new Date(a.appointment_date + " " + a.appointment_time) >= new Date())
            .map((a) => (
              <tr key={a.appointment_id}>
                <td>{a.doctor_name}</td>
                <td>{a.specialization}</td>
                <td>{a.appointment_date}</td>
                <td>{a.appointment_time}</td>
              </tr>
            ))}
        </tbody>
      </table>
    )}

    {/* Charts Section */}
    <div style={{ marginTop: "50px" }}>
      <h4 style={{ color: "#333", fontSize: "22px", marginBottom: "30px" }}>📈 Health & Appointment Analytics</h4>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Doctor Appointments Bar Chart */}
        <div style={{ background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}>
          <h5 style={{ color: "#667eea", marginBottom: "20px", fontSize: "18px" }}>
            👨‍⚕️ Appointments by Doctor
          </h5>
          {appointments.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>No data available</p>
          ) : (
            <Bar
              data={{
                labels: [...new Set(appointments.map(a => a.doctor_name))],
                datasets: [{
                  label: "Number of Appointments",
                  data: [...new Set(appointments.map(a => a.doctor_name))].map(
                    doctor => appointments.filter(a => a.doctor_name === doctor).length
                  ),
                  backgroundColor: "rgba(102, 126, 234, 0.7)",
                  borderColor: "rgba(102, 126, 234, 1)",
                  borderWidth: 2,
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false }
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
              }}
            />
          )}
        </div>

        {/* Risk Distribution Pie Chart */}
        <div style={{ background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}>
          <h5 style={{ color: "#667eea", marginBottom: "20px", fontSize: "18px" }}>
            ⚠️ Health Risk Distribution
          </h5>
          {healthHistory.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>No data available</p>
          ) : (
            <Pie
              data={{
                labels: ["Low Risk", "Medium Risk", "High Risk"],
                datasets: [{
                  data: [
                    healthHistory.filter(h => h.risk_level === "Low").length,
                    healthHistory.filter(h => h.risk_level === "Medium").length,
                    healthHistory.filter(h => h.risk_level === "High").length,
                  ],
                  backgroundColor: [
                    "rgba(38, 222, 129, 0.7)",
                    "rgba(255, 165, 2, 0.7)",
                    "rgba(255, 71, 87, 0.7)",
                  ],
                  borderColor: [
                    "rgba(38, 222, 129, 1)",
                    "rgba(255, 165, 2, 1)",
                    "rgba(255, 71, 87, 1)",
                  ],
                  borderWidth: 2,
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom" }
                }
              }}
            />
          )}
        </div>
      </div>
    </div>

    {/* Recent Health Records Table */}
    <h4 style={{ marginTop: "50px", color: "#333", fontSize: "22px", marginBottom: "20px" }}>
      🩺 Recent Health Records
    </h4>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Blood Pressure</th>
          <th>Cholesterol</th>
          <th>Heart Rate</th>
          <th>Risk Level</th>
        </tr>
      </thead>
      <tbody>
        {healthHistory.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: "center" }}>No health records yet</td>
          </tr>
        ) : (
          healthHistory.slice(0, 5).map((h) => (
            <tr key={h.record_id}>
              <td>{h.record_date}</td>
              <td>{h.blood_pressure} mmHg</td>
              <td>{h.cholesterol} mg/dL</td>
              <td>{h.heart_rate} bpm</td>
              <td>
                <strong style={{ 
                  color: h.risk_level === "High" ? "#ff4757" : h.risk_level === "Medium" ? "#ffa502" : "#26de81" 
                }}>
                  {h.risk_level}
                </strong>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}
            {activeTab === "health" && (
              <div>
                <h3 style={styles.sectionTitle}>🩺 Health Risk Assessment</h3>
                <form onSubmit={handleSubmitHealth}>
                  <div className="grid-2">
                    <input placeholder="Age" type="number" style={styles.input} value={healthForm.age} onChange={(e) => setHealthForm({ ...healthForm, age: e.target.value })} required />
                    <input placeholder="Blood Pressure (mmHg)" type="number" style={styles.input} value={healthForm.blood_pressure} onChange={(e) => setHealthForm({ ...healthForm, blood_pressure: e.target.value })} required />
                    <input placeholder="Cholesterol (mg/dL)" type="number" style={styles.input} value={healthForm.cholesterol} onChange={(e) => setHealthForm({ ...healthForm, cholesterol: e.target.value })} required />
                    <input placeholder="Heart Rate (bpm)" type="number" style={styles.input} value={healthForm.heart_rate} onChange={(e) => setHealthForm({ ...healthForm, heart_rate: e.target.value })} required />
                  </div>
                  <button type="submit" style={styles.button}>Calculate Risk Level</button>
                </form>

                <h4 style={{ marginTop: "40px", color: "#333", fontSize: "20px" }}>📋 All Health Records</h4>
                <table>
                  <thead><tr><th>Date</th><th>BP</th><th>Cholesterol</th><th>HR</th><th>Risk</th></tr></thead>
                  <tbody>
                    {healthHistory.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center" }}>No records yet</td></tr>
                    ) : (
                      healthHistory.map((h) => (
                        <tr key={h.record_id}>
                          <td>{h.record_date}</td>
                          <td>{h.blood_pressure}</td>
                          <td>{h.cholesterol}</td>
                          <td>{h.heart_rate}</td>
                          <td><strong style={{ color: h.risk_level === "High" ? "#ff4757" : h.risk_level === "Medium" ? "#ffa502" : "#26de81" }}>{h.risk_level}</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "appointments" && (
              <div>
                <h3 style={styles.sectionTitle}>📅 Book Appointment</h3>
                
                {!latestRisk ? (
                  <div style={{ background: "#fff3cd", padding: "20px", borderRadius: "10px", border: "2px solid #ffc107", marginBottom: "30px" }}>
                    <h4 style={{ color: "#856404", marginBottom: "10px" }}>⚠️ Health Assessment Required</h4>
                    <p style={{ color: "#856404", margin: 0 }}>Please complete your health risk assessment in the <strong>Health</strong> tab before booking an appointment.</p>
                  </div>
                ) : latestRisk === "Low" ? (
                  <div style={{ background: "#d4edda", padding: "20px", borderRadius: "10px", border: "2px solid #28a745", marginBottom: "30px" }}>
                    <h4 style={{ color: "#155724", marginBottom: "10px" }}>✅ Excellent Health Status</h4>
                    <p style={{ color: "#155724", margin: 0 }}>Your latest health assessment shows <strong>Low Risk</strong>. Appointments are only available for Medium or High risk employees. Keep maintaining your healthy lifestyle!</p>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      background: latestRisk === "High" ? "#f8d7da" : "#fff3cd", 
                      padding: "20px", 
                      borderRadius: "10px", 
                      border: latestRisk === "High" ? "2px solid #dc3545" : "2px solid #ffc107",
                      marginBottom: "20px" 
                    }}>
                      <h4 style={{ color: latestRisk === "High" ? "#721c24" : "#856404", marginBottom: "10px" }}>
                        {latestRisk === "High" ? "🚨 High Risk - Immediate Attention Required" : "⚠️ Medium Risk - Medical Consultation Recommended"}
                      </h4>
                      <p style={{ color: latestRisk === "High" ? "#721c24" : "#856404", margin: 0 }}>
                        Your latest risk assessment is <strong>{latestRisk}</strong>. Please book an appointment with a specialist.
                      </p>
                    </div>

                    <form onSubmit={handleBookAppointment}>
                      <select style={styles.input} value={apptForm.doctor_id} onChange={(e) => setApptForm({ ...apptForm, doctor_id: e.target.value })} required>
                        <option value="">Select Doctor & Specialization</option>
                        {doctors.map((d) => (<option key={d.doctor_id} value={d.doctor_id}>{d.name} - {d.specialization}</option>))}
                      </select>
                      <div className="grid-2">
                        <input type="date" style={styles.input} value={apptForm.appointment_date} onChange={(e) => setApptForm({ ...apptForm, appointment_date: e.target.value })} required />
                        <input type="time" style={styles.input} value={apptForm.appointment_time} onChange={(e) => setApptForm({ ...apptForm, appointment_time: e.target.value })} required />
                      </div>
                      <button type="submit" style={styles.button}>Book Appointment</button>
                    </form>
                  </>
                )}

                <h4 style={{ marginTop: "40px", color: "#333", fontSize: "20px" }}>📋 Your Appointments</h4>
                <table>
                  <thead><tr><th>Doctor</th><th>Specialization</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center" }}>No appointments yet</td></tr>
                    ) : (
                      appointments.map((a) => {
                        const appointmentDate = new Date(a.appointment_date + " " + a.appointment_time);
                        const now = new Date();
                        const status = appointmentDate < now ? "Completed" : "Upcoming";
                        return (
                          <tr key={a.appointment_id}>
                            <td>{a.doctor_name}</td>
                            <td>{a.specialization}</td>
                            <td>{a.appointment_date}</td>
                            <td>{a.appointment_time}</td>
                            <td><strong style={{ color: status === "Completed" ? "#28a745" : "#667eea" }}>{status}</strong></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "queries" && (
              <div>
                <h3 style={styles.sectionTitle}>🔍 Predefined Database Queries</h3>
                
                <div style={{ background: "#f0f4ff", padding: "25px", borderRadius: "15px", marginBottom: "30px" }}>
                  <h4 style={{ color: "#667eea", marginBottom: "20px" }}>Select Query Type</h4>
                  
                  <select 
                    style={{ ...styles.input, marginBottom: "20px" }} 
                    value={queryType} 
                    onChange={(e) => { setQueryType(e.target.value); setQueryResults([]); setQueryInput(""); }}
                  >
                    <option value="">-- Select a Query --</option>
                    <option value="high-risk">⚠️ Show All High-Risk Employees</option>
                    <option value="doctor-by-employee">👨‍⚕️ Show Doctor Booked by Employee</option>
                    <option value="appointments-by-doctor">📅 Show Appointments of a Doctor</option>
                    <option value="health-by-employee">🩺 Show Employee Health Details</option>
                  </select>

                  {(queryType === "doctor-by-employee" || queryType === "appointments-by-doctor" || queryType === "health-by-employee") && (
                    <div>
                      <input
                        style={styles.input}
                        placeholder={
                          queryType === "doctor-by-employee" ? "Enter Employee Name" :
                          queryType === "appointments-by-doctor" ? "Enter Doctor Name" :
                          "Enter Employee Name"
                        }
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                      />
                    </div>
                  )}

                  <button 
                    style={{ ...styles.button, marginTop: "10px" }} 
                    onClick={handleRunQuery}
                    disabled={!queryType}
                  >
                    🔍 Execute Query
                  </button>

                  {queryType && (
                    <div style={{ marginTop: "20px", padding: "15px", background: "white", borderRadius: "10px", border: "2px solid #667eea" }}>
                      <strong style={{ color: "#667eea" }}>SQL Query:</strong>
                      <pre style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "5px", overflow: "auto", fontSize: "12px" }}>
                        {getQuerySQL()}
                      </pre>
                    </div>
                  )}
                </div>

                <h4 style={{ color: "#333", marginBottom: "15px", fontSize: "20px" }}>📊 Query Results</h4>
                
                {queryResults.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", background: "#f9f9f9", borderRadius: "10px" }}>
                    <p style={{ color: "#999" }}>No results yet. Select a query above and click Execute.</p>
                  </div>
                ) : (
                  <div style={{ overflow: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(queryResults[0]).map((key) => (
                            <th key={key}>{key.replace(/_/g, " ").toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                              <td key={i}>{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p style={{ marginTop: "15px", color: "#666", textAlign: "center" }}>
                      <strong>{queryResults.length}</strong> result(s) found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
