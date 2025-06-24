import React, { useState, useEffect, useRef } from "react";
import apiInstance from "../../utils/axios";
import moment from "moment";
import { userId } from "../../utils/constants";
import Toast from "../plugin/Toast";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "react-router-dom";
import { Resizable } from "re-resizable";
import "./Chatbot.css";

const VITE_HOST_URS = import.meta.env.VITE_HOST_URS;

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [size, setSize] = useState({ width: 350, height: 500 });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const toggleChat = () => setIsOpen(!isOpen);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (userId()) fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sessionMessages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const fetchChatHistory = async (pageNum = 1, append = false) => {
    try {
      setLoadingMore(pageNum > 1);
      const res = await apiInstance.post(`chat/history/`, { 
        user_id: userId(), 
        page: pageNum,
        limit: 20
      });
      
      const newMessages = Array.isArray(res.data.data) ? res.data.data : [];
      const validMessages = newMessages.filter(msg => msg && typeof msg.text === 'string');
      
      if (append) {
        setMessages(prev => [...prev, ...validMessages]);
      } else {
        setMessages(validMessages);
      }
      
      setHasMoreMessages(newMessages.length === 20);
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setMessages([]);
      setHasMoreMessages(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loadingMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchChatHistory(nextPage, true);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const now = new Date().toISOString();
    const uid = userId();

    if (!uid) {
      setSessionMessages((prev) => [...prev, { 
        role: "user", 
        content: inputMessage, 
        timestamp: now 
      }]);
      setInputMessage("");
      setIsLoading(true);
      
      try {
        const res = await apiInstance.post(`chat/`, { query: inputMessage });
        const message = typeof res.data.message === 'string' ? res.data.message : "Xin lỗi, tôi không thể trả lời ngay bây giờ.";
        setSessionMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: message,
            timestamp: now,
          },
        ]);
        setDetectedLang(res.data.language || null);
      } catch (err) {
        console.error("Error sending message (no-auth):", err);
        Toast.error("Không thể gửi tin nhắn");
      } finally {
        setIsLoading(false);
      }
    } else {
      setMessages((prev) => [...prev, { 
        role: "user", 
        text: inputMessage, 
        timestamp: now 
      }]);
      setInputMessage("");
      setIsLoading(true);
      
      try {
        const res = await apiInstance.post(`chat/`, { 
          user_id: uid, 
          query: inputMessage 
        });
        setDetectedLang(res.data.language || null);
        await fetchChatHistory();
      } catch (err) {
        console.error("Error sending message (auth):", err);
        Toast.error("Không thể gửi tin nhắn");
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearChat = async () => {
    const uid = userId();
    if (!uid) {
      setSessionMessages([]);
      Toast.success("Cuộc trò chuyện đã được xóa.");
      return;
    }

    const result = await Swal.fire({
      title: "Bạn có chắc không?",
      text: "Hành động này sẽ xóa toàn bộ cuộc trò chuyện của bạn.",
      icon: "warning",
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await apiInstance.post(`chat/delete/`, { user_id: uid });
        setMessages([]);
        Toast.success("Cuộc trò chuyện đã được xóa.");
      } catch (err) {
        console.error("Error deleting chat:", err);
        Toast.error("Không thể xóa cuộc trò chuyện.");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessages = () => {
    const uid = userId();
    const currentMessages = uid ? messages.slice().reverse() : sessionMessages;

    if (!currentMessages.length && !isLoading) {
      return <div className="text-center text-muted mt-5">🤖 Bắt đầu một cuộc trò chuyện mới</div>;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return (
      <>
        {uid && hasMoreMessages && (
          <div className="text-center mb-3">
            <button 
              className="btn btn-outline-secondary btn-sm load-more-btn"
              onClick={loadMoreMessages}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Đang tải...
                </>
              ) : (
                '📜 Tải tin nhắn cũ hơn'
              )}
            </button>
          </div>
        )}

        {currentMessages
          .filter(msg => msg && msg.role && (msg.text || msg.content))
          .map((msg, i) => {
            const sender = msg.role;
            const content = uid ? msg.text : msg.content;

            // Convert all URLs to buttons
            const parts = typeof content === 'string' ? content.split(urlRegex) : [content];
            const contentWithLinks = parts.flatMap((part, index) => {
              if (part.match(urlRegex)) {
                return [
                  <a
                    key={`link-${index}`}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary ms-2 mb-1"
                  >
                    Truy cập liên kết
                  </a>
                ];
              }
              return part ? [part] : [];
            });

            const redirectRegex = /👉 Redirect URL: (\/[a-zA-Z0-9\-_/]+)/;
            const matchRedirect = typeof content === 'string' ? content.match(redirectRegex) : null;
            const cleanedContent = typeof content === 'string' ? content.replace(redirectRegex, '').trim() : '';

            return (
              <div key={`${msg.timestamp}-${i}`} className={`mb-3 message-${sender}`}>
                <div
                  className={`p-3 rounded message-bubble ${
                    sender === "user" ? "bg-primary text-white ms-auto" : "bg-light me-auto"
                  }`}
                  style={{ maxWidth: "80%" }}
                >
                  <div className="fw-bold small mb-1">{sender === "user" ? "Bạn" : "Bot"}</div>
                  <div className="markdown-body">
                    <ReactMarkdown>
                      {cleanedContent.replace(/<\/?[^>]+(>|$)/g, "")}
                    </ReactMarkdown>
                    {contentWithLinks.map((part, index) => (
                      <span key={`part-${index}`}>{part}</span>
                    ))}
                  </div>
                  {matchRedirect && (
                    <div className="mt-2">
                      <Link 
                        to={`${VITE_HOST_URS}${matchRedirect[1]}`} 
                        className="btn btn-sm btn-outline-primary"
                      >
                        Truy cập ngay
                      </Link>
                    </div>
                  )}
                  <div className="text-muted small mt-1">
                    {msg.timestamp ? moment(msg.timestamp).format("DD/MM HH:mm") : ''}
                  </div>
                </div>
              </div>
            );
          })}
      </>
    );
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <Resizable
          size={size}
          onResizeStop={(e, direction, ref, d) => {
            setSize({
              width: size.width + d.width,
              height: size.height + d.height,
            });
          }}
          minWidth={300}
          minHeight={400}
          maxWidth={600}
          maxHeight={800}
          className="chatbot-resizable"
        >
          <div className="card shadow-lg chatbot-card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Trợ lý ảo</h6>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-danger" onClick={handleClearChat}>
                  Xóa
                </button>
                <button className="btn btn-sm btn-light" onClick={toggleChat}>
                  ×
                </button>
              </div>
            </div>

            <div className="card-body overflow-auto p-3">
              {renderMessages()}
              {isLoading && (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status" />
                </div>
              )}
              {detectedLang && (
                <div className="text-center text-muted small mt-2">
                  Ngôn ngữ: {detectedLang.toUpperCase()}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="card-footer">
              <div className="input-group">
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control"
                  placeholder="Nhập tin nhắn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </Resizable>
      )}

      <button
        className="btn btn-primary rounded-circle p-3 shadow-lg chatbot-toggle"
        onClick={toggleChat}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      </button>
    </div>
  );
}

export default Chatbot;