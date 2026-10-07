import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  const [rfid, setRfid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyRFID = async () => {
    if (!rfid.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/voters/verify-rfid",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rfidUid: rfid.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("RFID verified:", data);

        // Store voter information
        sessionStorage.setItem(
          "voter",
          JSON.stringify(data.voter)
        );

        // Store the election returned by the backend
        sessionStorage.setItem(
          "electionId",
          data.election.electionId
        );

        sessionStorage.setItem(
          "election",
          JSON.stringify(data.election)
        );

        navigate("/face");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("RFID verification error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">

      <div className="logo">🗳️</div>

      <h1>SMART ELECTION</h1>
      <h2>SYSTEM</h2>

      <p className="welcome">
        WELCOME
      </p>

      <p className="instruction">
        Please enter your RFID card ID
        <br />
        to begin authentication
      </p>

      <input
        type="text"
        className="rfid-input"
        placeholder="Enter RFID UID"
        value={rfid}
        onChange={(e) => setRfid(e.target.value)}
      />

      <button
        disabled={!rfid.trim() || loading}
        onClick={handleVerifyRFID}
      >
        {loading ? "VERIFYING..." : "VERIFY RFID"}
      </button>

    </div>
  );
}

export default Welcome;