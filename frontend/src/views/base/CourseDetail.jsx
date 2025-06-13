import { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import moment from "moment";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import CartId from "../plugin/CartId";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import { CartContext } from "../plugin/Context";
import apiInstance from "../../utils/axios";

function CourseDetail() {
    const [course, setCourse] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addToCartBtn, setAddToCartBtn] = useState("Add To Cart");
    const [cartCount, setCartCount] = useContext(CartContext);

    const { slug } = useParams();
    const country = GetCurrentAddress().country;
    const userId = UserData()?.user_id || 0;

    const fetchCourse = async () => {
        try {
        const res = await apiInstance.get(`course/course-detail/${slug}/`);
        setCourse(res.data);
        } catch (err) {
        Toast.error("Failed to fetch course details.");
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, []);

    const isCourseEnrolled = async (courseId) => {
        try {
        const res = await apiInstance.get(`student/course-list/${userId}/`);
        const enrolledCourses = res.data;
        const isEnrolled = enrolledCourses.some(item => item.course?.id === courseId);

        if (isEnrolled) {
            Toast.warning("You are already enrolled in this course");
        }

        return isEnrolled;
        } catch (error) {
        Toast.error("Failed to check enrollment status");
        return false;
        }
    };

    const addToCart = async (courseId, userId, price, country, cartId) => {
        setAddToCartBtn("Adding To Cart");
        const alreadyEnrolled = await isCourseEnrolled(courseId);

        if (alreadyEnrolled) {
        setAddToCartBtn("Already Enrolled");
        return;
        }

        try {
        const cartRes = await apiInstance.get(`course/cart-list/${cartId}/`);
        const cartItems = cartRes.data;

        const alreadyInCart = cartItems.some(item => item.course.id === courseId);

        if (alreadyInCart) {
            setAddToCartBtn("Already In Cart");
            Toast.info("Course is already in your cart.");
            return;
        }

        const formdata = new FormData();
        formdata.append("course_id", courseId);
        formdata.append("user_id", userId);
        formdata.append("price", price);
        formdata.append("country_name", country);
        formdata.append("cart_id", cartId);

        await apiInstance.post(`course/cart/`, formdata);

        setAddToCartBtn("Added To Cart");
        Toast.success("Course added to cart");

        const updatedCart = await apiInstance.get(`course/cart-list/${cartId}/`);
        setCartCount(updatedCart.data?.length);
        } catch (error) {
        Toast.error("Failed to add course to cart");
        setAddToCartBtn("Add To Cart");
        }
    };

    const totalVariantItems = course?.variants?.reduce((total, variant) => {
        return total + (variant.items?.length || 0);
    }, 0);

    const getTotalFormattedDuration = (course) => {
        if (!course?.variants) return "00:00:00";

        const parseDurationText = (durationText) => {
        if (!durationText) return 0;

        const hhmmssMatch = durationText.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
        if (hhmmssMatch) {
            const [hours, minutes, seconds] = hhmmssMatch.slice(1).map(Number);
            return hours * 3600 + minutes * 60 + seconds;
        }

        const hourMatch = durationText.match(/(\d+)h/);
        const minuteMatch = durationText.match(/(\d+)m/);
        const secondMatch = durationText.match(/(\d+)s/);

        const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
        const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
        const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;

        return hours * 3600 + minutes * 60 + seconds;
        };

        let totalSeconds = 0;
        course.variants.forEach((variant) => {
        const items = variant.items || variant.variant_items || [];
        items.forEach((item) => {
            totalSeconds += parseDurationText(item.content_duration);
        });
        });

        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <>
            <BaseHeader />
            <main className="course-detail-page">
            {isLoading ? (
                <div className="loading-container text-center py-5">
                <div className="spinner-border text-primary me-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <span className="h5 mb-0 text-muted">Loading course data...</span>
                </div>
            ) : (
                <>
                {/* Hero Section */}
                <section className="course-hero bg-light py-4 py-md-5">
                    <div className="container">
                    <div className="row">
                        <div className="col-12">
                        <Link to="/" className="btn btn-outline-secondary mb-4">
                            <i className="fas fa-arrow-left me-2"></i>Back to courses
                        </Link>
                        </div>
                        
                        <div className="col-lg-8">
                        {/* Badge */}
                        <span className="badge bg-primary text-white py-2 px-3 mb-3">
                            {course.category.title}
                        </span>
                        
                        {/* Title */}
                        <h1 className="display-5 fw-bold mb-3">{course.title}</h1>
                        
                        {/* Short Description */}
                        <div className="lead text-muted mb-4">
                            <div dangerouslySetInnerHTML={{
                            __html: `${course?.description?.slice(0, 200)}${course?.description?.length > 200 ? '...' : ''}`,
                            }} />
                        </div>
                        
                        {/* Meta Info */}
                        <div className="course-meta d-flex flex-wrap gap-3 mb-4">
                            <div className="d-flex align-items-center">
                            <i className="fas fa-star text-warning me-2"></i>
                            <span>{course.average_rating}/5</span>
                            </div>
                            <div className="d-flex align-items-center">
                            <i className="fas fa-user-graduate text-orange me-2"></i>
                            <span>{course.students?.length} Enrolled</span>
                            </div>
                            <div className="d-flex align-items-center">
                            <i className="fas fa-signal text-success me-2"></i>
                            <span>{course.level}</span>
                            </div>
                            <div className="d-flex align-items-center">
                            <i className="bi bi-patch-exclamation-fill text-danger me-2"></i>
                            <span>{moment(course.date).format("DD MMM, YYYY")}</span>
                            </div>
                            <div className="d-flex align-items-center">
                            <i className="fas fa-globe text-info me-2"></i>
                            <span>{course.language}</span>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </section>

                {/* Main Content Section */}
                <section className="course-content py-5">
                    <div className="container">
                    <div className="row g-4">
                        {/* Main Content */}
                        <div className="col-lg-8">
                        <div className="card shadow-sm rounded-3 overflow-hidden">
                            {/* Tabs Navigation */}
                            <div className="card-header bg-white border-bottom p-0">
                            <ul className="nav nav-tabs nav-justified" id="courseTabs" role="tablist">
                                <li className="nav-item" role="presentation">
                                <button className="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab">
                                    <i className="fas fa-info-circle me-2"></i>Overview
                                </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                <button className="nav-link" id="curriculum-tab" data-bs-toggle="tab" data-bs-target="#curriculum" type="button" role="tab">
                                    <i className="fas fa-list-ul me-2"></i>Curriculum
                                </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                <button className="nav-link" id="instructor-tab" data-bs-toggle="tab" data-bs-target="#instructor" type="button" role="tab">
                                    <i className="fas fa-user-tie me-2"></i>Instructor
                                </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                <button className="nav-link" id="reviews-tab" data-bs-toggle="tab" data-bs-target="#reviews" type="button" role="tab">
                                    <i className="fas fa-star-half-alt me-2"></i>Reviews
                                </button>
                                </li>
                            </ul>
                            </div>

                            {/* Tabs Content */}
                            <div className="card-body p-4">
                            <div className="tab-content" id="courseTabsContent">
                                {/* Overview Tab */}
                                <div className="tab-pane fade show active" id="overview" role="tabpanel">
                                <h4 className="mb-4">Course Description</h4>
                                <div className="course-description" dangerouslySetInnerHTML={{ __html: course?.description }} />
                                </div>

                                {/* Curriculum Tab */}
                                <div className="tab-pane fade" id="curriculum" role="tabpanel">
                                <h4 className="mb-4">Course Curriculum</h4>
                                <div className="accordion curriculum-accordion" id="curriculumAccordion">
                                    {course?.variants?.map((variant, index) => (
                                    <div className="accordion-item border-0 mb-3" key={variant.variant_id}>
                                        <h5 className="accordion-header">
                                        <button 
                                            className="accordion-button collapsed bg-light rounded-3" 
                                            type="button" 
                                            data-bs-toggle="collapse" 
                                            data-bs-target={`#variant-${variant.variant_id}`}
                                        >
                                            <i className="fas fa-folder-open text-primary me-3"></i>
                                            {variant.title}
                                        </button>
                                        </h5>
                                        <div id={`variant-${variant.variant_id}`} className="accordion-collapse collapse" data-bs-parent="#curriculumAccordion">
                                        <div className="accordion-body pt-3">
                                            {variant.items?.map((lesson, idx) => (
                                            <div className="lesson-item mb-3" key={idx}>
                                                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                                                <div className="d-flex align-items-center">
                                                    {lesson.preview === true || lesson.preview === 'true' ? (
                                                    <>
                                                        <button 
                                                        className="btn btn-sm btn-outline-primary me-3"
                                                        data-bs-toggle="modal" 
                                                        data-bs-target={`#videoModal-${lesson.variant_item_id}`}
                                                        >
                                                        <i className="fas fa-play"></i>
                                                        </button>
                                                        <span>{lesson.title}</span>
                                                    </>
                                                    ) : (
                                                    <>
                                                        <i className="fas fa-lock text-muted me-3"></i>
                                                        <span className="text-muted">{lesson.title}</span>
                                                    </>
                                                    )}
                                                </div>
                                                {lesson.content_duration && (
                                                    <span className="badge bg-light text-dark">
                                                    <i className="fas fa-clock me-1"></i>
                                                    {lesson.content_duration}
                                                    </span>
                                                )}
                                                </div>

                                                {/* Video Modal */}
                                                <div className="modal fade" id={`videoModal-${lesson.variant_item_id}`} tabIndex="-1" aria-hidden="true">
                                                <div className="modal-dialog modal-lg">
                                                    <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h5 className="modal-title">{lesson.title}</h5>
                                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                    <div className="modal-body p-0">
                                                        <video 
                                                        src={lesson.file || ''}
                                                        className="w-100"
                                                        controls
                                                        autoPlay
                                                        />
                                                    </div>
                                                    </div>
                                                </div>
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                        </div>
                                    </div>
                                    ))}
                                </div>
                                </div>

                                {/* Instructor Tab */}
                                <div className="tab-pane fade" id="instructor" role="tabpanel">
                                <div className="instructor-card card border-0 mb-4">
                                    <div className="row g-0">
                                    <div className="col-md-4">
                                        <img 
                                        src={course.teacher.image} 
                                        className="img-fluid rounded-start h-100 object-fit-cover" 
                                        alt={course.teacher.full_name} 
                                        />
                                    </div>
                                    <div className="col-md-8">
                                        <div className="card-body">
                                        <h4 className="card-title">{course.teacher.full_name}</h4>
                                        <p className="card-text text-muted">{course.teacher.bio}</p>
                                        <div className="social-links">
                                            <a href={course.teacher.twitter} className="text-twitter me-3">
                                            <i className="fab fa-twitter-square fa-lg"></i>
                                            </a>
                                            <a href={course.teacher.facebook} className="text-facebook me-3">
                                            <i className="fab fa-facebook-square fa-lg"></i>
                                            </a>
                                            <a href={course.teacher.linkedin} className="text-linkedin">
                                            <i className="fab fa-linkedin fa-lg"></i>
                                            </a>
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                
                                <h5 className="mb-3">About Instructor</h5>
                                <p className="mb-0">{course.teacher.about}</p>
                                </div>

                                {/* Reviews Tab */}
                                <div className="tab-pane fade" id="reviews" role="tabpanel">
                                <h4 className="mb-4">Student Reviews</h4>
                                
                                {course?.reviews?.length > 0 ? (
                                    <div className="reviews-container">
                                    {course.reviews.map((review, index) => (
                                        <div className="review-item mb-4" key={index}>
                                        <div className="d-flex">
                                            <img
                                            src={review?.profile?.image || "/default-avatar.png"}
                                            alt={review?.profile?.full_name}
                                            className="rounded-circle me-3"
                                            width="60"
                                            height="60"
                                            />
                                            <div>
                                            <div className="d-flex flex-wrap align-items-center mb-2">
                                                <h5 className="me-3 mb-0">{review?.profile?.full_name}</h5>
                                                <div className="rating-badge bg-light text-warning px-2 py-1 rounded">
                                                {review?.rating}/5 <i className="fas fa-star"></i>
                                                </div>
                                                <small className="text-muted ms-auto">
                                                {moment(review?.date).format("MMM D, YYYY")}
                                                </small>
                                            </div>
                                            <p className="mb-0">{review?.review || <em className="text-muted">No comment provided.</em>}</p>
                                            </div>
                                        </div>
                                        </div>
                                    ))}
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                    No reviews yet. Be the first to review this course!
                                    </div>
                                )}
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>

                        {/* Sidebar */}
                        <div className="col-lg-4">
                        <div className="sticky-top" style={{top: '20px'}}>
                            {/* Course Preview Card */}
                            <div className="card shadow-sm mb-4 border-0">
                            <div className="course-thumbnail position-relative">
                                <img 
                                src={course.image} 
                                className="card-img-top" 
                                alt={course.title} 
                                />
                                {course?.file && (
                                <div className="play-button-overlay">
                                    <button 
                                    className="btn btn-primary btn-lg rounded-circle"
                                    data-bs-toggle="modal" 
                                    data-bs-target="#coursePreviewModal"
                                    >
                                    <i className="fas fa-play"></i>
                                    </button>
                                </div>
                                )}
                            </div>
                            
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3 className="card-title mb-0">
                                    ${course.price}
                                    {course.original_price && (
                                    <small className="text-muted text-decoration-line-through ms-2">
                                        ${course.original_price}
                                    </small>
                                    )}
                                </h3>
                                
                                <div className="dropdown">
                                    <button 
                                    className="btn btn-sm btn-outline-secondary rounded-circle"
                                    data-bs-toggle="dropdown"
                                    >
                                    <i className="fas fa-share-alt"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <a 
                                        className="dropdown-item" 
                                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        >
                                        <i className="fab fa-twitter me-2 text-primary"></i>Twitter
                                        </a>
                                    </li>
                                    <li>
                                        <a 
                                        className="dropdown-item" 
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        >
                                        <i className="fab fa-facebook me-2 text-primary"></i>Facebook
                                        </a>
                                    </li>
                                    <li>
                                        <a 
                                        className="dropdown-item" 
                                        href={`https://www.linkedin.com/shareArticle?url=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        >
                                        <i className="fab fa-linkedin me-2 text-primary"></i>LinkedIn
                                        </a>
                                    </li>
                                    <li>
                                        <button 
                                        className="dropdown-item" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success('Link copied to clipboard!');
                                        }}
                                        >
                                        <i className="fas fa-copy me-2 text-primary"></i>Copy link
                                        </button>
                                    </li>
                                    </ul>
                                </div>
                                </div>
                                
                                <div className="d-grid gap-2">
                                {addToCartBtn === "Add To Cart" && (
                                    <button 
                                    className="btn btn-primary py-3"
                                    onClick={() => addToCart(course?.id, userId, course.price, country, CartId())}
                                    >
                                    <i className="fas fa-shopping-cart me-2"></i>Add To Cart
                                    </button>
                                )}

                                {addToCartBtn === "Added To Cart" && (
                                    <button className="btn btn-success py-3" disabled>
                                    <i className="fas fa-check-circle me-2"></i>Added To Cart
                                    </button>
                                )}

                                {addToCartBtn === "Adding To Cart" && (
                                    <button className="btn btn-primary py-3" disabled>
                                    <i className="fas fa-spinner fa-spin me-2"></i>Adding...
                                    </button>
                                )}

                                {addToCartBtn === "Already enrolled this course" && (
                                    <button className="btn btn-success py-3" disabled>
                                    <i className="fas fa-check-circle me-2"></i>Already Enrolled
                                    </button>
                                )}
                                </div>
                            </div>
                            </div>
                            
                            {/* Course Features Card */}
                            <div className="card shadow-sm border-0 mb-4">
                            <div className="card-body">
                                <h5 className="card-title mb-4">This course includes</h5>
                                <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-2">
                                    <span>
                                    <i className="fas fa-book text-primary me-2"></i>
                                    Lectures
                                    </span>
                                    <span className="badge bg-primary rounded-pill">{totalVariantItems}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-2">
                                    <span>
                                    <i className="fas fa-clock text-primary me-2"></i>
                                    Duration
                                    </span>
                                    <span>{getTotalFormattedDuration(course)}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-2">
                                    <span>
                                    <i className="fas fa-signal text-primary me-2"></i>
                                    Level
                                    </span>
                                    <span>{course.level}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-2">
                                    <span>
                                    <i className="fas fa-globe text-primary me-2"></i>
                                    Language
                                    </span>
                                    <span>{course.language}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-2">
                                    <span>
                                    <i className="fas fa-calendar text-primary me-2"></i>
                                    Published
                                    </span>
                                    <span>{moment(course.date).format("MMM D, YYYY")}</span>
                                </li>
                                </ul>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </section>

                {/* Course Preview Modal */}
                {course?.file && (
                    <div className="modal fade" id="coursePreviewModal" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Course Preview</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body p-0">
                            <video 
                            src={course.file} 
                            className="w-100" 
                            controls 
                            autoPlay
                            />
                        </div>
                        </div>
                    </div>
                    </div>
                )}
                </>
            )}
            </main>
            <BaseFooter />
        </>
    );
}

export default CourseDetail;
