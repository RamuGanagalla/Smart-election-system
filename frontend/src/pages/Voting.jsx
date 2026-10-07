import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Voting() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get the election selected during RFID verification
  const electionId = sessionStorage.getItem("electionId");

  // Get election details stored during RFID verification
  const storedElection = sessionStorage.getItem("election");

  const election = storedElection
    ? JSON.parse(storedElection)
    : null;

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!electionId) {
        setError("No active election found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/candidates/election/${encodeURIComponent(
            electionId
          )}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.message || "Unable to load candidates."
          );
          return;
        }

        setCandidates(data.candidates || []);
      } catch (error) {
        console.error("Fetch candidates error:", error);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [electionId]);

  const selectCandidate = (candidate) => {
    sessionStorage.setItem(
      "selectedCandidate",
      JSON.stringify(candidate)
    );

    navigate("/confirmation");
  };

  if (loading) {
    return (
      <div className="voting-screen">
        <h1>CAST YOUR VOTE</h1>

        <p className="voting-instruction">
          Loading candidates...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="voting-screen">
        <h1>CAST YOUR VOTE</h1>

        <p className="voting-instruction">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="voting-screen">

      <h1>CAST YOUR VOTE</h1>

      {/* Current Election */}
      {election && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#4caf50",
              fontWeight: "600",
              marginBottom: "5px",
            }}
          >
            ● CURRENT ELECTION
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#172033",
            }}
          >
            {election.title}
          </div>
        </div>
      )}

      <p className="voting-instruction">
        Please touch the candidate of your choice
      </p>

      <div className="candidate-list">

        {candidates.length > 0 ? (
          candidates.map((candidate) => (
            <button
              key={candidate.candidateId}
              className="candidate-card"
              onClick={() => selectCandidate(candidate)}
            >
              <span className="candidate-symbol">
                {candidate.symbol}
              </span>

              <span className="candidate-name">
                {candidate.name}
              </span>

              <span className="vote-text">
                VOTE
              </span>
            </button>
          ))
        ) : (
          <p className="voting-instruction">
            No candidates are available for this election.
          </p>
        )}

      </div>

    </div>
  );
}

export default Voting;