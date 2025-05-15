import React from 'react'
import { Link } from 'react-router-dom'

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
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/student/dashboard/`}>
                    <i className="bi bi-speedometer2 text-primary"></i> Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/student/courses/`}>
                    <i className="fas fa-book text-success"></i> My Courses
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/student/wishlist/`}>
                    <i className="fas fa-heart text-danger"></i> Wishlist
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/student/question-answer/`}>
                    <i className="fas fa-envelope text-info"></i> Q/A
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/student/ai-teaching-agent/`}>
                    <i className="fas fa-robot text-warning"></i> AI Teaching Agent
                  </Link>
                </li>
              </ul>
  
              {/* Navbar header */}
              <span className="navbar-header mb-2 text-muted fw-semibold ps-3">Account Settings</span>
              <ul className="list-unstyled ms-n2 mb-0">
                <li className="nav-item">
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/student/profile/`}>
                    <i className="fas fa-user-edit text-warning"></i> Edit Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/student/change-password/`}>
                    <i className="fas fa-lock text-secondary"></i> Change Password
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link py-2 px-3 rounded d-flex align-items-center gap-2 hover-bg-light" to={`/login/`}>
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
export default Sidebar  