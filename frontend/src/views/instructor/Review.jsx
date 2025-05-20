import { useState, useEffect } from "react";
import moment from "moment";
import Rater from "react-rater";
import "react-rater/lib/react-rater.css";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import apiInstance from "../../utils/axios";
import { teacherId } from "../../utils/constants";
import Toast from "../plugin/Toast";

function Review() {
    const [reviews, setReviews] = useState([]);
    const [reply, setReply] = useState("");
    const [filteredReviews, setFilteredReview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReviewsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiInstance.get(`teacher/review-lists/${teacherId}/`);
            console.log(res.data);
            setReviews(res.data);
            setFilteredReview(res.data);
        } catch (err) {
            setError(err.message || "Failed to load reviews.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewsData();
    }, []);

    const handleSubmitReply = async (reviewId) => {
        try {
            await apiInstance
                .patch(`teacher/review-detail/${teacherId}/${reviewId}/`, {
                    reply: reply,
                })
                .then((res) => {
                    console.log(res.data);
                    fetchReviewsData();
                    Toast().fire({
                        icon: "success",
                        title: "Reply sent.",
                    });
                    setReply("");
                });
        } catch (error) {
            console.log(error);
            Toast().fire({
                icon: "error",
                title: "Failed to send reply.",
                text: error.message || "Something went wrong.",
            });
        }
    };

    const handleSortByDate = (e) => {
        const sortValue = e.target.value;
        let sortedReview = [...filteredReviews];
        if (sortValue === "Newest") {
            sortedReview.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            sortedReview.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        setFilteredReview(sortedReview);
    };

    const handleSortByRatingChange = (e) => {
        const rating = parseInt(e.target.value);
        console.log(rating);
        if (rating === 0) {
            setFilteredReview(reviews);
        } else {
            const filtered = reviews.filter((review) => review.rating === rating);
            setFilteredReview(filtered);
        }
    };

    const handleFilterByCourse = (e) => {
        const query = e.target.value.toLowerCase();
        if (query === "") {
            setFilteredReview(reviews);
        } else {
            const filtered = reviews.filter((review) =>
                review.course.title.toLowerCase().includes(query)
            );
            setFilteredReview(filtered);
        }
    };

    if (loading) {
        return (
            <>
                <BaseHeader />
                <section className="pt-5 pb-5 bg-light">
                    <div className="container">
                        <Header />
                        <div className="row mt-0 mt-md-4">
                            <Sidebar />
                            <div className="col-lg-9 col-md-8 col-12">
                                <div className="card border-0 shadow-sm rounded-4">
                                    <div className="card-body p-5 text-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Loading reviews...</p>
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
                <section className="pt-5 pb-5 bg-light">
                    <div className="container">
                        <Header />
                        <div className="row mt-0 mt-md-4">
                            <Sidebar />
                            <div className="col-lg-9 col-md-8 col-12">
                                <div className="card border-0 shadow-sm rounded-4">
                                    <div className="card-body p-5 text-center text-danger">
                                        <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                                        <p className="h5">Error loading reviews</p>
                                        <p className="text-muted">{error}</p>
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
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom rounded-top-4 p-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold text-dark"><i className="fas fa-star text-warning"></i> Manage Reviews</h4>
                                    </div>
                                    <form className="row mt-3 gx-2">
                                        <div className="col-xl-7 col-lg-6 col-md-6 col-12 mb-2 mb-md-0">
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0 shadow-sm"
                                                placeholder="🔍 Search by Course"
                                                onChange={handleFilterByCourse}
                                            />
                                        </div>
                                        <div className="col-xl-2 col-lg-2 col-md-3 col-6 mb-2 mb-md-0">
                                            <select className="form-select form-select-lg bg-light border-0 shadow-sm" onChange={handleSortByRatingChange}>
                                                <option value={0}>⭐ Rating</option>
                                                <option value={1}>1 Star</option>
                                                <option value={2}>2 Stars</option>
                                                <option value={3}>3 Stars</option>
                                                <option value={4}>4 Stars</option>
                                                <option value={5}>5 Stars</option>
                                            </select>
                                        </div>
                                        <div className="col-xl-3 col-lg-3 col-md-3 col-6">
                                            <select className="form-select form-select-lg bg-light border-0 shadow-sm" onChange={handleSortByDate}>
                                                <option value=""><i className="fas fa-sort-amount-down me-1"></i> Sort By</option>
                                                <option value="Newest"><i className="fas fa-arrow-down me-1"></i> Newest First</option>
                                                <option value="Oldest"><i className="fas fa-arrow-up me-1"></i> Oldest First</option>
                                            </select>
                                        </div>
                                    </form>
                                </div>

                                <ul className="list-group list-group-flush mt-4">
                                    {filteredReviews?.map((r, index) => (
                                        <li key={r.id} className="list-group-item p-4 shadow-sm rounded-4 mb-3 bg-white border-0">
                                            <div className="d-flex align-items-start">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={r.profile.image}
                                                        alt="avatar"
                                                        className="rounded-circle avatar-md"
                                                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = '/default-user.png'; }}
                                                    />
                                                </div>
                                                <div className="ms-3 flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <h6 className="mb-1 fw-bold text-dark">{r.profile.full_name}</h6>
                                                            <p className="text-muted small mb-0">{moment(r.date).format("DD MMM, YYYY")}</p>
                                                        </div>
                                                        <a href="#" className="text-muted" data-bs-toggle="tooltip" data-placement="top" title="Report Abuse">
                                                            <i className="fas fa-flag"></i>
                                                        </a>
                                                    </div>
                                                    <div className="mt-2">
                                                        <Rater total={5} rating={r.rating || 0} interactive={false} />
                                                        <span className="ms-2 text-muted small">for</span>
                                                        <span className="fw-bold text-dark ms-1">{r.course?.title}</span>
                                                        <p className="mt-2 mb-1 text-dark">{r.review}</p>
                                                        {r.reply && (
                                                            <div className="mt-2 p-3 bg-light rounded-3 border">
                                                                <span className="fw-bold text-primary"><i className="fas fa-reply me-2"></i>Your Response:</span>
                                                                <p className="mb-0 text-dark">{r.reply}</p>
                                                            </div>
                                                        )}
                                                        {!r.reply && (
                                                            <p className="mt-2">
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary rounded-pill"
                                                                    type="button"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target={`#collapse${r.id}`}
                                                                    aria-expanded="false"
                                                                    aria-controls={`collapse${r.id}`}
                                                                >
                                                                    <i className="fas fa-reply me-1"></i> Reply
                                                                </button>
                                                            </p>
                                                        )}
                                                        <div className="collapse mt-3" id={`collapse${r.id}`}>
                                                            <div className="card card-body border-0 shadow-sm">
                                                                <div className="mb-3">
                                                                    <label htmlFor={`replyText${r.id}`} className="form-label fw-bold">Write your response:</label>
                                                                    <textarea
                                                                        className="form-control form-control-sm"
                                                                        id={`replyText${r.id}`}
                                                                        rows="3"
                                                                        value={reply}
                                                                        onChange={(e) => setReply(e.target.value)}
                                                                    ></textarea>
                                                                </div>
                                                                <button
                                                                    type="submit"
                                                                    className="btn btn-sm btn-primary rounded-pill"
                                                                    onClick={() => handleSubmitReply(r.id)}
                                                                >
                                                                    <i className="fas fa-paper-plane me-1"></i> Send Reply
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {filteredReviews?.length < 1 && !loading && (
                                        <li className="list-group-item p-4 bg-white border-0 shadow-sm rounded-4 text-center text-muted">
                                            <i className="fas fa-comment-slash fa-2x mb-3"></i>
                                            <p className="h5">No reviews yet</p>
                                            <p className="small">Student reviews for your courses will appear here.</p>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BaseFooter />
        </>
    );
}

export default Review;