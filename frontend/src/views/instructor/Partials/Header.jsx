import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import apiInstance from "../../../utils/axios";

function Header() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiInstance.get("teacher/profile/");
        setProfile(res.data);
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
      }
    };
    fetchProfile();
  }, []);

  if (!profile) return null;

  return (
    <div className="row align-items-center">
      <div className="col-12">
        <div className="card px-4 pt-4 pb-4 shadow rounded-4 bg-white border-0">
          <div className="d-flex align-items-start justify-content-between flex-nowrap">
            {/* Profile Info */}
            <div className="d-flex align-items-start" style={{ maxWidth: "70%" }}>
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
              <div className="overflow-hidden">
                <h4 className="fw-bold text-primary mb-1 text-truncate">{profile.full_name}</h4>
                <p className="text-muted mb-1">{profile.about || "No bio provided."}</p>
                <small className="text-muted d-block mb-2">
                  <i className="fas fa-globe me-1 text-secondary"></i>
                  {profile.country || "Unknown"} &nbsp;|&nbsp;
                  <i className="fas fa-calendar-alt me-1 text-secondary"></i>
                  {profile.date ? moment(profile.date).format("MMM YYYY") : ""}
                </small>
                {profile.bio && (
                  <p className="mb-2 text-dark">
                    <strong>Bio:</strong> {profile.bio}
                  </p>
                )}

                {/* Social Links */}
                <div className="d-flex flex-wrap gap-2">
                  {profile.facebook && (
                    <a
                      href={profile.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary rounded-pill"
                    >
                      <i className="fab fa-facebook me-1"></i> Facebook
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={profile.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-info rounded-pill"
                    >
                      <i className="fab fa-twitter me-1"></i> Twitter
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                    >
                      <i className="fab fa-linkedin me-1"></i> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Account Settings Button */}
            <div className="ms-4 flex-shrink-0">
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
