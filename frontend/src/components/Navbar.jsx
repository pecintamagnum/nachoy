import { Link } from 'react-router-dom';
import { ShoppingCart, User, ClipboardList } from 'lucide-react';

export default function Navbar({ cartCount }) {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        🌮 Nachos Fiesta
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-item">Menu</Link>
        <Link to="/cart" className="nav-item cart-icon-wrapper">
          <ShoppingCart size={24} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
        <Link to="/history" className="nav-item" title="Pesanan Saya">
          <ClipboardList size={24} />
        </Link>
        <Link to="/admin" className="nav-item admin-icon">
          <User size={24} />
        </Link>
      </div>
    </nav>
  );
}
