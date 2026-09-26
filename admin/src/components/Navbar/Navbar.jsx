import "./Navbar.css";
import { assets } from "../../assets/assets";
import { useAuth } from "../../context/useAuth";
const Navbar = () => {
  const { logout, user } = useAuth();
  return <div className="navbar"><img className="logo" src={assets.logo} alt="Elevoni" /><div className="admin-account"><span>{user?.name || user?.email}</span><button type="button" onClick={logout}>Log out</button></div></div>;
};
export default Navbar;
