import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

/**
 * Navbar Component - Furni-inspired navigation
 * Features:
 * - Responsive mobile menu
 * - User authentication status
 * - Role-based navigation
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navigationLinks = {
    admin: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Users', path: '/users' },
      { label: 'Subscriptions', path: '/subscriptions' },
      { label: 'Teams', path: '/teams' },
      { label: 'Sessions', path: '/sessions' },
      { label: 'Progress', path: '/progress' },
    ],
    coach: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Teams', path: '/teams' },
      { label: 'Sessions', path: '/sessions' },
      { label: 'Progress', path: '/progress' },
      { label: 'Achievements', path: '/achievements' },
    ],
    trainee: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Sessions', path: '/sessions' },
      { label: 'Progress', path: '/progress' },
      { label: 'Achievements', path: '/achievements' },
    ],
    parent: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Progress', path: '/progress' },
      { label: 'Achievements', path: '/achievements' },
    ],
  };

  const currentLinks = user ? navigationLinks[user.role] || [] : [];

  return (
    <nav className="custom-navbar navbar navbar-expand-md navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          FitHub<span>.</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarsFurni"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}
          id="navbarsFurni"
        >
          {user && (
            <ul className="custom-navbar-nav navbar-nav ms-auto mb-2 mb-md-0">
              {currentLinks.map((link) => (
                <li key={link.path} className="nav-item">
                  <Link className="nav-link" to={link.path}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <ul className="custom-navbar-cta navbar-nav mb-2 mb-md-0 ms-5">
            {user ? (
              <>
                <li className="nav-item dropdown">
                  <span className="nav-link dropdown-toggle" role="button">
                    {user.name || user.email}
                  </span>
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <li>
                <Link className="nav-link" to="/login">
                  Login
                </Link>
              </li>
            )}</ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
