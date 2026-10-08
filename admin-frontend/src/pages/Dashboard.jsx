import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Vote,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowUpRight,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [votersCount, setVotersCount] = useState(0);
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [votesCount, setVotesCount] = useState(0);

  const [activeElection, setActiveElection] = useState(null);
  const [activeElectionVotes, setActiveElectionVotes] = useState(0);

  // REAL chart data
  const [candidateVoteData, setCandidateVoteData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const admin = JSON.parse(
    sessionStorage.getItem("admin")
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // =========================================
      // ELECTIONS
      // =========================================

      const electionsResponse = await fetch(
        "http://localhost:3000/api/elections"
      );

      if (!electionsResponse.ok) {
        throw new Error("Unable to fetch elections");
      }

      const electionsData =
        await electionsResponse.json();

      const electionList =
        electionsData.elections || [];

      setElections(electionList);

      // =========================================
      // VOTERS
      // =========================================

      const votersResponse = await fetch(
        "http://localhost:3000/api/voters"
      );

      if (!votersResponse.ok) {
        throw new Error("Unable to fetch voters");
      }

      const votersData =
        await votersResponse.json();

      const allVoters = votersData.voters || [];

      // =========================================
      // CANDIDATES
      // =========================================

      const candidatesResponse = await fetch(
        "http://localhost:3000/api/candidates"
      );

      if (!candidatesResponse.ok) {
        throw new Error(
          "Unable to fetch candidates"
        );
      }

      const candidatesData =
        await candidatesResponse.json();

      const candidateList =
        candidatesData.candidates || [];

      setCandidatesCount(
        candidatesData.count ??
        candidateList.length
      );

      // =========================================
      // FIND ACTIVE ELECTION
      // =========================================

      const active = electionList.find(
        (election) =>
          election.status?.toLowerCase() ===
          "active"
      );
      // =========================================
      // ACTIVE ELECTION VOTERS
      // =========================================

      const activeElectionVoters = active
        ? allVoters.filter((voter) =>
          voter.statuses?.some(
            (status) =>
              status.electionId ===
              active.electionId
          )
        )
        : [];

      setVotersCount(
        activeElectionVoters.length
      );

      setActiveElection(active || null);

      // =========================================
      // ACTIVE ELECTION VOTES
      // =========================================

      let currentActiveVotes = 0;

      if (active?.electionId) {
        try {
          const votesResponse = await fetch(
            `http://localhost:3000/api/votes/election/${active.electionId}`
          );

          if (votesResponse.ok) {
            const votesData =
              await votesResponse.json();

            const votes =
              votesData.votes || [];

            currentActiveVotes =
              votesData.count ??
              votes.length;

            setActiveElectionVotes(
              currentActiveVotes
            );

            // =====================================
            // REAL VOTE DATA FOR CHART
            // =====================================

            const voteCounts = {};

            votes.forEach((vote) => {
              const candidateId =
                String(vote.candidateId);

              voteCounts[candidateId] =
                (voteCounts[candidateId] || 0) +
                1;
            });

            const chartData =
              candidateList
                .filter(
                  (candidate) =>
                    candidate.electionId ===
                    active.electionId
                )
                .map((candidate) => {
                  const candidateId =
                    String(
                      candidate.candidateId ??
                      candidate._id ??
                      candidate.id
                    );

                  return {
                    name:
                      candidate.name ||
                      candidate.candidateName ||
                      "Unknown Candidate",

                    votes:
                      voteCounts[
                      candidateId
                      ] || 0,
                  };
                });

            setCandidateVoteData(
              chartData
            );
          } else {
            setActiveElectionVotes(0);
            setCandidateVoteData([]);
          }
        } catch (error) {
          console.error(
            "Unable to fetch active election votes:",
            error
          );

          setActiveElectionVotes(0);
          setCandidateVoteData([]);
        }
      } else {
        setActiveElectionVotes(0);
        setCandidateVoteData([]);
      }

      // =========================================
      // TOTAL VOTES FROM ALL ELECTIONS
      // =========================================

      let totalVotes = 0;

      for (const election of electionList) {
        if (!election.electionId) continue;

        try {
          const response = await fetch(
            `http://localhost:3000/api/votes/election/${election.electionId}`
          );

          if (!response.ok) continue;

          const data =
            await response.json();

          totalVotes +=
            data.count ??
            data.votes?.length ??
            0;
        } catch (error) {
          console.error(
            `Unable to load votes for ${election.electionId}`,
            error
          );
        }
      }

      setVotesCount(totalVotes);
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        "Unable to load dashboard data. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // TURNOUT
  // =========================================

  const currentTurnout =
    votersCount > 0
      ? (
        (activeElectionVotes /
          votersCount) *
        100
      ).toFixed(2)
      : "0.00";

  // =========================================
  // RECENT ELECTIONS
  // =========================================

  const recentElections = [...elections]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt || b.startDate
        ) -
        new Date(
          a.createdAt || a.startDate
        )
    )
    .slice(0, 5);

  // =========================================
  // STATUS
  // =========================================

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1).toLowerCase()
    );
  };

  // =========================================
  // DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================
  // MAXIMUM BAR HEIGHT
  // =========================================

  const maxCandidateVotes =
    candidateVoteData.length > 0
      ? Math.max(
        ...candidateVoteData.map(
          (candidate) =>
            candidate.votes
        )
      )
      : 0;

  return (
    <>
      {/* ERROR */}
      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#be123c",
            borderRadius: "10px",
          }}
        >
          {error}
        </div>
      )}

      {/* WELCOME */}
      <section className="welcome-row">
        <div>
          <h1>
            Good evening,{" "}
            {admin?.name || "Administrator"} 👋
          </h1>

          <p>
            Here's what's happening across your
            election system today.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() =>
            navigate("/elections")
          }
        >
          <Plus size={18} />
          Create Election
        </button>
      </section>

      {/* STAT CARDS */}
      <div className="stats-grid">

        <StatCard
          title="Total Elections"
          value={
            loading
              ? "..."
              : elections.length
          }
          change="Live from database"
          icon={Vote}
          tone="blue"
        />

        <StatCard
          title="Registered Voters"
          value={
            loading
              ? "..."
              : votersCount
          }
          change="Live from database"
          icon={Users}
          tone="purple"
        />

        <StatCard
          title="Votes Cast"
          value={
            loading
              ? "..."
              : votesCount
          }
          change="Live from database"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          title="Current Turnout"
          value={`${currentTurnout}%`}
          change={
            activeElection
              ? "Active election"
              : "No active election"
          }
          icon={TrendingUp}
          tone="orange"
        />

      </div>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">

        {/* ACTIVE ELECTION */}
        <section className="panel election-panel">

          <div className="panel-header">
            <div>
              <h3>Active Election</h3>
              <p>
                Live election overview
              </p>
            </div>

            <StatusBadge
              status={
                activeElection
                  ? "Active"
                  : "Upcoming"
              }
            />
          </div>

          {activeElection ? (
            <div className="active-election">

              <div className="election-title-row">

                <div className="election-symbol">
                  <Vote size={23} />
                </div>

                <div>
                  <h2>
                    {activeElection.title}
                  </h2>

                  <span>
                    {
                      activeElection.electionId
                    }
                  </span>
                </div>

              </div>

              <div className="progress-info">
                <span>
                  Voting turnout
                </span>

                <strong>
                  {currentTurnout}%
                </strong>
              </div>

              <div className="progress-bar">
                <div
                  style={{
                    width: `${Math.min(
                      Number(currentTurnout),
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="mini-stats">

                <div>
                  <span>
                    Total voters
                  </span>

                  <strong>
                    {votersCount}
                  </strong>
                </div>

                <div>
                  <span>
                    Votes cast
                  </span>

                  <strong>
                    {activeElectionVotes}
                  </strong>
                </div>

                <div>
                  <span>
                    Remaining
                  </span>

                  <strong>
                    {Math.max(
                      votersCount -
                      activeElectionVotes,
                      0
                    )}
                  </strong>
                </div>

              </div>

              <button
                className="secondary-btn full"
                onClick={() =>
                  navigate("/reports")
                }
              >
                View Live Report
                <ArrowUpRight
                  size={17}
                />
              </button>

            </div>
          ) : (

            <div className="active-election">

              <div className="election-title-row">

                <div className="election-symbol">
                  <Vote size={23} />
                </div>

                <div>
                  <h2>
                    No Active Election
                  </h2>

                  <span>
                    Create or activate an
                    election to begin
                  </span>
                </div>

              </div>

              <button
                className="secondary-btn full"
                onClick={() =>
                  navigate("/elections")
                }
              >
                Manage Elections
                <ArrowUpRight
                  size={17}
                />
              </button>

            </div>
          )}

        </section>

        {/* REAL ELECTION ACTIVITY */}
        <section className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Election Activity
              </h3>

              <p>
                Votes by candidate
              </p>
            </div>

            <button
              className="icon-btn"
              onClick={fetchDashboardData}
              title="Refresh dashboard"
            >
              <RefreshCw size={18} />
            </button>

          </div>

          {loading ? (

            <div
              style={{
                minHeight: "250px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              Loading voting activity...
            </div>

          ) : !activeElection ? (

            <div
              style={{
                minHeight: "250px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No active election.
            </div>

          ) : candidateVoteData.length === 0 ? (

            <div
              style={{
                minHeight: "250px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No candidates registered
              for this election.
            </div>

          ) : (

            <div
              style={{
                minHeight: "250px",
                display: "flex",
                alignItems: "flex-end",
                gap: "22px",
                padding:
                  "30px 20px 10px",
                overflowX: "auto",
              }}
            >

              {candidateVoteData.map(
                (candidate) => {

                  const barHeight =
                    maxCandidateVotes > 0
                      ? Math.max(
                        (candidate.votes /
                          maxCandidateVotes) *
                        180,
                        candidate.votes > 0
                          ? 12
                          : 4
                      )
                      : 4;

                  return (
                    <div
                      key={candidate.name}
                      style={{
                        minWidth: "70px",
                        height: "220px",
                        display: "flex",
                        flexDirection:
                          "column",
                        alignItems:
                          "center",
                        justifyContent:
                          "flex-end",
                      }}
                    >

                      <strong
                        style={{
                          marginBottom:
                            "8px",
                          fontSize:
                            "14px",
                        }}
                      >
                        {candidate.votes}
                      </strong>

                      <div
                        style={{
                          width: "42px",
                          height: `${barHeight}px`,
                          borderRadius:
                            "7px 7px 0 0",
                          background:
                            "#5b7cff",
                          transition:
                            "height 0.3s ease",
                        }}
                      />

                      <span
                        style={{
                          marginTop:
                            "10px",
                          fontSize:
                            "12px",
                          color:
                            "#64748b",
                          textAlign:
                            "center",
                          maxWidth:
                            "90px",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                        title={
                          candidate.name
                        }
                      >
                        {candidate.name}
                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}

          <div className="chart-legend">

            <span>
              <i className="dot blue-dot" />
              Votes recorded
            </span>

            <strong>
              {activeElectionVotes} total
            </strong>

          </div>

        </section>
      </div>

      {/* BOTTOM GRID */}
      <div className="bottom-grid">

        {/* RECENT ELECTIONS */}
        <section className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Recent Elections
              </h3>

              <p>
                Overview of your elections
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                navigate("/elections")
              }
            >
              View all
              <ArrowUpRight size={15} />
            </button>

          </div>

          <div className="table-wrap">

            <table>

              <thead>
                <tr>
                  <th>Election</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Turnout</th>
                </tr>
              </thead>

              <tbody>

                {recentElections.length >
                  0 ? (

                  recentElections.map(
                    (election) => (

                      <tr
                        key={
                          election.electionId
                        }
                      >

                        <td>
                          <strong>
                            {election.title}
                          </strong>

                          <small>
                            {
                              election.electionId
                            }
                          </small>
                        </td>

                        <td>
                          <span className="table-date">

                            <CalendarDays
                              size={14}
                            />

                            {formatDate(
                              election.startDate
                            )}

                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={formatStatus(
                              election.status
                            )}
                          />
                        </td>

                        <td>
                          <strong>
                            {election.electionId ===
                              activeElection?.electionId
                              ? `${currentTurnout}%`
                              : "—"}
                          </strong>
                        </td>

                      </tr>
                    )
                  )

                ) : (

                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "30px",
                      }}
                    >
                      {loading
                        ? "Loading elections..."
                        : "No elections found."}
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* QUICK ACTIONS */}
        <section className="panel quick-panel">

          <div className="panel-header">

            <div>
              <h3>
                Quick Actions
              </h3>

              <p>
                Frequently used actions
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              navigate("/elections")
            }
          >
            <span className="quick-icon blue">
              <Vote size={18} />
            </span>

            <div>
              <strong>
                Create election
              </strong>

              <small>
                Set up a new election
              </small>
            </div>

            <ArrowUpRight size={16} />
          </button>

          <button
            onClick={() =>
              navigate("/voters")
            }
          >
            <span className="quick-icon purple">
              <Users size={18} />
            </span>

            <div>
              <strong>
                Register voter
              </strong>

              <small>
                Add a new voter
              </small>
            </div>

            <ArrowUpRight size={16} />
          </button>

          <button
            onClick={() =>
              navigate("/candidates")
            }
          >
            <span className="quick-icon orange">
              <Plus size={18} />
            </span>

            <div>
              <strong>
                Add candidate
              </strong>

              <small>
                Add candidate to election
              </small>
            </div>

            <ArrowUpRight size={16} />
          </button>

          <button
            onClick={() =>
              navigate("/reports")
            }
          >
            <span className="quick-icon green">
              <TrendingUp size={18} />
            </span>

            <div>
              <strong>
                View reports
              </strong>

              <small>
                Analyze election results
              </small>
            </div>

            <ArrowUpRight size={16} />
          </button>

        </section>

      </div>
    </>
  );
}