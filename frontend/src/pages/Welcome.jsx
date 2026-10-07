import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  const [rfid, setRfid] = useState("");
  const [loading, setLoading] = useState(false);

  const [election, setElection] = useState(null);
  const [electionLoading, setElectionLoading] = useState(true);
  const [electionError, setElectionError] = useState("");

  // Fetch the currently active election
  useEffect(() => {
    const fetchActiveElection = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/elections/active"
        );

        const data = await response.json();

        if (response.ok) {
          setElection(data.election);
          setElectionError("");
        } else {
          setElection(null);
          setElectionError(
            data.message || "No active election is currently running."
          );
        }
      } catch (error) {
        console.error("Active election fetch error:", error);
        setElection(null);
        setElectionError("Unable to connect to the server.");
      } finally {
        setElectionLoading(false);
      }
    };

    fetchActiveElection();
  }, []);

  const handleVerifyRFID = async () => {
    if (!rfid.trim() || !election) return;

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

        // Store election returned by the backend
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

      {/* Active Election */}
      {electionLoading ? (
        <p className="instruction">
          Loading current election...
        </p>
      ) : election ? (
        <div className="active-election">
          <div className="election-status">
            <span className="status-dot"></span>
            <span>CURRENT ELECTION</span>
          </div>

          <h3>{election.title}</h3>

          <div className="election-line"></div>

          <p className="election-subtitle">
            Please cast your vote for this election
          </p>
        </div>
      ) : (
        <div className="active-election no-election">
          <div className="election-status">
            <span className="status-dot offline"></span>
            <span>NO ACTIVE ELECTION</span>
          </div>

          <h3>{electionError}</h3>
        </div>
      )}

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
        disabled={!election || electionLoading}
      />

      <button
        disabled={!rfid.trim() || loading || !election || electionLoading}
        onClick={handleVerifyRFID}
      >
        {loading ? "VERIFYING..." : "VERIFY RFID"}
      </button>

    </div>
  );
}

export default Welcome;