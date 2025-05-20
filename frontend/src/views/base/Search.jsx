import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
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

function Search() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useContext(CartContext);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 8;

  const country = GetCurrentAddress().country;
  const userId = UserData()?.user_id;
  const cartId = CartId();

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await apiInstance.get("/course/course-list/");
      setCourses(res.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      Toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddToCart = async (courseId, price) => {
    if (!userId) {
      Toast.warning("Please log in to add to cart");
      return;
    }

    const formdata = new FormData();
    formdata.append("course_id", courseId);
    formdata.append("user_id", userId);
    formdata.append("price", price);
    formdata.append("country_name", country);
    formdata.append("cart_id", cartId);

    try {
      await apiInstance.post("course/cart/", formdata);
      Toast.success("Added to cart");

      const res = await apiInstance.get(`course/cart-list/${cartId}/`);
      setCartCount(res.data?.length);
    } catch (error) {
      console.error("Add to cart error:", error);
      Toast.error("Failed to add to cart");
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1); // Reset về page 1 khi tìm kiếm

    if (query === "") {
      fetchCourses();
    } else {
      const filteredCourses = courses.filter((course) =>
        course.title.toLowerCase().includes(query)
      );
      setCourses(filteredCourses);
    }
  };

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const paginatedCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const LoadingSpinner = () => (
    <div className="d-flex justify-content-center align-items-center my-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <>
      <BaseHeader />

      <section className="mb-5" style={{ marginTop: "100px" }}>
        <div className="container mb-lg-8">
          <div className="row mb-5 mt-3">
            <div className="col-12 mb-4">
              <h2 className="h1">Showing Results for "{searchQuery || "All Courses"}"</h2>
              <input
                type="text"
                className="form-control mt-3"
                placeholder="Search Courses..."
                onChange={handleSearch}
              />
            </div>

            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
              {isLoading ? (
                <LoadingSpinner />
              ) : paginatedCourses.length === 0 ? (
                <p>No courses found.</p>
              ) : (
                paginatedCourses.map((c) => (
                  <div className="col" key={c.id}>
                    <div className="card card-hover h-100">
                      <Link to={`/course-detail/${c.slug}/`}>
                        <img
                          src={c.image}
                          alt="course"
                          className="card-img-top"
                          style={{ width: "100%", height: "200px", objectFit: "cover" }}
                        />
                      </Link>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <span className="badge bg-info">{c.level}</span>
                            <span className="badge bg-success ms-2">{c.language}</span>
                          </div>
                          <i className="fas fa-heart text-danger fs-5" />
                        </div>
                        <h4 className="mb-2 text-truncate-line-2">
                          <Link
                            to={`/course-detail/${c.slug}/`}
                            className="text-inherit text-decoration-none text-dark fs-5"
                          >
                            {c.title}
                          </Link>
                        </h4>
                        <small>By: {c.teacher.full_name}</small> <br />
                        <small>{c.students?.length} Student{c.students?.length > 1 && "s"}</small>
                        <div className="lh-1 mt-3 d-flex">
                          <span className="fs-6">
                            <Rater total={5} rating={c.average_rating || 0} />
                          </span>
                          <span className="text-warning ms-2">4.5</span>
                          <span className="fs-6 ms-2">({c.reviews?.length} Reviews)</span>
                        </div>
                      </div>
                      <div className="card-footer d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">${c.price}</h5>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(c.id, c.price)}
                            className="btn btn-primary me-2"
                          >
                            <i className="fas fa-shopping-cart text-white" />
                          </button>
                          <Link to={`/course-detail/${c.slug}/`} className="btn btn-primary">
                            Enroll <i className="fas fa-arrow-right text-white ms-2" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <nav className="d-flex justify-content-center mt-4">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => goToPage(currentPage - 1)}>
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                      <button className="page-link" onClick={() => goToPage(index + 1)}>
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => goToPage(currentPage + 1)}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </section>

      <BaseFooter />
    </>
  );
}

export default Search;
