import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Icons for menu
import "./Navbar.css"; // Import the updated CSS

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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
        <li>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Home</Link>
        </li>
        <li>
          <Link to="/billing" onClick={() => setMenuOpen(false)}>Bill</Link>
        </li>
        <li>
          <Link to="/preorders" onClick={() => setMenuOpen(false)}>Preorders</Link>
        </li>
        <li>
          <Link to="/loans" onClick={() => setMenuOpen(false)}>Loans</Link>
        </li>
        <li>
          <Link to="/udhaar" onClick={() => setMenuOpen(false)}>Udhaar</Link>
        </li>
        <li>
          <Link to="/inventory" onClick={() => setMenuOpen(false)}>Inventory</Link>
        </li>
        <li>
          <Link to="/" onClick={() => setMenuOpen(false)}>Login/Logout</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
