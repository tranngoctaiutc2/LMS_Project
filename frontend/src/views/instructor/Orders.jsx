import { useState, useEffect } from "react";
import moment from "moment";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Adjust as needed

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await apiInstance.get(`teacher/course-order-list/${UserData()?.teacher_id}/`);
                setOrders(response.data);
            } catch (err) {
                setError("Failed to fetch orders. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(orders.length / itemsPerPage);

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
                                                <i className="fas fa-shopping-cart text-warning me-2"></i>
                                                Orders
                                            </h3>
                                            <p className="mb-0 text-muted">Order Dashboard provides an overview of all your course orders</p>
                                        </div>
                                        <div className="badge bg-primary bg-opacity-10 text-primary p-2">
                                            {loading ? '...' : orders.length} Orders
                                        </div>
                                    </div>
                                </div>
                                
                                {loading ? (
                                    <div className="card-body text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 mb-0">Loading orders...</p>
                                    </div>
                                ) : error ? (
                                    <div className="card-body text-center py-5">
                                        <div className="alert alert-danger">{error}</div>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => window.location.reload()}
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="card-body text-center py-5">
                                        <img 
                                            src="/static/empty-order.svg" 
                                            alt="No orders" 
                                            className="img-fluid mb-3"
                                            style={{maxWidth: '200px'}}
                                        />
                                        <h5>No orders yet</h5>
                                        <p className="text-muted">Your course orders will appear here</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table mb-0 table-hover align-middle">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="ps-4">Course</th>
                                                        <th>Amount</th>
                                                        <th>Invoice</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentItems.map((o, index) => (
                                                        <tr key={index} className="border-top">
                                                            <td className="ps-4">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="me-3">
                                                                        <img 
                                                                            src={o.course.image || "/static/default-course.png"} 
                                                                            alt={o.course.title}
                                                                            className="rounded"
                                                                            width="60"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="mb-1">
                                                                            <a 
                                                                                href={`/course/${o.course.slug}`} 
                                                                                className="text-inherit text-decoration-none"
                                                                            >
                                                                                {o.course.title}
                                                                            </a>
                                                                        </h6>
                                                                        <small className="text-muted">Order #{o.order.oid}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-success bg-opacity-10 text-success">
                                                                    ${o.price}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <a 
                                                                    href="#" 
                                                                    className="text-decoration-none"
                                                                >
                                                                    View Invoice
                                                                </a>
                                                            </td>
                                                            <td>
                                                                {moment(o.date).format("DD MMM, YYYY")}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="card-footer bg-white border-top-0">
                                                <nav aria-label="Page navigation">
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

export default Orders;