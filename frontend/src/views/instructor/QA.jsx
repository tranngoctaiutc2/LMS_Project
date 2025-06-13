import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import Modal from "react-bootstrap/Modal";
import moment from "moment";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { Link } from "react-router-dom";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";

function QA() {
    const [questions, setQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [createMessage, setCreateMessage] = useState({ title: "", message: "" });
    const [ConversationShow, setConversationShow] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isTeacher, setIsTeacher] = useState(false);
    const lastElementRef = useRef();

    const handleConversationClose = () => setConversationShow(false);
    const handleConversationShow = (q) => {
        setConversationShow(true);
        setSelectedConversation(q);
    };

    const handleMessageChange = (event) => {
        setCreateMessage({
            ...createMessage,
            [event.target.name]: event.target.value,
        });
    };

    const fetchQuestions = async () => {
        try {
            const res = await apiInstance.get(
                `teacher/question-answer-list/${UserData()?.teacher_id}/`
            );
            setQuestions(res.data);
        } catch (err) {
            Toast.error("Failed to fetch Q&A data.");
        }
    };

    const sendNewMessage = async (e) => {
        e.preventDefault();
        const formdata = new FormData();
        formdata.append("course_id", selectedConversation.course);
        formdata.append("user_id", UserData()?.user_id);
        formdata.append("message", createMessage.message);
        formdata.append("qa_id", selectedConversation?.qa_id);

        try {
            const res = await apiInstance.post(
                `student/question-answer-message-create/`,
                formdata
            );
            setSelectedConversation(res.data.question);
            Toast.success("Message sent");
        } catch (err) {
            Toast.error("Failed to send message.");
        }
    };

    const handleSearchQuestion = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchTerm(query);
        if (query === "") {
            fetchQuestions();
        } else {
            const filtered = questions?.filter((q) =>
                q.title.toLowerCase().includes(query)
            );
            setQuestions(filtered);
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
        fetchQuestions();
    };

    useEffect(() => {
        const checkTeacherStatus = async () => {
            try {
                const res = await apiInstance.get("/teacher/status");
                if (res.data.is_teacher) {
                    setIsTeacher(true);
                    fetchQuestions();
                } else {
                    setIsTeacher(false);
                }
            } catch (err) {
                Toast.error("Failed to check teacher status.");
                setIsTeacher(false);
            } finally {
                setCheckingStatus(false);
            }
        };

        checkTeacherStatus();
    }, []);

    useEffect(() => {
        if (lastElementRef.current) {
            lastElementRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedConversation]);

    if (checkingStatus) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-3 text-muted">Checking status...</span>
            </div>
        );
    }

    if (!isTeacher) {
        return (
            <>
                <BaseHeader />
                <section className="pt-6 pb-6 bg-light min-vh-100">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-8 col-md-10">
                                <div className="card text-center shadow-lg">
                                    <div className="card-body p-5">
                                        <div className="mb-4">
                                            <i className="fas fa-chalkboard-teacher text-primary display-1"></i>
                                        </div>
                                        <h2 className="card-title mb-3">Become an Instructor</h2>
                                        <p className="card-text text-muted mb-4 fs-5">
                                            You haven't registered as an instructor yet. Register now to start
                                            sharing knowledge and managing course orders!
                                        </p>
                                        <div className="row text-start mb-4">
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-check-circle text-success me-3"></i>
                                                    <span>Sell your courses</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-check-circle text-success me-3"></i>
                                                    <span>Track order performance</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-check-circle text-success me-3"></i>
                                                    <span>Export order history</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-check-circle text-success me-3"></i>
                                                    <span>24/7 Support</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                            <Link
                                                to="/instructor/register"
                                                className="btn btn-primary btn-lg px-5 me-md-2"
                                            >
                                                <i className="fas fa-user-graduate me-2"></i>
                                                Become an Instructor
                                            </Link>
                                            <Link to="/" className="btn btn-outline-secondary btn-lg px-4">
                                                <i className="fas fa-home me-2"></i>
                                                Back to Home
                                            </Link>
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

    return (
        <>
            <BaseHeader />
            <section className="pt-5 pb-5">
                <div className="container">
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            <h4 className="mb-0 mb-1">
                                <i className="fas fa-envelope text-info"></i> Question and Answer
                            </h4>

                            <div className="card">
                                <div className="card-header border-bottom p-0 pb-3">
                                    <h4 className="mb-3 p-3">Discussion</h4>
                                    <form className="row g-4 p-3">
                                        <div className="col-sm-12 col-lg-12">
                                            <div className="position-relative">
                                                <input
                                                    className="form-control pe-5 bg-transparent"
                                                    type="search"
                                                    placeholder="Search Questions"
                                                    aria-label="Search"
                                                    value={searchTerm}
                                                    onChange={handleSearchQuestion}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="card-body p-0 pt-3">
                                    {questions?.length > 0 ? (
                                        <div className="vstack gap-3 p-3">
                                            {questions.map((q, index) => (
                                                <div className="shadow rounded-4 p-4 border border-light bg-white" key={q.id || index}>
                                                    <div className="d-sm-flex justify-content-between align-items-center mb-3">
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={q.profile.image}
                                                                alt="avatar"
                                                                className="rounded-circle me-3"
                                                                style={{
                                                                    width: "60px",
                                                                    height: "60px",
                                                                    objectFit: "cover",
                                                                    border: "2px solid #007bff"
                                                                }}
                                                            />
                                                            <div>
                                                                <h6 className="mb-1 text-primary fw-bold">{q.profile.full_name}</h6>
                                                                <small className="text-muted">{moment(q.date).format("DD MMM, YYYY")}</small>
                                                            </div>
                                                        </div>
                                                        {q.messages?.length > 0 && (
                                                            <span className="badge rounded-pill bg-info text-dark fw-semibold px-3 py-2">
                                                                📘 {q.messages[0].course_name}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h5 className="fw-bold text-dark">
                                                        {q.title}
                                                        <span className="badge bg-success ms-2">{q.messages?.length}</span>
                                                    </h5>

                                                    <div className="text-end">
                                                        <button className="btn btn-outline-primary btn-sm mt-3" onClick={() => handleConversationShow(q)}>
                                                            <i className="fas fa-comments me-1"></i> Join Conversation
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <div className="mb-4">
                                                <i className="fas fa-question-circle text-muted" style={{ fontSize: "80px" }}></i>
                                            </div>
                                            <h4 className="mb-2">No questions found</h4>
                                            <p className="text-muted mb-4">
                                                {searchTerm
                                                    ? "No questions match your search criteria"
                                                    : "No questions have been asked yet. Students can ask questions about your courses here."}
                                            </p>
                                            {searchTerm && (
                                                <button className="btn btn-outline-secondary" onClick={clearSearch}>
                                                    <i className="fas fa-times me-1"></i> Clear search
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Modal show={ConversationShow} size="lg" onHide={handleConversationClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Lesson: {selectedConversation?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="border p-2 p-sm-4 rounded-3">
                        <ul className="list-unstyled mb-0" style={{ overflowY: "scroll", height: "500px" }}>
                            {selectedConversation?.messages?.map((m, index) => (
                                <li className="comment-item mb-3" key={index}>
                                    <div className="d-flex">
                                        <div className="avatar avatar-sm flex-shrink-0">
                                            <img
                                                className="avatar-img rounded-circle"
                                                src={
                                                    m.profile.image?.startsWith("http://127.0.0.1:8000")
                                                        ? m.profile.image
                                                        : `http://127.0.0.1:8000${m.profile.image}`
                                                }
                                                style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                }}
                                                alt="avatar"
                                            />
                                        </div>
                                        <div className="ms-2">
                                            <div className="bg-light p-3 rounded w-100">
                                                <div className="d-flex w-100 justify-content-center">
                                                    <div className="me-2">
                                                        <h6 className="mb-1 lead fw-bold text-dark">
                                                            {m.profile.full_name}
                                                            <br />
                                                            <span style={{ fontSize: "12px", color: "gray" }}>
                                                                {moment(m.date).format("DD MMM, YYYY")}
                                                            </span>
                                                        </h6>
                                                        <p className="mb-0 mt-3">{m.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            <div ref={lastElementRef}></div>
                        </ul>
                        <form className="w-100 d-flex" onSubmit={sendNewMessage}>
                            <textarea
                                name="message"
                                className="form-control pe-4 bg-light w-75"
                                rows="2"
                                onChange={handleMessageChange}
                                placeholder="What's your question?"
                            ></textarea>
                            <button className="btn btn-primary ms-2 mb-0 w-25" type="submit">
                                Post <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>

            <BaseFooter />
        </>
    );
}

export default QA;
