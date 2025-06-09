import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Rater from "react-rater";
import "react-rater/lib/react-rater.css";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { useTranslation } from "react-i18next";

import CartId from "../plugin/CartId";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import { CartContext } from "../plugin/Context";
import apiInstance from "../../utils/axios";

import BackgroundImg from '../../assets/images/background/2.jpg';
import BackgroundInstructor from '../../assets/images/background/instruc.png';
import Topleft from '../../assets/images/svg/topleft.svg';
import Topright from '../../assets/images/svg/topright.svg';
import Botleft from '../../assets/images/svg/botleft.svg';
import Botright from '../../assets/images/svg/botright.svg';

function Index() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cartCount, setCartCount] = useContext(CartContext);
    const [wishlist, setWishlist] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useTranslation();
    const country = GetCurrentAddress().country;
    const userId = UserData()?.user_id;
    const cartId = CartId();

    const fetchCourses = async (forceRefresh = false) => {
        const cached = localStorage.getItem("courses");
        const cacheTimestamp = localStorage.getItem("courses_timestamp");
        const CACHE_DURATION = 5 * 60 * 1000;
        
        if (!forceRefresh && cached && cacheTimestamp) {
            const now = Date.now();
            const cacheTime = parseInt(cacheTimestamp);
            
            if (now - cacheTime < CACHE_DURATION) {
                setCourses(JSON.parse(cached));
                setIsLoading(false);
                return;
            }
        }

        try {
            const res = await apiInstance.get(`/course/course-list/`);
            setCourses(res.data);
            
            localStorage.setItem("courses", JSON.stringify(res.data));
            localStorage.setItem("courses_timestamp", Date.now().toString());
        } catch (error) {
            Toast.error("Failed to load courses");
            
            if (cached) {
                setCourses(JSON.parse(cached));
                Toast.info("Showing cached data due to network error");
            }
        } finally {
            setIsLoading(false);
        }
    };



    const fetchWishlist = async () => {
        try {
        if (!userId) return;
        const res = await apiInstance.get(`student/wishlist/${userId}/`);
        const wishlistIds = res.data.map(item => item.course?.id || item.course_id);
        setWishlist(wishlistIds);
        } catch (error) {
        Toast.error("Failed to fetch wishlist");
        }
    };

    const fetchCart = async () => {
        if (!cartId) {
            return;
        }

        try {
            const res = await apiInstance.get(`course/cart-list/${cartId}/`);
            setCartCount(res.data?.length || 0);
        } catch (error) {
            return;
        }
    };


    useEffect(() => {
        fetchCourses();
        fetchWishlist();
        fetchCart();
    }, []);

    const isCourseEnrolled = async (courseId) => {
        try {
        const res = await apiInstance.get(`student/course-list/${userId}/`);
        const enrolled = res.data.some(item => item.course?.id === courseId);
        if (enrolled) Toast.warning("You are already enrolled in this course");
        return enrolled;
        } catch (err) {
        Toast.error("Error checking enrollment status");
        return false;
        }
    };

    const addToCart = async (courseId, userId, price, country, cartId) => {
        if (!userId) {
            Toast.warning("Please login to add to cart");
            setTimeout(() => navigate('/login'), 2000);
            return;
        }
        const enrolled = await isCourseEnrolled(courseId);
        if (enrolled) return;

        try {
            const cartRes = await apiInstance.get(`course/cart-list/${cartId}/`);
            const inCart = cartRes.data.some(item => item.course.id === courseId);
            if (inCart) return Toast.info("Course already in cart");

            const formData = new FormData();
            formData.append("course_id", courseId);
            formData.append("user_id", userId);
            formData.append("price", price);
            formData.append("country_name", country);
            formData.append("cart_id", cartId);

            await apiInstance.post(`course/cart/`, formData);
            Toast.success("Course added to cart");
            await fetchCart();
            const updatedCart = await apiInstance.get(`course/cart-list/${cartId}/`);
            setCartCount(updatedCart.data?.length);
        } catch (err) {
            Toast.error("Failed to add course to cart");
        }
    };

    const addToWishlist = async (courseId) => {
        if (!userId) return Toast.warning("Please login to add to wishlist");

        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("course_id", courseId);

        try {
        await apiInstance.post(`student/wishlist/${userId}/`, formData);
        if (wishlist.includes(courseId)) {
            setWishlist(prev => prev.filter(id => id !== courseId));
            Toast.success("Removed from wishlist");
        } else {
            setWishlist(prev => [...prev, courseId]);
            Toast.success("Added to wishlist");
        }
        } catch (error) {
        Toast.error("Failed to update wishlist");
        }
    };

    const [topReviews, setTopReviews] = useState([]);

    useEffect(() => {
        apiInstance.get("/top-reviews/").then((res) => {
            setTopReviews(res.data.slice(0, 4));
        }).catch((err) => {
            console.error("Failed to load reviews", err);
        });
    }, []);

    const handleClick = async () => {
        try {
        const res = await apiInstance.get("/teacher/status");
        if (res.data.is_teacher) {
            navigate("/instructor/profile/");
        } else {
            navigate("/instructor/register/");
        }
        } catch (error) {
        console.error("Error checking teacher status", error);
        navigate("/instructor/register/");
        }
    };
    // Pagination logic
    const itemsPerPage = 4;
    const totalPages = Math.ceil(courses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = courses.slice(indexOfFirstItem, indexOfLastItem);

    const maxPagesToShow = 3;
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxPagesToShow) {
    startPage = Math.max(1, currentPage - 1);
    endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }
    }

    const visiblePageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
    visiblePageNumbers.push(i);
    }
    return (
        <>
            <BaseHeader />

            <section className="py-14 bg-white">
                <div className="container">
                    <div className="row align-items-center">
                    {/* Left content */}
                    <div className="col-lg-6 mb-6 mb-lg-0">
                        <div>
                        <p className="text-success fw-semibold mb-3 d-flex align-items-center">
                            <i className="fas fa-check bg-success bg-opacity-10 text-success rounded-circle p-2 me-2"></i>
                            {t("hero_platform.trusted")}
                        </p>

                        <h1 className="display-4 fw-bold text-dark mb-4">
                            {t("hero_platform.title")}
                        </h1>

                        <p className="text-muted mb-5 lead">
                            {t("hero_platform.description")}
                        </p>

                        <div className="d-flex flex-wrap gap-3">
                            <a href="#" className="btn btn-primary btn-lg px-4 shadow">
                            {t("hero_platform.join_now")} <i className="fas fa-plus ms-2"></i>
                            </a>
                            <a
                            href="https://www.youtube.com/watch?v=Nfzi7034Kbg"
                            className="btn btn-outline-success btn-lg px-4 shadow"
                            >
                            {t("hero_platform.watch_demo")} <i className="fas fa-video ms-2"></i>
                            </a>
                        </div>
                        </div>
                    </div>

                    {/* Right image */}
                    <div className="col-lg-6 text-center">
                        <div className="position-relative">
                        <div className="bg-light rounded-circle position-absolute top-50 start-50 translate-middle" style={{ width: 360, height: 360, zIndex: 0 }}></div>
                        <img
                            src={BackgroundImg}
                            alt="Hero"
                            className="img-fluid rounded-4 position-relative"
                            style={{ maxHeight: 420, objectFit: "cover", zIndex: 1 }}
                        />
                        </div>
                    </div>
                    </div>
                </div>
            </section>

            <section className="py-5 bg-light">
                <div className="container">
                    <div className="row g-4">
                    {[
                        {
                        icon: "fe fe-award",
                        color: "text-info",
                        value: "316,000+",
                        label: t("stats.instructors"),
                        },
                        {
                        icon: "fe fe-users",
                        color: "text-warning",
                        value: "1.8 Billion+",
                        label: t("stats.enrolments"),
                        },
                        {
                        icon: "fe fe-tv",
                        color: "text-primary",
                        value: "41,000+",
                        label: t("stats.languages"),
                        },
                        {
                        icon: "fe fe-film",
                        color: "text-success",
                        value: "179,000+",
                        label: t("stats.videos"),
                        },
                    ].map((stat, i) => (
                        <div key={i} className="col-6 col-md-3">
                        <div className="bg-white rounded-4 p-4 text-center shadow-lg h-100">
                            <div className="mb-3">
                            <i className={`${stat.icon} fs-2 ${stat.color}`}></i>
                            </div>
                            <h4 className="fw-bold text-dark mb-1">{stat.value}</h4>
                            <p className="text-muted mb-0">{stat.label}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
            </section>

            <section className="py-5 pb-14 bg-light">
                <div className="container">
                    {/* Header */}
                    <div className="row mb-6">
                    <div className="col-12 text-center text-md-start">
                        <div className="mb-4">
                        <h2 className="display-5 fw-bold mb-3 text-dark">🔥 {t("popular_courses.title")}</h2>
                        <p className="lead text-muted mb-0" style={{ lineHeight: 1.6 }}>
                            {t("popular_courses.subtitle")}
                        </p>
                        </div>
                    </div>
                    </div>

                    {/* Courses Grid */}
                    <div className="row g-4">
                    {isLoading ? (
                        <div className="d-flex justify-content-center align-items-center py-5 w-100 fade-in">
                        <div className="spinner-border text-primary me-3" role="status">
                            <span className="visually-hidden">{t("loading.aria")}</span>
                        </div>
                        <span className="h5 mb-0 text-muted">{t("loading.text")}</span>
                        </div>
                    ) : (
                        currentItems?.map((c, index) => (
                        <div className="col-12 col-md-6 col-lg-4 col-xl-3 d-flex" key={c.id || index}>
                            <div className="card h-100 w-100 border-0 shadow-sm rounded-4 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                            <Link to={`/course-detail/${c.slug}/`} className="text-decoration-none">
                                <div className="position-relative">
                                <img
                                    src={c.image}
                                    alt={c.title}
                                    className="card-img-top"
                                    style={{ height: "200px", objectFit: "cover", transition: "transform 0.3s" }}
                                    onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-course.png';
                                    }}
                                />
                                <button
                                    onClick={(e) => {
                                    e.preventDefault();
                                    addToWishlist(c.id);
                                    }}
                                    className="btn btn-sm btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-3 transition-colors duration-200 hover:bg-primary hover:text-white"
                                    aria-label={t("wishlist." + (wishlist.includes(c.id) ? "remove" : "add"))}
                                >
                                    <i className={`fas fa-heart ${wishlist.includes(c.id) ? "text-danger" : "text-secondary"}`} />
                                </button>
                                </div>
                            </Link>

                            <div className="card-body px-4 pb-0 pt-3">
                                <div className="d-flex gap-2 mb-3">
                                <span className="badge bg-info bg-opacity-10 text-info px-3 py-2">{c.level}</span>
                                <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">{c.language}</span>
                                </div>
                                <h5 className="card-title mb-2 fw-semibold">
                                <Link to={`/course-detail/${c.slug}/`} className="text-dark text-decoration-none hover:text-primary">
                                    {c.title}
                                </Link>
                                </h5>
                                <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                                {t("course.by")}: {c.teacher?.full_name || 'Unknown Instructor'}
                                </p>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <i className="fas fa-users text-muted me-1"></i>
                                    <span className="small text-muted">
                                        {t("course.student_count", { count: c.students?.length || 0 })}
                                    </span>
                                </div>
                                <div className="text-warning small">
                                    <Rater total={5} rating={c.average_rating || 0} interactive={false} />
                                    <span className="ms-1">
                                        {t("course.review_count", { count: c.reviews?.length || 0 })}
                                    </span>
                                </div>
                                </div>
                            </div>

                            <div className="card-footer bg-transparent border-0 pt-0 pb-4 px-4">
                                <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 text-primary fw-bold">${c.price || '0.00'}</h5>
                                <div className="d-flex gap-2">
                                    <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!userId) {
                                        Toast().fire({ icon: "warning", title: t("login_required") });
                                        return;
                                        }
                                        addToCart(c.id, userId, c.price, country, cartId);
                                    }}
                                    className="btn btn-sm btn-outline-primary border-2 rounded-3 hover:bg-primary hover:text-white transition-colors duration-200"
                                    aria-label={t("course.add_cart")}
                                    >
                                    <i className="fas fa-shopping-cart"></i>
                                    </button>
                                    <Link
                                    to={`/course-detail/${c.slug}/`}
                                    className="btn btn-sm btn-primary rounded-3 hover:bg-primary-dark transition-colors duration-200"
                                    >
                                    {t("course.enroll")}
                                    </Link>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        ))
                    )}
                    </div>

                    {totalPages > 1 && (
                    <div className="row py-3 mt-6">
                        <div className="col-12">
                        <nav aria-label="Page navigation">
                            <ul className="pagination justify-content-center gap-2">
                            {/* Previous */}
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button
                                className="page-link rounded-3 px-4 py-2 text-dark bg-light border-0 shadow-sm hover:bg-primary hover:text-white transition-colors duration-200"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                >
                                <i className="fas fa-chevron-left me-2"></i> {t("pagination.prev")}
                                </button>
                            </li>

                            {/* Page Numbers */}
                            {visiblePageNumbers.map((page) => (
                                <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                                <button
                                    className={`page-link rounded-3 px-4 py-2 text-dark border-0 shadow-sm ${
                                    currentPage === page
                                        ? "bg-primary text-white"
                                        : "bg-light hover:bg-primary hover:text-white"
                                    } transition-colors duration-200`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                                </li>
                            ))}

                            {/* Dấu ... nếu còn trang */}
                            {endPage < totalPages && (
                                <li className="page-item disabled">
                                <span className="page-link rounded-3 px-4 py-2 text-dark bg-light border-0 shadow-sm">...</span>
                                </li>
                            )}

                            {/* Next */}
                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                <button
                                className="page-link rounded-3 px-4 py-2 text-dark bg-light border-0 shadow-sm hover:bg-primary hover:text-white transition-colors duration-200"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                >
                                {t("pagination.next")} <i className="fas fa-chevron-right ms-2"></i>
                                </button>
                            </li>
                            </ul>
                        </nav>
                        </div>
                    </div>
                    )}
                </div>
            </section>



            <section className="my-8 py-5">
                <style jsx>{`
                    .cta-section {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 1rem;
                    overflow: hidden;
                    }

                    .cta-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #0f172a;
                    }

                    .cta-text {
                    font-size: 1rem;
                    color: #475569;
                    margin-top: 1rem;
                    line-height: 1.6;
                    }

                    .cta-btn {
                    background-color: #38bdf8;
                    color: white;
                    font-weight: 600;
                    padding: 0.75rem 1.25rem;
                    margin-top: 1.5rem;
                    border-radius: 0.5rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: background-color 0.3s ease;
                    text-decoration: none;
                    }

                    .cta-btn:hover {
                    background-color: #0ea5e9;
                    }

                    @media (max-width: 991.98px) {
                    .cta-title {
                        font-size: 1.5rem;
                        text-align: center;
                    }

                    .cta-text,
                    .cta-btn {
                        text-align: center;
                        margin-left: auto;
                        margin-right: auto;
                        display: block;
                    }

                    .cta-btn {
                        justify-content: center;
                    }
                    }
                `}</style>

            <div className="container">
                <div className="row align-items-center cta-section gx-0 mt-5">
                <div className="col-lg-6 d-none d-lg-block">
                    <div className="position-relative h-100 d-flex align-items-center justify-content-center">
                    <div className="position-relative">
                        <img
                        src={BackgroundInstructor}
                        alt="Instructor"
                        className="img-fluid mt-n4 rounded-start"
                        />
                        <img
                        src={Topleft}
                        alt="Top Left"
                        className="position-absolute top-0 start-0"
                        />
                        <img
                        src={Topright}
                        alt="Top Right"
                        className="position-absolute top-0 end-0 me-4"
                        />
                        <img
                        src={Botleft}
                        alt="Bottom Left"
                        className="position-absolute bottom-0 start-0 mb-4 ms-2"
                        />
                        <img
                        src={Botright}
                        alt="Bottom Right"
                        className="position-absolute bottom-0 end-0 mb-4 me-2"
                        />
                    </div>
                    </div>
                </div>

                <div className="col-lg-6 col-12 px-4 py-5">
                    <div>
                    <h2 className="cta-title">{t("become_instructor.title")}</h2>
                    <p className="cta-text">
                        {t("become_instructor.description")}    
                    </p>
                    <button onClick={handleClick} className="cta-btn">
                        {t("become_instructor.button")} <i className="fas fa-arrow-right"></i>
                    </button>
                    </div>
                </div>
                </div>
            </div>
            </section>

            <section className="bg-white py-5" style={{
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background elements */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    width: '200px',
                    height: '200px',
                    background: 'linear-gradient(45deg, #87CEEB, #B0E0E6)',
                    borderRadius: '50%',
                    opacity: '0.1',
                    filter: 'blur(40px)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '5%',
                    width: '250px',
                    height: '250px',
                    background: 'linear-gradient(45deg, #4682B4, #6495ED)',
                    borderRadius: '50%',
                    opacity: '0.1',
                    filter: 'blur(50px)'
                }}></div>

                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-bold text-dark mb-4" style={{
                            textShadow: '0 2px 10px rgba(70, 130, 180, 0.2)'
                        }}>
                            💬 {t("student_reviews.title")}
                        </h2>
                        <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>
                            {t("student_reviews.description")}
                        </p>
                    </div>

                    <div className="row g-4 justify-content-center">
                        {topReviews.map((r) => (
                            <div key={r.id} className="col-sm-6 col-lg-4 col-xl-3">
                                <div
                                    className="card h-100 border-0 shadow-lg p-4"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '20px',
                                        border: '2px solid #B0E0E6',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => navigate(`/course-detail/${r.course.slug}/`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(70, 130, 180, 0.3)';
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(70, 130, 180, 0.1)';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.98)';
                                        e.currentTarget.style.color = 'inherit';
                                    }}
                                >
                                    {/* Gradient border effect */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        right: '0',
                                        height: '4px',
                                        background: 'linear-gradient(90deg, #87CEEB, #4682B4, #6495ED)',
                                        borderRadius: '20px 20px 0 0'
                                    }}></div>

                                    <div className="text-center">
                                        <div className="position-relative d-inline-block mb-3">
                                            <img
                                                src={r.profile.image}
                                                alt={r.profile.full_name}
                                                className="rounded-circle border"
                                                style={{ 
                                                    width: '80px', 
                                                    height: '80px', 
                                                    objectFit: 'cover',
                                                    border: '4px solid transparent',
                                                    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4) border-box',
                                                    borderRadius: '50px'
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                right: '-5px',
                                                width: '25px',
                                                height: '25px',
                                                background: 'linear-gradient(45deg, #4682B4, #87CEEB)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                            }}>
                                                ✓
                                            </div>
                                        </div>

                                        <p className="small mb-2" style={{ 
                                            fontStyle: 'italic',
                                            lineHeight: '1.5',
                                            minHeight: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            "{r.review}"
                                        </p>

                                        <div className="mb-3">
                                            {[...Array(5)].map((_, i) => (
                                                <i
                                                    key={i}
                                                    className={`fas fa-star ${i < r.rating ? "text-warning" : "text-muted"}`}
                                                    style={{ 
                                                        fontSize: '14px',
                                                        margin: '0 2px',
                                                        filter: i < r.rating ? 'drop-shadow(0 2px 4px rgba(70, 130, 180, 0.3))' : 'none'
                                                    }}
                                                ></i>
                                            ))}
                                        </div>

                                        <h6 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>
                                            {r.profile.full_name}
                                        </h6>
                                        
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            background: 'linear-gradient(45deg, #4682B4, #87CEEB)',
                                            color: 'white',
                                            borderRadius: '15px',
                                            fontSize: '0.8rem',
                                            fontWeight: '500',
                                            boxShadow: '0 2px 10px rgba(70, 130, 180, 0.3)'
                                        }}>
                                            {r.course.title}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom decoration */}
                    <div className="text-center mt-5">
                        <div className="d-inline-flex align-items-center gap-3 px-4 py-3" style={{
                            background: 'rgba(176, 224, 230, 0.2)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '50px',
                            border: '1px solid #B0E0E6'
                        }}>
                            <div className="d-flex" style={{ marginLeft: '-10px' }}>
                                {topReviews.slice(0, 3).map((r, i) => (
                                    <img
                                        key={i}
                                        src={r.profile.image}
                                        alt=""
                                        className="rounded-circle border"
                                        style={{
                                            width: '35px',
                                            height: '35px',
                                            objectFit: 'cover',
                                            marginLeft: '-10px',
                                            borderColor: '#4682B4',
                                            borderWidth: '2px',
                                            boxShadow: '0 2px 10px rgba(70, 130, 180, 0.2)'
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-primary fw-semibold">
                                {t("student_reviews.join_message")} ✨
                            </span>
                        </div>
                    </div>
                </div>
            </section>  
            <BaseFooter />
        </>
    );
}

export default Index;
