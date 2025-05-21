import { useState, useEffect } from "react";
import moment from "moment";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";

function TeacherNotification() {
    const [noti, setNoti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

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

    useEffect(() => {
        fetchNoti();
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
                                        <img 
                                            src="/static/empty-notification.svg" 
                                            alt="No notifications" 
                                            className="img-fluid mb-3"
                                            style={{maxWidth: '200px'}}
                                        />
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