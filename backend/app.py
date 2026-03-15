import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

DB_PATH = "health_app.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS employee (
        employee_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        age           INTEGER,
        gender        TEXT,
        role          TEXT NOT NULL DEFAULT 'employee'
    );

    CREATE TABLE IF NOT EXISTS doctor (
        doctor_id      INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT NOT NULL,
        specialization TEXT
    );

    CREATE TABLE IF NOT EXISTS health_record (
        record_id      INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id    INTEGER NOT NULL,
        blood_pressure INTEGER NOT NULL,
        cholesterol    INTEGER NOT NULL,
        heart_rate     INTEGER NOT NULL,
        risk_level     TEXT NOT NULL,
        record_date    TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointment (
        appointment_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id      INTEGER NOT NULL,
        doctor_id        INTEGER NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id)   REFERENCES doctor(doctor_id)   ON DELETE CASCADE
    );
    """)

        # Seed doctors
    cur.execute("SELECT COUNT(*) AS c FROM doctor")
    if cur.fetchone()["c"] == 0:
        cur.executemany(
            "INSERT INTO doctor (name, specialization) VALUES (?, ?)",
            [
                ("Dr. Rajesh Kumar", "Cardiology"),
                ("Dr. Priya Sharma", "General Physician"),
                ("Dr. Amit Patel", "Endocrinology"),
                ("Dr. Sneha Reddy", "Neurology"),
                ("Dr. Vikram Singh", "Orthopedics"),
                ("Dr. Anjali Mehta", "Dermatology"),
                ("Dr. Rohit Verma", "Psychiatry"),
                ("Dr. Kavita Desai", "Pulmonology"),
                ("Dr. Suresh Rao", "Gastroenterology"),
                ("Dr. Neha Gupta", "Ophthalmology"),
            ],
        )
    conn.commit()
    conn.close()

def compute_risk(age, bp, chol, hr):
    score = 0
    if age and age >= 45:
        score += 1
    if bp >= 140:
        score += 2
    elif bp >= 120:
        score += 1
    if chol >= 240:
        score += 2
    elif chol >= 200:
        score += 1
    if hr >= 100:
        score += 1

    if score <= 1:
        return "Low"
    elif score <= 3:
        return "Medium"
    else:
        return "High"

app = Flask(__name__)
CORS(app)

# Initialize database on first request
with app.app_context():
    init_db()

# ---------- AUTH ----------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    name = data["name"]
    email = data["email"]
    password = data["password"]
    age = data.get("age")
    gender = data.get("gender")

    password_hash = generate_password_hash(password)

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO employee (name, email, password_hash, age, gender, role) "
            "VALUES (?, ?, ?, ?, ?, 'employee')",
            (name, email, password_hash, age, gender),
        )
        conn.commit()
        employee_id = cur.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Email already exists"}), 400
    conn.close()
    return jsonify({"employee_id": employee_id}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data["email"]
    password = data["password"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT employee_id, name, password_hash, role FROM employee WHERE email = ?",
        (email,),
    )
    row = cur.fetchone()
    conn.close()

    if row and check_password_hash(row["password_hash"], password):
        return jsonify({
            "user_id": row["employee_id"],
            "name": row["name"],
            "role": row["role"]
        })
    return jsonify({"error": "Invalid credentials"}), 401

# ---------- HEALTH RECORDS ----------

@app.route("/api/health-record", methods=["POST"])
def create_health_record():
    data = request.json
    employee_id = data["employee_id"]
    age = data["age"]
    bp = data["blood_pressure"]
    chol = data["cholesterol"]
    hr = data["heart_rate"]

    risk = compute_risk(age, bp, chol, hr)
    today = datetime.today().strftime("%Y-%m-%d")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO health_record (employee_id, blood_pressure, cholesterol, heart_rate, risk_level, record_date) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (employee_id, bp, chol, hr, risk, today),
    )
    conn.commit()
    conn.close()

    return jsonify({"risk_level": risk}), 201

@app.route("/api/health-records/<int:employee_id>", methods=["GET"])
def get_health_records(employee_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT record_id, blood_pressure, cholesterol, heart_rate, risk_level, record_date "
        "FROM health_record WHERE employee_id = ? ORDER BY record_date DESC",
        (employee_id,),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

# ---------- DOCTORS & APPOINTMENTS ----------

@app.route("/api/doctors", methods=["GET"])
def list_doctors():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT doctor_id, name, specialization FROM doctor")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route("/api/appointments", methods=["POST"])
def create_appointment():
    data = request.json
    employee_id = data["employee_id"]
    doctor_id = data["doctor_id"]
    date = data["appointment_date"]
    time = data["appointment_time"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) AS c FROM appointment "
        "WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?",
        (doctor_id, date, time),
    )
    if cur.fetchone()["c"] > 0:
        conn.close()
        return jsonify({"error": "Slot already booked"}), 400

    cur.execute(
        "INSERT INTO appointment (employee_id, doctor_id, appointment_date, appointment_time) "
        "VALUES (?, ?, ?, ?)",
        (employee_id, doctor_id, date, time),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"}), 201

@app.route("/api/appointments/employee/<int:employee_id>", methods=["GET"])
def get_employee_appointments(employee_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT a.appointment_id, a.appointment_date, a.appointment_time,
               d.name AS doctor_name, d.specialization
        FROM appointment a
        JOIN doctor d ON a.doctor_id = d.doctor_id
        WHERE a.employee_id = ?
        ORDER BY a.appointment_date, a.appointment_time
        """,
        (employee_id,),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

# ---------- PREDEFINED QUERY ----------

@app.route("/api/query/high-risk", methods=["GET"])
def high_risk_employees():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT DISTINCT e.name, e.email, hr.risk_level
        FROM health_record hr
        JOIN employee e ON hr.employee_id = e.employee_id
        WHERE hr.risk_level = 'High'
        """
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)
@app.route("/api/query/doctor-by-employee", methods=["POST"])
def doctor_by_employee():
    data = request.json
    employee_name = data.get("employee_name", "")
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT e.name AS employee_name, d.name AS doctor_name, 
               d.specialization, a.appointment_date, a.appointment_time
        FROM appointment a
        JOIN employee e ON a.employee_id = e.employee_id
        JOIN doctor d ON a.doctor_id = d.doctor_id
        WHERE e.name LIKE ?
        ORDER BY a.appointment_date DESC
        """,
        (f"%{employee_name}%",),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route("/api/query/appointments-by-doctor", methods=["POST"])
def appointments_by_doctor():
    data = request.json
    doctor_name = data.get("doctor_name", "")
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT d.name AS doctor_name, e.name AS employee_name, 
               e.email, a.appointment_date, a.appointment_time
        FROM appointment a
        JOIN doctor d ON a.doctor_id = d.doctor_id
        JOIN employee e ON a.employee_id = e.employee_id
        WHERE d.name LIKE ?
        ORDER BY a.appointment_date DESC
        """,
        (f"%{doctor_name}%",),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route("/api/query/health-by-employee", methods=["POST"])
def health_by_employee():
    data = request.json
    employee_name = data.get("employee_name", "")
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT e.name AS employee_name, e.email, hr.blood_pressure, 
               hr.cholesterol, hr.heart_rate, hr.risk_level, hr.record_date
        FROM health_record hr
        JOIN employee e ON hr.employee_id = e.employee_id
        WHERE e.name LIKE ?
        ORDER BY hr.record_date DESC
        """,
        (f"%{employee_name}%",),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

if __name__ == "__main__":
    app.run(debug=True, port=5001)



