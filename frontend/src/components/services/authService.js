// src/services/authService.js
const getToken = () => {
    return localStorage.getItem('token');
  };
  
  const setToken = (token) => {
    localStorage.setItem('token', token);
  };
  
  const removeToken = () => {
    localStorage.removeItem('token');
  };
  
  const isAuthenticated = () => {
    const token = getToken();
    return !!token;
  };
  
  export const authService = {
    getToken,
    setToken,
    removeToken,
    isAuthenticated
  };