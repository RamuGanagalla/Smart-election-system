
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Voting() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Current election
  // Later we can make this dynamic from the active election.
  const electionId = "EL-2026-001";

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/candidates/election/${electionId}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || "Unable to load candidates.");
          return;
        }

        setCandidates(data.candidates);
      } catch (error) {
        console.error(error);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const selectCandidate = (candidate) => {
    sessionStorage.setItem(
      "selectedCandidate",
      JSON.stringify(candidate)
    );

    sessionStorage.setItem(
      "electionId",
      electionId
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

      <p className="voting-instruction">
        Please touch the candidate of your choice
      </p>

      <div className="candidate-list">

        {candidates.map((candidate) => (
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
        ))}

      </div>

    </div>
  );
}

export default Voting;
