import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import _ from 'lodash';
import Modal from "react-bootstrap/Modal";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";

function QA() {
  const [questions, setQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [ConversationShow, setConversationShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastElementRef = useRef();

  const [createMessage, setCreateMessage] = useState({ title: "", message: "" });

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await apiInstance.get(`student/question-answer-list-create/${UserData()?.user_id}/`);
      setQuestions(response.data);
      setOriginalQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Toast.error("Failed to load questions");
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleConversationClose = () => setConversationShow(false);
  const handleConversationShow = (conversation) => {
    setConversationShow(true);
    setSelectedConversation(conversation);
  };

  const handleMessageChange = (event) => {
    setCreateMessage({
      ...createMessage,
      [event.target.name]: event.target.value,
    });
  };

  const debouncedSearch = useCallback(
    _.debounce((query) => {
      if (!query.trim()) {
        setQuestions(originalQuestions);
        return;
      }
      const filtered = originalQuestions.filter((question) =>
        question?.title?.toLowerCase().includes(query)
      );
      setQuestions(filtered);
    }, 300),
    [originalQuestions]
  );

  const handleSearchQuestion = (event) => {
    const query = event?.target?.value?.toLowerCase() || '';
    debouncedSearch(query);
  };

  const sendNewMessage = async (e) => {
    e.preventDefault();
    if (!createMessage.message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formdata = new FormData();
      formdata.append("course_id", selectedConversation.course);
      formdata.append("user_id", UserData()?.user_id);
      formdata.append("message", createMessage.message);
      formdata.append("qa_id", selectedConversation?.qa_id);

      const response = await apiInstance.post(`student/question-answer-message-create/`, formdata);
      setSelectedConversation(response.data.question);
      setCreateMessage({ ...createMessage, message: "" });
      Toast.success("Message sent successfully");
      fetchQuestions();
    } catch (error) {
      console.error('Error sending message:', error);
      Toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (lastElementRef.current) {
      lastElementRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation]);

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
                <i className="fas fa-envelope text-info"></i> Question and Answer
              </h4>

              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white border-bottom rounded-top-4 p-4">
                  <h4 className="mb-0 fw-bold text-dark">💬 Discussion</h4>
                  <form className="mt-3">
                    <input
                      className="form-control form-control-lg bg-light border-0 shadow-sm"
                      type="search"
                      placeholder="🔍 Search Questions"
                      onChange={handleSearchQuestion}
                    />
                  </form>
                </div>

                <div className="card-body bg-white p-4">
                  <div className="vstack gap-4">
                    {questions?.map((q, index) => (
                      <div
                        key={q.qa_id || index}
                        className="p-4 bg-white border rounded-4 shadow-sm position-relative"
                        style={{ borderLeft: "5px solid #0d6efd" }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="d-flex align-items-center">
                            <img
                              src={q.profile?.image || '/default-avatar.png'}
                              alt="avatar"
                              className="rounded-circle me-3"
                              style={{ width: "60px", height: "60px", objectFit: "cover", border: "2px solid #0d6efd" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                            <div>
                              <h6 className="mb-0 fw-bold text-primary">{q.profile?.full_name || 'Anonymous'}</h6>
                              <small className="text-muted">{moment(q.date).format("DD MMM, YYYY")}</small>
                            </div>
                          </div>
                          {q.messages?.length > 0 && (
                            <span className="badge bg-info text-dark px-3 py-2 fs-6 rounded-pill fw-semibold">
                              📘 {q.messages[0].course_name}
                            </span>
                          )}
                        </div>

                        <h5 className="fw-bold text-dark mb-2">{q.title}</h5>
                        <span className="badge bg-success rounded-pill">
                          {q.messages?.length || 0} message{q.messages?.length !== 1 ? "s" : ""}
                        </span>

                        <div className="text-end mt-3">
                          <button
                            className="btn btn-outline-primary btn-sm px-4 py-2"
                            onClick={() => handleConversationShow(q)}
                          >
                            <i className="fas fa-comments me-1"></i> Join Conversation
                          </button>
                        </div>
                      </div>
                    ))}

                    {questions?.length === 0 && (
                      <div className="text-center py-5 text-muted">
                        <i className="fas fa-question-circle fa-2x mb-3"></i>
                        <p className="fs-5">No questions found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal show={ConversationShow} size="lg" onHide={handleConversationClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Discussion: {selectedConversation?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="border p-2 p-sm-4 rounded-3">
            <ul className="list-unstyled mb-0" style={{ overflowY: "auto", height: "500px" }}>
              {selectedConversation?.messages?.map((m, index) => (
                <li key={index} className="comment-item mb-3">
                  <div className="d-flex">
                    <img
                      className="rounded-circle"
                      src={m.profile?.image || '/default-avatar.png'}
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                      alt="profile"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div className="ms-2">
                      <div className="bg-light p-3 rounded">
                        <h6 className="mb-1 fw-bold text-dark">
                          {m.profile?.full_name || 'Anonymous'}
                          <br />
                          <small className="text-muted">{moment(m.date).format("DD MMM, YYYY")}</small>
                        </h6>
                        <p className="mb-0 mt-2">{m.message}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              <div ref={lastElementRef}></div>
            </ul>

            <form className="w-100 d-flex mt-3" onSubmit={sendNewMessage}>
              <textarea
                name="message"
                className="form-control pe-4 bg-light w-75"
                rows="2"
                onChange={handleMessageChange}
                value={createMessage.message}
                placeholder="Type your message here..."
                required
              />
              <button
                className="btn btn-primary ms-2 mb-0 w-25"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <>
                    Post <i className="fas fa-paper-plane"></i>
                  </>
                )}
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
