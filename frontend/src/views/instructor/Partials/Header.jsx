import React, { useContext } from "react";
import { ProfileContext } from "../../plugin/Context";
import { Link } from 'react-router-dom'
import moment from "moment";

function Header() {
  const [profile, setProfile] = useContext(ProfileContext);

  return (
    <div className="row align-items-center">
      <div className="col-12">
        <div className="card px-4 pt-4 pb-4 shadow rounded-4 bg-white border-0">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            {/* Profile Info */}
            <div className="d-flex align-items-center mb-3 mb-md-0">
              {profile.image && (
                <div className="me-3 position-relative">
                  <img
                    src={profile.image}
                    alt="Profile"
                    className="rounded-circle shadow border border-3 border-white"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
              <div>
                <h4 className="fw-bold text-primary mb-1">{profile.full_name}</h4>
                <p className="text-muted mb-1">
                  {profile.about || "No bio provided."}
                </p>
                <small className="text-muted">
                  <i className="fas fa-globe me-1 text-secondary"></i>
                  {profile.country || "Unknown"} &nbsp;|&nbsp;
                  <i className="fas fa-calendar-alt me-1 text-secondary"></i>
                  {moment(profile.date).format("MMM YYYY")}
                </small>
              </div>
            </div>

            {/* Action */}
            <div>
              <Link
                to="/instructor/profile/"
                className="btn btn-outline-primary btn-sm px-4 py-2 rounded-pill"
              >
                <i className="fas fa-gear fa-spin me-2"></i> Account Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Header;

