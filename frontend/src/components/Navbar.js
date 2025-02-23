import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Icons for menu
import { authService } from "./services/authService"; // Import auth service
import "./Navbar.css"; // Import CSS

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <p>GOLDREP</p>
        </Link>
      </div>

      {/* Hamburger Menu Icon for Mobile */}
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={28} /> : <Menu size={28} />}
      </div>

      {/* Navigation Links */}
      <ul className={menuOpen ? "nav-links active" : "nav-links"}>
        <li><Link to="/dashboard" onClick={() => setMenuOpen(false)}>Home</Link></li>
        <li><Link to="/billing" onClick={() => setMenuOpen(false)}>Bill</Link></li>
        <li><Link to="/preorders" onClick={() => setMenuOpen(false)}>Preorders</Link></li>
        <li><Link to="/loans" onClick={() => setMenuOpen(false)}>Loans</Link></li>
        <li><Link to="/udhaar" onClick={() => setMenuOpen(false)}>Udhaar</Link></li>
        <li><Link to="/inventory" onClick={() => setMenuOpen(false)}>Inventory</Link></li>

        {/* Show shop name if logged in */}
        {/* {isAuthenticated && user && (
          <li className="shop-name">Welcome, {user.shopName || "Shopkeeper"}</li>
        )} */}

        {/* Show Login if not authenticated, Logout if authenticated */}
        <li>
          {isAuthenticated ? (
            <button 
              className="logout-btn" 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Logout
            </button>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
