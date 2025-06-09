import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { logout } from "../../utils/auth";

const TeacherRegistration = () => {
  const navigate = useNavigate();
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    about: '',
    country: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    image: null
  });
  const [teacherData, setTeacherData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const [profileRes, teacherRes] = await Promise.allSettled([
          apiInstance.get(`user/profile/${UserData()?.user_id}/`),
          apiInstance.get('teacher/status/')
        ]);

        if (profileRes.status === 'fulfilled') {
          const profile = profileRes.value.data;
          setUserProfile(profile);
          setFormData(prev => ({
            ...prev,
            full_name: profile.full_name || profile.first_name + ' ' + profile.last_name || '',
            about: profile.about || '',
            country: profile.country || '',
          }));
        }

        if (teacherRes.status === 'fulfilled' && teacherRes.value.data.is_teacher) {
          setIsTeacher(true);
          const teacher = teacherRes.value.data.teacher;
          setTeacherData(teacher);
          setFormData(prev => ({
            ...prev,
            full_name: teacher.full_name || prev.full_name,
            bio: teacher.bio || '',
            about: teacher.about || prev.about,
            country: teacher.country || prev.country,
            facebook: teacher.facebook || '',
            twitter: teacher.twitter || '',
            linkedin: teacher.linkedin || '',
            image: null
          }));
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setError('Full name is required.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          data.append(key, value);
        }
      });

      let res;
      if (isTeacher) {
        res = await apiInstance.put('teacher/profile/', data);
      } else {
        res = await apiInstance.post('teacher/register/', data);
        setIsTeacher(true);
      }

      Toast.success(res.data.message || 'Submission successful!');
      setTeacherData(res.data.teacher);
      setMessage(res.data.message || 'Success!');
      setTimeout(() => {
      logout();
    }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || userProfile.first_name + ' ' + userProfile.last_name || '',
        bio: '',
        about: userProfile.about || '',
        country: userProfile.country || '',
        facebook: '',
        twitter: '',
        linkedin: '',
        image: null
      });
    }
  };

  if (loading) {
    return (
      <>
        <BaseHeader />
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted">Loading information...</p>
          </div>
        </div>
        <BaseFooter />
      </>
    );
  }

  return (
    <>
      <BaseHeader />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-primary text-white py-3">
                <h4 className="mb-0">
                  <i className="fas fa-chalkboard-teacher me-2"></i>
                  {isTeacher ? "Manage Instructor Profile" : "Register as Instructor"}
                </h4>
              </div>

              <div className="card-body">
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Short Bio</label>
                      <input
                        type="text"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Detailed Introduction</label>
                      <textarea
                        name="about"
                        rows="5"
                        value={formData.about}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="form-control"
                    />
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label">Facebook</label>
                      <input
                        type="url"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Twitter</label>
                      <input
                        type="url"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">LinkedIn</label>
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-arrow-left me-1"></i> Back
                    </button>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-warning" onClick={resetForm}>
                        <i className="fas fa-undo me-1"></i> Reset
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            {isTeacher ? "Update Profile" : "Register as Instructor"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BaseFooter />
    </>
  );
};

export default TeacherRegistration;
