import { useState, useEffect } from "react";
import moment from "moment";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import { Link } from "react-router-dom";

function TeacherNotification() {
    const [noti, setNoti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isTeacher, setIsTeacher] = useState(false);

    const fetchNoti = async () => {
        try {
            setLoading(true);
            const response = await apiInstance.get(`teacher/noti-list/${UserData()?.teacher_id}/`);
            setNoti(response.data);
        } catch (err) {
            setError("Failed to fetch notifications. Please try again later.");
            Toast.error("Failed to fetch notifications.");
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        try {
            const res = await apiInstance.get("/teacher/status");
            if (res.data.is_teacher) {
                setIsTeacher(true);
                fetchNoti();
            } else {
                setIsTeacher(false);
            }
        } catch (err) {
            setIsTeacher(false);
        } finally {
            setCheckingStatus(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const handleMarkAsSeen = async (notiId) => {
        try {
            const formdata = new FormData();
            formdata.append("teacher", UserData()?.teacher_id);
            formdata.append("pk", notiId);
            formdata.append("seen", true);

            await apiInstance.patch(
                `teacher/noti-detail/${UserData()?.teacher_id}/${notiId}`,
                formdata
            );
            fetchNoti();
            Toast.success("Notification marked as seen");
        } catch (err) {
            Toast.error("Failed to update notification");
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = noti.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(noti.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (checkingStatus) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-3 text-muted">Checking status...</span>
            </div>
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
                                            sharing knowledge and managing course orders!
                                        </p>
                                        <div className="row text-start mb-4">
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-check-circle text-success me-3"></i>
                                                    <span>Sell your courses</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-check-circle text-success me-3"></i>
                                                    <span>Track order performance</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-check-circle text-success me-3"></i>
                                                    <span>Export order history</span>
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
                                            <Link to="/" className="btn btn-outline-secondary btn-lg px-4">
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
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-header bg-white border-bottom-0">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <h3 className="mb-1">
                                                <i className="fas fa-bell text-danger me-2"></i>
                                                Notifications
                                            </h3>
                                            <p className="mb-0 text-muted">Manage all your notifications from here</p>
                                        </div>
                                        <div className="badge bg-primary bg-opacity-10 text-primary p-2">
                                            {loading ? '...' : noti.length} Notifications
                                        </div>
                                    </div>
                                </div>
                                
                                {loading ? (
                                    <div className="card-body text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 mb-0">Loading notifications...</p>
                                    </div>
                                ) : error ? (
                                    <div className="card-body text-center py-5">
                                        <div className="alert alert-danger">{error}</div>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={fetchNoti}
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : noti.length === 0 ? (
                                        <div className="card-body text-center py-5">
                                            <div className="mb-3">
                                                <i 
                                                    className="fas fa-bell-slash text-muted" 
                                                    style={{ fontSize: '64px' }}
                                                ></i>
                                            </div>
                                            <h5>No notifications yet</h5>
                                            <p className="text-muted">Your notifications will appear here</p>
                                        </div>
                                ) : (
                                    <>
                                        <div className="card-body p-0">
                                            <ul className="list-group list-group-flush">
                                                {currentItems.map((n, index) => (
                                                    <li className="list-group-item p-4 border-bottom" key={index}>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex align-items-center mb-2">
                                                                    <span className="badge bg-info bg-opacity-10 text-info me-2">
                                                                        {n.type}
                                                                    </span>
                                                                    <small className="text-muted">
                                                                        {moment(n.date).fromNow()}
                                                                    </small>
                                                                </div>
                                                                <p className="text-muted mb-0">
                                                                    {moment(n.date).format("DD MMM, YYYY h:mm A")}
                                                                </p>
                                                            </div>
                                                            <button 
                                                                className="btn btn-sm btn-outline-secondary ms-3"
                                                                onClick={() => handleMarkAsSeen(n.id)}
                                                                title="Mark as seen"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="card-footer bg-white border-top-0">
                                                <nav aria-label="Notifications pagination">
                                                    <ul className="pagination justify-content-center mb-0">
                                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                            <button 
                                                                className="page-link" 
                                                                onClick={() => paginate(currentPage - 1)}
                                                            >
                                                                Previous
                                                            </button>
                                                        </li>
                                                        
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                                            <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                                                <button 
                                                                    className="page-link" 
                                                                    onClick={() => paginate(number)}
                                                                >
                                                                    {number}
                                                                </button>
                                                            </li>
                                                        ))}
                                                        
                                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                            <button 
                                                                className="page-link" 
                                                                onClick={() => paginate(currentPage + 1)}
                                                            >
                                                                Next
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </nav>
                                            </div>
                                        )}
                                    </>
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

export default TeacherNotification;