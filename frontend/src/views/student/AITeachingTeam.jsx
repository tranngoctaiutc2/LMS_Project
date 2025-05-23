import React, { useEffect, useState } from "react";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Toast from "../plugin/Toast";
import UserData from "../plugin/UserData";
import apiInstance from "../../utils/axios";
import { useNavigate } from "react-router-dom";

const agents = [
  {
    icon: "🧠",
    title: "Professor Agent",
    type: "professor",
    endpoint: "/professor-agent/",
    description: "Creates a comprehensive knowledge base with explanations from first principles, structured in a Google Doc.",
  },
  {
    icon: "💼",
    title: "Academic Advisor Agent",
    type: "advisor",
    endpoint: "/academic-advisor-agent/",
    description: "Designs a clear and structured learning roadmap, outlining prerequisites and milestones in a Google Doc.",
  },
  {
    icon: "📚",
    title: "Research Librarian Agent",
    type: "librarian",
    endpoint: "/librarian-agent/",
    description: "Collects high-quality reference materials, categorized by difficulty level and reliability, in a detailed document.",
  },
  {
    icon: "✍️",
    title: "Teaching Assistant Agent",
    type: "assistant",
    endpoint: "/assistant-agent/",
    description: "Creates exercises with guided solutions to reinforce key concepts covered in the topic.",
  },
];

const AITeachingAgents = () => {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("en");
  const [duration, setDuration] = useState("4 weeks");
  const [professorDocs, setProfessorDocs] = useState([]);
  const [selectedProfessorDoc, setSelectedProfessorDoc] = useState(null);
  const [manualProfessorLinks, setManualProfessorLinks] = useState([""]);
  const [loading, setLoading] = useState({});
  const [docUrls, setDocUrls] = useState({});
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfessorDocs = async () => {
      try {
        const res = await apiInstance.get("/ai-document-list/", {
          params: { user_id: UserData()?.user_id }
        });
        const professorOnly = res.data?.filter((doc) => doc.ai_type === "professor") || [];
        setProfessorDocs(professorOnly);
        console.log("Fetched professor docs:", professorOnly);
      } catch (err) {
        console.error("Failed to fetch professor docs", err);
      }
    };
    fetchProfessorDocs();
  }, []);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleLinkChange = (index, value) => {
    const updated = [...manualProfessorLinks];
    updated[index] = value;
    setManualProfessorLinks(updated);
  };

  const addManualLink = () => {
    if (manualProfessorLinks.length >= 5) return;
    setManualProfessorLinks([...manualProfessorLinks, ""]);
  };

  const getAdvisorExtraData = () => {
    const validLinks = manualProfessorLinks.filter((url) => isValidUrl(url));
    let professor_content = "";
    if (selectedProfessorDoc) professor_content = selectedProfessorDoc;
    else if (validLinks.length > 0) professor_content = validLinks.join("\n");
    return { professor_content, study_duration: duration };
  };

  const handleCallAgent = async (agentType, endpoint, extraData = {}) => {
    let finalTopic = topic;

    if (!finalTopic && selectedProfessorDoc?.topic) {
      finalTopic = selectedProfessorDoc.topic;
      Toast.info(`Auto-filled topic from selected document: "${finalTopic}"`);
    }

    if (!finalTopic) return Toast.warning("Please enter a topic or select a professor document");

    setLoading((prev) => ({ ...prev, [agentType]: true }));

    try {
      const res = await apiInstance.post(
        endpoint,
        {
          topic: finalTopic,
          user_id: UserData()?.user_id,
          language,
          ...extraData,
        },
        { timeout: 180000 }
      );

      Toast.success(`${agentType} completed!`);
      setDocUrls((prev) => ({ ...prev, [agentType]: res.data.doc_url }));
      return res.data;
    } catch (error) {
      console.error(error);
      Toast.error(error.response?.data?.error || "Agent failed");
      return null;
    } finally {
      setLoading((prev) => ({ ...prev, [agentType]: false }));
    }
  };


  const handleRunAll = async () => {
    if (!topic) return Toast.warning("Please enter a topic");
    setStep(1);

    const professorRes = await handleCallAgent("professor", "/professor-agent/");
    if (!professorRes || !professorRes.content) return;

    const professorContent = professorRes.content;
    setStep(2);

    await handleCallAgent("advisor", "/advisor-agent/", {
      professor_content: professorContent,
      study_duration: duration,
    });

    setStep(3);
    await handleCallAgent("librarian", "/librarian-agent/");

    setStep(4);
    await handleCallAgent("assistant", "/assistant-agent/");

    setStep(0);
  };

  const handleCheckFeasibility = async () => {
    if (!topic) return Toast.warning("Please enter a topic");
    setChecking(true);
    try {
      const res = await apiInstance.post("/check-topic/", { topic });
      Toast.success(`✅ ${res.data?.message || "Topic is feasible"}`);
    } catch (err) {
      Toast.error(err.response?.data?.error || "❌ Topic may be too vague or unsupported");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <BaseHeader />

      <div className="container py-4">
        <h2 className="mb-4 text-center">AI Teaching Team</h2>

        <div className="mb-4 text-center">
          <input
            type="text"
            className="form-control w-50 mx-auto mb-2"
            placeholder="Enter a topic (e.g., Machine Learning)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <select
            className="form-select w-25 mx-auto mb-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="vi">Vietnamese</option>
          </select>

          <select
            className="form-select w-25 mx-auto mb-2"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            {["2 weeks", "4 weeks", "6 weeks", "8 weeks", "10 weeks", "12 weeks"].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <button
            className="btn btn-outline-info mt-2"
            onClick={handleCheckFeasibility}
            disabled={checking}
          >
            {checking ? "Checking..." : "🔍 Check Topic Feasibility"}
          </button>
        </div>

        <div className="row">
          {agents.map((agent, index) => (
            <div key={index} className="col-md-6 mb-4">
              <div className="card h-100 shadow rounded-3 p-3">
                <h4 className="mb-2">
                  <span className="me-2">{agent.icon}</span> {agent.title}
                </h4>
                <p className="text-muted small mb-3">{agent.description}</p>

                {agent.type === "advisor" && (
                  <>
                    <select
                      className="form-select mb-2"
                      value={selectedProfessorDoc?.id || ""}
                      onChange={(e) => {
                        const selected = professorDocs.find((doc) => doc.id === Number(e.target.value));
                        setSelectedProfessorDoc(selected || null);
                      }}
                    >
                      <option value="">-- Select Professor Document --</option>
                      {professorDocs.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.topic} - {new Date(doc.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    {manualProfessorLinks.map((link, idx) => (
                      <input
                        key={idx}
                        type="text"
                        className={`form-control mb-2 ${link && !isValidUrl(link) ? "is-invalid" : ""}`}
                        placeholder={`Additional link #${idx + 1}`}
                        value={link}
                        onChange={(e) => handleLinkChange(idx, e.target.value)}
                      />
                    ))}

                    {manualProfessorLinks.length < 5 && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm mb-2"
                        onClick={addManualLink}
                      >
                        ➕ Add another link
                      </button>
                    )}
                  </>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const extraData = agent.type === "advisor" ? getAdvisorExtraData() : {};
                    handleCallAgent(agent.type, agent.endpoint, extraData);
                  }}
                  disabled={loading[agent.type]}
                >
                  {loading[agent.type] ? "Generating..." : `Run ${agent.title}`}
                </button>

                {docUrls[agent.type] && (
                  <div className="mt-3">
                    <a
                      href={docUrls[agent.type]}
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
          <button className="btn btn-success me-3" onClick={handleRunAll}>
            🚀 Run All Agents
            {step > 0 && <span className="ms-2">(Step {step}/4)</span>}
          </button>

          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/student/ai-document-list/")}
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
