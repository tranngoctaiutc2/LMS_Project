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
    description: "Creates or updates a knowledge base with structured explanations in a Google Doc.",
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
    endpoint: "/research-librarian-agent/",
    description: "Collects high-quality reference materials, categorized by difficulty level and reliability, in a detailed document.",
  },
  {
    icon: "✍️",
    title: "Teaching Assistant Agent",
    type: "assistant",
    endpoint: "/teaching-assistant-agent/",
    description: "Creates exercises with guided solutions to reinforce key concepts covered in the topic.",
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
        ...(agent.type === "advisor" ? { duration: "4 weeks" } : {}),
      },
    }), {})
  );
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState(0);
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
      updateAgentState(agentType, { docUrl: res.data.doc_url });
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

  const handleRunAll = async () => {
    if (!globalTopic && !agents.some(agent => agentStates[agent.type].selectedProfessorDoc)) {
      return Toast.warning("Please enter a global topic or select a professor document for at least one agent");
    }
    setIsRunningGlobal(true);
    setStep(1);

    for (const agent of agents) {
      await handleCallAgent(agent.type, agent.endpoint);
      setStep((prev) => prev + 1);
    }
    setStep(0);
    setIsRunningGlobal(false);
  };

  const handleCheckFeasibility = async () => {
    if (!globalTopic) return Toast.warning("Please enter a topic");
    setChecking(true);
    try {
      const res = await apiInstance.post("/check-topic/", { topic: globalTopic });
      Toast.success(`✅ ${res.data?.message || "Topic is feasible"}`);
    } catch (err) {
      Toast.error(err.response?.data?.error || "❌ Topic may be too vague or unsupported");
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


  const handleProfessorDocChange = (agentType, selectedDocId) => {
    if (globalTopic.trim()) {
      Toast.warning("You cannot select a professor document when a global topic is entered.");
      return;
    }

    const selected = professorDocs.find((doc) => doc.id === Number(selectedDocId));
    if (selected && agentType === "advisor") {
      updateAgentState(agentType, {
        selectedProfessorDoc: selected,
        selectedAdvisorDoc: null,
      });
    } else {
      updateAgentState(agentType, { selectedProfessorDoc: selected || null });
    }
  };


  return (
    <>
      <BaseHeader />
      <div className="container py-4">
        <h2 className="mb-4 text-center">AI Teaching Team</h2>

        <div className="mb-4 text-center">
          <h5>Global Settings</h5>
          <input
            type="text"
            className="form-control w-50 mx-auto mb-2"
            placeholder="Enter a global topic (e.g., Machine Learning)"
            value={globalTopic}
            onChange={(e) => setGlobalTopic(e.target.value)}
            disabled={isRunningGlobal}
          />
          <select
            className="form-select w-25 mx-auto mb-2"
            value={globalLanguage}
            onChange={(e) => setGlobalLanguage(e.target.value)}
            disabled={isRunningGlobal}
          >
            <option value="en">English</option>
            <option value="vi">Vietnamese</option>
          </select>
          <button
            className="btn btn-outline-info mt-2"
            onClick={handleCheckFeasibility}
            disabled={checking || isRunningGlobal}
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

                <select
                  className="form-select mb-2"
                  value={agentStates[agent.type].selectedProfessorDoc?.id || ""}
                  onChange={(e) => handleProfessorDocChange(agent.type, e.target.value)}
                  disabled={!!globalTopic || (agent.type === "advisor" && agentStates[agent.type].selectedAdvisorDoc) || isRunningGlobal}
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
                      disabled={!!globalTopic || agentStates[agent.type].selectedProfessorDoc || isRunningGlobal}
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
                      disabled = {isRunningGlobal} 
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
                  disabled={agentStates[agent.type].loading || isRunningGlobal}
                >
                  {agentStates[agent.type].loading ? "Generating..." : `Run ${agent.title}`}
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
          <button className="btn btn-success me-3" onClick={handleRunAll} disabled={isRunningGlobal}>
            🚀 Run All Agents
            {step > 0 && <span className="ms-2">(Step {step}/{agents.length})</span>}
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