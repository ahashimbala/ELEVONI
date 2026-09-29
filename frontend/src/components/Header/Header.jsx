import "./Header.css";

const Header = () => {
  return (
    <section className="header">
      <div className="header-contents">
        <h2><span className="header-title-lead">Smoked Catfish Delivered</span> to Your Doorstep</h2>

        <p>We smoke premium catfish in Nigeria.</p>
        <img
          className="header-inline-image"
          src="/header4.png"
          alt=""
          aria-hidden="true"
        />
        <button
          onClick={() =>
            document
              .getElementById("fish-display")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Shop Now
        </button>
      </div>

      <div className="header-visual">
        <img
          className="header-visual-image"
          src="/header4.png"
          alt="Smoked catfish arranged on a tray"
          fetchPriority="high"
        />
      </div>
    </section>
  );
};

export default Header;
