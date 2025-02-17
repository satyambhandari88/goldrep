// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Inventory from './components/Inventory';
import BillingForm from './components/BillingForm';
import UdhaarPage from './components/UdhaarPage';
import UdhaarDetailsPage from './components/UdhaarDetailsPage';
import AddLoan from './components/AddLoan';
import LoanDetails from './components/LoanDetails';
import LoanTable from './components/LoanTable';
import PreorderTable from "./components/PreorderTable";
import AddPreorder from "./components/AddPreorder";
import PreorderDetails from "./components/PreorderDetails";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  return (
    <Router>


<Navbar />

<div className="page-content">



      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingForm />
            </ProtectedRoute>
          }
        />



      <Route
          path="/udhaar"
          element={
            <ProtectedRoute>
              <UdhaarPage />
            </ProtectedRoute>
          }
        />



      <Route
          path="/udhaar/:phone"
          element={
            <ProtectedRoute>
              <UdhaarDetailsPage />
            </ProtectedRoute>
          }
        />




      <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <LoanTable />
            </ProtectedRoute>
          }
        />



      <Route
          path="/loan/:id"
          element={
            <ProtectedRoute>
              <LoanDetails />
            </ProtectedRoute>
          }
        />



      <Route
          path="/add-loan"
          element={
            <ProtectedRoute>
              <AddLoan />
            </ProtectedRoute>
          }
        />


      <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


<Route path="/preorders" element={<PreorderTable />} />
        <Route path="/preorder/add" element={<AddPreorder />} />
        <Route path="/preorder/:id" element={<PreorderDetails />} />

        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>

      </div>
    </Router>
  );
};

export default App;