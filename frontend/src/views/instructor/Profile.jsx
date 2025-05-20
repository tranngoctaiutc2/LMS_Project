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
    const [profile, setProfile] = useContext(ProfileContext);
    const [profileData, setProfileData] = useState({
        image: "",
        full_name: "",
        about: "",
        country: "",
    });
    const [imagePreview, setImagePreview] = useState("");

    const fetchProfile = () => {
        apiInstance.get(`user/profile/${UserData()?.user_id}/`).then((res) => {
            console.log(res.data);
            setProfile(res.data);
            setProfileData(res.data);
            setImagePreview(res.data.image);
        });
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleProfileChange = (event) => {
        setProfileData({
            ...profileData,
            [event.target.name]: event.target.value,
        });
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setProfileData({
            ...profileData,
            [event.target.name]: selectedFile,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };

        if (selectedFile) {
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const res = await apiInstance.get(`user/profile/${UserData()?.user_id}/`);
        const formdata = new FormData();
        if (profileData.image && profileData.image !== res.data.image) {
            formdata.append("image", profileData.image);
        }

        formdata.append("full_name", profileData.full_name);
        formdata.append("about", profileData.about);
        formdata.append("country", profileData.country);

        await apiInstance
            .patch(`user/profile/${UserData()?.user_id}/`, formdata, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then((res) => {
                console.log(res.data);
                setProfile(res.data);
                Toast().fire({
                    icon: "success",
                    title: "Profile updated successfully",
                });
                setIsLoading(false);
            });
    };

    console.log(imagePreview);

    return (
        <>
            <BaseHeader />
    
            <section className="pt-6 pb-6 bg-light min-vh-100">
                <div className="container">
                    {/* Header */}
                    <Header />
                    <div className="row mt-4">
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            <div className="card shadow-sm border-0 rounded-4">
                                <div className="card-header bg-white border-bottom-0 rounded-top-4 px-4 py-3">
                                <h4 className="mb-3">
                                    <i className="fas fa-user-edit text-warning"></i> Profile Details
                                </h4>
                                    <p className="text-muted mb-0">You have full control to manage your own account setting.</p>
                                </div>
                                <form className="card-body px-4 py-4" onSubmit={handleFormSubmit}>
                                    <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center mb-5 gap-4">
                                        <img
                                            src={imagePreview}
                                            alt="avatar"
                                            className="rounded-circle border"
                                            style={{
                                                width: "100px",
                                                height: "100px",
                                                objectFit: "cover",
                                            }}
                                        />
                                        <div>
                                            <h5 className="mb-1">Your Avatar</h5>
                                            <p className="text-muted mb-2">PNG or JPG up to 800px wide and tall.</p>
                                            <input
                                                type="file"
                                                className="form-control"
                                                name="image"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>
    
                                    <hr className="my-4" />
    
                                    <div>
                                        <h5 className="mb-1">Personal Details</h5>
                                        <p className="text-muted mb-4">Edit your personal information and address.</p>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label">Full Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Your full name"
                                                    required
                                                    name="full_name"
                                                    value={profileData.full_name}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">About Me</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="5"
                                                    placeholder="Tell something about yourself"
                                                    name="about"
                                                    value={profileData.about}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">Country</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Your country"
                                                    required
                                                    name="country"
                                                    value={profileData.country}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>
                                            <div className="col-12 text-end mt-3">
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
                                                            Update Profile <i className="fas fa-check-circle ms-2"></i>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
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
