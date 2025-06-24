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
    const [activeModalLesson, setActiveModalLesson] = useState(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    const openModal = (lesson) => {
        setActiveModalLesson(lesson);
        setIsVideoLoading(true);
    };

    const closeModal = () => {
        setActiveModalLesson(null);
        setIsVideoLoading(false);
    };

    const handleVideoCanPlay = () => setIsVideoLoading(false);

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
            <style jsx>{`
                .course-detail-page {
                    background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
                    min-height: 100vh;
                }

                .course-hero {
                    background: linear-gradient(135deg, #87ceeb 0%, #b0e0e6 50%, #f0f8ff 100%);
                    position: relative;
                    overflow: hidden;
                }

                .course-hero::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
                    z-index: 1;
                }

                .course-hero .container {
                    position: relative;
                    z-index: 2;
                }

                .floating-animation {
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                .card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(135, 206, 235, 0.2);
                    box-shadow: 0 4px 20px rgba(135, 206, 235, 0.1);
                }

                .card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 40px rgba(135, 206, 235, 0.2);
                    border-color: rgba(135, 206, 235, 0.4);
                }

                .badge-custom {
                    background: linear-gradient(135deg, #4682b4, #5f9ea0);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 25px;
                    font-weight: 500;
                    box-shadow: 0 2px 10px rgba(70, 130, 180, 0.3);
                    animation: pulse-glow 2s infinite;
                }

                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 2px 10px rgba(70, 130, 180, 0.3); }
                    50% { box-shadow: 0 4px 20px rgba(70, 130, 180, 0.5); }
                }

                .meta-icon {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #87ceeb, #b0e0e6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 10px;
                    transition: transform 0.3s ease;
                }

                .meta-item:hover .meta-icon {
                    transform: scale(1.1) rotate(5deg);
                }

                .nav-tabs-custom {
                    border: none;
                    background: rgba(135, 206, 235, 0.05);
                    border-radius: 15px 15px 0 0;
                    padding: 10px;
                }

                .nav-tabs-custom .nav-link {
                    border: none;
                    background: transparent;
                    color: #4682b4;
                    font-weight: 500;
                    border-radius: 10px;
                    margin: 0 5px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .nav-tabs-custom .nav-link::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    transition: left 0.5s;
                }

                .nav-tabs-custom .nav-link:hover::before {
                    left: 100%;
                }

                .nav-tabs-custom .nav-link.active {
                    background: linear-gradient(135deg, #4682b4, #5f9ea0);
                    color: white;
                    box-shadow: 0 4px 15px rgba(70, 130, 180, 0.3);
                }

                .accordion-custom .accordion-button {
                    background: linear-gradient(135deg, #f0f8ff, #e6f3ff);
                    border: 1px solid rgba(135, 206, 235, 0.3);
                    color: #4682b4;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .accordion-custom .accordion-button:not(.collapsed) {
                    background: linear-gradient(135deg, #87ceeb, #b0e0e6);
                    color: white;
                    box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3);
                }

                .lesson-item-custom {
                    background: linear-gradient(135deg, #f8fdff, #f0f8ff);
                    border: 1px solid rgba(135, 206, 235, 0.2);
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .lesson-item-custom::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(90deg, #4682b4, #87ceeb);
                    transition: left 0.3s ease;
                }

                .lesson-item-custom:hover::before {
                    left: 0;
                }

                .lesson-item-custom:hover {
                    transform: translateX(5px);
                    box-shadow: 0 5px 20px rgba(135, 206, 235, 0.2);
                    border-color: rgba(135, 206, 235, 0.4);
                }

                .btn-primary-custom {
                    background: linear-gradient(135deg, #4682b4, #5f9ea0);
                    border: none;
                    border-radius: 25px;
                    padding: 12px 30px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .btn-primary-custom::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    transition: width 0.3s, height 0.3s;
                }

                .btn-primary-custom:hover::before {
                    width: 300px;
                    height: 300px;
                }

                .btn-primary-custom:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(70, 130, 180, 0.4);
                }

                .instructor-card-custom {
                    background: linear-gradient(135deg, #f8fdff, #f0f8ff);
                    border: 1px solid rgba(135, 206, 235, 0.3);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .instructor-card-custom:hover {
                    transform: scale(1.02);
                    box-shadow: 0 10px 30px rgba(135, 206, 235, 0.2);
                }

                .review-item-custom {
                    background: linear-gradient(135deg, #f8fdff, #f0f8ff);
                    border: 1px solid rgba(135, 206, 235, 0.2);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 20px;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .review-item-custom::before {
                    content: '"';
                    position: absolute;
                    top: -10px;
                    left: 20px;
                    font-size: 50px;
                    color: rgba(135, 206, 235, 0.3);
                    font-family: serif;
                }

                .review-item-custom:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(135, 206, 235, 0.15);
                }

                .sidebar-sticky {
                    background: rgba(248, 253, 255, 0.8);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    border: 1px solid rgba(135, 206, 235, 0.2);
                }

                .price-highlight {
                    color: #4682b4;
                    font-size: 2.5rem;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.3);
                }

                .loading-custom {
                    background: linear-gradient(135deg, #f0f8ff, #e6f3ff);
                    border-radius: 15px;
                    padding: 40px;
                    text-align: center;
                }

                .spinner-custom {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(135, 206, 235, 0.3);
                    border-top: 4px solid #4682b4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-bottom: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .play-button-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .play-button-custom {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #4682b4, #5f9ea0);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    font-size: 24px;
                    box-shadow: 0 8px 25px rgba(70, 130, 180, 0.4);
                    transition: all 0.3s ease;
                    animation: pulse-play 2s infinite;
                }

                @keyframes pulse-play {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                }

                .play-button-custom:hover {
                    transform: translate(-50%, -50%) scale(1.2);
                    box-shadow: 0 12px 35px rgba(70, 130, 180, 0.6);
                }

                .feature-list-custom {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
                    transition: transform 0.3s ease;
                    }

                    .feature-list-custom:hover {
                    transform: translateY(-3px);
                    }

                    .feature-item {
                    transition: all 0.3s ease;
                    border-radius: 8px;
                    }

                    .feature-item:hover {
                    background: rgba(135, 206, 235, 0.08);
                    transform: translateX(4px);
                    }

                .rating-stars {
                    color: #ffd700;
                    filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
                }

                .section-divider {
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #87ceeb, transparent);
                    margin: 40px 0;
                    border-radius: 2px;
                }

                .back-button-custom {
                    background: linear-gradient(135deg, #f0f8ff, #e6f3ff);
                    border: 1px solid rgba(135, 206, 235, 0.3);
                    color: #4682b4;
                    border-radius: 25px;
                    padding: 10px 20px;
                    transition: all 0.3s ease;
                }

                .back-button-custom:hover {
                    background: linear-gradient(135deg, #87ceeb, #b0e0e6);
                    color: white;
                    transform: translateX(-5px);
                }

                .course-thumbnail {
                    position: relative;
                    overflow: hidden;
                    border-radius: 15px;
                    box-shadow: 0 8px 25px rgba(135, 206, 235, 0.2);
                }

                .course-thumbnail img {
                    transition: transform 0.3s ease;
                }

                .course-thumbnail:hover img {
                    transform: scale(1.05);
                }

                .social-links a {
                    display: inline-block;
                    width: 40px;
                    height: 40px;
                    line-height: 40px;
                    text-align: center;
                    border-radius: 50%;
                    margin-right: 10px;
                    transition: all 0.3s ease;
                    background: rgba(135, 206, 235, 0.1);
                }

                .social-links a:hover {
                    transform: translateY(-3px) scale(1.1);
                    box-shadow: 0 5px 15px rgba(135, 206, 235, 0.3);
                }
            `}</style>
            
            {isLoading ? (
                <div className="loading-custom">
                    <div className="spinner-custom"></div>
                    <h5 className="text-muted">Loading course data...</h5>
                </div>
            ) : (
                <>
                {/* Hero Section */}
                <section className="course-hero py-5">
                    <div className="container">
                    <div className="row">
                        <div className="col-12">
                        <Link to="/" className="btn back-button-custom mb-4">
                            <i className="fas fa-arrow-left me-2"></i>Back to courses
                        </Link>
                        </div>
                        
                        <div className="col-lg-8">
                        {/* Badge */}
                        <span className="badge badge-custom mb-3 floating-animation">
                            <i className="fas fa-tag me-2"></i>
                            {course.category.title}
                        </span>
                        
                        {/* Title */}
                        <h1 className="display-5 fw-bold mb-3 text-black" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>
                            {course.title}
                        </h1>
                        
                        {/* Short Description */}
                        <div className="lead text-black mb-4" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>
                            <div dangerouslySetInnerHTML={{
                            __html: `${course?.description?.slice(0, 200)}${course?.description?.length > 200 ? '...' : ''}`,
                            }} />
                        </div>
                        
                        {/* Meta Info */}
                        <div className="course-meta d-flex flex-wrap gap-3 mb-4">
                            <div className="d-flex align-items-center meta-item">
                                <div className="meta-icon">
                                    <i className="fas fa-star rating-stars"></i>
                                </div>
                                <span className="text-black fw-medium">{course.average_rating}/5</span>
                            </div>
                            <div className="d-flex align-items-center meta-item">
                                <div className="meta-icon">
                                    <i className="fas fa-user-graduate text-black"></i>
                                </div>
                                <span className="text-black fw-medium">{course.students?.length} Enrolled</span>
                            </div>
                            <div className="d-flex align-items-center meta-item">
                                <div className="meta-icon">
                                    <i className="fas fa-signal text-black"></i>
                                </div>
                                <span className="text-black fw-medium">{course.level}</span>
                            </div>
                            <div className="d-flex align-items-center meta-item">
                                <div className="meta-icon">
                                    <i className="fas fa-calendar text-black"></i>
                                </div>
                                <span className="text-black fw-medium">{moment(course.date).format("DD MMM, YYYY")}</span>
                            </div>
                            <div className="d-flex align-items-center meta-item">
                                <div className="meta-icon">
                                    <i className="fas fa-globe text-black"></i>
                                </div>
                                <span className="black-white fw-medium">{course.language}</span>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </section>

                <div className="section-divider"></div>

                {/* Main Content Section */}
                <section className="course-content py-5">
                    <div className="container">
                    <div className="row g-4">
                        {/* Main Content */}
                        <div className="col-lg-8">
                        <div className="card card-hover rounded-3 overflow-hidden">
                            {/* Tabs Navigation */}
                            <div className="card-header bg-white border-bottom-0 p-0">
                            <ul className="nav nav-tabs nav-tabs-custom nav-justified" id="courseTabs" role="tablist">
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
                                <h4 className="mb-4 text-primary">Course Description</h4>
                                <div className="course-description" dangerouslySetInnerHTML={{ __html: course?.description }} />
                                
                                {/* What You'll Learn Section */}
                                <div className="mt-5">
                                    <h5 className="text-primary mb-3">
                                        <i className="fas fa-lightbulb me-2"></i>What You'll Learn
                                    </h5>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="feature-item">
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                Comprehensive understanding of the subject
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="feature-item">
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                Practical hands-on experience
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="feature-item">
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                Industry best practices
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="feature-item">
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                Real-world project experience
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Prerequisites Section */}
                                <div className="mt-5">
                                    <h5 className="text-primary mb-3">
                                        <i className="fas fa-clipboard-list me-2"></i>Prerequisites
                                    </h5>
                                    <div className="alert alert-info border-0" style={{background: 'rgba(135, 206, 235, 0.1)'}}>
                                        <i className="fas fa-info-circle me-2"></i>
                                        Basic computer literacy and enthusiasm to learn!
                                    </div>
                                </div>
                                </div>

                                {/* Curriculum Tab */}
<div className="tab-pane fade" id="curriculum" role="tabpanel">
      <h4 className="mb-4 text-primary">Course Curriculum</h4>
      <div className="accordion accordion-custom curriculum-accordion" id="curriculumAccordion">
        {course?.variants?.map((variant, index) => (
          <div className="accordion-item border-0 mb-3" key={variant.variant_id}>
            <h5 className="accordion-header">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#variant-${variant.variant_id}`}
                aria-expanded="false"
                aria-controls={`variant-${variant.variant_id}`}
              >
                <i className="fas fa-folder-open me-3"></i>
                {variant.title}
                <span className="badge bg-primary ms-auto me-3">
                  {variant.items?.length || 0} lessons
                </span>
              </button>
            </h5>
            <div
              id={`variant-${variant.variant_id}`}
              className="accordion-collapse collapse"
              data-bs-parent="#curriculumAccordion"
            >
              <div className="accordion-body pt-3">
                {variant.items?.map((lesson, idx) => (
                  <div className="lesson-item-custom mb-3" key={lesson.variant_item_id || idx}>
                    <div className="d-flex justify-content-between align-items-center p-3">
                      <div className="d-flex align-items-center">
                        {lesson.preview === true || lesson.preview === "true" ? (
                          lesson.file ? (
                            <>
                              <button
                                className="btn btn-sm btn-outline-primary me-3"
                                onClick={() => openModal(lesson)}
                                style={{ borderRadius: "50%", width: "35px", height: "35px" }}
                              >
                                <i className="fas fa-play"></i>
                              </button>
                              <div>
                                <span className="fw-medium">{lesson.title}</span>
                                <br />
                                <small className="text-muted">
                                  <i className="fas fa-eye me-1"></i>Preview available
                                </small>
                              </div>
                            </>
                          ) : (
                            <>
                              <div
                                className="me-3"
                                style={{
                                  width: "35px",
                                  height: "35px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <i className="fas fa-file-alt text-muted"></i>
                              </div>
                              <div>
                                <span className="fw-medium">{lesson.title}</span>
                                <br />
                                <small className="text-muted">
                                  <i className="fas fa-info-circle me-1"></i>No video available
                                </small>
                              </div>
                            </>
                          )
                        ) : (
                          <>
                            <div
                              className="me-3"
                              style={{
                                width: "35px",
                                height: "35px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <i className="fas fa-lock text-muted"></i>
                            </div>
                            <div>
                              <span className="text-muted">{lesson.title}</span>
                              <br />
                              <small className="text-muted">
                                <i className="fas fa-lock me-1"></i>Locked
                              </small>
                            </div>
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
                    {activeModalLesson?.variant_item_id === lesson.variant_item_id && lesson.file && (
                      <div className="modal fade show d-block" tabIndex="-1" aria-hidden="true">
                        <div className="modal-dialog modal-xl modal-lg">
                          <div className="modal-content" style={{ borderRadius: "15px", overflow: "hidden" }}>
                            <div
                              className="modal-header"
                              style={{ background: "linear-gradient(135deg, #4682b4, #5f9ea0)", color: "white" }}
                            >
                              <h5 className="modal-title">{lesson.title}</h5>
                              <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={closeModal}
                              ></button>
                            </div>
                            <div className="modal-body p-0 position-relative">
                              {/* Loading Spinner */}
                              {isVideoLoading && (
                                <div
                                  className="position-absolute top-50 start-50 translate-middle"
                                  style={{ zIndex: 10 }}
                                >
                                  <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                              )}
                              <video
                                src={lesson.file}
                                className="w-100"
                                controls
                                onCanPlay={handleVideoCanPlay}
                                onError={() => {
                                  setIsVideoLoading(false);
                                  console.error(`Failed to load video for lesson: ${lesson.title}`);
                                }}
                                style={{ 
                                  width: "100%",
                                  height: "auto",
                                  minHeight: "400px", // Đảm bảo chiều cao tối thiểu
                                  maxHeight: "80vh", // Giới hạn chiều cao tối đa
                                  objectFit: "contain" // Giữ tỷ lệ video
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                                <h4 className="mb-4 text-primary">Meet Your Instructor</h4>
                                <div className="instructor-card-custom card border-0 mb-4">
                                    <div className="row g-0">
                                    <div className="col-md-4">
                                        <img 
                                        src={course.teacher.image} 
                                        className="img-fluid h-100 object-fit-cover" 
                                        alt={course.teacher.full_name} 
                                        style={{borderRadius: '20px 0 0 20px'}}
                                        />
                                    </div>
                                    <div className="col-md-8">
                                        <div className="card-body p-4">
                                        <h4 className="card-title text-primary">{course.teacher.full_name}</h4>
                                        <p className="card-text text-muted mb-3">{course.teacher.bio}</p>
                                        <div className="social-links">
                                            <a href={course.teacher.twitter} className="text-primary">
                                            <i className="fab fa-twitter"></i>
                                            </a>
                                            <a href={course.teacher.facebook} className="text-primary">
                                            <i className="fab fa-facebook"></i>
                                            </a>
                                            <a href={course.teacher.linkedin} className="text-primary">
                                            <i className="fab fa-linkedin"></i>
                                            </a>
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                
                                <h5 className="mb-3 text-primary">About Instructor</h5>
                                <p className="mb-0">{course.teacher.about}</p>
                                </div>

                                {/* Reviews Tab */}
                                <div className="tab-pane fade" id="reviews" role="tabpanel">
                                <h4 className="mb-4 text-primary">Student Reviews</h4>
                                
                                {course?.reviews?.length > 0 ? (
                                    <div className="reviews-container">
                                    {course.reviews.map((review, index) => (
                                        <div className="review-item-custom" key={index}>
                                        <div className="d-flex">
                                            <img
                                            src={review?.profile?.image || "/default-avatar.png"}
                                            alt={review?.profile?.full_name}
                                            className="rounded-circle me-3"
                                            width="60"
                                            height="60"
                                            style={{border: '3px solid rgba(135, 206, 235, 0.3)'}}
                                            />
                                            <div className="flex-grow-1">
                                            <div className="d-flex flex-wrap align-items-center mb-2">
                                                <h5 className="me-3 mb-0 text-primary">{review?.profile?.full_name}</h5>
                                                <div className="rating-badge px-3 py-1 rounded-pill me-3" style={{background: 'linear-gradient(135deg, #ffd700, #ffed4e)', color: '#333'}}>
                                                <i className="fas fa-star me-1"></i>
                                                {review?.rating}/5
                                                </div>
                                                <small className="text-muted">
                                                <i className="fas fa-calendar-alt me-1"></i>
                                                {moment(review?.date).format("MMM D, YYYY")}
                                                </small>
                                            </div>
                                            <p className="mb-0 text-muted">{review?.review || <em className="text-muted">No comment provided.</em>}</p>
                                            </div>
                                        </div>
                                        </div>
                                    ))}
                                    </div>
                                ) : (
                                    <div className="alert alert-info border-0" style={{background: 'rgba(135, 206, 235, 0.1)'}}>
                                    <i className="fas fa-info-circle me-2"></i>
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
                        <div className="sticky-top sidebar-sticky" style={{top: '20px'}}>
                            {/* Course Preview Card */}
                            <div className="card card-hover mb-4 border-0">
                            <div className="course-thumbnail position-relative">
                                <img 
                                src={course.image} 
                                className="card-img-top" 
                                alt={course.title}
                                style={{borderRadius: '15px 15px 0 0'}}
                                />
                                {course?.file && (
                                <div className="play-button-overlay">
                                    <button 
                                    className="play-button-custom"
                                    data-bs-toggle="modal" 
                                    data-bs-target="#coursePreviewModal"
                                    >
                                    <i className="fas fa-play"></i>
                                    </button>
                                </div>
                                )}
                            </div>
                            
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <div className="price-highlight">
                                    ${course.price}
                                    </div>
                                    {course.original_price && (
                                    <small className="text-muted text-decoration-line-through">
                                        ${course.original_price}
                                    </small>
                                    )}
                                </div>
                                
                                <div className="dropdown">
                                    <button 
                                    className="btn btn-sm btn-outline-primary rounded-circle"
                                    data-bs-toggle="dropdown"
                                    style={{width: '40px', height: '40px'}}
                                    >
                                    <i className="fas fa-share-alt"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end" style={{borderRadius: '15px', border: '1px solid rgba(135, 206, 235, 0.3)'}}>
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
                                            Toast.success('Link copied to clipboard!');
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
                                    className="btn btn-primary-custom py-3"
                                    onClick={() => addToCart(course?.id, userId, course.price, country, CartId())}
                                    >
                                    <i className="fas fa-shopping-cart me-2"></i>Add To Cart
                                    </button>
                                )}

                                {addToCartBtn === "Added To Cart" && (
                                    <button className="btn btn-success py-3" disabled style={{borderRadius: '25px'}}>
                                    <i className="fas fa-check-circle me-2"></i>Added To Cart
                                    </button>
                                )}

                                {addToCartBtn === "Adding To Cart" && (
                                    <button className="btn btn-primary py-3" disabled style={{borderRadius: '25px'}}>
                                    <i className="fas fa-spinner fa-spin me-2"></i>Adding...
                                    </button>
                                )}

                                {addToCartBtn === "Already enrolled this course" && (
                                    <button className="btn btn-success py-3" disabled style={{borderRadius: '25px'}}>
                                    <i className="fas fa-graduation-cap me-2"></i>Already Enrolled
                                    </button>
                                )}
                                
                                <button className="btn btn-outline-primary py-2" style={{borderRadius: '20px'}}>
                                    <i className="fas fa-heart me-2"></i>Add to Wishlist
                                </button>
                                </div>
                            </div>
                            </div>
                            
                            {/* Course Features Card */}
                            <div className="card card-hover border-0 mb-4 shadow-sm">
                            <div className="card-body feature-list-custom">
                                <h5 className="card-title mb-4 text-primary d-flex align-items-center">
                                <i className="fas fa-gift me-2"></i> This course includes
                                </h5>
                                <ul className="list-group list-group-flush">
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-book text-primary me-3"></i>Lectures</span>
                                    <span className="badge bg-primary rounded-pill">{totalVariantItems}</span>
                                </li>
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-clock text-primary me-3"></i>Duration</span>
                                    <span className="fw-semibold text-muted">{getTotalFormattedDuration(course)}</span>
                                </li>
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-signal text-primary me-3"></i>Level</span>
                                    <span className="badge bg-info rounded-pill text-white">{course.level}</span>
                                </li>
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-globe text-primary me-3"></i>Language</span>
                                    <span className="fw-semibold text-muted">{course.language}</span>
                                </li>
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-calendar text-primary me-3"></i>Published</span>
                                    <span className="fw-semibold text-muted">{moment(course.date).format("MMM D, YYYY")}</span>
                                </li>
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-certificate text-primary me-3"></i>Certificate</span>
                                    <span className="badge bg-success rounded-pill">Yes</span>
                                </li>
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-mobile-alt text-primary me-3"></i>Mobile Access</span>
                                    <span className="badge bg-success rounded-pill">Yes</span>
                                </li>
                                <li className="list-group-item feature-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                    <span><i className="fas fa-infinity text-primary me-3"></i>Lifetime Access</span>
                                    <span className="badge bg-success rounded-pill">Yes</span>
                                </li>
                                </ul>
                            </div>
                            </div>

                            {/* Money Back Guarantee */}
                            <div className="card border-0 shadow-sm">
                            <div className="card-body text-center bg-white rounded-4 p-4">
                                <i className="fas fa-similar fa-shield text-success mb-3" style={{ fontSize: '2rem' }}></i>
                                <h6 className="text-primary mb-2">30-Day Money-Back Guarantee</h6>
                                <small className="text-muted">Full refund if you're not satisfied</small>
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
                        <div className="modal-content" style={{borderRadius: '20px', overflow: 'hidden'}}>
                        <div className="modal-header" style={{background: 'linear-gradient(135deg, #4682b4, #5f9ea0)', color: 'white'}}>
                            <h5 className="modal-title">
                                <i className="fas fa-play me-2"></i>Course Preview
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
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
            {activeModalLesson && (
  <div className="modal fade show d-block" tabIndex="-1" aria-hidden="true" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
    <div className="modal-dialog modal-xl modal-lg">
      <div className="modal-content" style={{ borderRadius: "15px", overflow: "hidden" }}>
        <div className="modal-header" style={{ background: "linear-gradient(135deg, #4682b4, #5f9ea0)", color: "white" }}>
          <h5 className="modal-title">{activeModalLesson.title}</h5>
          <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
        </div>
        <div className="modal-body p-0 position-relative">
          {isVideoLoading && (
            <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          <video
            src={activeModalLesson.file}
            className="w-100"
            controls
            autoPlay
            onCanPlay={handleVideoCanPlay}
            onError={() => {
              setIsVideoLoading(false);
              console.error(`Failed to load video for lesson: ${activeModalLesson.title}`);
            }}
            style={{
              width: "100%",
              height: "auto",
              minHeight: "400px",
              maxHeight: "80vh",
              objectFit: "contain"
            }}
          />
        </div>
      </div>
    </div>
  </div>
)}
            </main>
            <BaseFooter />
        </>
    );
}

export default CourseDetail;
