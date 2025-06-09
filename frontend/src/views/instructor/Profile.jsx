import React, { useState, useEffect, useContext } from "react";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import { ProfileContext } from "../plugin/Context";

function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState("");
  const [profile, setProfile] = useContext(ProfileContext);
  const [teacherData, setTeacherData] = useState({
    image: "",
    full_name: "",
    bio: "",
    about: "",
    country: "",
    facebook: "",
    twitter: "",
    linkedin: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);

  const checkTeacherStatus = async () => {
    try {
      const res = await apiInstance.get('teacher/check-status/');
      if (res.data.is_teacher) {
        setIsTeacher(true);
        setTeacherData(res.data.teacher);
        setImagePreview(res.data.teacher.image || "");
      } else {
        setIsTeacher(false);
        Toast.error(res.data.message || "You are not registered as a teacher");
      }
    } catch (error) {
      setIsTeacher(false);
      Toast.error("Unable to check teacher status");
    }
  };

  const fetchTeacherProfile = async () => {
    try {
      const res = await apiInstance.get('teacher/profile/');
      setTeacherData(res.data);
      setImagePreview(res.data.image || "");
      setOriginalImage(res.data.image || "");
      setIsTeacher(true);
    } catch (error) {
      if (error.response?.status === 404) {
        Toast.error("You are not registered as a teacher!");
        setIsTeacher(false);
      } else {
        Toast.error("Unable to load teacher information");
      }
    }
  };

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  const handleProfileChange = (event) => {
    setTeacherData({
      ...teacherData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setTeacherData({
      ...teacherData,
      [event.target.name]: selectedFile,
    });

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    if (selectedFile) reader.readAsDataURL(selectedFile);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formdata = new FormData();

      if (teacherData.image instanceof File) {
        formdata.append("image", teacherData.image);
      }

      formdata.append("full_name", teacherData.full_name || "");
      formdata.append("bio", teacherData.bio || "");
      formdata.append("about", teacherData.about || "");
      formdata.append("country", teacherData.country || "");
      formdata.append("facebook", teacherData.facebook || "");
      formdata.append("twitter", teacherData.twitter || "");
      formdata.append("linkedin", teacherData.linkedin || "");

      const updateRes = await apiInstance.patch(
        'teacher/profile/',
        formdata,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (updateRes.data.teacher) {
        setTeacherData(updateRes.data.teacher);
        setImagePreview(updateRes.data.teacher.image || "");
      }

      Toast.success(updateRes.data.message || "Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);

      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object' && !errors.message) {
          Object.keys(errors).forEach(key => {
            if (Array.isArray(errors[key])) {
              Toast.error(`${key}: ${errors[key].join(', ')}`);
            } else {
              Toast.error(`${key}: ${errors[key]}`);
            }
          });
        } else {
          Toast.error(errors.message || "An error occurred while updating the profile");
        }
      } else {
        Toast.error("Unable to update profile. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTeacher) {
    return (
      <>
        <BaseHeader />
        <section className="pt-6 pb-6 bg-light min-vh-100">
          <div className="container">
            <Header />
            <div className="row mt-4">
              <Sidebar />
              <div className="col-lg-9 col-md-8 col-12">
                <div className="card shadow-sm border-0 rounded-4">
                  <div className="card-body text-center py-5">
                    <i className="fas fa-user-times text-muted mb-3" style={{ fontSize: "3rem" }}></i>
                    <h4 className="text-muted">You are not registered as a teacher</h4>
                    <p className="text-muted">Please register to access this page.</p>
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
          <Header />
          <div className="row mt-4">
            <Sidebar />
            <div className="col-lg-9 col-md-8 col-12">
              <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-bottom-0 rounded-top-4 px-4 py-3">
                  <h4 className="mb-3">
                    <i className="fas fa-chalkboard-teacher text-warning"></i> Teacher Profile
                  </h4>
                  <p className="text-muted mb-0">Manage your teacher profile information.</p>
                  <div className="row mt-3">
                    <div className="col-md-4">
                      <div className="text-center">
                        <h6 className="text-primary mb-1">{teacherData.students || 0}</h6>
                        <small className="text-muted">Students</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center">
                        <h6 className="text-success mb-1">{teacherData.courses || 0}</h6>
                        <small className="text-muted">Courses</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center">
                        <h6 className="text-warning mb-1">{teacherData.review || 0}</h6>
                        <small className="text-muted">Reviews</small>
                      </div>
                    </div>
                  </div>
                </div>

                <form className="card-body px-4 py-4" onSubmit={handleFormSubmit}>
                  <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center mb-5 gap-4">
                    <img
                      src={imagePreview || "/default-avatar.png"}
                      alt="avatar"
                      className="rounded-circle border"
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                    <div>
                      <h5 className="mb-1">Profile Picture</h5>
                      <p className="text-muted mb-2">PNG or JPG up to 800px width and height.</p>
                      <input
                        type="file"
                        className="form-control"
                        name="image"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="mb-4">
                    <h5 className="mb-1">Personal Information</h5>
                    <p className="text-muted mb-4">Edit your personal information.</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter full name"
                          name="full_name"
                          value={teacherData.full_name || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter country"
                          name="country"
                          value={teacherData.country || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Short Bio</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Brief introduction about yourself"
                          name="bio"
                          value={teacherData.bio || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">About Me</label>
                        <textarea
                          className="form-control"
                          rows="5"
                          placeholder="More about yourself and your teaching experience"
                          name="about"
                          value={teacherData.about || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="mb-4">
                    <h5 className="mb-1">Social Media Links</h5>
                    <p className="text-muted mb-4">Add your social media links.</p>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">
                          <i className="fab fa-facebook text-primary me-2"></i>Facebook
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://facebook.com/username"
                          name="facebook"
                          value={teacherData.facebook || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          <i className="fab fa-twitter text-info me-2"></i>Twitter
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://twitter.com/username"
                          name="twitter"
                          value={teacherData.twitter || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          <i className="fab fa-linkedin text-primary me-2"></i>LinkedIn
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://linkedin.com/in/username"
                          name="linkedin"
                          value={teacherData.linkedin || ""}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 text-end mt-4">
                    <button
                      className="btn btn-primary px-4 py-2 rounded-pill"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          Updating... <i className="fas fa-spinner fa-spin ms-2"></i>
                        </>
                      ) : (
                        <>
                          Update Information <i className="fas fa-save ms-2"></i>
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

export default Profile;
