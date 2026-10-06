import { useState } from "react";
import { useNavigate } from "react-router-dom";

const candidates = [
  {
    id: 1,
    name: "Candidate A",
    symbol: "🌳",
  },
  {
    id: 2,
    name: "Candidate B",
    symbol: "⭐",
  },
  {
    id: 3,
    name: "Candidate C",
    symbol: "🪷",
  },
];

function Voting() {
  const navigate = useNavigate();

  const [selectedCandidate, setSelectedCandidate] =
    useState(null);

  const selectCandidate = (candidate) => {
    sessionStorage.setItem(
      "selectedCandidate",
      JSON.stringify(candidate)
    );

    setSelectedCandidate(candidate);

    navigate("/confirmation");
  };

  return (
    <div className="voting-screen">

      <h1>CAST YOUR VOTE</h1>

      <p className="voting-instruction">
        Please touch the candidate of your choice
      </p>

      <div className="candidate-list">

        {candidates.map((candidate) => (
          <button
            key={candidate.id}
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