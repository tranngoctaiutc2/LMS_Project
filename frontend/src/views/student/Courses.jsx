import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import _ from 'lodash';

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [originalCourses, setOriginalCourses] = useState([]);
  const [fetching, setFetching] = useState(true);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const res = await apiInstance.get(`student/course-list/${UserData()?.user_id}/`);
      setCourses(res.data);
      setOriginalCourses(res.data);
    } catch (error) {
      console.error('Fetch error:', error);
      Toast.error("Failed to load courses");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const debouncedSearch = useCallback(
    _.debounce((query) => {
      if (!query.trim()) {
        setCourses(originalCourses);
        return;
      }
      const filtered = originalCourses.filter((c) =>
        c?.course?.title?.toLowerCase().includes(query)
      );
      setCourses(filtered);
    }, 300),
    [originalCourses]
  );

  const handleSearch = (event) => {
    const query = event?.target?.value?.toLowerCase() || '';
    debouncedSearch(query);
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
                <i className="fas fa-book text-success"></i> My Courses
              </h4>

              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white border-bottom rounded-top-4 p-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0 fw-bold text-dark">📚 My Learning Journey</h4>
                  </div>
                  <form className="mt-3">
                    <input
                      type="search"
                      className="form-control form-control-lg bg-light border-0 shadow-sm"
                      placeholder="🔍 Search Courses"
                      onChange={handleSearch}
                      disabled={fetching}
                    />
                  </form>
                </div>

                {fetching ? (
                  <div className="card-body bg-white p-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading your courses...</p>
                  </div>
                ) : (
                  <div className="card-body bg-white p-4">
                    <div className="table-responsive">
                      <table className="table table-hover table-borderless">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-4">Course</th>
                            <th>Enrolled</th>
                            <th>Progress</th>
                            <th className="text-end pe-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses?.map((c, index) => (
                            <tr key={index} className="align-middle">
                              <td className="ps-4">
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    <img
                                      src={c.course.image}
                                      alt={c.course.title}
                                      className="rounded-3"
                                      style={{ width: "80px", height: "60px", objectFit: "cover" }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/default-course.png';
                                      }}
                                    />
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h6 className="mb-1 fw-bold text-dark">{c.course.title}</h6>
                                    <div className="d-flex flex-wrap gap-2 mt-1">
                                      <span className="badge bg-light text-dark border">
                                        <i className="fas fa-language me-1"></i>{c.course.language}
                                      </span>
                                      <span className="badge bg-light text-dark border">
                                        <i className="fas fa-chart-line me-1"></i>{c.course.level}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-muted">{moment(c.date).format("MMM D, YYYY")}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress flex-grow-1" style={{ height: "8px" }}>
                                    <div
                                      className="progress-bar bg-success"
                                      role="progressbar"
                                      style={{
                                        width: `${(c.completed_lesson?.length / c.lectures?.length) * 100 || 0}%`
                                      }}
                                      aria-valuenow={(c.completed_lesson?.length / c.lectures?.length) * 100 || 0}
                                      aria-valuemin="0"
                                      aria-valuemax="100"
                                    ></div>
                                  </div>
                                  <small className="ms-2 text-muted">
                                    {Math.round((c.completed_lesson?.length / c.lectures?.length) * 100) || 0}%
                                  </small>
                                </div>
                              </td>
                              <td className="text-end pe-4">
                                <Link
                                  to={`/student/courses/${c.enrollment_id}/`}
                                  className={`btn btn-sm ${c.completed_lesson?.length > 0 ? 'btn-primary' : 'btn-success'}`}
                                >
                                  {c.completed_lesson?.length > 0 ? (
                                    <>Continue <i className="fas fa-arrow-right ms-1"></i></>
                                  ) : (
                                    <>Start <i className="fas fa-play ms-1"></i></>
                                  )}
                                </Link>
                              </td>
                            </tr>
                          ))}

                          {courses?.length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center p-5 text-muted">
                                <i className="fas fa-book-open fa-2x mb-3"></i>
                                <p className="h5">No courses found</p>
                                <p className="small">When you enroll in courses, they will appear here</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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

export default Courses;