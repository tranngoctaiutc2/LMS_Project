import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import Rater from "react-rater";
import "react-rater/lib/react-rater.css";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import CartId from "../plugin/CartId";
import GetCurrentAddress from "../plugin/UserCountry";
import { CartContext } from "../plugin/Context";

function Wishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [cartCount, setCartCount] = useContext(CartContext);
    const [loading, setLoading] = useState(true);
    const country = GetCurrentAddress()?.country;

    const fetchWishlist = useCallback(() => {
        setLoading(true);
        useAxios.get(`student/wishlist/${UserData()?.user_id}/`)
            .then((res) => {
                setWishlist(res.data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const addToCart = async (courseId, userId, price, country, cartId) => {
        const formdata = new FormData();
        formdata.append("course_id", courseId);
        formdata.append("user_id", userId);
        formdata.append("price", price);
        formdata.append("country_name", country);
        formdata.append("cart_id", cartId);

        try {
            await useAxios.post(`course/cart/`, formdata);
            Toast().fire({
                title: "Added To Cart",
                icon: "success",
            });
            
            useAxios.get(`course/cart-list/${CartId()}/`)
                .then((res) => {
                    setCartCount(res.data?.length);
                });
        } catch (error) {
            console.log(error);
        }
    };

    const toggleWishlist = (courseId, e) => {
        e.preventDefault();
        const formdata = new FormData();
        formdata.append("user_id", UserData()?.user_id);
        formdata.append("course_id", courseId);

        useAxios.post(`student/wishlist/${UserData()?.user_id}/`, formdata)
            .then((res) => {
                fetchWishlist();
                Toast().fire({
                    icon: "success",
                    title: res.data.message,
                });
            });
    };

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
                                <i className="fas fa-heart text-danger"></i> Wishlist
                            </h4>

                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom rounded-top-4 p-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold text-dark">❤️ Saved Courses</h4>
                                        <span className="badge bg-primary rounded-pill">
                                            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="card-body bg-white p-5 text-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Loading your wishlist...</p>
                                    </div>
                                ) : (
                                    <div className="card-body bg-white p-4">
                                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                            {wishlist?.map((w, index) => (
                                                <div className="col" key={w.id || index}>
                                                    <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden hover-shadow-lg transition-all">
                                                        <Link to={`/course-detail/${w.course.slug}/`} className="text-decoration-none">
                                                            <div className="position-relative">
                                                                <img
                                                                    src={w.course.image}
                                                                    alt={w.course.title}
                                                                    className="card-img-top"
                                                                    style={{
                                                                        height: "160px",
                                                                        objectFit: "cover",
                                                                        width: "100%"
                                                                    }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = '/default-course.png';
                                                                    }}
                                                                />
                                                                <div className="position-absolute top-0 end-0 p-3">
                                                                    <button 
                                                                        onClick={(e) => toggleWishlist(w.course?.id, e)}
                                                                        className="btn btn-sm btn-light rounded-circle shadow-sm"
                                                                        aria-label="Remove from wishlist"
                                                                    >
                                                                        <i className="fas fa-heart text-danger"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </Link>

                                                        <div className="card-body pb-0">
                                                            <div className="d-flex gap-2 mb-2">
                                                                <span className="badge bg-info bg-opacity-10 text-info">
                                                                    {w.course.level}
                                                                </span>
                                                                <span className="badge bg-success bg-opacity-10 text-success">
                                                                    {w.course.language}
                                                                </span>
                                                            </div>
                                                            
                                                            <h5 className="card-title mb-2">
                                                                <Link 
                                                                    to={`/course-detail/${w.course.slug}/`} 
                                                                    className="text-dark text-decoration-none"
                                                                >
                                                                    {w.course.title}
                                                                </Link>
                                                            </h5>
                                                            
                                                            <p className="text-muted small mb-3">
                                                                By: {w.course?.teacher?.full_name || 'Unknown Instructor'}
                                                            </p>
                                                            
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <div>
                                                                    <i className="fas fa-users text-muted me-1"></i>
                                                                    <span className="small text-muted">
                                                                        {w.course.students?.length || 0} Student{w.course.students?.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="text-warning small">
                                                                    <Rater 
                                                                        total={5} 
                                                                        rating={w.course.average_rating || 0} 
                                                                        interactive={false}
                                                                    />
                                                                    <span className="ms-1">
                                                                        ({w.course.reviews?.length || 0})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="card-footer bg-transparent border-0 pt-0 pb-3">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <h5 className="mb-0 text-primary">
                                                                    ${w.course.price || '0.00'}
                                                                </h5>
                                                                <div>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            addToCart(w.course.id, UserData()?.user_id, w.course.price, country, CartId());
                                                                        }}
                                                                        className="btn btn-sm btn-outline-primary me-2"
                                                                        aria-label="Add to cart"
                                                                    >
                                                                        <i className="fas fa-shopping-cart"></i>
                                                                    </button>
                                                                    <Link 
                                                                        to={`/course-detail/${w.course.slug}/`}
                                                                        className="btn btn-sm btn-primary"
                                                                    >
                                                                        Enroll Now
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {wishlist.length === 0 && !loading && (
                                                <div className="col-12 text-center py-5">
                                                    <div className="display-4 text-muted mb-3">
                                                        <i className="fas fa-heart-broken"></i>
                                                    </div>
                                                    <h5 className="text-muted">Your wishlist is empty</h5>
                                                    <p className="text-muted small">
                                                        When you save courses, they will appear here
                                                    </p>
                                                    <Link to="/courses/" className="btn btn-primary mt-3">
                                                        Browse Courses
                                                    </Link>
                                                </div>
                                            )}
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

export default Wishlist;