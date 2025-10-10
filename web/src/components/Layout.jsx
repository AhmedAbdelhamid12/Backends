import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'coach', 'trainee', 'parent'] },
    { path: '/users', label: 'Users', roles: ['admin'] },
    { path: '/sessions', label: 'Sessions', roles: ['admin', 'coach'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="navbar-brand">
            <span className="brand-icon">🏊</span>
            <span className="brand-text">Swim Academy</span>
          </div>
          <div className="navbar-menu">
            {filteredNavItems.map(item => (
              <Link key={item.path} to={item.path} className="nav-link">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <span className="user-name">{user?.name || user?.email}</span>
              <span className="role-badge">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
