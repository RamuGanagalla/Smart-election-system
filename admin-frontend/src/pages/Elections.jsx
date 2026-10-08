import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

const API = "http://localhost:3000/api";

export default function Elections() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [editElection, setEditElection] = useState(null);

  const [totalVoters, setTotalVoters] = useState(0);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // =====================================================
  // FETCH ALL ELECTION DATA
  // =====================================================

  const fetchElections = async () => {
    try {
      setLoading(true);
      setError("");

      // -----------------------------------------------
      // Get elections
      // -----------------------------------------------

      const electionsResponse = await fetch(
        `${API}/elections`
      );

      const electionsData =
        await electionsResponse.json();

      if (!electionsResponse.ok) {
        throw new Error(
          electionsData.message ||
          "Failed to fetch elections"
        );
      }

      const electionList =
        electionsData.elections || [];

      // -----------------------------------------------
      // Get registered voters
      // -----------------------------------------------

      const votersResponse = await fetch(
        `${API}/voters`
      );

      const votersData =
        await votersResponse.json();

      if (!votersResponse.ok) {
        throw new Error(
          votersData.message ||
          "Failed to fetch voters"
        );
      }

      const voterCount =
        votersData.count ??
        votersData.voters?.length ??
        0;

      setTotalVoters(voterCount);

      // -----------------------------------------------
      // Get votes for every election
      // -----------------------------------------------

      const formattedElections =
        await Promise.all(
          electionList.map(
            async (election) => {
              let voteCount = 0;
              const electionVoters =
                (votersData.voters || []).filter(
                  (voter) =>
                    voter.statuses?.some(
                      (status) =>
                        status.electionId ===
                        election.electionId
                    )
                );

              const electionVoterCount =
                electionVoters.length;

              try {
                const votesResponse =
                  await fetch(
                    `${API}/votes/election/${election.electionId}`
                  );

                if (votesResponse.ok) {
                  const votesData =
                    await votesResponse.json();

                  voteCount =
                    votesData.count ??
                    votesData.votes?.length ??
                    0;
                }
              } catch (error) {
                console.error(
                  `Unable to fetch votes for ${election.electionId}`,
                  error
                );
              }

              const turnout =
                electionVoterCount > 0
                  ? (
                    (voteCount /
                      electionVoterCount) *
                    100
                  ).toFixed(2)
                  : "0.00";

              return {
                id: election.electionId,

                name: election.title,

                description:
                  election.description || "",

                startDate:
                  election.startDate,

                endDate:
                  election.endDate,

                createdAt:
                  election.createdAt,

                date: `${new Date(election.startDate).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })} – ${new Date(election.endDate).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}`,

                status:
                  election.status
                    ?.charAt(0)
                    .toUpperCase() +
                  election.status
                    ?.slice(1)
                    .toLowerCase(),

                // REAL DATABASE VALUES
                voters: electionVoterCount,
                votes: voteCount,
                turnout,
              };
            }
          )
        );

      setItems(formattedElections);
    } catch (err) {
      console.error(
        "Election loading error:",
        err
      );

      setError(
        err.message ||
        "Unable to load elections"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // =====================================================
  // GENERATE ELECTION ID
  // =====================================================

  const generateElectionId = () => {
    let maxNumber = 0;

    items.forEach((election) => {
      const match =
        election.id?.match(
          /EL-\d{4}-(\d+)/
        );

      if (match) {
        const number = parseInt(
          match[1],
          10
        );

        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    return `EL-${new Date().getFullYear()}-${String(
      maxNumber + 1
    ).padStart(3, "0")}`;
  };

  // =====================================================
  // CREATE ELECTION
  // =====================================================

  const addElection = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      if (
        new Date(form.startDate) >
        new Date(form.endDate)
      ) {
        setError(
          "End date must be after start date."
        );
        return;
      }

      const electionId =
        generateElectionId();

      const response = await fetch(
        `${API}/elections`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            electionId,
            title: form.title.trim(),
            description:
              form.description.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to create election"
        );
      }

      setShow(false);

      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
      });

      await fetchElections();

      alert(
        "Election created successfully!"
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to create election"
      );
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // ACTIVATE ELECTION
  // =====================================================

  const activateElection = async (
    electionId
  ) => {
    try {
      const response = await fetch(
        `${API}/elections/${electionId}/activate`,
        {
          method: "PUT",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Unable to activate election"
        );
        return;
      }

      setActiveMenu(null);

      await fetchElections();

      alert(
        "Election activated successfully!"
      );
    } catch (error) {
      console.error(
        "Activate election error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    }
  };

  // =====================================================
  // COMPLETE ELECTION
  // =====================================================

  const completeElection = async (
    electionId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to complete this election?\n\nOnce completed, it cannot be activated again."
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/elections/${electionId}/complete`,
        {
          method: "PUT",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Unable to complete election"
        );
        return;
      }

      setActiveMenu(null);

      await fetchElections();

      alert(
        "Election completed successfully!"
      );
    } catch (error) {
      console.error(
        "Complete election error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    }
  };

  // =====================================================
  // DELETE ELECTION
  // =====================================================

  const deleteElection = async (
    electionId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this election?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/elections/${electionId}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Unable to delete election"
        );
        return;
      }

      setActiveMenu(null);

      await fetchElections();

      alert(
        "Election deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete election error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    }
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEdit = (election) => {
    setEditElection(election);

    setForm({
      title: election.name,
      description:
        election.description || "",

      startDate: election.startDate
        ? new Date(
          election.startDate
        )
          .toISOString()
          .slice(0, 16)
        : "",

      endDate: election.endDate
        ? new Date(
          election.endDate
        )
          .toISOString()
          .slice(0, 16)
        : "",
    });

    setActiveMenu(null);
  };

  // =====================================================
  // UPDATE ELECTION
  // =====================================================

  const updateElection = async (e) => {
    e.preventDefault();

    if (!editElection) {
      return;
    }

    try {
      setEditing(true);
      setError("");

      if (
        new Date(form.startDate) >
        new Date(form.endDate)
      ) {
        setError(
          "End date must be after start date."
        );
        return;
      }

      const response = await fetch(
        `${API}/elections/${editElection.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description:
              form.description.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Unable to update election"
        );
        return;
      }

      setEditElection(null);

      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
      });

      await fetchElections();

      alert(
        "Election updated successfully!"
      );
    } catch (error) {
      console.error(
        "Update election error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    } finally {
      setEditing(false);
    }
  };

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredItems = items.filter(
    (election) => {
      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        election.name
          .toLowerCase()
          .includes(searchValue) ||
        election.id
          .toLowerCase()
          .includes(searchValue);

      const matchesFilter =
        filter === "All" ||
        election.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    }
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="page">

      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>Elections</h1>

          <p>
            Create and manage all your
            elections from one place.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            setShow(true);
            setError("");
          }}
        >
          <Plus size={18} />
          Create Election
        </button>
      </div>

      {/* SEARCH / FILTER */}

      <div className="toolbar">

        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search elections..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className="filter-select"
        >
          <option value="All">
            All elections
          </option>

          <option value="Upcoming">
            Upcoming
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="Cancelled">
            Cancelled
          </option>
        </select>

      </div>

      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* CONTENT */}

      {loading ? (

        <div className="empty-state">
          Loading elections...
        </div>

      ) : filteredItems.length === 0 ? (

        <div className="empty-state">
          <h3>No elections found</h3>

          <p>
            Create an election or
            change your search/filter.
          </p>
        </div>

      ) : (

        <div className="election-grid">

          {filteredItems.map(
            (election) => (

              <div
                className="election-card"
                key={election.id}
              >

                {/* TOP */}

                <div className="election-card-top">

                  <div className="election-icon">
                    <CheckCircle2
                      size={22}
                    />
                  </div>

                  <div className="election-actions">

                    <StatusBadge
                      status={
                        election.status
                      }
                    />

                    <button
                      className="icon-btn"
                      onClick={() =>
                        setActiveMenu(
                          activeMenu ===
                            election.id
                            ? null
                            : election.id
                        )
                      }
                    >
                      <MoreVertical
                        size={20}
                      />
                    </button>

                    {/* ACTION MENU */}

                    {activeMenu ===
                      election.id && (
                        <div className="action-menu">

                          {/* UPCOMING → ACTIVATE */}

                          {election.status ===
                            "Upcoming" && (
                              <button
                                onClick={() =>
                                  activateElection(
                                    election.id
                                  )
                                }
                              >
                                <Play
                                  size={17}
                                />
                                Activate Election
                              </button>
                            )}

                          {/* ACTIVE → COMPLETE */}

                          {election.status ===
                            "Active" && (
                              <button
                                onClick={() =>
                                  completeElection(
                                    election.id
                                  )
                                }
                              >
                                <CheckCircle2
                                  size={17}
                                />
                                Complete Election
                              </button>
                            )}

                          {/* VIEW DETAILS */}

                          <button
                            onClick={() => {
                              setActiveMenu(
                                null
                              );

                              alert(
                                `Election: ${election.name}\n\nID: ${election.id}\nStatus: ${election.status}\nRegistered voters: ${election.voters}\nVotes cast: ${election.votes}\nTurnout: ${election.turnout}%`
                              );
                            }}
                          >
                            <Eye size={17} />
                            View Details
                          </button>

                          {/* EDIT */}

                          {election.status !==
                            "Completed" && (
                              <button
                                onClick={() =>
                                  openEdit(
                                    election
                                  )
                                }
                              >
                                <Pencil
                                  size={17}
                                />
                                Edit Election
                              </button>
                            )}

                          {/* RESULTS */}

                          {election.status ===
                            "Completed" && (
                              <button
                                onClick={() => {
                                  setActiveMenu(
                                    null
                                  );

                                  navigate(
                                    "/reports"
                                  );
                                }}
                              >
                                <BarChart3
                                  size={17}
                                />
                                View Results
                              </button>
                            )}

                          {/* DELETE */}

                          <button
                            className="danger"
                            onClick={() =>
                              deleteElection(
                                election.id
                              )
                            }
                          >
                            <Trash2
                              size={17}
                            />
                            Delete Election
                          </button>

                        </div>
                      )}

                  </div>
                </div>

                {/* ELECTION INFO */}

                <div className="election-info">

                  <h2>
                    {election.name}
                  </h2>

                  <span className="election-id">
                    {election.id}
                  </span>

                  <div className="election-meta">

                    <span>
                      <CalendarDays
                        size={15}
                      />

                      {election.date}
                    </span>

                    <span>
                      <Users size={15} />

                      {election.voters}{" "}
                      registered voters
                    </span>

                  </div>

                </div>

                {/* TURNOUT */}

                <div className="turnout">

                  <div className="turnout-header">

                    <span>
                      Turnout
                    </span>

                    <strong>
                      {election.turnout}%
                    </strong>

                  </div>

                  <div className="progress-bar">

                    <div
                      style={{
                        width: `${Math.min(
                          Number(
                            election.turnout
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                {/* FOOTER */}

                <div className="election-footer">

                  <span>
                    {election.votes}{" "}
                    votes cast
                  </span>

                  <button
                    className="manage-btn"
                    onClick={() =>
                      navigate(
                        "/reports"
                      )
                    }
                  >
                    Manage →
                  </button>

                </div>

              </div>
            )
          )}

        </div>
      )}

      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {show && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShow(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  Create Election
                </h2>

                <p>
                  Create a new election
                  for your voters.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShow(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={addElection}
            >

              <div className="form-group">

                <label>
                  Election Title
                </label>

                <input
                  type="text"
                  name="title"
                  placeholder="College Student Council Election 2026"
                  value={form.title}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  placeholder="Enter election description"
                  value={
                    form.description
                  }
                  onChange={handleChange}
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Start Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    End Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    name="endDate"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setShow(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Election"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {editElection && (
        <div
          className="modal-overlay"
          onClick={() =>
            setEditElection(null)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  Edit Election
                </h2>

                <p>
                  Update election
                  information.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setEditElection(null)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={updateElection}
            >

              <div className="form-group">

                <label>
                  Election Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={handleChange}
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Start Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    End Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    name="endDate"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setEditElection(
                      null
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={editing}
                >
                  {editing
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}