import React, { useState, useEffect, useContext } from "react";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";

import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import { logout } from "../../utils/auth";

function ChangePassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState({
        old_password: "",
        new_password: "",
        confirm_new_password: "",
    });

    const handlePasswordChange = (event) => {
        setPassword({
            ...password,
            [event.target.name]: event.target.value,
        });
    };
    console.log(password);

    const changePasswordSubmit = async (e) => {
        e.preventDefault();

        if (password.confirm_new_password !== password.new_password) {
            Toast().fire({
                icon: "error",
                title: "Password does not match",
            });
        }

        const formdata = new FormData();
        formdata.append("user_id", UserData()?.user_id);
        formdata.append("old_password", password.old_password);
        formdata.append("new_password", password.new_password);
        setIsLoading(true);

        try {
            const res = await useAxios.post("user/change-password/", formdata);
            Toast().fire({
                icon: res.data.icon,
                title: res.data.message,
            });

            if (res.data.icon === "success") {
                logout();
                window.location.href = "/login";
            }
        } catch (error) {
            Toast().fire({
                icon: "error",
                title: "An error occurred while changing the password.",
            });
        } finally {
                setIsLoading(false);
        }
    };

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
