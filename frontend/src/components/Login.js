import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authService } from "./services/authService";
import "./Login.css"; 

import K from "./k.png";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post("https://goldrep-1.onrender.com/api/auth/login", formData);
      
      // Store token & user in localStorage using authService
      authService.setToken(response.data.token);
      authService.setUser(response.data.user);

      navigate("/dashboard"); // Redirect to dashboard
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
    <div className="login-page">
      <div className="bg-pattern"></div>
      <div className="login-content">
      <div className="brand-container">
  {/* Moved logo to the top */}
  <div className="logo-wrapper">
    <img src= {K} alt="New Logo" className="logo" />
  </div>
  
  <h1 className="brand-name">GOLDREP</h1>
  
  {/* New logo in place of the old one */}

  
  <p className="brand-tagline">Premium Goldsmith Shop Management Software</p>
  <p className="company-name">by Reporev Technologies Pvt. Ltd.</p>
    <p>Exclusive Trading Partner: Purilyser</p>
  
</div>


        <div className="login-form-wrapper">
          <div className="login-form-container">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Log in to manage your goldsmith business</p>
            
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-wrapper">
                  <i className="icon phone-icon"></i>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    required
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <i className="icon password-icon"></i>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="forgot-password">
                <a href="/forgot-password">Forgot Password?</a>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Sign In'}
              </button>

                <div className="register-link">
                 <p className="register">Don't have an account? <a href="/register">Sign up here</a></p>
              </div>
                
            </form>
            
            <div className="support-section">
              <p className="login-subtitle">Need help? Contact our support team</p>
              <a href="mailto:support@reporevtech.com" className="support-link">support@reporevtech.com</a>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="login-footer">
        <p className="login-subtitle">© {new Date().getFullYear()} Reporev Technologies Pvt. Ltd. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <span className="footer-divider">|</span>
          <a href="/terms-of-service">Terms of Service</a>
        </div>
      </footer>
    </div>
    
  );
};

export default Login;
