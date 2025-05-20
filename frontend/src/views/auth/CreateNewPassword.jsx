import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import Toast from "../plugin/Toast";
import zxcvbn from "zxcvbn";

function CreateNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParam] = useSearchParams();

  const otp = searchParam.get("otp") || "";
  const uuidb64 = searchParam.get("uuidb64") || "";
  const refreshToken = searchParam.get("refresh_token") || "";

  useEffect(() => {
    if (!otp || !uuidb64 || !refreshToken) {
      Toast.error("Invalid or expired reset link");
      navigate("/login");
    }
  }, [otp, uuidb64, refreshToken, navigate]);

  const handleCreatePassword = async (e) => {
    e.preventDefault();

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    const strength = zxcvbn(trimmedPassword);

    if (!trimmedPassword || !trimmedConfirm) {
      Toast.warning("Please fill in both fields.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      Toast.warning("Passwords do not match.");
      return;
    }

    if (strength.score < 2) {
      Toast.warning("Password is too weak. Try using more unique characters.");
      return;
    }

    const formData = new FormData();
    formData.append("password", trimmedPassword);
    formData.append("otp", otp);
    formData.append("uuidb64", uuidb64);
    formData.append("refresh_token", refreshToken);

    setIsLoading(true);

    try {
      const res = await apiInstance.post("user/password-change/", formData);
      Toast.success(res.data.message || "Password updated successfully");
      navigate("/login");
    } catch (error) {
      Toast.error(
        error?.response?.data?.message || "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = zxcvbn(password);

  return (
    <>
      <BaseHeader />
      <section className="container d-flex flex-column vh-100 justify-content-center align-items-center">
        <div className="row w-100 justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="card shadow rounded-4 border-0">
              <div className="card-body p-5">
                <div className="mb-4 text-center">
                  <h1 className="fw-bold mb-2">Create New Password</h1>
                  <p className="text-muted">Choose a strong password for your account</p>
                </div>
                <form onSubmit={handleCreatePassword} noValidate>
                  <div className="mb-4 position-relative">
                    <label htmlFor="new-password" className="form-label fw-semibold">
                      New Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="new-password"
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
                      <small
                        className={`text-${
                          passwordStrength.score >= 3 ? "success" : "danger"
                        }`}
                      >
                        Strength: {["Very Weak", "Weak", "Fair", "Good", "Strong"][passwordStrength.score]}
                      </small>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirm-password" className="form-label fw-semibold">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="form-control rounded-3 py-2"
                      placeholder="**************"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary rounded-3 py-2 fw-semibold" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          Processing <i className="fas fa-spinner fa-spin ms-2"></i>
                        </>
                      ) : (
                        <>
                          Save New Password <i className="fas fa-check-circle ms-2"></i>
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

export default CreateNewPassword;
