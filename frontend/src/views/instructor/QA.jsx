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
    const [selectedConversation, setSelectedConversation] = useState(null);
    const lastElementRef = useRef();
    const [createMessage, setCreateMessage] = useState({
        title: "",
        message: "",
    });

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

    useEffect(() => {
        fetchQuestions();
    }, []);

    const [ConversationShow, setConversationShow] = useState(false);
    const handleConversationClose = () => setConversationShow(false);
    const handleConversationShow = (converation) => {
        setConversationShow(true);
        setSelectedConversation(converation);
    };

    const handleMessageChange = (event) => {
        setCreateMessage({
        ...createMessage,
        [event.target.name]: event.target.value,
        });
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

    useEffect(() => {
        if (lastElementRef.current) {
        lastElementRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedConversation]);

    const handleSearchQuestion = (event) => {
        const query = event.target.value.toLowerCase();
        if (query === "") {
            fetchQuestions();
        } else {
            const filtered = questions?.filter((question) => {
                return question.title.toLowerCase().includes(query);
            });
            setQuestions(filtered);
        }
    };

    return (
        <>
            <BaseHeader />

            <section className="pt-5 pb-5">
                <div className="container">
                    {/* Header Here */}
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        {/* Sidebar Here */}
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            <h4 className="mb-0 mb-1">
                                {" "}
                                <i className="fas fa-envelope text-info"></i> Question and Answer
                            </h4>

                            <div className="card">
                                {/* Card header */}
                                <div className="card-header border-bottom p-0 pb-3">
                                    {/* Title */}
                                    <h4 className="mb-3 p-3">Discussion</h4>
                                    <form className="row g-4 p-3">
                                        {/* Search */}
                                        <div className="col-sm-12 col-lg-12">
                                            <div className="position-relative">
                                                <input className="form-control pe-5 bg-transparent" type="search" placeholder="Search Questions" aria-label="Search" onChange={handleSearchQuestion} />
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                {/* Card body */}
                                <div className="card-body p-0 pt-3">
                                    <div className="vstack gap-3 p-3">
                                        {/* Question item START */}
                                        {questions?.map((q, index) => (
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
                                                {q.title}{" "}
                                                <span className="badge bg-success ms-2">{q.messages?.length}</span>
                                                </h5>

                                                <div className="text-end">
                                                <button className="btn btn-outline-primary btn-sm mt-3" onClick={() => handleConversationShow(q)}>
                                                    <i className="fas fa-comments me-1"></i> Join Conversation
                                                </button>
                                                </div>
                                            </div>
                                            ))}
                                        {/* {questions?.length < 1 && <p>No Questions</p>} */}
                                    </div>
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
                                <li className="comment-item mb-3">
                                    <div className="d-flex">
                                        <div className="avatar avatar-sm flex-shrink-0">
                                            <a href="#">
                                                <img
                                                    className="avatar-img rounded-circle"
                                                    src={m.profile.image?.startsWith("http://127.0.0.1:8000") ? m.profile.image : `http://127.0.0.1:8000${m.profile.image}`}
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                    }}
                                                    alt="womans image"
                                                />
                                            </a>
                                        </div>
                                        <div className="ms-2">
                                            {/* Comment by */}
                                            <div className="bg-light p-3 rounded w-100">
                                                <div className="d-flex w-100 justify-content-center">
                                                    <div className="me-2 ">
                                                        <h6 className="mb-1 lead fw-bold">
                                                            <a href="#!" className="text-decoration-none text-dark">
                                                                {" "}
                                                                {m.profile.full_name}{" "}
                                                            </a>
                                                            <br />
                                                            <span style={{ fontSize: "12px", color: "gray" }}>{moment(m.date).format("DD MMM, YYYY")}</span>
                                                        </h6>
                                                        <p className="mb-0 mt-3  ">{m.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}

                            <div ref={lastElementRef}></div>
                        </ul>

                        <form class="w-100 d-flex" onSubmit={sendNewMessage}>
                            <textarea name="message" class="one form-control pe-4 bg-light w-75" id="autoheighttextarea" rows="2" onChange={handleMessageChange} placeholder="What's your question?"></textarea>
                            <button class="btn btn-primary ms-2 mb-0 w-25" type="submit">
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
