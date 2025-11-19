import Navbar from './Navbar';
// Footer is now exported as a named export from new design system
// Keep old Footer import for backward compatibility if needed
import './Layout.css';

/**
 * Layout Component - Furni-inspired layout with Navbar and Footer
 * Wraps all protected pages with navigation and footer
 */
const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
