import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  X,
  Vote,
  Pencil,
  Trash2,
  RefreshCw,
  Mail,
  FileText,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";

const API_BASE = "http://localhost:3000/api";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);

  const [selectedElection, setSelectedElection] = useState("");
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const [voteCounts, setVoteCounts] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // FETCH ELECTIONS
  // =========================================================

  const fetchElections = async () => {
    try {
      setLoadingElections(true);

      const response = await fetch(`${API_BASE}/elections`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch elections"
        );
      }

      const electionList = data.elections || [];

      setElections(electionList);

      // Select active election first
      const activeElection = electionList.find(
        (election) => election.status === "active"
      );

      if (activeElection) {
        setSelectedElection(activeElection.electionId);
      } else if (electionList.length > 0) {
        setSelectedElection(electionList[0].electionId);
      }
    } catch (err) {
      console.error("Fetch elections error:", err);
      setError(
        err.message || "Unable to load elections"
      );
    } finally {
      setLoadingElections(false);
    }
  };

  // =========================================================
  // FETCH ALL CANDIDATES
  // =========================================================

  const fetchCandidates = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/candidates`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch candidates"
        );
      }

      setCandidates(data.candidates || []);
    } catch (err) {
      console.error("Fetch candidates error:", err);

      setError(
        err.message || "Unable to load candidates"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH VOTES FOR SELECTED ELECTION
  // =========================================================

  const fetchVoteCounts = async (electionId) => {
    if (!electionId) {
      setVoteCounts({});
      return;
    }

    try {
      setLoadingVotes(true);

      const response = await fetch(
        `${API_BASE}/votes/election/${encodeURIComponent(
          electionId
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch votes"
        );
      }

      const counts = {};

      (data.votes || []).forEach((vote) => {
        const candidateId = vote.candidateId;

        if (!candidateId) {
          return;
        }

        counts[candidateId] =
          (counts[candidateId] || 0) + 1;
      });

      setVoteCounts(counts);
    } catch (err) {
      console.error("Fetch vote counts error:", err);
      setVoteCounts({});
    } finally {
      setLoadingVotes(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchCandidates();
    fetchElections();
  }, []);

  // =========================================================
  // LOAD VOTES WHEN ELECTION CHANGES
  // =========================================================

  useEffect(() => {
    fetchVoteCounts(selectedElection);
  }, [selectedElection]);

  // =========================================================
  // SELECTED ELECTION
  // =========================================================

  const currentElection = useMemo(() => {
    return elections.find(
      (election) =>
        election.electionId === selectedElection
    );
  }, [elections, selectedElection]);

  // =========================================================
  // FILTER CANDIDATES
  // =========================================================

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      // First filter by selected election
      if (
        selectedElection &&
        candidate.electionId !== selectedElection
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        candidate.candidateId,
        candidate.name,
        candidate.email,
        candidate.symbol,
        candidate.manifesto,
        candidate.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    candidates,
    selectedElection,
    search,
  ]);

  // =========================================================
  // CANDIDATE ID GENERATOR
  // =========================================================

  const generateCandidateId = () => {
    let maxNumber = 0;

    candidates.forEach((candidate) => {
      const match = String(
        candidate.candidateId || ""
      ).match(/^C(\d+)$/i);

      if (match) {
        const number = Number(match[1]);

        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    return `C${String(maxNumber + 1).padStart(
      3,
      "0"
    )}`;
  };

  // =========================================================
  // ADD CANDIDATE
  // =========================================================

  const addCandidate = async (event) => {
    event.preventDefault();

    if (!selectedElection) {
      setError("Please select an election first.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData(
        event.currentTarget
      );

      const candidateData = {
        candidateId: generateCandidateId(),
        electionId: selectedElection,
        name: formData.get("name").trim(),
        email:
          formData.get("email")?.trim() || null,
        symbol:
          formData.get("symbol")?.trim() || null,
        manifesto:
          formData.get("manifesto")?.trim() || null,
      };

      const response = await fetch(
        `${API_BASE}/candidates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(candidateData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to add candidate"
        );
      }

      setSuccess(
        "Candidate added successfully."
      );

      setShowAdd(false);

      event.currentTarget.reset();

      await fetchCandidates();
    } catch (err) {
      console.error("Add candidate error:", err);

      setError(
        err.message || "Unable to add candidate"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenMenu(null);

    setError("");
    setSuccess("");

    setShowEdit(true);
  };

  // =========================================================
  // UPDATE CANDIDATE
  // =========================================================

  const updateCandidate = async (event) => {
    event.preventDefault();

    if (!selectedCandidate?.candidateId) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData(
        event.currentTarget
      );

      const candidateData = {
        name: formData.get("name").trim(),
        email:
          formData.get("email")?.trim() || null,
        symbol:
          formData.get("symbol")?.trim() || null,
        manifesto:
          formData.get("manifesto")?.trim() || null,
        status: formData.get("status"),
      };

      const response = await fetch(
        `${API_BASE}/candidates/${encodeURIComponent(
          selectedCandidate.candidateId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(candidateData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update candidate"
        );
      }

      setSuccess(
        "Candidate updated successfully."
      );

      setShowEdit(false);
      setSelectedCandidate(null);

      await fetchCandidates();
    } catch (err) {
      console.error(
        "Update candidate error:",
        err
      );

      setError(
        err.message ||
          "Unable to update candidate"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE CANDIDATE
  // =========================================================

  const deleteCandidate = async (candidateId) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete candidate ${candidateId}?`
    );

    if (!confirmed) {
      return;
    }

    setOpenMenu(null);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE}/candidates/${encodeURIComponent(
          candidateId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete candidate"
        );
      }

      setSuccess(
        "Candidate deleted successfully."
      );

      await fetchCandidates();
    } catch (err) {
      console.error(
        "Delete candidate error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete candidate"
      );
    }
  };

  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-heading">
        <div>
          <h1>Candidates</h1>

          <p>
            Add and manage candidates for each election.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            clearMessages();
            setShowAdd(true);
          }}
          disabled={!selectedElection}
        >
          <Plus size={18} />
          Add Candidate
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="info-box"
          style={{
            marginBottom: "18px",
            borderColor: "#ef4444",
          }}
        >
          <span>{error}</span>

          <button
            className="icon-btn"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div
          className="info-box"
          style={{
            marginBottom: "18px",
            borderColor: "#22c55e",
          }}
        >
          <span>{success}</span>

          <button
            className="icon-btn"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* FILTER ROW */}
      <div className="filter-row">
        <div className="search-box">
          <Search size={17} />

          <input
            placeholder="Search candidates..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="filter-pill"
          value={selectedElection}
          onChange={(event) =>
            setSelectedElection(
              event.target.value
            )
          }
          disabled={loadingElections}
        >
          <option value="">
            Select Election
          </option>

          {elections.map((election) => (
            <option
              key={election.electionId}
              value={election.electionId}
            >
              {election.title} ({election.status})
            </option>
          ))}
        </select>

        <button
          className="icon-btn"
          title="Refresh candidates"
          onClick={() => {
            clearMessages();
            fetchCandidates();
            fetchVoteCounts(
              selectedElection
            );
          }}
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* SELECTED ELECTION INFO */}
      {currentElection && (
        <div
          style={{
            marginBottom: "18px",
            color: "#667085",
            fontSize: "13px",
          }}
        >
          <strong>
            {currentElection.title}
          </strong>

          {" • "}

          {filteredCandidates.length} candidate
          {filteredCandidates.length !== 1
            ? "s"
            : ""}
        </div>
      )}

      {/* CANDIDATE GRID */}
      {loading ? (
        <div
          className="panel"
          style={{
            padding: "50px",
            textAlign: "center",
          }}
        >
          Loading candidates...
        </div>
      ) : !selectedElection ? (
        <div
          className="panel"
          style={{
            padding: "50px",
            textAlign: "center",
          }}
        >
          <Vote
            size={38}
            style={{
              opacity: 0.45,
              marginBottom: "10px",
            }}
          />

          <h3>Select an election</h3>

          <p>
            Select an election above to view its
            candidates.
          </p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: "50px",
            textAlign: "center",
          }}
        >
          <Vote
            size={38}
            style={{
              opacity: 0.45,
              marginBottom: "10px",
            }}
          />

          <h3>No candidates found</h3>

          <p>
            {search
              ? "No candidates match your search."
              : "No candidates have been added to this election yet."}
          </p>
        </div>
      ) : (
        <div className="candidate-grid">
          {filteredCandidates.map(
            (candidate) => {
              const votes =
                voteCounts[
                  candidate.candidateId
                ] || 0;

              return (
                <div
                  className="candidate-card"
                  key={candidate.candidateId}
                >
                  {/* TOP */}
                  <div className="candidate-top">
                    <div className="candidate-symbol-big">
                      {candidate.symbol || "?"}
                    </div>

                    <button
                      className="icon-btn"
                      onClick={() =>
                        setOpenMenu(
                          openMenu ===
                            candidate.candidateId
                            ? null
                            : candidate.candidateId
                        )
                      }
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenu ===
                      candidate.candidateId && (
                      <div
                        className="action-menu"
                        style={{
                          position:
                            "absolute",
                          right: "0",
                          top: "42px",
                          zIndex: 20,
                          minWidth: "150px",
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e5e7eb",
                          borderRadius:
                            "10px",
                          boxShadow:
                            "0 10px 25px rgba(0,0,0,0.12)",
                          padding: "6px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              candidate
                            )
                          }
                          style={{
                            width: "100%",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            padding:
                              "9px 10px",
                            border:
                              "none",
                            background:
                              "transparent",
                            cursor:
                              "pointer",
                            borderRadius:
                              "7px",
                          }}
                        >
                          <Pencil
                            size={15}
                          />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteCandidate(
                              candidate.candidateId
                            )
                          }
                          style={{
                            width: "100%",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            padding:
                              "9px 10px",
                            border:
                              "none",
                            background:
                              "transparent",
                            color:
                              "#dc2626",
                            cursor:
                              "pointer",
                            borderRadius:
                              "7px",
                          }}
                        >
                          <Trash2
                            size={15}
                          />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* NAME */}
                  <h2>
                    {candidate.name}
                  </h2>

                  {/* STATUS */}
                  <div
                    style={{
                      marginTop: "5px",
                    }}
                  >
                    <StatusBadge
                      status={
                        candidate.status ||
                        "active"
                      }
                    />
                  </div>

                  {/* EMAIL */}
                  {candidate.email && (
                    <div
                      className="candidate-election"
                      style={{
                        marginTop: "12px",
                      }}
                    >
                      <Mail size={14} />
                      {candidate.email}
                    </div>
                  )}

                  {/* ELECTION */}
                  <div className="candidate-election">
                    <Vote size={14} />

                    {currentElection?.title ||
                      candidate.electionId}
                  </div>

                  {/* MANIFESTO */}
                  {candidate.manifesto && (
                    <div
                      className="candidate-election"
                      title={
                        candidate.manifesto
                      }
                    >
                      <FileText size={14} />

                      <span
                        style={{
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {candidate.manifesto}
                      </span>
                    </div>
                  )}

                  {/* BOTTOM */}
                  <div className="candidate-bottom">
                    <span>
                      {loadingVotes
                        ? "..."
                        : `${votes} vote${
                            votes !== 1
                              ? "s"
                              : ""
                          }`}
                    </span>

                    <button
                      className="text-btn"
                      onClick={() =>
                        openEditModal(
                          candidate
                        )
                      }
                    >
                      Edit →
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* =====================================================
          ADD CANDIDATE MODAL
          ===================================================== */}

      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Add Candidate</h2>

                <p>
                  Add a candidate to the selected
                  election.
                </p>
              </div>

              <button
                className="icon-btn"
                onClick={() =>
                  setShowAdd(false)
                }
              >
                <X />
              </button>
            </div>

            <form onSubmit={addCandidate}>
              <div className="form-grid">
                <label>
                  Candidate name

                  <input
                    name="name"
                    required
                    placeholder="Enter candidate name"
                  />
                </label>

                <label>
                  Email

                  <input
                    name="email"
                    type="email"
                    placeholder="candidate@example.com"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Symbol

                  <input
                    name="symbol"
                    placeholder="🌳"
                    maxLength="4"
                  />
                </label>

                <label>
                  Election

                  <input
                    value={
                      currentElection?.title ||
                      ""
                    }
                    disabled
                  />
                </label>
              </div>

              <label>
                Manifesto

                <textarea
                  name="manifesto"
                  placeholder="Enter candidate manifesto..."
                  rows="4"
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    marginTop: "7px",
                    padding:
                      "12px 13px",
                    border:
                      "1px solid #d9dee8",
                    borderRadius:
                      "9px",
                    resize:
                      "vertical",
                    fontFamily:
                      "inherit",
                    fontSize:
                      "13px",
                    outline:
                      "none",
                  }}
                />
              </label>

              <div
                className="info-box"
                style={{
                  marginTop: "16px",
                }}
              >
                <Vote size={18} />

                <span>
                  Candidate ID will be generated
                  automatically and the candidate
                  will be registered under the
                  selected election.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setShowAdd(false)
                  }
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  <Plus size={17} />

                  {submitting
                    ? "Adding..."
                    : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT CANDIDATE MODAL
          ===================================================== */}

      {showEdit && selectedCandidate && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Edit Candidate</h2>

                <p>
                  Update candidate information and
                  status.
                </p>
              </div>

              <button
                className="icon-btn"
                onClick={() => {
                  setShowEdit(false);
                  setSelectedCandidate(null);
                }}
              >
                <X />
              </button>
            </div>

            <form onSubmit={updateCandidate}>
              <div className="form-grid">
                <label>
                  Candidate ID

                  <input
                    value={
                      selectedCandidate.candidateId ||
                      ""
                    }
                    disabled
                  />
                </label>

                <label>
                  Candidate name

                  <input
                    name="name"
                    required
                    defaultValue={
                      selectedCandidate.name ||
                      ""
                    }
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Email

                  <input
                    name="email"
                    type="email"
                    defaultValue={
                      selectedCandidate.email ||
                      ""
                    }
                  />
                </label>

                <label>
                  Symbol

                  <input
                    name="symbol"
                    maxLength="4"
                    defaultValue={
                      selectedCandidate.symbol ||
                      ""
                    }
                  />
                </label>
              </div>

              <label>
                Manifesto

                <textarea
                  name="manifesto"
                  rows="4"
                  defaultValue={
                    selectedCandidate.manifesto ||
                    ""
                  }
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    marginTop: "7px",
                    padding:
                      "12px 13px",
                    border:
                      "1px solid #d9dee8",
                    borderRadius:
                      "9px",
                    resize:
                      "vertical",
                    fontFamily:
                      "inherit",
                    fontSize:
                      "13px",
                    outline:
                      "none",
                  }}
                />
              </label>

              <div className="form-grid">
                <label>
                  Status

                  <select
                    name="status"
                    defaultValue={
                      selectedCandidate.status ||
                      "active"
                    }
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </label>

                <label>
                  Election

                  <input
                    value={
                      selectedCandidate.electionId ||
                      ""
                    }
                    disabled
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setShowEdit(false);
                    setSelectedCandidate(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  <Pencil size={17} />

                  {submitting
                    ? "Updating..."
                    : "Update Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}