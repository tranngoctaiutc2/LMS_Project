import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import _ from "lodash";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import { Link } from "react-router-dom";

function Dashboard() {
    const [stats, setStats] = useState({});
    const [courses, setCourses] = useState([]);
    const [originalCourses, setOriginalCourses] = useState([]);
    const [isTeacher, setIsTeacher] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkTeacherStatus = async () => {
        try {
            const response = await apiInstance.get(`teacher/status/`);
            setIsTeacher(response.data.is_teacher || false);
        } catch (error) {
            console.error("Error checking teacher status:", error);
            setIsTeacher(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseData = () => {
        apiInstance.get(`teacher/summary/${UserData()?.teacher_id}/`).then((res) => {
            setStats(res.data[0]);
        });

        apiInstance.get(`teacher/course-lists/${UserData()?.teacher_id}/`).then((res) => {
            setCourses(res.data);
            setOriginalCourses(res.data);
        });
    };

    useEffect(() => {
        checkTeacherStatus();
    }, []);

    useEffect(() => {
        if (isTeacher) {
            fetchCourseData();
        }
    }, [isTeacher]);

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
        const query = event.target.value.toLowerCase();
        debouncedSearch(query);
    };

    if (loading) {
        return (
            <>
                <BaseHeader />
                <section className="pt-5 pb-5">
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
                <section className="pt-5 pb-5">
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
                                                to="/instructor/register/" 
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

            <section className="pt-5 pb-5">
                <div className="container">
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            <div className="row mb-4">
                                <h4 className="mb-0 mb-4">
                                    <i className="bi bi-grid-fill text-primary"></i> Dashboard
                                </h4>

                                {/* Stats */}
                                <div className="col-sm-6 col-lg-4 mb-3">
                                    <div className="d-flex align-items-center p-4 bg-warning bg-opacity-10 rounded-3">
                                        <i className="fas fa-tv fa-fw text-warning display-6" />
                                        <div className="ms-4">
                                            <h5 className="fw-bold mb-0">{stats.total_courses}</h5>
                                            <p className="mb-0 h6 fw-light">Total Courses</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6 col-lg-4 mb-3">
                                    <div className="d-flex align-items-center p-4 bg-danger bg-opacity-10 rounded-3">
                                        <i className="fas fa-graduation-cap text-danger display-6" />
                                        <div className="ms-4">
                                            <h5 className="fw-bold mb-0">{stats.total_students}</h5>
                                            <p className="mb-0 h6 fw-light">Total Students</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6 col-lg-4 mb-3">
                                    <div className="d-flex align-items-center p-4 bg-success bg-opacity-10 rounded-3">
                                        <i className="fas fa-dollar-sign text-success display-6" />
                                        <div className="ms-4">
                                            <h5 className="fw-bold mb-0">${stats.total_revenue?.toFixed(2)}</h5>
                                            <p className="mb-0 h6 fw-light">Total Revenue</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Courses */}
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h3 className="mb-0">Courses</h3>
                                    <span>Manage your courses: search, view, edit or delete.</span>
                                </div>
                                <div className="card-body">
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search your courses..."
                                        onChange={handleSearch}
                                    />
                                </div>
                                <div className="table-responsive overflow-y-hidden">
                                    <table className="table table-hover text-nowrap">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Courses</th>
                                                <th>Enrolled</th>
                                                <th>Level</th>
                                                <th>Status</th>
                                                <th>Date Created</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses?.map((c, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={c.image}
                                                                alt="course"
                                                                style={{
                                                                    width: "100px",
                                                                    height: "70px",
                                                                    borderRadius: "10px",
                                                                    objectFit: "cover",
                                                                }}
                                                            />
                                                            <div className="ms-3">
                                                                <h6 className="mb-1">{c.title}</h6>
                                                                <small className="text-muted">{c.language}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{c.students?.length}</td>
                                                    <td><span className="badge bg-success">{c.level}</span></td>
                                                    <td><span className="badge bg-warning text-dark">{c.teacher_course_status}</span></td>
                                                    <td>{moment(c.date).format("DD MMM, YYYY")}</td>
                                                    <td>
                                                        <Link to={`/instructor/edit-course/${c.course_id}/`} className="btn btn-sm btn-primary me-1">
                                                            <i className="fas fa-edit"></i>
                                                        </Link>
                                                        <button className="btn btn-sm btn-danger me-1">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                        {/* <button className="btn btn-sm btn-secondary">
                                                            <i className="fas fa-eye"></i>
                                                        </button> */}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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

export default Dashboard;