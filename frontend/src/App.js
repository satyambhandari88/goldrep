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
import { authService } from './components/services/authService';
import "./App.css";


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = authService.getToken();
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Router>
      {/* ✅ Navbar will only show if the user is logged in */}
      {isAuthenticated && <Navbar />}

      

    
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={<Navigate to={authService.isAuthenticated() ? "/dashboard" : "/login"} />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><BillingForm /></ProtectedRoute>} />
          <Route path="/udhaar" element={<ProtectedRoute><UdhaarPage /></ProtectedRoute>} />
          <Route path="/udhaar/:phone" element={<ProtectedRoute><UdhaarDetailsPage /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><LoanTable /></ProtectedRoute>} />
          <Route path="/loan/:id" element={<ProtectedRoute><LoanDetails /></ProtectedRoute>} />
          <Route path="/add-loan" element={<ProtectedRoute><AddLoan /></ProtectedRoute>} />
          
          {/* Preorder Routes (Now Protected) */}
          <Route path="/preorders" element={<ProtectedRoute><PreorderTable /></ProtectedRoute>} />
          <Route path="/preorder/add" element={<ProtectedRoute><AddPreorder /></ProtectedRoute>} />
          <Route path="/preorder/:id" element={<ProtectedRoute><PreorderDetails /></ProtectedRoute>} />

        </Routes>
      
    </Router>
  );
};

export default App;
