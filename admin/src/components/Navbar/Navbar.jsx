import "./Navbar.css";
import { assets } from "../../assets/assets";
import { useAuth } from "../../context/useAuth";

const Navbar = () => {
  const { logout, user } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-logo-wrapper">
        <img className="logo" src={assets.logo} alt="Elevoni Admin" />
      </div>

      <div className="admin-account">
        <div className="user-info">
          <span className="user-avatar">
            {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
          </span>
          <div className="user-details">
            <span className="user-name">{user?.name || "Admin User"}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>

        <button type="button" className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
