import { useState, useEffect} from "react";
import { useNavigate, Link } from "react-router-dom";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { login } from "../../utils/auth";
import { useAuthStore } from "../../store/auth";
import Toast from "../plugin/Toast";
import { useClerk } from "@clerk/clerk-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Toast.warning("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    const { error } = await login(trimmedEmail, trimmedPassword);

    if (error) {
      Toast.error(error);
    } else {
      Toast.success("Login successful");
      navigate("/");
    }

    setIsLoading(false);
  };

  const { redirectToSignIn } = useClerk();
  const handleOAuthLogin = async () => {
  setOauthLoading(true);
  try {
    await redirectToSignIn({
      strategy: "oauth_google",
      redirectUrl: window.location.origin + "/clerk-callback",
    });
  } catch (err) {
    console.error(err);
    Toast.error("Google login failed via Clerk");
    setOauthLoading(false);
  }
};


  return (
    <>
      <BaseHeader />

      <section className="container d-flex flex-column vh-100 justify-content-center align-items-center">
        <div className="row w-100 justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="card shadow rounded-4 border-0">
              <div className="card-body p-5">
                <div className="mb-4 text-center">
                  <h1 className="fw-bold mb-2">Sign in</h1>
                  <p className="text-muted">
                    Don’t have an account?
                    <Link to="/register/" className="ms-1 text-primary text-decoration-none fw-semibold">
                      Sign up
                    </Link>
                  </p>
                </div>

                <div className="d-grid mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-dark rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    onClick={handleOAuthLogin}
                    disabled={oauthLoading}
                  >
                    {oauthLoading ? (
                      <>
                        Redirecting <i className="fas fa-spinner fa-spin"></i>
                      </>
                    ) : (
                      <>
                        <img
                          src="https://www.svgrepo.com/show/475656/google-color.svg"
                          alt="Google icon"
                          width="20"
                          height="20"
                        />
                        Continue with Google
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center mb-3 text-muted">
                  <small>or sign in with your email</small>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="form-control rounded-3 py-2"
                      placeholder="johndoe@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-semibold">
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        className="form-control rounded-start py-2"
                        placeholder="**************"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <span
                        className="input-group-text bg-white border-start-0"
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="rememberme"
                      />
                      <label className="form-check-label" htmlFor="rememberme">
                        Remember me
                      </label>
                    </div>
                    <Link to="/forgot-password/" className="text-decoration-none text-primary">
                      Forgot password?
                    </Link>
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 py-2 fw-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          Processing <i className="fas fa-spinner fa-spin ms-2"></i>
                        </>
                      ) : (
                        <>
                          Sign in <i className="fas fa-sign-in-alt ms-2"></i>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BaseFooter />
    </>
  );
}

export default Login;
