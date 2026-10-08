import "./Header.css";

const Header = () => {
  return (
    <section className="header">
      <div className="header-contents">
        <div className="header-copy">
          <h2>
            <span className="header-title-lead">Smoked Catfish Delivered</span>{" "}
            to Your Doorstep
          </h2>

          <p>We smoke premium catfish in Nigeria.</p>

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
      </div>
    </section>
  );
};

export default Header;
