import { useState, useContext, useEffect, useRef } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [googleError, setGoogleError] = useState("");

  const [currState, setCurrState] = useState("Login");
  useEffect(() => {
    if (!googleClientId) return undefined;
    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) {
            toast.error("Google sign-in did not return a credential. Please try again.");
            return;
          }
          try {
            const response = await axios.post(`${url}/api/user/google`, { credential });
            if (!response.data?.success || !response.data?.token) {
              throw new Error(response.data?.message || "Google sign-in failed.");
            }
            setToken(response.data.token);
            localStorage.setItem("token", response.data.token);
            setShowLogin(false);
            toast.success(currState === "Sign Up" ? "Your Elevoni account is ready!" : "Welcome back to Elevoni!");
          } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to sign in with Google. Please try again.");
          }
        }
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: currState === "Sign Up" ? "signup_with" : "signin_with",
        shape: "rect",
        width: String(Math.min(360, Math.floor(googleButtonRef.current.getBoundingClientRect().width || 360)))
      });
    };

    const handleScriptError = () => setGoogleError(`Google ${currState === "Sign Up" ? "sign-up" : "sign-in"} is unavailable right now.`);
    const scriptId = "google-identity-services";
    let script = document.getElementById(scriptId);
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderGoogleButton);
      script.addEventListener("error", handleScriptError, { once: true });
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderGoogleButton);
      script?.removeEventListener("error", handleScriptError);
    };
  }, [currState, googleClientId, setShowLogin, setToken, url]);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    try {
      const response = await axios.post(newUrl, data);

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        setShowLogin(false);

        if (currState === "Login") {
          toast.success("Welcome back! Logged in successfully.");
        } else {
          toast.success("Account created successfully! Welcome aboard.");
        }
      } else {
        toast.error(response.data.message || "Authentication failed.");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(
        error.response?.data?.message || "Server error. Please try again.",
      );
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>
        <div className="login-popup-inputs">
          {currState === "Login" ? (
            <></>
          ) : (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name"
              required
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">
          {currState === "Sign Up" ? "Create account" : "Login"}
        </button>
        <>
            <div className="login-popup-divider" aria-hidden="true"><span>or</span></div>
            {googleClientId ? (
              <div className="google-signin-button" ref={googleButtonRef} aria-label={currState === "Sign Up" ? "Sign up with Google" : "Sign in with Google"} />
            ) : (
              <p className="google-signin-message">Google {currState === "Sign Up" ? "sign-up" : "sign-in"} is not configured yet.</p>
            )}
            {googleError && <p className="google-signin-message" role="status">{googleError}</p>}
        </>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
        {currState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
