# Employee Health Monitoring System

A comprehensive full-stack application for managing employee health records, assessing cardiovascular risks, and scheduling doctor appointments. 

## Features

- **Authentication:** Secure employee registration and login.
- **Health Tracking:** Employees can log their health records including Age, Blood Pressure, Cholesterol, and Heart Rate.
- **Risk Assessment:** The system automatically computes a cardiovascular risk level (Low, Medium, High) based on the inputs provided.
- **Doctor Appointments:** Employees can browse the list of available specialized doctors and book an appointment slot.
- **Reporting & Queries:** 
  - Identify high-risk employees.
  - Review an employee's appointment history with a specific doctor.
  - Review an doctor's client schedule.

## Tech Stack

- **Frontend:** React.js, React Router, Chart.js (for analytics/visualization)
- **Backend:** Python, Flask, Flask-CORS
- **Database:** SQLite (Relational DB for Employees, Doctors, Records, and Appointments)

## Getting Started

Follow the instructions below to get the project up and running locally.

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Python 3.x](https://www.python.org/)

### Backend Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install the dependencies:
   *(Assuming there is a requirements.txt, or manually install)*
   ```bash
   pip install Flask Flask-Cors Werkzeug
   ```
4. Run the Flask development server:
   ```bash
   python app.py
   ```
   > The server will start on `http://127.0.0.1:5001`. The database `health_app.db` and sample doctor seed data will be automatically generated upon the first request.

### Frontend Setup

1. Open a new terminal tab/window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary NPM dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   > The React app will run on `http://localhost:3000` and proxy/fetch requests to the backend server.

## Database Schema

The SQLite database (`health_app.db`) uses the following core entities:
- **employee**: Stores employee profiles and authentication hash.
- **doctor**: Stores doctor details and their medical specialization.
- **health_record**: Logs employee health indicators and computed risk over time.
- **appointment**: Maps employees to doctors based on specific dates and times.

## License

This project is licensed under the MIT License.
