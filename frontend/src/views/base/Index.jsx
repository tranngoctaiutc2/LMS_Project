import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Rater from "react-rater";
import "react-rater/lib/react-rater.css";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import CartId from "../plugin/CartId";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";
import { CartContext } from "../plugin/Context";
import apiInstance from "../../utils/axios";

import BackgroundImg from '../../assets/images/background/2.jpg';
import BackgroundInstructor from '../../assets/images/background/instructor.jpg';
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

  const country = GetCurrentAddress().country;
  const userId = UserData()?.user_id;
  const cartId = CartId();

  const fetchCourses = async () => {
    try {
      const res = await apiInstance.get(`/course/course-list/`);
      setCourses(res.data);
    } catch (error) {
      Toast.error("Failed to load courses");
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
    if (!cartId) return;
    try {
      const res = await apiInstance.get(`course/cart-list/${cartId}/`);
      setCartCount(res.data?.length || 0);
    } catch (error) {
      Toast.error("Failed to fetch cart!");
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

  // Pagination logic
  const itemsPerPage = 4;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = courses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(courses.length / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
        <>
            <BaseHeader />

            <section className="py-lg-8 py-5">
                {/* container */}
                <div className="container my-lg-8">
                    {/* row */}
                    <div className="row align-items-center">
                        {/* col */}
                        <div className="col-lg-6 mb-6 mb-lg-0">
                            <div>
                                {/* heading */}
                                <h5 className="text-dark mb-4">
                                    <i className="fe fe-check icon-xxs icon-shape bg-light-success text-success rounded-circle me-2" />
                                    Most trusted education platform
                                </h5>
                                {/* heading */}
                                <h1 className="display-3 fw-bold mb-3">Grow your skills and advance career</h1>
                                {/* para */}
                                <p className="pe-lg-10 mb-5">Start, switch, or advance your career with more than 5,000 courses, Professional Certificates, and degrees from world-class universities and companies.</p>
                                {/* btn */}
                                <a href="#" className="btn btn-primary fs-4 text-inherit ms-3">
                                    Join Free Now <i className="fas fa-plus"></i>
                                </a>
                                <a href="https://www.youtube.com/watch?v=Nfzi7034Kbg" className="btn btn-outline-success fs-4 text-inherit ms-3">
                                    Watch Demo <i className="fas fa-video"></i>
                                </a>
                            </div>
                        </div>
                        {/* col */}
                        <div className="col-lg-6 d-flex justify-content-center">
                            {/* images */}
                            <div className="position-relative">
                                <img src={BackgroundImg} alt="girl" className="end-0 bottom-0" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="pb-8">
                <div className="container mb-lg-8">
                    {/* row */}
                    <div className="row mb-5">
                        <div className="col-md-6 col-lg-3 border-top-md border-top pb-4  border-end-md">
                            {/* text */}
                            <div className="py-7 text-center">
                                <div className="mb-3">
                                    <i className="fe fe-award fs-2 text-info" />
                                </div>
                                <div className="lh-1">
                                    <h2 className="mb-1">316,000+</h2>
                                    <span>Qualified Instructor</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3 border-top-md border-top border-end-lg">
                            {/* icon */}
                            <div className="py-7 text-center">
                                <div className="mb-3">
                                    <i className="fe fe-users fs-2 text-warning" />
                                </div>
                                {/* text */}
                                <div className="lh-1">
                                    <h2 className="mb-1">1.8 Billion+</h2>
                                    <span>Course enrolments</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3 border-top-lg border-top border-end-md">
                            {/* icon */}
                            <div className="py-7 text-center">
                                <div className="mb-3">
                                    <i className="fe fe-tv fs-2 text-primary" />
                                </div>
                                {/* text */}
                                <div className="lh-1">
                                    <h2 className="mb-1">41,000+</h2>
                                    <span>Courses in 42 languages</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3 border-top-lg border-top">
                            {/* icon */}
                            <div className="py-7 text-center">
                                <div className="mb-3">
                                    <i className="fe fe-film fs-2 text-success" />
                                </div>
                                {/* text */}
                                <div className="lh-1">
                                    <h2 className="mb-1">179,000+</h2>
                                    <span>Online Videos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-6 bg-light">
                <div className="container">
                    {/* Header */}
                    <div className="row mb-5">
                    <div className="col-12 text-center text-md-start">
                        <div className="mb-4">
                        <h2 className="display-5 fw-bold mb-3">🔥 Most Popular Courses</h2>
                        <p className="lead text-muted">
                            Discover the top-rated courses among our learners worldwide
                        </p>
                        </div>
                    </div>
                    </div>

                    {/* Courses Grid */}
                    <div className="row g-4">
                    {currentItems?.map((c, index) => (
                        <div className="col-12 col-md-6 col-lg-4 col-xl-3" key={c.id || index}>
                        {/* Course Card */}
                        <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden hover-shadow transition-all">
                            {/* Course Image */}
                            <Link to={`/course-detail/${c.slug}/`} className="text-decoration-none">
                            <div className="position-relative">
                                <img
                                src={c.image}
                                alt={c.title}
                                className="card-img-top"
                                style={{ height: "180px", objectFit: "cover" }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-course.png';
                                }}
                                />
                                {/* Wishlist Button */}
                                <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    addToWishlist(c.id);
                                }}
                                className="btn btn-sm btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-3"
                                aria-label={wishlist.includes(c.id) ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                <i className={`fas fa-heart ${wishlist.includes(c.id) ? "text-danger" : "text-secondary"}`} />
                                </button>
                            </div>
                            </Link>

                            {/* Card Body */}
                            <div className="card-body pb-0">
                            {/* Badges */}
                            <div className="d-flex gap-2 mb-3">
                                <span className="badge bg-info bg-opacity-10 text-info">{c.level}</span>
                                <span className="badge bg-success bg-opacity-10 text-success">{c.language}</span>
                            </div>

                            {/* Course Title */}
                            <h5 className="card-title mb-2">
                                <Link 
                                to={`/course-detail/${c.slug}/`} 
                                className="text-dark text-decoration-none"
                                >
                                {c.title}
                                </Link>
                            </h5>

                            {/* Instructor */}
                            <p className="text-muted small mb-3">
                                By: {c.teacher?.full_name || 'Unknown Instructor'}
                            </p>

                            {/* Rating and Students */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                <i className="fas fa-users text-muted me-1"></i>
                                <span className="small text-muted">
                                    {c.students?.length || 0} Student{c.students?.length !== 1 ? 's' : ''}
                                </span>
                                </div>
                                <div className="text-warning small">
                                <Rater 
                                    total={5} 
                                    rating={c.average_rating || 0} 
                                    interactive={false}
                                />
                                <span className="ms-1">
                                    ({c.reviews?.length || 0} Reviews)
                                </span>
                                </div>
                            </div>
                            </div>

                            {/* Card Footer */}
                            <div className="card-footer bg-transparent border-0 pt-0 pb-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 text-primary">
                                ${c.price || '0.00'}
                                </h5>
                                <div>
                                <button 
                                    onClick={(e) => {
                                    e.preventDefault();
                                    if (!userId) {
                                        Toast().fire({
                                        icon: "warning",
                                        title: "Please login to add to cart",
                                        });
                                        return;
                                    }
                                    addToCart(c.id, userId, c.price, country, cartId);
                                    }}
                                    className="btn btn-sm btn-outline-primary me-2"
                                    aria-label="Add to cart"
                                >
                                    <i className="fas fa-shopping-cart"></i>
                                </button>
                                <Link 
                                    to={`/course-detail/${c.slug}/`}
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
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                    <div className="row mt-5">
                        <div className="col-12">
                        <nav aria-label="Page navigation">
                            <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button 
                                className="page-link rounded-start" 
                                onClick={() => setCurrentPage(currentPage - 1)}
                                aria-label="Previous"
                                >
                                <i className="fas fa-chevron-left me-2"></i> Previous
                                </button>
                            </li>
                            
                            {pageNumbers.map((number) => (
                                <li 
                                key={number} 
                                className={`page-item ${currentPage === number ? "active" : ""}`}
                                >
                                <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(number)}
                                >
                                    {number}
                                </button>
                                </li>
                            ))}
                            
                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                <button 
                                className="page-link rounded-end" 
                                onClick={() => setCurrentPage(currentPage + 1)}
                                aria-label="Next"
                                >
                                Next <i className="fas fa-chevron-right ms-2"></i>
                                </button>
                            </li>
                            </ul>
                        </nav>
                        </div>
                    </div>
                    )}
                </div>
                </section>

            <section className="my-8 py-lg-8">
                {/* container */}
                <div className="container">
                    {/* row */}
                    <div className="row align-items-center bg-primary gx-0 rounded-3 mt-5">
                        {/* col */}
                        <div className="col-lg-6 col-12 d-none d-lg-block">
                            <div className="d-flex justify-content-center pt-4">
                                {/* img */}
                                <div className="position-relative">
                                    <img src={BackgroundInstructor} alt="image" className="img-fluid mt-n8" />
                                    <div className="ms-n8 position-absolute bottom-0 start-0 mb-6">
                                        <img src={Botleft} alt="dollor" />
                                    </div>
                                    <div className="position-absolute top-0 start-0">
                                        <img src={Topleft} alt="left corner" />
                                    </div>
                                    <div className="me-n4 position-absolute top-0 end-0">
                                        <img src={Topright} alt="graph" />
                                    </div>
                                    <div className="me-n4 position-absolute bottom-0 end-0 mb-6">
                                        <img src={Botright} alt="right corner" />
                                    </div>
                                    </div>

                            </div>
                        </div>
                        <div className="col-lg-5 col-12">
                            <div className="text-white p-5 p-lg-0">
                                {/* text */}
                                <h2 className="h1 text-white">Become an instructor today</h2>
                                <p className="mb-0">Instructors from around the world teach millions of students on Geeks. We provide the tools and skills to teach what you love.</p>
                                <a href="#" className="btn bg-white text-dark fw-bold mt-4">
                                    Start Teaching Today <i className="fas fa-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gray-200 pt-8 pb-8 mt-5">
                <div className="container pb-8">
                    {/* row */}
                    <div className="row mb-lg-8 mb-5">
                        <div className="offset-lg-1 col-lg-10 col-12">
                            <div className="row align-items-center">
                                {/* col */}
                                <div className="col-lg-6 col-md-8">
                                    {/* rating */}
                                    <div>
                                        <div className="mb-3">
                                            <span className="lh-1">
                                                <span className="align-text-top ms-2">
                                                    <i className="fas fa-star text-warning"></i>
                                                    <i className="fas fa-star text-warning"></i>
                                                    <i className="fas fa-star text-warning"></i>
                                                    <i className="fas fa-star text-warning"></i>
                                                    <i className="fas fa-star text-warning"></i>
                                                </span>
                                                <span className="text-dark fw-semibold">4.5/5.0</span>
                                            </span>
                                            <span className="ms-2">(Based on 3265 ratings)</span>
                                        </div>
                                        {/* heading */}
                                        <h2 className="h1">What our students say</h2>
                                        <p className="mb-0">
                                            Hear from
                                            <span className="text-dark">teachers</span>,<span className="text-dark">trainers</span>, and
                                            <span className="text-dark">leaders</span>
                                            in the learning space about how Geeks empowers them to provide quality online learning experiences.
                                        </p>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-4 text-md-end mt-4 mt-md-0">
                                    {/* btn */}
                                    <a href="#" className="btn btn-primary">
                                        View Reviews
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* row */}
                    <div className="row">
                        {/* col */}
                        <div className="col-md-12">
                            <div className="position-relative">
                                {/* controls */}
                                {/* slider */}
                                <div className="sliderTestimonial">
                                    {/* item */}
                                    <div className="row">
                                        <div className="col-lg-4">
                                            <div className="item">
                                                <div className="card">
                                                    <div className="card-body text-center p-6">
                                                        {/* img */}
                                                        <img src="../../assets/images/avatar/avatar-1.jpg" alt="avatar" className="avatar avatar-lg rounded-circle" />
                                                        <p className="mb-0 mt-3">“The generated lorem Ipsum is therefore always free from repetition, injected humour, or words etc generate lorem Ipsum which looks racteristic reasonable.”</p>
                                                        {/* rating */}
                                                        <div className="lh-1 mb-3 mt-4">
                                                            <span className="fs-6 align-top">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                            </span>
                                                            <span className="text-warning">5</span>
                                                            {/* text */}
                                                        </div>
                                                        <h3 className="mb-0 h4">Gladys Colbert</h3>
                                                        <span>Software Engineer at Palantir</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4">
                                            <div className="item">
                                                <div className="card">
                                                    <div className="card-body text-center p-6">
                                                        {/* img */}
                                                        <img src="../../assets/images/avatar/avatar-1.jpg" alt="avatar" className="avatar avatar-lg rounded-circle" />
                                                        <p className="mb-0 mt-3">“The generated lorem Ipsum is therefore always free from repetition, injected humour, or words etc generate lorem Ipsum which looks racteristic reasonable.”</p>
                                                        {/* rating */}
                                                        <div className="lh-1 mb-3 mt-4">
                                                            <span className="fs-6 align-top">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                            </span>
                                                            <span className="text-warning">5</span>
                                                            {/* text */}
                                                        </div>
                                                        <h3 className="mb-0 h4">Gladys Colbert</h3>
                                                        <span>Software Engineer at Palantir</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4">
                                            <div className="item">
                                                <div className="card">
                                                    <div className="card-body text-center p-6">
                                                        {/* img */}
                                                        <img src="../../assets/images/avatar/avatar-1.jpg" alt="avatar" className="avatar avatar-lg rounded-circle" />
                                                        <p className="mb-0 mt-3">“The generated lorem Ipsum is therefore always free from repetition, injected humour, or words etc generate lorem Ipsum which looks racteristic reasonable.”</p>
                                                        {/* rating */}
                                                        <div className="lh-1 mb-3 mt-4">
                                                            <span className="fs-6 align-top">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} fill="currentColor" className="bi bi-star-fill text-warning" viewBox="0 0 16 16">
                                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                </svg>
                                                            </span>
                                                            <span className="text-warning">5</span>
                                                            {/* text */}
                                                        </div>
                                                        <h3 className="mb-0 h4">Gladys Colbert</h3>
                                                        <span>Software Engineer at Palantir</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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

export default Index;
