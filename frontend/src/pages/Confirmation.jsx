import { useNavigate } from "react-router-dom";

function Confirmation() {
  const navigate = useNavigate();

  const candidate = JSON.parse(
    sessionStorage.getItem("selectedCandidate")
  );

  const confirmVote = async () => {
  try {
    const voter = JSON.parse(
      sessionStorage.getItem("voter")
    );

    const response = await fetch(
      `http://localhost:3000/api/voters/update-vote-status/${voter.voterId}`,
      {
        method: "PUT",
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("Vote status updated:", data);
      navigate("/success");
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Unable to connect to the server.");
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
        >
          CHANGE VOTE
        </button>

        <button
          className="confirm-button"
          onClick={confirmVote}
        >
          CONFIRM VOTE
        </button>

      </div>

    </div>
  );
}

export default Confirmation;