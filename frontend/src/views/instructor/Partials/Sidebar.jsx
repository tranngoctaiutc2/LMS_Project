import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="col-lg-3 col-md-4 col-12">
      <nav className="navbar navbar-expand-md shadow-sm mb-4 mb-lg-0 sidenav bg-white rounded-4 border">
        <a className="d-xl-none d-lg-none d-md-none text-dark fw-bold text-decoration-none p-3" href="#">
          Menu
        </a>
        <button
          className="navbar-toggler d-md-none icon-shape icon-sm rounded bg-primary text-white m-3"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#sidenav"
          aria-controls="sidenav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list"></i>
        </button>
        <div className="collapse navbar-collapse p-3" id="sidenav">
          <div className="navbar-nav flex-column w-100">
            <ul className="list-unstyled ms-n2 mb-4">
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/dashboard/">
                  <i className="bi bi-grid-fill text-primary"></i> Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/courses/">
                  <i className="fas fa-book text-success"></i> My Courses
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/create-course/">
                  <i className="fas fa-plus text-info"></i> Create Course
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/reviews/">
                  <i className="fas fa-star text-warning"></i> Review
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/students/">
                  <i className="fas fa-user-graduate text-info"></i> Students
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/earning/">
                  <i className="fas fa-dollar-sign text-success"></i> Earning
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/coupon/">
                  <i className="fas fa-tag text-primary"></i> Coupons
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/notifications/">
                  <i className="fas fa-bell text-danger"></i> Notifications
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/orders/">
                  <i className="fas fa-shopping-cart text-warning"></i> Orders
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/question-answer/">
                  <i className="fas fa-envelope text-info"></i> Q/A
                </Link>
              </li>
            </ul>

            <span className="navbar-header mb-2 text-muted fw-semibold ps-3">Account Settings</span>
            <ul className="list-unstyled ms-n2 mb-0">
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/profile/">
                  <i className="fas fa-chalkboard-teacher text-warning"></i> Edit Teacher Profile
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/instructor/change-password/">
                  <i className="fas fa-lock text-secondary"></i> Change Password
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to="/login/">
                  <i className="fas fa-sign-out-alt text-danger"></i> Sign Out
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;
