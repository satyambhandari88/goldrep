import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: '',
    logo: '',
    gstNo: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      await axios.post('https://goldrep-1.onrender.com/api/auth/register', submitData);
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register Your Shop</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="shopName">Shop Name</label>
            <input
              id="shopName"
              name="shopName"
              type="text"
              required
              placeholder="Enter shop name"
              value={formData.shopName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ownerName">Owner Name</label>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              required
              placeholder="Enter owner name"
              value={formData.ownerName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
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

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              required
              placeholder="Enter shop address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo">Logo URL (Optional)</label>
            <input
              id="logo"
              name="logo"
              type="text"
              placeholder="Enter logo URL"
              value={formData.logo}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gstNo">GST Number</label>
            <input
              id="gstNo"
              name="gstNo"
              type="text"
              required
              placeholder="Enter GST number"
              value={formData.gstNo}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="submit-button">
            Register
          </button>
        </form>
        
        <div className="redirect-text">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="redirect-link">
            Login here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
