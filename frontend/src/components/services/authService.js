const getToken = () => {
  return localStorage.getItem("token");
};

const setToken = (token) => {
  localStorage.setItem("token", token);
};

const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const isAuthenticated = () => {
  return !!getToken();
};

// Store user data
const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Logout function
const logout = () => {
  removeToken();
  window.location.href = "/login"; // Redirect to login page after logout
};

export const authService = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  setUser,
  getUser,
  logout
};
