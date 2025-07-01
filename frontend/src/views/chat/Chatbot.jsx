import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fetchingRef = useRef(false);
  const location = useLocation();

  // 🔄 Reset và load lại khi user hoặc location thay đổi
  useEffect(() => {
    const uid = userId();

    if (!uid) {
      setMessages([]);
      setHistoryLoaded(false);
      setPage(1);
      setHasMoreMessages(true);
      return;
    }

    if (!historyLoaded && !fetchingRef.current) {
      loadChatHistory();
    }
  }, [location]); // hoặc thêm dependency khác nếu dùng auth context

  // 🧠 Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sessionMessages]);

  // 🧠 Focus input khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ✅ Sửa toggle để tránh gọi load nhiều lần
  const toggleChat = () => {
    setIsOpen(prev => {
      const newState = !prev;

      if (newState && userId() && !historyLoaded && !fetchingRef.current) {
        loadChatHistory();
      }

      return newState;
    });
  };

  const loadChatHistory = useCallback(async (pageNum = 1, append = false) => {
    const uid = userId();
    if (!uid || fetchingRef.current) return;

    try {
      fetchingRef.current = true;
      setLoadingMore(pageNum > 1);

      const response = await apiInstance.post(`chat/history/`, {
        user_id: uid,
        page: pageNum,
        limit: 20
      });

      const historyData = response.data.data || [];
      const validMessages = historyData.filter(msg =>
        msg &&
        typeof msg.text === 'string' &&
        msg.role &&
        msg.timestamp
      );

      if (append) {
        setMessages(prev => {
          const existingIds = new Set(
            prev.map(m => `${m.timestamp}_${m.role}_${m.text.substring(0, 50)}`)
          );
          const newMessages = validMessages.filter(m =>
            !existingIds.has(`${m.timestamp}_${m.role}_${m.text.substring(0, 50)}`)
          );
          return [...prev, ...newMessages];
        });
      } else {
        setMessages(validMessages);
        setHistoryLoaded(true);
      }

      setHasMoreMessages(historyData.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading chat history:", error);
      if (!append) {
        setMessages([]);
        setHistoryLoaded(true);
      }
      setHasMoreMessages(false);
      Toast.error("Failed to load chat history");
    } finally {
      fetchingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loadingMore || fetchingRef.current) return;
    await loadChatHistory(page + 1, true);
  };

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const messageText = inputMessage.trim();
    const uid = userId();
    const timestamp = new Date().toISOString();
    const userMessageId = generateMessageId();
    
    // Clear input immediately
    setInputMessage("");
    setIsLoading(true);

    if (!uid) {
      // Handle session messages for guests
      const userMessage = { 
        id: userMessageId,
        role: "user", 
        content: messageText, 
        timestamp: timestamp 
      };
      
      setSessionMessages(prev => [...prev, userMessage]);
      
      try {
        const response = await apiInstance.post(`chat/`, { query: messageText });
        
        const botMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: response.data.message || "Sorry, I couldn't respond right now.",
          timestamp: new Date().toISOString(),
        };
        
        setSessionMessages(prev => [...prev, botMessage]);
        setDetectedLang(response.data.language || null);
      } catch (error) {
        console.error("Error sending message (guest):", error);
        Toast.error("Failed to send message");
        setSessionMessages(prev => prev.filter(m => m.id !== userMessageId));
      }
    } else {
      // Handle authenticated user messages
      const userMessage = { 
        id: userMessageId,
        role: "user", 
        text: messageText, 
        timestamp: timestamp 
      };
      
      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);
      
      try {
        const response = await apiInstance.post(`chat/`, { 
          user_id: uid, 
          query: messageText 
        });
        
        // Only add bot response if we got one
        if (response.data.message) {
          const botMessage = {
            id: generateMessageId(),
            role: "assistant",
            text: response.data.message,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, botMessage]);
        }
        
        setDetectedLang(response.data.language || null);
        
        // DO NOT reload history - we already have the messages in state
        
      } catch (error) {
        console.error("Error sending message (authenticated):", error);
        Toast.error("Failed to send message");
        // Remove user message on error
        setMessages(prev => prev.filter(m => m.id !== userMessageId));
      }
    }
    
    setIsLoading(false);
  };

  const handleClearChat = async () => {
    const uid = userId();
    
    if (!uid) {
      setSessionMessages([]);
      Toast.success("Chat cleared successfully.");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action will delete your entire chat history.",
      icon: "warning",
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await apiInstance.post(`chat/delete/`, { user_id: uid });
        setMessages([]);
        setSessionMessages([]);
        setPage(1);
        setHasMoreMessages(true);
        setHistoryLoaded(false);
        Toast.success("Chat history deleted successfully.");
      } catch (error) {
        console.error("Error deleting chat:", error);
        Toast.error("Failed to delete chat history.");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessages = () => {
    const uid = userId();
    const currentMessages = uid ? messages.slice().reverse() : sessionMessages;

    if (!currentMessages.length && !isLoading) {
      return (
        <div className="text-center text-muted mt-5">
          🤖 Start a new conversation
        </div>
      );
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return (
      <>
        {uid && hasMoreMessages && !fetchingRef.current && historyLoaded && (
          <div className="text-center mb-3">
            <button 
              className="btn btn-outline-secondary btn-sm load-more-btn"
              onClick={loadMoreMessages}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading...
                </>
              ) : (
                '📜 Load older messages'
              )}
            </button>
          </div>
        )}

        {uid && !historyLoaded && (
          <div className="text-center mt-3">
            <div className="spinner-border text-primary" role="status" />
            <div className="text-muted mt-2">Loading chat history...</div>
          </div>
        )}

        {currentMessages
          .filter(msg => msg && msg.role && (msg.text || msg.content))
          .map((msg, index) => {
            const sender = msg.role;
            const content = uid ? msg.text : msg.content;
            const messageKey = msg.id || `${msg.timestamp}-${index}-${sender}`;

            if (!content) return null;

            // Convert URLs to buttons
            const parts = typeof content === 'string' ? content.split(urlRegex) : [content];
            const contentWithLinks = parts.flatMap((part, partIndex) => {
              if (part && typeof part === 'string' && part.match && part.match(urlRegex)) {
                return [
                  <a
                    key={`link-${partIndex}`}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary ms-2 mb-1"
                  >
                    Visit Link
                  </a>
                ];
              }
              return part ? [part] : [];
            });

            // Handle redirect URLs
            const redirectRegex = /👉 Redirect URL: (\/[a-zA-Z0-9\-_/]+)/;
            const matchRedirect = typeof content === 'string' ? content.match(redirectRegex) : null;
            const cleanedContent = typeof content === 'string' ? content.replace(redirectRegex, '').trim() : content || '';

            return (
              <div key={messageKey} className={`mb-3 message-${sender}`}>
                <div
                  className={`p-3 rounded message-bubble ${
                    sender === "user" ? "bg-primary text-white ms-auto" : "bg-light me-auto"
                  }`}
                  style={{ maxWidth: "80%" }}
                >
                  <div className="fw-bold small mb-1">
                    {sender === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="markdown-body">
                    <ReactMarkdown>
                      {typeof cleanedContent === 'string' ? cleanedContent : ''}
                    </ReactMarkdown>
                  </div>
                  {matchRedirect && VITE_HOST_URS && (
                    <div className="mt-2">
                      <Link 
                        to={`${VITE_HOST_URS}${matchRedirect[1]}`} 
                        className="btn btn-sm btn-outline-primary"
                      >
                        Visit Now
                      </Link>
                    </div>
                  )}
                  <div className="text-muted small mt-1">
                    {msg.timestamp ? moment(msg.timestamp).format("MM/DD HH:mm") : ''}
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
              <h6 className="mb-0">AI Assistant</h6>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-danger" 
                  onClick={handleClearChat}
                  disabled={isLoading}
                  title="Clear chat history"
                >
                  Clear
                </button>
                <button 
                  className="btn btn-sm btn-light" 
                  onClick={toggleChat}
                  title="Close chat"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="card-body overflow-auto p-3" style={{ height: size.height - 120 }}>
              {renderMessages()}
              {isLoading && (
                <div className="text-center mt-3">
                  <div className="spinner-border text-primary" role="status" />
                  <div className="text-muted mt-1">Processing...</div>
                </div>
              )}
              {detectedLang && (
                <div className="text-center text-muted small mt-2">
                  Detected Language: {detectedLang.toUpperCase()}
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
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  title="Send message"
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        </Resizable>
      )}

      <button
        className="btn btn-primary rounded-circle p-3 shadow-lg chatbot-toggle"
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
        title="Toggle chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      </button>
    </div>
  );
}

export default Chatbot;