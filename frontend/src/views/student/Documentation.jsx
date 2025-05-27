import React, { useEffect, useState } from "react";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";

const AI_TYPE_LABELS = {
  professor: "📘 Professor Agent",
  advisor: "🗺️ Academic Advisor",
  librarian: "📚 Research Librarian",
  assistant: "✍️ Teaching Assistant",
};

const LANGUAGE_LABELS = {
  en: "English",
  vi: "Vietnamese",
};

const getEmbedUrl = (url) => {
  if (url.endsWith(".pdf")) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  if (url.includes("docs.google.com/document")) {
    return url.replace("/edit", "/preview");
  }
  return null;
};

function UserDocuments() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await apiInstance.get("/ai-document-list/", {
        params: { user_id: UserData()?.user_id },
      });
      setDocuments(res.data);
      setFilteredDocs(res.data);
    } catch (error) {
      Toast.error("Failed to fetch your documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    let filtered = documents;

    if (search.trim()) {
      filtered = filtered.filter((d) =>
        d.topic.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((d) => new Date(d.created_at) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter((d) => new Date(d.created_at) <= new Date(dateTo));
    }

    setFilteredDocs(filtered);
  }, [search, dateFrom, dateTo, documents]);

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const group = doc.ai_type || "unknown";
    acc[group] = acc[group] || [];
    acc[group].push(doc);
    return acc;
  }, {});

  return (
    <>
      <BaseHeader />
      <section className="pt-6 pb-6 bg-light min-vh-100">
        <div className="container">
          <Header />
          <div className="row mt-4">
            <Sidebar />
            <div className="col-lg-9 col-md-8 col-12">
              <div className="card shadow-sm border-0 rounded-4 mb-4">
                <div className="card-header bg-white px-4 py-3 rounded-top-4">
                  <h4 className="mb-0">
                    <i className="fas fa-folder-open text-primary me-2"></i> My Documents
                  </h4>
                </div>

                <div className="card-body px-4 py-3">
                  {/* Filters */}
                  <div className="row g-2 mb-3">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by topic..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="date"
                        className="form-control"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="date"
                        className="form-control"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>

                  {loading ? (
                    <p>Loading documents...</p>
                  ) : filteredDocs.length === 0 ? (
                    <p className="text-muted">No documents found.</p>
                  ) : (
                    Object.entries(groupedDocs).map(([type, docs]) => (
                      <div key={type} className="mb-5">
                        <h5 className="fw-bold mb-3 text-primary">
                          {AI_TYPE_LABELS[type] || `🤖 ${type}`}
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead>
                              <tr>
                                <th>Topic</th>
                                <th>Language</th>
                                {type === "advisor" && <th>Study Duration</th>}
                                <th>Created At</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {docs.map((doc) => (
                                <tr key={doc.id}>
                                  <td>{doc.topic}</td>
                                  <td>{LANGUAGE_LABELS[doc.language] || doc.language || "N/A"}</td>
                                  {type === "advisor" && (
                                    <td>{doc.study_duration || "N/A"}</td>
                                  )}
                                  <td>{new Date(doc.created_at).toLocaleString("en-US")}</td>
                                  <td>
                                    <a
                                      href={doc.doc_url}
                                      className="btn btn-sm btn-outline-primary me-2"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Open
                                    </a>
                                    <button
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => setPreviewUrl(doc.doc_url)}
                                    >
                                      Preview
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preview Modal */}
              {previewUrl && (
                <div
                  className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
                  style={{ zIndex: 1050 }}
                >
                  <div
                    className="bg-white rounded-4 shadow-lg p-4 d-flex flex-column"
                    style={{
                      width: "90%",
                      maxWidth: "1000px",
                      maxHeight: "90vh",
                      overflow: "hidden",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0 text-primary">Document Preview</h5>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setPreviewUrl(null)}
                      >
                        Close
                      </button>
                    </div>

                    {getEmbedUrl(previewUrl) ? (
                      <div className="flex-grow-1 overflow-auto">
                        <iframe
                          src={getEmbedUrl(previewUrl)}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "1px solid #ccc",
                            minHeight: "500px",
                          }}
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        Cannot preview this document type.
                      </div>
                    )}

                    <div className="d-flex justify-content-end mt-3">
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary me-2"
                      >
                        Open in New Tab
                      </a>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setPreviewUrl(null)}
                      >
                        Close
                      </button>
                    </div>
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

export default UserDocuments;