import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import moment from "moment";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";

function Dashboard() {
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState([]);
    const [fetching, setFetching] = useState(true);

    const fetchData = () => {
        setFetching(true);
        useAxios.get(`student/summary/${UserData()?.user_id}/`).then((res) => {
            console.log(res.data[0]);
            setStats(res.data[0]);
        });

        useAxios.get(`student/course-list/${UserData()?.user_id}/`).then((res) => {
            console.log(res.data);
            setCourses(res.data);
            setFetching(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        console.log(query);
        if (query === "") {
            fetchData();
        } else {
            const filtered = courses.filter((c) => {
                return c.course.title.toLowerCase().includes(query);
            });
            setCourses(filtered);
        }
    };

    return (
        <>
          <BaseHeader />
      
          <section className="pt-5 pb-5">
            <div className="container">
              {/* Header */}
              <Header />
      
              <div className="row mt-0 mt-md-4">
                {/* Sidebar */}
                <Sidebar />
      
                <div className="col-lg-9 col-md-8 col-12">
                  {/* Section Title */}
                  <div className="row mb-4">
                    <h4 className="mb-3">
                      <i className="bi bi-grid-fill me-2 text-primary"></i> Dashboard
                    </h4>
      
                    {/* Statistic Cards */}
                    <div className="col-sm-6 col-lg-4 mb-3">
                      <div className="d-flex align-items-center p-4 bg-warning bg-opacity-10 rounded-4 shadow-sm">
                        <i className="fas fa-tv display-6 text-warning"></i>
                        <div className="ms-3">
                          <h5 className="mb-1 fw-bold">{stats.total_courses}</h5>
                          <p className="mb-0 text-muted">Total Courses</p>
                        </div>
                      </div>
                    </div>
      
                    <div className="col-sm-6 col-lg-4 mb-3">
                      <div className="d-flex align-items-center p-4 bg-danger bg-opacity-10 rounded-4 shadow-sm">
                        <i className="fas fa-clipboard-check display-6 text-danger"></i>
                        <div className="ms-3">
                          <h5 className="mb-1 fw-bold">{stats.completed_lessons}</h5>
                          <p className="mb-0 text-muted">Completed Lessons</p>
                        </div>
                      </div>
                    </div>
      
                    <div className="col-sm-6 col-lg-4 mb-3">
                      <div className="d-flex align-items-center p-4 bg-success bg-opacity-10 rounded-4 shadow-sm">
                        <i className="fas fa-medal display-6 text-success"></i>
                        <div className="ms-3">
                          <h5 className="mb-1 fw-bold">{stats.achieved_certificates}</h5>
                          <p className="mb-0 text-muted">Certificates</p>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  {/* Loading State */}
                  {fetching && <div className="text-center py-4">Loading your courses...</div>}
      
                  {/* Courses Table */}
                  {!fetching && (
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-header bg-white border-bottom-0">
                        <h5 className="mb-1">Your Courses</h5>
                        <small className="text-muted">Start or continue learning from here.</small>
                      </div>
      
                      <div className="card-body">
                        <form className="mb-3">
                          <input
                            type="search"
                            className="form-control"
                            placeholder="Search Your Courses"
                            onChange={handleSearch}
                          />
                        </form>
      
                        {courses.length === 0 ? (
                          <div className="text-center py-4">No courses found.</div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table align-middle table-hover text-nowrap">
                              <thead className="table-light">
                                <tr>
                                  <th>Course</th>
                                  <th>Enrolled</th>
                                  <th>Lectures</th>
                                  <th>Completed</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {courses.map((c, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <img
                                          src={c.course.image}
                                          alt={c.course.title}
                                          className="rounded-circle"
                                          style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                        />
                                        <div className="ms-3">
                                          <h6 className="mb-1 fw-semibold">{c.course.title}</h6>
                                          <small className="text-muted">
                                            <i className="fas fa-language me-1"></i> {c.course.language} •{" "}
                                            <i className="bi bi-bar-chart-fill me-1"></i> {c.course.level}
                                          </small>
                                        </div>
                                      </div>
                                    </td>
                                    <td>{moment(c.date).format("D MMM, YYYY")}</td>
                                    <td>{c.lectures?.length}</td>
                                    <td>{c.completed_lesson?.length}</td>
                                    <td>
                                      <Link
                                        to={`/student/courses/${c.enrollment_id}/`}
                                        className={`btn btn-sm mt-1 ${
                                          c.completed_lesson?.length > 0 ? "btn-primary" : "btn-success"
                                        }`}
                                      >
                                        {c.completed_lesson?.length > 0 ? "Continue" : "Start"}{" "}
                                        <i className="fas fa-arrow-right ms-1"></i>
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
      
          <BaseFooter />
        </>
      );
}
export default Dashboard;      
