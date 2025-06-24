import React, { useEffect, useState } from "react";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Toast from "../plugin/Toast";
import UserData from "../plugin/UserData";
import apiInstance from "../../utils/axios";
import { useNavigate } from "react-router-dom";

const tooltipStyles = `
  .custom-tooltip {
    position: relative;
  }
  
  .custom-tooltip .tooltip-text {
    visibility: hidden;
    background-color: #333;
    color: white;
    text-align: center;
    border-radius: 8px;
    padding: 12px 16px;
    position: absolute;
    z-index: 1000;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    line-height: 1.4;
    max-width: 280px;
    white-space: normal;
  }
  
  .custom-tooltip .tooltip-text::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
  
  .custom-tooltip:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
`;

const agents = [
  {
    icon: "🧠",
    title: "Professor Agent",
    type: "professor",
    endpoint: "/professor-agent/",
    description: "Creates or updates a knowledge base with structured explanations in a Google Doc.",
    hint: "💡 Tip: You can explore additional information about your topic by selecting an existing professor document you've created before.",
  },
  {
    icon: "💼",
    title: "Academic Advisor Agent",
    type: "advisor",
    endpoint: "/academic-advisor-agent/",
    description: "Designs a clear and structured learning roadmap, outlining prerequisites and milestones in a Google Doc.",
    hint: "💡 Tip: You can create a learning roadmap based on existing professor content by selecting a professor file, or modify the timeline by choosing a new duration with an existing advisor document.",
  },
  {
    icon: "📚",
    title: "Research Librarian Agent",
    type: "librarian",
    endpoint: "/research-librarian-agent/",
    description: "Collects high-quality reference materials, categorized by difficulty level and reliability, in a detailed document.",
    hint: "💡 Tip: You can find curated learning resources based on topics you've already explored by selecting an existing professor document.",
  },
  {
    icon: "✍️",
    title: "Teaching Assistant Agent",
    type: "assistant",
    endpoint: "/teaching-assistant-agent/",
    description: "Creates exercises with guided solutions to reinforce key concepts covered in the topic.",
    hint: "💡 Tip: You can generate practice questions and exercises based on topics you've studied by selecting an existing professor document.",
  },
];

const AITeachingAgents = () => {
  const [globalTopic, setGlobalTopic] = useState("");
  const [globalLanguage, setGlobalLanguage] = useState("en");
  const [professorDocs, setProfessorDocs] = useState([]);
  const [advisorDocs, setAdvisorDocs] = useState([]);
  const [isRunningGlobal, setIsRunningGlobal] = useState(false);
  const [agentStates, setAgentStates] = useState(
    agents.reduce((acc, agent) => ({
      ...acc,
      [agent.type]: {
        selectedProfessorDoc: null,
        selectedAdvisorDoc: null,
        loading: false,
        docUrl: null,
        completed: false, // Thêm trạng thái completed
        ...(agent.type === "advisor" ? { duration: "4 weeks" } : {}),
      },
    }), {})
  );
  const [checking, setChecking] = useState(false);
  const [topicStatus, setTopicStatus] = useState({ status: null, message: "" });
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [existingAgents, setExistingAgents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await apiInstance.get("/ai-document-list/", {
          params: { user_id: UserData()?.user_id },
        });
        const professorOnly = res.data?.filter((doc) => doc.ai_type === "professor") || [];
        const advisorOnly = res.data?.filter((doc) => doc.ai_type === "advisor") || [];
        setProfessorDocs(professorOnly);
        setAdvisorDocs(advisorOnly);
      } catch (err) {
        console.error("Failed to fetch documents", err);
        Toast.error("Failed to fetch documents");
      }
    };
    fetchDocs();
  }, []);

  const updateAgentState = (agentType, updates) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentType]: { ...prev[agentType], ...updates },
    }));
  };

  const getAgentExtraData = (agentType) => {
    const agentState = agentStates[agentType];
    const extraData = {};
    if (agentState.selectedProfessorDoc) {
      extraData.professor_content = { doc_url: agentState.selectedProfessorDoc.doc_url };
    }
    if (agentType === "advisor") {
      extraData.study_duration = agentState.duration;
      if (agentState.selectedAdvisorDoc) {
        extraData.advisor_content = { doc_url: agentState.selectedAdvisorDoc.doc_url };
      }
    }
    return extraData;
  };

  const validateTopicInput = (topic) => {
    const specialCharPattern = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?`~]/;
    return !specialCharPattern.test(topic);
  };

  // Hàm format text với ** thành bold
  const formatBoldText = (text) => {
    if (typeof text !== 'string') return text;
    
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleCallAgent = async (agentType, endpoint) => {
    const agentState = agentStates[agentType];
    let finalTopic = globalTopic;
    let finalLanguage = globalLanguage;

    if (agentState.selectedProfessorDoc) {
      finalTopic = agentState.selectedProfessorDoc.topic;
      finalLanguage = agentState.selectedProfessorDoc.language;
    } else if (agentType === "advisor" && agentState.selectedAdvisorDoc) {
      finalTopic = agentState.selectedAdvisorDoc.topic;
      finalLanguage = agentState.selectedAdvisorDoc.language;
    }

    if (!finalTopic) return Toast.warning("Please enter a topic or select a professor document");

    const payload = {
      user_id: UserData()?.user_id,
      topic: finalTopic,
      language: finalLanguage,
      ...getAgentExtraData(agentType),
    };

    if (agentState.selectedProfessorDoc) {
      payload.doc_url = agentState.selectedProfessorDoc.doc_url;
      Toast.info(`Auto-filled topic: "${finalTopic}", language: "${finalLanguage}" for ${agentType} from selected professor document.`);
    }
    if (agentType === "advisor" && agentState.selectedAdvisorDoc) {
      Toast.info(`Using advisor document: "${agentState.selectedAdvisorDoc.topic}" for ${agentType}.`);
    }

    setIsRunningGlobal(true);
    updateAgentState(agentType, { loading: true });

    try {
      const res = await apiInstance.post(endpoint, payload, { timeout: 300000 });
      Toast.success(`${agentType} completed!`);
      updateAgentState(agentType, { 
        docUrl: res.data.doc_url,
        completed: true // Đánh dấu là hoàn thành
      });
      return res.data;
    } catch (error) {
      console.error(error);
      Toast.error(error.response?.data?.error || "Agent failed");
      return null;
    } finally {
      updateAgentState(agentType, { loading: false });
      setIsRunningGlobal(false);
    }
  };

  // Hàm clear để reset trang bất đồng bộ
  const handleClear = async () => {
    // Reset tất cả state
    setGlobalTopic("");
    setGlobalLanguage("en");
    setTopicStatus({ status: null, message: "" });
    setTopicSuggestions([]);
    setExistingAgents([]);
    
    // Reset agent states
    setAgentStates(
      agents.reduce((acc, agent) => ({
        ...acc,
        [agent.type]: {
          selectedProfessorDoc: null,
          selectedAdvisorDoc: null,
          loading: false,
          docUrl: null,
          completed: false,
          ...(agent.type === "advisor" ? { duration: "4 weeks" } : {}),
        },
      }), {})
    );

    // Fetch lại documents
    try {
      const res = await apiInstance.get("/ai-document-list/", {
        params: { user_id: UserData()?.user_id },
      });
      const professorOnly = res.data?.filter((doc) => doc.ai_type === "professor") || [];
      const advisorOnly = res.data?.filter((doc) => doc.ai_type === "advisor") || [];
      setProfessorDocs(professorOnly);
      setAdvisorDocs(advisorOnly);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }

    Toast.success("Page cleared successfully!");
  };

  const handleCheckFeasibility = async () => {
    if (!globalTopic) return Toast.warning("Please enter a topic");
    
    if (!validateTopicInput(globalTopic)) {
      setTopicStatus({ status: "Not Allow", message: "Topic cannot contain special characters" });
      setExistingAgents([]);
      return;
    }

    setChecking(true);
    try {
      const res = await apiInstance.post("/check-global-topic/", { 
        topic: globalTopic, 
        language: globalLanguage,
        user_id: UserData()?.user_id,
      });
      
      setTopicStatus({ status: res.data.status, message: res.data.message });
      setTopicSuggestions(res.data.suggestions || []);
      if (res.data.message.includes("already exists for AI")) {
        const agentTypes = res.data.message.match(/AI: ([\w\s,]+)/)?.[1].split(",").map(type => type.trim());
        setExistingAgents(agentTypes.filter(type => type !== "professor" && ["advisor", "librarian", "assistant"].includes(type)));
      } else {
        setExistingAgents([]);
      }
    } catch (err) {
      setTopicStatus({ status: "Not Allow", message: err.response?.data?.message || "Failed to check topic feasibility" });
      setExistingAgents([]);
    } finally {
      setChecking(false);
    }
  };

  const handleAdvisorDocChange = (agentType, selectedDocId) => {
    if (globalTopic.trim()) {
      Toast.warning("You cannot select an advisor document when a global topic is entered.");
      return;
    }

    const selected = advisorDocs.find((doc) => doc.id === Number(selectedDocId));
    const agentState = agentStates[agentType];

    if (selected) {
      if (selected.study_duration && selected.study_duration === agentState.duration) {
        Toast.warning(`Selected advisor document has the same duration (${selected.study_duration}) as the current setting. Please choose a different duration or document.`);
        return;
      }

      updateAgentState(agentType, {
        selectedAdvisorDoc: selected,
        selectedProfessorDoc: null,
      });
    } else {
      updateAgentState(agentType, { selectedAdvisorDoc: null });
    }
  };

  const checkIfAgentDocExistsForTopic = async (topic, agentType) => {
    try {
      const res = await apiInstance.get("/ai-document-list/", {
        params: { user_id: UserData()?.user_id },
      });

      return res.data.some(
        (doc) =>
          doc.ai_type === agentType &&
          doc.topic?.trim().toLowerCase() === topic.trim().toLowerCase()
      );
    } catch (err) {
      console.error("Check failed", err);
      return false;
    }
  };

  const handleProfessorDocChange = async (agentType, selectedDocId) => {
    if (globalTopic.trim()) {
      Toast.warning("You cannot select a professor document when a global topic is entered.");
      return;
    }

    const selected = professorDocs.find((doc) => doc.id === Number(selectedDocId));
    if (!selected) {
      updateAgentState(agentType, { selectedProfessorDoc: null });
      return;
    }

    if (agentType !== "professor") {
      const exists = await checkIfAgentDocExistsForTopic(selected.topic, agentType);
      if (exists) {
        const agentName = {
          advisor: "Academic Advisor",
          librarian: "Research Librarian",
          assistant: "Teaching Assistant"
        }[agentType] || agentType;

        Toast.error(`A ${agentName} document already exists for topic "${selected.topic}". Cannot use this professor document.`);
        updateAgentState(agentType, { selectedProfessorDoc: null });
        return;
      }
    }

    if (agentType === "advisor") {
      updateAgentState(agentType, {
        selectedProfessorDoc: selected,
        selectedAdvisorDoc: null,
      });
    } else {
      updateAgentState(agentType, { selectedProfessorDoc: selected });
    }
  };

  const capitalizeTopic = (topic) => {
    return topic
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getIsRunEnabled = (agentType) => {
    return (
      (topicStatus.status === "Allow" && !existingAgents.includes(agentType)) ||
      agentStates[agentType].selectedProfessorDoc ||
      (agentType === "advisor" && agentStates[agentType].selectedAdvisorDoc)
    ) && !agentStates[agentType].completed; // Thêm điều kiện completed
  };

  const isAnyDocSelectedExcept = (currentAgentType) => {
    return Object.entries(agentStates).some(
      ([type, state]) =>
        type !== currentAgentType &&
        (state.selectedProfessorDoc || state.selectedAdvisorDoc)
    );
  };

  return (
    <>
      <style>{tooltipStyles}</style>
      <BaseHeader />
      <div className="container py-4">
        <h2 className="mb-4 text-center">AI Teaching Team</h2>

        <div className="mb-4 text-center">
          <h5>Global Settings</h5>
          <div className="custom-tooltip">
            <input
              type="text"
              className="form-control w-50 mx-auto mb-2"
              placeholder="Enter a global topic (e.g., Machine Learning)"
              value={globalTopic}
              onChange={(e) => {
                const value = e.target.value;
                if (!validateTopicInput(value)) {
                  Toast.error("Special characters are not allowed in topic");
                  return;
                }
                const formattedTopic = capitalizeTopic(value);
                setGlobalTopic(formattedTopic);
                setTopicStatus({ status: null, message: "" });
                setExistingAgents([]);
              }}
              disabled={isRunningGlobal || agents.some(agent => agentStates[agent.type].selectedProfessorDoc || agentStates[agent.type].selectedAdvisorDoc)}
            />
            <span className="tooltip-text">
              💡 Please enter a scientific topic in English with proper spelling. This helps ensure the best learning experience for all agents.
            </span>
          </div>
          <select
            className="form-select w-25 mx-auto mb-2"
            value={globalLanguage}
            onChange={(e) => setGlobalLanguage(e.target.value)}
            disabled={isRunningGlobal || agents.some(agent => agentStates[agent.type].selectedProfessorDoc || agentStates[agent.type].selectedAdvisorDoc)}
          >
            <option value="en">English</option>
            <option value="vi">Vietnamese</option>
          </select>
          <button
            className="btn btn-outline-info mt-2"
            onClick={handleCheckFeasibility}
            disabled={checking || isRunningGlobal || !globalTopic.trim()}
          >
            {checking ? "Checking..." : "🔍 Check Topic Feasibility"}
          </button>
          {topicStatus.message && (
            <div className={`mt-2 p-2 rounded ${topicStatus.status === "Allow" ? "text-success bg-success-subtle" : "text-danger bg-danger-subtle"}`}>
              {formatBoldText(topicStatus.message)}
            </div>
          )}
          {topicStatus.status === "Allow" && topicSuggestions.length > 0 && (
            <div className="mt-3 d-flex justify-content-center">
              <div className="card border-info shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
                <div className="card-header bg-info-subtle text-info fw-semibold">
                  {globalLanguage === "vi" ? "🔎 Gợi ý chủ đề liên quan" : "🔎 Suggested Related Topics"}
                </div>
                <div className="card-body d-flex flex-column gap-2">
                  {topicSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="d-flex justify-content-between align-items-center border rounded px-3 py-2"
                    >
                      <span
                        className="text-dark"
                        style={{ fontSize: "15px" }}
                      >
                        {suggestion}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(suggestion);
                          Toast.success(
                            globalLanguage === "vi"
                              ? `Đã sao chép: "${suggestion}"`
                              : `Copied: "${suggestion}"`
                          );
                        }}
                      >
                        📋 {globalLanguage === "vi" ? "Sao chép" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="row">
          {agents.map((agent, index) => (
            <div key={index} className="col-md-6 mb-4">
              <div className="card h-100 shadow rounded-3 p-3">
                <h4 className="mb-2">
                  <span className="me-2">{agent.icon}</span> {agent.title}
                </h4>
                <p className="text-muted small mb-3">{formatBoldText(agent.description)}</p>
                <div className="alert alert-info py-2 px-3 mb-3" style={{fontSize: '12px', lineHeight: '1.4'}}>
                  {formatBoldText(agent.hint)}
                </div>
                <select
                  className="form-select mb-2"
                  value={agentStates[agent.type].selectedProfessorDoc?.id || ""}
                  onChange={(e) => handleProfessorDocChange(agent.type, e.target.value)}
                  disabled={
                    !!globalTopic ||
                    (agent.type === "advisor" && agentStates[agent.type].selectedAdvisorDoc) ||
                    isRunningGlobal ||
                    isAnyDocSelectedExcept(agent.type) ||
                    agentStates[agent.type].completed
                  }
                >
                  <option value="">-- Select Professor Document (Optional) --</option>
                  {professorDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.topic} - {new Date(doc.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>

                {agent.type === "advisor" && (
                  <>
                    <select
                      className="form-select mb-2"
                      value={agentStates[agent.type].selectedAdvisorDoc?.id || ""}
                      onChange={(e) => handleAdvisorDocChange(agent.type, e.target.value)}
                      disabled={
                        !!globalTopic || 
                        agentStates[agent.type].selectedProfessorDoc || 
                        isRunningGlobal || 
                        isAnyDocSelectedExcept(agent.type) ||
                        agentStates[agent.type].completed
                      }
                    >
                      <option value="">-- Select Advisor Document (Optional) --</option>
                      {advisorDocs.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.topic} - {new Date(doc.created_at).toLocaleDateString()} (Duration: {doc.study_duration || "N/A"})
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select mb-2"
                      value={agentStates[agent.type].duration}
                      onChange={(e) => updateAgentState(agent.type, { duration: e.target.value })}
                      disabled={isRunningGlobal || agentStates[agent.type].completed}
                    >
                      {["2 weeks", "4 weeks", "6 weeks", "8 weeks", "10 weeks", "12 weeks"].map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() => handleCallAgent(agent.type, agent.endpoint)}
                  disabled={agentStates[agent.type].loading || isRunningGlobal || !getIsRunEnabled(agent.type)}
                >
                  {agentStates[agent.type].loading ? "Generating..." : 
                   agentStates[agent.type].completed ? "Completed" : 
                   `Run ${agent.title}`}
                </button>

                {agentStates[agent.type].docUrl && (
                  <div className="mt-3">
                    <a
                      href={agentStates[agent.type].docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      📄 View Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <button
            className="btn btn-warning me-3"
            onClick={handleClear}
            disabled={isRunningGlobal}
          >
            🧹 Clear All
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/student/ai-document-list/")}
            disabled={isRunningGlobal}
          >
            📚 View All My Documents
          </button>
        </div>
      </div>
      <BaseFooter />
    </>
  );
};

export default AITeachingAgents;