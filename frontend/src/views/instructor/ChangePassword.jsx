import React, { useState, useEffect } from "react";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import { logout } from "../../utils/auth";
import { Link } from "react-router-dom";

function ChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState({
    old_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  const checkTeacherStatus = async () => {
    try {
      const response = await apiInstance.get(`teacher/status/`);
      setIsTeacher(response.data.is_teacher || false);
    } catch (error) {
      console.error("Error checking teacher status:", error);
      setIsTeacher(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTeacherStatus();
  }, []);

  const handlePasswordChange = (event) => {
    setPassword({
      ...password,
      [event.target.name]: event.target.value,
    });
  };

  const changePasswordSubmit = async (e) => {
    e.preventDefault();

    if (password.confirm_new_password !== password.new_password) {
      Toast.error("Password does not match");
      return;
    }

    const formdata = new FormData();
    formdata.append("user_id", UserData()?.user_id);
    formdata.append("old_password", password.old_password);
    formdata.append("new_password", password.new_password);

    setIsLoading(true);
    try {
      const res = await apiInstance.post("user/change-password/", formdata);
      Toast[res.data.icon || "success"](res.data.message || "Password changed");

      if (res.data.icon === "success") {
        logout();
        window.location.href = "/login";
      }
    } catch (error) {
      Toast.error("An error occurred while changing the password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <BaseHeader />
        <section className="pt-6 pb-6 bg-light min-vh-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Checking status...</p>
              </div>
            </div>
          </div>
        </section>
        <BaseFooter />
      </>
    );
  }

  if (!isTeacher) {
    return (
      <>
        <BaseHeader />
        <section className="pt-6 pb-6 bg-light min-vh-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-md-10">
                <div className="card text-center shadow-lg">
                  <div className="card-body p-5">
                    <div className="mb-4">
                      <i className="fas fa-chalkboard-teacher text-primary display-1"></i>
                    </div>
                    <h2 className="card-title mb-3">Become an Instructor</h2>
                    <p className="card-text text-muted mb-4 fs-5">
                      You haven't registered as an instructor yet. Register now to start 
                      sharing knowledge and creating amazing courses!
                    </p>
                    
                    <div className="row text-start mb-4">
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <span>Create unlimited courses</span>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <span>Earn money from courses</span>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <span>Manage students easily</span>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <span>24/7 Support</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                      <Link 
                        to="/instructor/register" 
                        className="btn btn-primary btn-lg px-5 me-md-2"
                      >
                        <i className="fas fa-user-graduate me-2"></i>
                        Become an Instructor
                      </Link>
                      <Link 
                        to="/" 
                        className="btn btn-outline-secondary btn-lg px-4"
                      >
                        <i className="fas fa-home me-2"></i>
                        Back to Home
                      </Link>
                    </div>
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

  return (
    <>
      <BaseHeader />

      <section className="pt-6 pb-6 bg-light min-vh-100">
        <div className="container">
          {/* Header */}
          <Header />
          <div className="row mt-4">
            {/* Sidebar */}
            <Sidebar />

            <div className="col-lg-9 col-md-8 col-12">
              <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-bottom-0 rounded-top-4 px-4 py-3">
                  <h4 className="mb-3">
                    <i className="fas fa-lock text-secondary"></i> Change Password
                  </h4>
                </div>

                <div className="card-body px-4 py-4">
                  <form className="row g-3 needs-validation" noValidate onSubmit={changePasswordSubmit}>
                    <div className="col-12">
                      <label className="form-label">Old Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="**************"
                        required
                        name="old_password"
                        value={password.old_password}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="**************"
                        required
                        name="new_password"
                        value={password.new_password}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="**************"
                        required
                        name="confirm_new_password"
                        value={password.confirm_new_password}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div className="col-12 text-end mt-2">
                      <button
                        className="btn btn-primary px-4 py-2 rounded-pill"
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            Saving... <i className="fas fa-spinner fa-spin ms-2"></i>
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
        </div>
      </section>

      <BaseFooter />
    </>
  );
}

export default ChangePassword;