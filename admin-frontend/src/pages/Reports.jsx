import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Trophy,
  Users,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Vote,
} from "lucide-react";

const API_BASE = "http://localhost:3000/api";

export default function Reports() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] =
    useState("");

  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH ELECTIONS
  // =====================================================

  const fetchElections = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/elections`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch elections"
        );
      }

      const list = data.elections || [];

      setElections(list);

      // Select active election automatically
      const activeElection = list.find(
        (election) => election.status === "active"
      );

      if (activeElection) {
        setSelectedElection(
          activeElection.electionId
        );
      } else if (list.length > 0) {
        setSelectedElection(
          list[0].electionId
        );
      }
    } catch (err) {
      console.error(
        "Fetch elections error:",
        err
      );

      setError(
        err.message ||
        "Unable to load elections"
      );
    }
  };

  // =====================================================
  // FETCH VOTERS
  // =====================================================

  const fetchVoters = async () => {
    const response = await fetch(
      `${API_BASE}/voters`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to fetch voters"
      );
    }

    setVoters(data.voters || []);
  };

  // =====================================================
  // FETCH CANDIDATES
  // =====================================================

  const fetchCandidates = async (
    electionId
  ) => {
    const response = await fetch(
      `${API_BASE}/candidates/election/${encodeURIComponent(
        electionId
      )}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to fetch candidates"
      );
    }

    setCandidates(data.candidates || []);
  };

  // =====================================================
  // FETCH VOTES
  // =====================================================

  const fetchVotes = async (
    electionId
  ) => {
    const response = await fetch(
      `${API_BASE}/votes/election/${encodeURIComponent(
        electionId
      )}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to fetch votes"
      );
    }

    setVotes(data.votes || []);
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          fetchElections(),
          fetchVoters(),
        ]);
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
          "Unable to load report data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // =====================================================
  // LOAD ELECTION-SPECIFIC DATA
  // =====================================================

  useEffect(() => {
    if (!selectedElection) {
      setCandidates([]);
      setVotes([]);
      return;
    }

    const loadElectionData = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          fetchCandidates(
            selectedElection
          ),
          fetchVotes(
            selectedElection
          ),
        ]);
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
          "Unable to load election report"
        );
      } finally {
        setLoading(false);
      }
    };

    loadElectionData();
  }, [selectedElection]);

  // =====================================================
  // SELECTED ELECTION
  // =====================================================

  const election = useMemo(() => {
    return elections.find(
      (item) =>
        item.electionId ===
        selectedElection
    );
  }, [
    elections,
    selectedElection,
  ]);

  // =====================================================
  // VOTER STATUS FOR SELECTED ELECTION
  // =====================================================

  const voterStats = useMemo(() => {
    const totalVoters =
      voters.length;

    const votedVoters =
      voters.filter((voter) => {
        const status =
          voter.statuses?.find(
            (item) =>
              item.electionId ===
              selectedElection
          );

        return status?.hasVoted === true;
      }).length;

    const notVoted =
      Math.max(
        totalVoters - votedVoters,
        0
      );

    const turnout =
      totalVoters > 0
        ? (votedVoters /
          totalVoters) *
        100
        : 0;

    return {
      totalVoters,
      votedVoters,
      notVoted,
      turnout,
    };
  }, [
    voters,
    selectedElection,
  ]);

  // =====================================================
  // CANDIDATE RESULTS
  // =====================================================

  const results = useMemo(() => {
    const voteCounts = {};

    votes.forEach((vote) => {
      const candidateId =
        vote.candidateId;

      voteCounts[candidateId] =
        (voteCounts[candidateId] || 0) +
        1;
    });

    const totalVotes =
      votes.length;

    return candidates
      .map((candidate) => {
        const count =
          voteCounts[
          candidate.candidateId
          ] || 0;

        const percentage =
          totalVotes > 0
            ? (count /
              totalVotes) *
            100
            : 0;

        return {
          ...candidate,
          votes: count,
          percentage,
        };
      })
      .sort(
        (a, b) =>
          b.votes - a.votes
      );
  }, [
    candidates,
    votes,
  ]);

  // =====================================================
  // LEADING CANDIDATE
  // =====================================================

  const leadingCandidate =
    results.length > 0 &&
      results[0].votes > 0
      ? results[0]
      : null;

  // =====================================================
  // INTEGRITY INFORMATION
  // =====================================================

  const integrityStats =
    useMemo(() => {
      const total =
        votes.length;

      const withHash =
        votes.filter(
          (vote) =>
            Boolean(
              vote.integrityHash
            )
        ).length;

      return {
        total,
        withHash,
        missing:
          total - withHash,
      };
    }, [votes]);

  // =====================================================
  // EXPORT REPORT
  // =====================================================

  const exportReport = () => {
    if (!election) {
      return;
    }

    const rows = [
      [
        "Election",
        election.title,
      ],
      [
        "Election ID",
        election.electionId,
      ],
      [
        "Status",
        election.status,
      ],
      [
        "Registered Voters",
        voterStats.totalVoters,
      ],
      [
        "Voted",
        voterStats.votedVoters,
      ],
      [
        "Not Voted",
        voterStats.notVoted,
      ],
      [
        "Turnout",
        `${voterStats.turnout.toFixed(
          2
        )}%`,
      ],
      [
        "Votes Cast",
        votes.length,
      ],
      [
        "Candidates",
        candidates.length,
      ],
      [
        "Leading Candidate",
        leadingCandidate?.name ||
        "No votes yet",
      ],
      [],
      [
        "Candidate",
        "Candidate ID",
        "Votes",
        "Percentage",
      ],
      ...results.map(
        (candidate) => [
          candidate.name,
          candidate.candidateId,
          candidate.votes,
          `${candidate.percentage.toFixed(
            2
          )}%`,
        ]
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value ?? ""
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `${election.electionId
      }-report.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const refreshReport = async () => {
    if (!selectedElection) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchVoters(),
        fetchCandidates(selectedElection),
        fetchVotes(selectedElection),
      ]);
    } catch (err) {
      console.error("Refresh report error:", err);

      setError(
        err.message || "Unable to refresh report"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    loading &&
    elections.length === 0
  ) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
        }}
      >
        Loading reports...
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* PAGE HEADER */}

      <div className="page-heading">
        <div>
          <h1>Election Reports</h1>

          <p>
            Analyze turnout and
            candidate performance.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            className="secondary-btn"
            onClick={refreshReport}
            disabled={loading}
          >
            <RefreshCw
              size={17}
            />

            Refresh
          </button>

          <button
            className="secondary-btn"
            onClick={exportReport}
            disabled={!election}
          >
            <Download
              size={17}
            />

            Export Report
          </button>
        </div>
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
          {error}
        </div>
      )}

      {/* ELECTION SELECTOR */}

      <div className="report-select">
        <div>
          <span>
            Election
          </span>

          <select
            value={
              selectedElection
            }
            onChange={(event) =>
              setSelectedElection(
                event.target.value
              )
            }
            style={{
              marginTop: "6px",
              border: "none",
              outline: "none",
              background:
                "transparent",
              fontSize:
                "16px",
              fontWeight: 600,
              color:
                "#172033",
              cursor:
                "pointer",
            }}
          >
            <option value="">
              Select Election
            </option>

            {elections.map(
              (item) => (
                <option
                  key={
                    item.electionId
                  }
                  value={
                    item.electionId
                  }
                >
                  {item.title}
                </option>
              )
            )}
          </select>
        </div>

        {election && (
          <span
            className={`status-badge ${election.status}`}
          >
            <i />

            {election.status
              .charAt(0)
              .toUpperCase() +
              election.status.slice(
                1
              )}
          </span>
        )}
      </div>

      {/* STATS */}

      <div className="stats-grid">
        <Stat
          icon={Users}
          title="Registered Voters"
          value={
            voterStats.totalVoters
          }
          tone="blue"
        />

        <Stat
          icon={CheckCircle2}
          title="Votes Cast"
          value={votes.length}
          tone="green"
        />

        <Stat
          icon={TrendingUp}
          title="Turnout"
          value={`${voterStats.turnout.toFixed(
            2
          )}%`}
          tone="orange"
        />

        <Stat
          icon={Trophy}
          title="Leading Candidate"
          value={
            leadingCandidate?.name ||
            "No votes yet"
          }
          tone="purple"
        />
      </div>

      {/* MAIN REPORT GRID */}

      <div className="report-grid">
        {/* CANDIDATE RESULTS */}

        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>
                Candidate Results
              </h3>

              <p>
                Current vote
                distribution
              </p>
            </div>

            <BarChart3
              size={20}
            />
          </div>

          {results.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <Vote
                size={35}
                style={{
                  opacity: 0.45,
                  marginBottom:
                    "10px",
                }}
              />

              <h3>
                No candidates
              </h3>

              <p>
                No candidates have
                been registered for
                this election.
              </p>
            </div>
          ) : (
            <div className="result-list">
              {results.map(
                (
                  candidate,
                  index
                ) => (
                  <div
                    className="result-row"
                    key={
                      candidate.candidateId
                    }
                  >
                    <div className="result-head">
                      <span>
                        <b className="rank">
                          {index + 1}
                        </b>

                        <span className="result-symbol">
                          {candidate.symbol ||
                            "—"}
                        </span>

                        <strong>
                          {
                            candidate.name
                          }
                        </strong>
                      </span>

                      <strong>
                        {
                          candidate.votes
                        }{" "}
                        <small>
                          (
                          {candidate.percentage.toFixed(
                            2
                          )}
                          %)
                        </small>
                      </strong>
                    </div>

                    <div className="progress-bar">
                      <div
                        style={{
                          width: `${candidate.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* TURNOUT */}

        <section className="panel turnout-panel">
          <div className="panel-header">
            <div>
              <h3>
                Turnout Overview
              </h3>

              <p>
                Voters who have cast
                a vote
              </p>
            </div>
          </div>

          <div
            className="donut"
            style={{
              background: `conic-gradient(
      #315bea ${voterStats.turnout}%,
      #e8ecf3 ${voterStats.turnout}% 100%
    )`,
            }}
          >
            <div>
              <strong>
                {voterStats.turnout.toFixed(2)}%
              </strong>

              <span>Turnout</span>
            </div>
          </div>

          <div className="turnout-legend">
            <span>
              <i className="dot green-dot" />

              Voted{" "}
              <strong>
                {voterStats.votedVoters}
              </strong>
            </span>

            <span>
              <i className="dot gray-dot" />

              Not voted{" "}
              <strong>
                {voterStats.notVoted}
              </strong>
            </span>
          </div>
        </section>
      </div>

      {/* ELECTION SUMMARY */}

      <section
        className="panel"
        style={{
          marginTop: "20px",
        }}
      >
        <div className="panel-header">
          <div>
            <h3>
              Election Summary
            </h3>

            <p>
              Real-time information
              for the selected
              election
            </p>
          </div>
        </div>

        <div
          className="stats-grid compact"
          style={{
            marginTop: "15px",
          }}
        >
          <div className="mini-card">
            <span>
              Election ID
            </span>

            <strong
              style={{
                fontSize:
                  "14px",
              }}
            >
              {election?.electionId ||
                "—"}
            </strong>
          </div>

          <div className="mini-card">
            <span>
              Candidates
            </span>

            <strong>
              {candidates.length}
            </strong>
          </div>

          <div className="mini-card">
            <span>
              Votes Recorded
            </span>

            <strong>
              {votes.length}
            </strong>
          </div>

          <div className="mini-card">
            <span>
              Winner / Leader
            </span>

            <strong
              style={{
                fontSize:
                  "14px",
              }}
            >
              {leadingCandidate?.name ||
                "No votes yet"}
            </strong>
          </div>
        </div>
      </section>

      {/* INTEGRITY */}

      <div
        className="integrity-banner"
        style={{
          marginTop: "20px",
        }}
      >
        <div className="integrity-check">
          <CheckCircle2
            size={22}
          />
        </div>

        <div>
          <strong>
            Vote integrity records
          </strong>

          <p>
            {integrityStats.total ===
              0
              ? "No votes have been recorded for this election yet."
              : `${integrityStats.withHash} of ${integrityStats.total} recorded votes contain an integrity hash.`}
          </p>
        </div>

        <span>
          {integrityStats.total ===
            0
            ? "No votes"
            : integrityStats.missing ===
              0
              ? "Recorded"
              : "Check required"}
        </span>
      </div>
    </>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function Stat({
  icon: Icon,
  title,
  value,
  tone,
}) {
  return (
    <div className="stat-card">
      <div
        className={`stat-icon ${tone}`}
      >
        <Icon size={21} />
      </div>

      <div className="stat-info">
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}