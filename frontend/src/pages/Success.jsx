import { useNavigate } from "react-router-dom";

function Success() {
  const navigate = useNavigate();

  const voter = JSON.parse(
    sessionStorage.getItem("voter")
  );

  const finishVoting = () => {
    sessionStorage.clear();

    navigate("/");
  };

  return (
    <div className="screen">

      <div className="success-icon">
        ✓
      </div>

      <h1>VOTE RECORDED</h1>

      <p className="welcome">
        Thank you, {voter?.name}!
      </p>

      <p className="instruction">
        Your vote has been successfully recorded.
        <br />
        Please proceed from the voting area.
      </p>

      <button onClick={finishVoting}>
        FINISH
      </button>

    </div>
  );
}

export default Success;