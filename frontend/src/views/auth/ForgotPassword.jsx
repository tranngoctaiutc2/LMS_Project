import { useState } from "react";
import { Link } from "react-router-dom";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import Toast from "../plugin/Toast";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Toast.warning("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Toast.warning("Invalid email format");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiInstance.get(`user/password-reset/${trimmedEmail}/`);
      Toast.success(response.data?.message || "Password reset email sent");
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || "Failed to send reset email. Please try again.";
      Toast.error(errorMsg);
    } finally {
      setIsLoading(false);
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
                  <h1 className="fw-bold mb-2">Forgot Password</h1>
                  <p className="text-muted">We’ll help you get back into your account</p>
                </div>
                <form onSubmit={handleEmailSubmit} noValidate>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="form-control rounded-3 py-2"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 py-2 fw-semibold"
                      disabled={isLoading}
                      style={{ transition: "0.2s" }}
                    >
                      {isLoading ? (
                        <>
                          Processing <i className="fas fa-spinner fa-spin ms-2"></i>
                        </>
                      ) : (
                        <>
                          Reset Password <i className="fas fa-arrow-right ms-2"></i>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-3">
                  <Link to="/login" className="text-decoration-none text-primary fw-medium">
                    ← Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BaseFooter />
    </>
  );
}

export default ForgotPassword;
