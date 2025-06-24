import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Toast from "../plugin/Toast";
import apiInstance from "../../utils/axios";

export default function ClerkCallback() {
  const navigate = useNavigate();
  const { isLoaded, userId, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const handleCallback = async () => {
      try {
        const token = await getToken({ template: "LMS-Project" });
        if (!token) {
          Toast.error("Fail to fetch token from Clerk");
          return;
        }
        const res = await apiInstance.post("/clerk/login/", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { access, refresh, user } = res.data;
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("user", JSON.stringify(user));
        apiInstance.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        Toast.success("Login successful");
        navigate("/");
      } catch (error) {
        Toast.error(error?.response?.data?.detail || "Login failed");
      }
    };

    handleCallback();
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) {
    return (
      <section className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3">Đang xác thực tài khoản...</p>
        </div>
      </section>
    );
  }

  return null;
}
