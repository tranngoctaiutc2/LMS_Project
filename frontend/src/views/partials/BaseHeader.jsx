import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../plugin/Context";
import { useAuthStore } from "../../store/auth";
import { useTranslation } from "react-i18next";

function BaseHeader() {
    const [cartCount] = useContext(CartContext);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isLoggedIn, user] = useAuthStore((state) => [state.isLoggedIn, state.user]);

    return (
        <div className="base-header">
            <style jsx>{`
                .base-header .navbar {
                    background: #1f2937;
                    border-bottom: 1px solid #334155;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                    padding: 0.75rem 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .base-header .navbar-brand {
                    font-weight: 700;
                    font-size: 1.5rem;
                    color: #3b82f6;
                    text-decoration: none;
                }

                .base-header .navbar-brand:hover {
                    color: #2563eb;
                }

                .base-header .navbar .nav-link {
                    color: #e2e8f0;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .base-header .navbar .nav-link:hover,
                .base-header .navbar .nav-link.active {
                    background-color: #2563eb;
                    color: #ffffff;
                }

                .base-header .dropdown-menu {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    padding: 0.5rem;
                    margin-top: 0.25rem;
                }

                .base-header .dropdown-item {
                    color: #64748b;
                    border-radius: 6px;
                    padding: 0.5rem 0.75rem;
                    margin: 0.125rem 0;
                    transition: all 0.3s ease;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .base-header .dropdown-item:hover {
                    background-color: #f1f5f9;
                    color: #2563eb;
                }

                .base-header .dropdown-item i {
                    width: 16px;
                    text-align: center;
                    color: #94a3b8;
                }

                .base-header .dropdown-item:hover i {
                    color: #2563eb;
                }

                .base-header .search-container {
                    display: flex;
                    align-items: center;
                    background: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    padding: 0.5rem 1rem;
                    transition: all 0.3s ease;
                    max-width: 280px;
                    cursor: pointer;
                    margin: 0 1rem;
                }

                .base-header .search-container:hover {
                    border-color: #2563eb;
                    background-color: #e0f2fe;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }

                .base-header .fake-placeholder {
                    color: #64748b;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                }

                .base-header .auth-buttons {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-left: 1rem;
                }

                .base-header .auth-btn {
                    border-radius: 6px;
                    padding: 0.5rem 1rem;
                    font-weight: 500;
                    border: 1px solid transparent;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }

                .base-header .login-btn,
                .base-header .register-btn {
                    background: #3b82f6;
                    color: white;
                }

                .base-header .login-btn:hover,
                .base-header .register-btn:hover {
                    background: #2563eb;
                }

                .base-header .logout-btn {
                    background: #ef4444;
                    color: white;
                }

                .base-header .logout-btn:hover {
                    background: #dc2626;
                }

                .base-header .cart-btn {
                    background: #10b981;
                    color: white;
                    position: relative;
                }

                .base-header .cart-btn:hover {
                    background: #059669;
                }

                .base-header .cart-count {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    font-weight: 600;
                    padding: 0.125rem 0.375rem;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    min-width: 1.25rem;
                    text-align: center;
                }

                .base-header .navbar-toggler {
                    border: 1px solid #e2e8f0;
                    padding: 0.375rem 0.5rem;
                    border-radius: 6px;
                    background: transparent;
                }

                .base-header .navbar-toggler-icon {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2837, 99, 235, 1%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='m4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
                }

                @media (max-width: 991.98px) {
                    .base-header .search-container {
                        margin: 1rem 0;
                        max-width: 100%;
                    }

                    .base-header .auth-buttons {
                        flex-direction: column;
                        width: 100%;
                        margin: 1rem 0 0 0;
                        gap: 0.5rem;
                    }

                    .base-header .auth-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .base-header .navbar-nav .nav-item {
                        margin: 0.125rem 0;
                    }
                }

                @media (min-width: 992px) {
                    .base-header .navbar-collapse {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }

                    .base-header .navbar-nav {
                        flex-direction: row;
                    }
                }
            `}</style>

            <nav className="navbar navbar-expand-lg">
                <div className="container">
                    <Link className="navbar-brand" to="/">
                        {t("company_name")}
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label={t("toggle_navigation")}
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <Link className="nav-link" to="/pages/contact-us/">
                                    <i className="fas fa-phone nav-icon"></i>
                                    {t("contact_us")}
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/pages/about-us/">
                                    <i className="fas fa-info-circle nav-icon"></i>
                                    {t("about_us")}
                                </Link>
                            </li>

                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="fas fa-chalkboard-user nav-icon"></i>
                                    {t("instructor")}
                                </a>
                                <ul className="dropdown-menu">
                                    <li><Link className="dropdown-item" to="/instructor/dashboard/"><i className="bi bi-grid-fill"></i>{t("dashboard")}</Link></li>
                                    <li><Link className="dropdown-item" to="/instructor/courses/"><i className="fas fa-book"></i>{t("my_courses")}</Link></li>
                                    <li><Link className="dropdown-item" to="/instructor/create-course/"><i className="fas fa-plus"></i>{t("create_course")}</Link></li>
                                    <li><Link className="dropdown-item" to="/instructor/reviews/"><i className="fas fa-star"></i>{t("reviews")}</Link></li>
                                    <li><Link className="dropdown-item" to="/instructor/question-answer/"><i className="fas fa-envelope"></i>{t("qa")}</Link></li>
                                    <li><Link className="dropdown-item" to="/instructor/students/"><i className="fas fa-users"></i>{t("students")}</Link></li>
                                    <li><Link className="dropdown-item" to="/instructor/earning/"><i className="fas fa-dollar-sign"></i>{t("earning")}</Link></li>
                                    <li><Link className="dropdown-item" to="/instructor/profile/"><i className="fas fa-gear"></i>{t("settings_profile")}</Link></li>
                                </ul>
                            </li>

                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="fas fa-graduation-cap nav-icon"></i>
                                    {t("student")}
                                </a>
                                <ul className="dropdown-menu">
                                    <li><Link className="dropdown-item" to="/student/dashboard/"><i className="bi bi-grid-fill"></i>{t("dashboard")}</Link></li>
                                    <li><Link className="dropdown-item" to="/student/courses/"><i className="fas fa-shopping-cart"></i>{t("my_courses")}</Link></li>
                                    <li><Link className="dropdown-item" to="/student/wishlist/"><i className="fas fa-heart"></i>{t("wishlist.text")}</Link></li>
                                    <li><Link className="dropdown-item" to="/student/question-answer/"><i className="fas fa-envelope"></i>{t("qa")}</Link></li>
                                    <li><Link className="dropdown-item" to="/student/profile/"><i className="fas fa-gear"></i>{t("settings_profile")}</Link></li>
                                    <li><Link className="dropdown-item" to="/student/ai-teaching-agent/"><i className="fas fa-robot"></i>{t("ai_teaching_team")}</Link></li>
                                </ul>
                            </li>
                        </ul>

                        <div className="search-container" role="button" onClick={() => navigate("/search")}>
                            <span className="fake-placeholder">
                                <i className="fas fa-search me-2 text-gray-500"></i>
                                {t("search_courses")}
                            </span>
                        </div>

                        <div className="auth-buttons">
                            {isLoggedIn() ? (
                                <Link to="/logout/" className="btn auth-btn logout-btn">
                                    <i className="fas fa-sign-out-alt"></i>
                                    {t("logout")}
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login/" className="btn auth-btn login-btn">
                                        <i className="fas fa-sign-in-alt"></i>
                                        {t("login")}
                                    </Link>
                                    <Link to="/register/" className="btn auth-btn register-btn">
                                        <i className="fas fa-user-plus"></i>
                                        {t("register")}
                                    </Link>
                                </>
                            )}
                            <Link className="btn auth-btn cart-btn" to="/cart/">
                                <i className="fas fa-shopping-cart"></i>
                                {t("cart")}
                                <span className="cart-count">{cartCount}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default BaseHeader;