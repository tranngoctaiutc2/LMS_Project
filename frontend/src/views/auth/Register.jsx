import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../utils/auth";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Toast from "../plugin/Toast";
import zxcvbn from "zxcvbn";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const navigate = useNavigate();

  const passwordStrength = zxcvbn(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = fullName.trim();
    const mail = email.trim();
    const pass1 = password.trim();
    const pass2 = password2.trim();

    if (!name || !mail || !pass1 || !pass2) {
      Toast.warning("Please fill in all fields.");
      return;
    }

    if (pass1 !== pass2) {
      Toast.warning("Passwords do not match.");
      return;
    }

    if (passwordStrength.score < 2) {
      Toast.warning("Password is too weak. Try a longer or more complex one.");
      return;
    }

    if (!agreed) {
      Toast.warning("You must agree to the terms before registering.");
      return;
    }

    setIsLoading(true);
    const { error } = await register(name, mail, pass1, pass2);

    if (error) {
      Toast.error(error);
      setIsLoading(false);
    } else {
      Toast.success("Registration successful!");
      navigate("/");
    }
  };

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0:
        return { label: "Very Weak", color: "danger" };
      case 1:
        return { label: "Weak", color: "warning" };
      case 2:
        return { label: "Fair", color: "secondary" };
      case 3:
        return { label: "Good", color: "info" };
      case 4:
        return { label: "Strong", color: "success" };
      default:
        return { label: "Unknown", color: "light" };
    }
  };

  const { label, color } = getStrengthLabel(passwordStrength.score);

  return (
    <>
      <BaseHeader />

      <section className="container d-flex flex-column vh-100 justify-content-center align-items-center">
        <div className="row w-100 justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="card shadow rounded-4 border-0">
              <div className="card-body p-5">
                <div className="mb-4 text-center">
                  <h1 className="fw-bold mb-2">Sign Up</h1>
                  <p className="text-muted">
                    Already have an account?
                    <Link to="/login/" className="ms-1 text-primary text-decoration-none fw-semibold">
                      Sign in
                    </Link>
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="full_name" className="form-label fw-semibold">Full Name</label>
                    <input
                      type="text"
                      id="full_name"
                      className="form-control rounded-3 py-2"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">Email Address</label>
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

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">Password</label>
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
                    {password && (
                      <div className="mt-2">
                        <span className={`badge bg-${color}`}>Strength: {label}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirm-password" className="form-label fw-semibold">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="form-control rounded-3 py-2"
                      placeholder="**************"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="terms"
                      checked={agreed}
                      onChange={() => setAgreed(!agreed)}
                    />
                    <label className="form-check-label" htmlFor="terms">
                      I agree to the <Link to="/#">Terms & Conditions</Link>
                    </label>
                  </div>

                  <div className="d-grid mt-4">
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
                          Sign Up <i className="fas fa-user-plus ms-2"></i>
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

export default Register;
