
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Confirmation() {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  const candidate = JSON.parse(
    sessionStorage.getItem("selectedCandidate")
  );

  const voter = JSON.parse(
    sessionStorage.getItem("voter")
  );

  const electionId = sessionStorage.getItem("electionId");

  const confirmVote = async () => {
    if (!voter || !candidate || !electionId) {
      alert("Voting information is missing.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "http://localhost:3000/api/votes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voterId: voter.voterId,
            electionId: electionId,
            candidateId: candidate.candidateId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Vote cast successfully:", data);

        // Clear temporary voting data
        sessionStorage.removeItem("selectedCandidate");
        sessionStorage.removeItem("electionId");

        navigate("/success");
      } else {
        alert(data.message || "Unable to cast vote.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">

      <h1>CONFIRM YOUR VOTE</h1>

      <p className="instruction">
        You selected:
      </p>

      <div className="selected-candidate">

        <div className="selected-symbol">
          {candidate?.symbol}
        </div>

        <h2>
          {candidate?.name}
        </h2>

      </div>

      <p className="warning">
        Please verify your selection before confirming.
      </p>

      <div className="confirmation-buttons">

        <button
          className="cancel-button"
          onClick={() => navigate("/voting")}
          disabled={submitting}
        >
          CHANGE VOTE
        </button>

        <button
          className="confirm-button"
          onClick={confirmVote}
          disabled={submitting}
        >
          {submitting ? "CASTING VOTE..." : "CONFIRM VOTE"}
        </button>

      </div>

    </div>
  );
}

export default Confirmation;
