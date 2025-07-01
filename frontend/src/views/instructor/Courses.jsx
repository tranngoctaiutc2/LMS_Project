import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import _ from "lodash";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Toast from "../plugin/Toast";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";

function Courses() {
    const [courses, setCourses] = useState([]);
    const [originalCourses, setOriginalCourses] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isTeacher, setIsTeacher] = useState(false);

    const fetchTeacherStatus = async () => {
        try {
        const res = await apiInstance.get("/teacher/status");
        setIsTeacher(res.data.is_teacher);
        } catch (err) {
        Toast.error("Failed to check teacher status.");
        } finally {
        setLoading(false);
        }
    };

    const fetchData = useCallback(async () => {
        setFetching(true);
        try {
        const res = await apiInstance.get(`teacher/course-lists/${UserData()?.teacher_id}/`);
        setCourses(res.data);
        setOriginalCourses(res.data);
        } catch (error) {
        Toast.error("Failed to fetch course list.");
        } finally {
        setFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchTeacherStatus();
    }, []);

    useEffect(() => {
        if (isTeacher) {
        fetchData();
        }
    }, [isTeacher, fetchData]);

    const debouncedSearch = useCallback(
        _.debounce((query) => {
        if (!query.trim()) {
            setCourses(originalCourses);
            return;
        }
        const filtered = originalCourses.filter((c) =>
            c?.title?.toLowerCase().includes(query)
        );
        setCourses(filtered);
        }, 300),
        [originalCourses]
    );

    const handleSearch = (event) => {
        const query = event?.target?.value?.toLowerCase() || "";
        debouncedSearch(query);
    };

    const handleDeleteCourse = async (courseId, title) => {
        const confirmed = window.confirm(`Delete course "${title}"?\nThis action cannot be undone.`);
        if (!confirmed) return;

        try {
        await apiInstance.delete(`teacher/course-delete/${UserData()?.teacher_id}/${courseId}/`);
        fetchData();
        Toast.success(`Deleted "${title}" successfully`);
        } catch (err) {
        Toast.error(`Failed to delete "${title}"`);
        }
    };

    if (loading) {
        return (
        <>
            <BaseHeader />
            <section className="pt-6 pb-6 bg-light min-vh-100">
            <div className="container">
                <div className="row justify-content-center">
                <div className="col-md-6 text-center">
                    <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Checking status...</p>
                </div>
                </div>
            </div>
            </section>
            <BaseFooter />
        </>
        );
    }

    if (!isTeacher) {
        return (
        <>
            <BaseHeader />
            <section className="pt-6 pb-6 bg-light min-vh-100">
            <div className="container">
                <div className="row justify-content-center">
                <div className="col-lg-8 col-md-10">
                    <div className="card text-center shadow-lg">
                    <div className="card-body p-5">
                        <div className="mb-4">
                        <i className="fas fa-chalkboard-teacher text-primary display-1"></i>
                        </div>
                        <h2 className="card-title mb-3">Become an Instructor</h2>
                        <p className="card-text text-muted mb-4 fs-5">
                        You haven't registered as an instructor yet. Register now to start 
                        sharing knowledge and creating amazing courses!
                        </p>

                        <div className="row text-start mb-4">
                        <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center">
                            <i className="fas fa-check-circle text-success me-3"></i>
                            <span>Create unlimited courses</span>
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center">
                            <i className="fas fa-check-circle text-success me-3"></i>
                            <span>Earn money from courses</span>
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center">
                            <i className="fas fa-check-circle text-success me-3"></i>
                            <span>Manage students easily</span>
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <div className="d-flex align-items-center">
                            <i className="fas fa-check-circle text-success me-3"></i>
                            <span>24/7 Support</span>
                            </div>
                        </div>
                        </div>

                        <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                        <Link 
                            to="/instructor/register" 
                            className="btn btn-primary btn-lg px-5 me-md-2"
                        >
                            <i className="fas fa-user-graduate me-2"></i>
                            Become an Instructor
                        </Link>
                        <Link 
                            to="/" 
                            className="btn btn-outline-secondary btn-lg px-4"
                        >
                            <i className="fas fa-home me-2"></i>
                            Back to Home
                        </Link>
                        </div>
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

            <section className="pt-5 pb-5 bg-light">
                <div className="container">
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            <h4 className="mb-3">
                                <i className="fas fa-graduation-cap text-primary"></i> Manage Courses
                            </h4>

                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom rounded-top-4 p-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold text-dark">⚙️ Course Management</h4>
                                    </div>
                                    <form className="mt-3">
                                        <input
                                            type="search"
                                            className="form-control form-control-lg bg-light border-0 shadow-sm"
                                            placeholder="🔍 Search Your Courses"
                                            onChange={handleSearch}
                                            disabled={fetching}
                                        />
                                    </form>
                                </div>

                                {fetching ? (
                                    <div className="card-body bg-white p-5 text-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Fetching your courses...</p>
                                    </div>
                                ) : (
                                    <div className="card-body bg-white p-4">
                                        <div className="table-responsive">
                                            <table className="table table-hover table-borderless">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="ps-4">Course</th>
                                                        <th>Enrolled</th>
                                                        <th>Level</th>
                                                        <th>Status</th>
                                                        <th>Created Date</th>
                                                        <th className="text-end pe-4">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {courses?.map((c, index) => (
                                                        <tr key={index} className="align-middle">
                                                            <td className="ps-4">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <img
                                                                            src={c.image}
                                                                            alt={c.title}
                                                                            className="rounded-3"
                                                                            style={{ width: "80px", height: "60px", objectFit: "cover" }}
                                                                            onError={(e) => {
                                                                                e.target.onerror = null;
                                                                                e.target.src = '/default-course.png';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-grow-1 ms-3">
                                                                        <h6 className="mb-1 fw-bold text-dark">{c.title}</h6>
                                                                        <div className="d-flex flex-wrap gap-2 mt-1">
                                                                            <span className="badge bg-light text-dark border">
                                                                                <i className="fas fa-language me-1"></i> {c.language}
                                                                            </span>
                                                                            <span className="badge bg-light text-dark border">
                                                                                <i className="fas fa-chart-line me-1"></i> {c.level}
                                                                            </span>
                                                                            <span className="badge bg-light text-dark border">
                                                                                <i className="fas fa-dollar-sign me-1"></i> {c.price}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{c.students?.length}</td>
                                                            <td>
                                                                <span className={`badge bg-success`}>{c.level}</span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-warning text-dark`}>{c.teacher_course_status}</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{moment(c.date).format("MMM D, YYYY")}</span>
                                                            </td>
                                                            <td className="text-end pe-4">
                                                                <Link to={`/instructor/edit-course/${c.course_id}/`} className="btn btn-sm btn-outline-primary me-2" title="Edit">
                                                                    <i className="fas fa-edit"></i>
                                                                </Link>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger me-2"
                                                                    title="Delete"
                                                                    onClick={() => handleDeleteCourse(c.course_id, c.title)}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                                {/* <button className="btn btn-sm btn-outline-secondary" title="View">
                                                                    <i className="fas fa-eye"></i>
                                                                </button> */}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {courses?.length === 0 && !fetching && (
                                                        <tr>
                                                            <td colSpan="6" className="text-center p-5 text-muted">
                                                                <i className="fas fa-folder-open fa-2x mb-3"></i>
                                                                <p className="h5">No courses found</p>
                                                                <p className="small">Add your first course to start teaching!</p>
                                                                <Link to="/instructor/create-course" className="btn btn-primary btn-sm mt-2">
                                                                    <i className="fas fa-plus-circle me-1"></i> Add New Course
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BaseFooter />
        </>
    );
}

export default Courses;