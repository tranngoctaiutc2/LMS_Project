import { useState, useEffect } from "react";
import moment from "moment";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";

function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiInstance.get(`teacher/student-lists/${UserData()?.teacher_id}/`);
                setStudents(res.data);
            } catch (err) {
                setError(err.message || "Failed to load students.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.country && student.country.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <>
                <BaseHeader />
                <section className="pt-5 pb-5 bg-light min-vh-100">
                    <div className="container">
                        <Header />
                        <div className="row mt-0 mt-md-4">
                            <Sidebar />
                            <div className="col-lg-9 col-md-8 col-12">
                                <div className="card border-0 shadow-sm rounded-3">
                                    <div className="card-body p-5 text-center">
                                        <div className="spinner-grow text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Loading your students...</p>
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

    if (error) {
        return (
            <>
                <BaseHeader />
                <section className="pt-5 pb-5 bg-light min-vh-100">
                    <div className="container">
                        <Header />
                        <div className="row mt-0 mt-md-4">
                            <Sidebar />
                            <div className="col-lg-9 col-md-8 col-12">
                                <div className="card border-0 shadow-sm rounded-3">
                                    <div className="card-body p-5 text-center">
                                        <i className="fas fa-exclamation-circle text-danger fa-3x mb-4"></i>
                                        <h4 className="mb-3">Error Loading Students</h4>
                                        <p className="text-muted mb-4">{error}</p>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => window.location.reload()}
                                        >
                                            <i className="fas fa-sync-alt me-2"></i> Try Again
                                        </button>
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

            <section className="pt-5 pb-5 bg-light min-vh-100">
                <div className="container">
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            <div className="card border-0 shadow-sm rounded-3">
                                <div className="card-header bg-white border-bottom-0 rounded-top-3 p-4">
                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                                        <div className="mb-3 mb-md-0">
                                            <h3 className="mb-1 fw-bold">
                                                <i className="fas fa-user-graduate text-primary me-2"></i> 
                                                Your Students
                                            </h3>
                                            <p className="mb-0 text-muted">
                                                {students.length} {students.length === 1 ? 'student' : 'students'} enrolled in your courses
                                            </p>
                                        </div>
                                        <div className="search-box">
                                            <div className="input-group">
                                                <span className="input-group-text bg-white border-end-0">
                                                    <i className="fas fa-search text-muted"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0"
                                                    placeholder="Search students..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body p-4">
                                    {filteredStudents.length > 0 ? (
                                        <div className="row g-4">
                                            {filteredStudents.map((student, index) => (
                                                <div className="col-xl-4 col-lg-6 col-md-6 col-12" key={index}>
                                                    <div className="card border-0 shadow-sm h-100 hover-shadow transition-all">
                                                        <div className="card-body p-4 text-center">
                                                            <div className="avatar-wrapper mb-3">
                                                                <img
                                                                    src={student.image ? `http://127.0.0.1:8000${student.image}` : '/default-user.png'}
                                                                    className="rounded-circle object-cover"
                                                                    style={{
                                                                        width: "100px",
                                                                        height: "100px",
                                                                        border: "3px solid #f8f9fa",
                                                                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                                                                    }}
                                                                    alt={student.full_name}
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/default-user.png'; }}
                                                                />
                                                            </div>
                                                            <h5 className="mb-2 fw-bold">{student.full_name}</h5>
                                                            <div className="d-flex align-items-center justify-content-center mb-3">
                                                                <i className="fas fa-map-marker-alt text-muted me-2"></i>
                                                                <span className="text-muted small">{student.country || 'Location not specified'}</span>
                                                            </div>
                                                            
                                                            <div className="d-flex justify-content-between border-top pt-3 mt-3">
                                                                <div className="text-start">
                                                                    <span className="d-block text-muted small">Enrolled</span>
                                                                    <span className="fw-bold text-dark">{moment(student.date).format("MMM D, YYYY")}</span>
                                                                </div>
                                                                <div className="text-end">
                                                                    <span className="d-block text-muted small">Courses</span>
                                                                    <span className="fw-bold text-dark">{student.courses_count || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 text-center">
                                                            <button className="btn btn-sm btn-outline-primary rounded-pill px-3">
                                                                <i className="fas fa-envelope me-1"></i> Message
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <img 
                                                src="/static/empty-students.svg" 
                                                alt="No students found" 
                                                className="img-fluid mb-4"
                                                style={{ maxWidth: '300px' }}
                                            />
                                            <h4 className="mb-2">No students found</h4>
                                            <p className="text-muted mb-4">
                                                {searchTerm ? 
                                                    "No students match your search criteria" : 
                                                    "You currently have no students enrolled in your courses"
                                                }
                                            </p>
                                            {searchTerm && (
                                                <button 
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setSearchTerm("")}
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    )}
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

export default Students;