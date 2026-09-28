import "./Header.css";

const Header = () => {
  return (
    <div className="header">
      <div className="header-contents">
        <h2>
          Smoked Catfish <br />
          Delivered to Your <br />
          Doorstep
        </h2>
        <p>
          We smoke premium catfish in <br />
          Nigeria.
        </p>
        <button onClick={() => document.getElementById("fish-display")?.scrollIntoView({ behavior: "smooth" })}>Shop Now</button>
      </div>
    </div>
  );
};

export default Header;
