import React, { useState, useEffect, useRef } from "react";
import apiInstance from "../../utils/axios";
import moment from "moment";
import { userId } from "../../utils/constants";
import Toast from "../plugin/Toast";

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState(null);
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (userId()) fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sessionMessages]);

  const fetchChatHistory = async () => {
    try {
      const res = await apiInstance.post(`chat/history/`, { user_id: userId() });
      setMessages(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const now = new Date().toISOString();
    const uid = userId();

    if (!uid) {
      // Guest user
      setSessionMessages((prev) => [...prev, { role: "user", content: inputMessage, timestamp: now }]);
      setInputMessage("");
      setIsLoading(true);
      try {
        const res = await apiInstance.post(`chat/`, { query: inputMessage });
        setSessionMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.data.message || "Xin lỗi, tôi không thể trả lời ngay lúc này.",
            timestamp: now,
          },
        ]);
        setDetectedLang(res.data.language || null);
      } catch (err) {
        Toast.error("Lỗi khi gửi tin nhắn");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Logged-in user
      setMessages((prev) => [...prev, { metadata: { role: "user" }, text: inputMessage, timestamp: now }]);
      setInputMessage("");
      setIsLoading(true);
      try {
        const res = await apiInstance.post(`chat/`, { user_id: uid, query: inputMessage });
        setDetectedLang(res.data.language || null);
        await fetchChatHistory();
      } catch {
        Toast.error("Lỗi khi gửi tin nhắn");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearChat = async () => {
    const uid = userId();
    if (!uid) {
      Toast.warning("Bạn cần đăng nhập để sử dụng chức năng này.");
      return;
    }

    const result = await Toast.custom({
      title: "Bạn có chắc?",
      text: "Hành động này sẽ xoá toàn bộ cuộc trò chuyện.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
    });

    if (result.isConfirmed) {
      try {
        await apiInstance.post(`chat/delete/`, { user_id: uid });
        setMessages([]);
        Toast.success("Đã xoá cuộc trò chuyện.");
      } catch {
        Toast.error("Không thể xoá cuộc trò chuyện.");
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
      return <div className="text-center text-muted">Bắt đầu cuộc trò chuyện mới</div>;
    }

    return currentMessages.map((msg, i) => {
      const sender = uid ? msg.metadata.role : msg.role;
      const content = uid ? msg.text : msg.content;
      return (
        <div key={i} className={`mb-3 ${sender === "user" ? "text-end" : "text-start"}`}>
          <div
            className={`d-inline-block p-3 rounded ${
              sender === "user" ? "bg-primary text-white" : "bg-light"
            }`}
            style={{ maxWidth: "80%" }}
          >
            {content}
            <div className="text-muted small mt-1">{moment(msg.timestamp).format("HH:mm")}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      {isOpen && (
        <div
          className="card shadow-lg"
          style={{ width: "350px", height: "500px", position: "absolute", right: "0", bottom: "70px" }}
        >
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Trợ lý ảo</h6>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-danger" onClick={handleClearChat}>
                Xoá
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
                Ngôn ngữ phát hiện: {detectedLang.toUpperCase()}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="card-footer">
            <div className="input-group">
              <input
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
      )}

      <button
        className="btn btn-primary rounded-circle p-3 shadow-lg"
        onClick={toggleChat}
        style={{
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      </button>
    </div>
  );
}

export default Chatbot;
