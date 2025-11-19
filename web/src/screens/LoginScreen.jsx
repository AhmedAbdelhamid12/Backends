import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Input from '../components/Input';
import './LoginScreen.css';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      toast.success('Login successful!');
      // Navigate immediately after successful login
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="login-wave wave1"></div>
        <div className="login-wave wave2"></div>
        <div className="login-wave wave3"></div>
      </div>

      {/* Floating Bubbles */}
      <div className="bubbles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`bubble bubble-${i + 1}`}></div>
        ))}
      </div>

      <div className={`login-container ${!showWelcome ? 'login-container-show' : ''}`}>
        <div className="login-card">
          {/* Logo Section */}
          <div className="login-logo-section">
            <div className="login-logo">
              <div className="logo-swim-icon">🏊‍♂️</div>
            </div>
            <h1 className="login-title">Swim Academy Pro</h1>
            <p className="login-subtitle">Dive into Excellence</p>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <button className="social-btn google-btn" onClick={handleGoogleLogin} type="button">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="divider">
            <span>or continue with email</span>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              fullWidth
              autoComplete="email"
              icon="📧"
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              fullWidth
              autoComplete="current-password"
              icon="🔒"
            />

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-password">Forgot password?</a>
            </div>
            
            <Button type="submit" loading={loading} fullWidth size="large">
              Sign In
            </Button>
          </form>
          
          <div className="login-footer">
            <p>Don't have an account? <Link to="/register" className="signup-link">Sign up</Link></p>
            <p className="demo-info">Demo Account</p>
            <div className="demo-credentials">
              <code>admin@swimacademy.com</code>
              <code>admin123</code>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="login-info-panel">
          <div className="info-content">
            <h2>🌟 Welcome to Swim Academy Pro</h2>
            <ul className="features-list">
              <li>
                <span className="feature-icon">✅</span>
                <div>
                  <strong>Professional Training</strong>
                  <p>Expert coaches and personalized programs</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">📊</span>
                <div>
                  <strong>Track Progress</strong>
                  <p>Monitor your improvement over time</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">🏆</span>
                <div>
                  <strong>Achievements</strong>
                  <p>Earn badges and celebrate milestones</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">👥</span>
                <div>
                  <strong>Community</strong>
                  <p>Connect with fellow swimmers</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;