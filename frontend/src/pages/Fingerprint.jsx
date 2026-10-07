import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Fingerprint() {
  const navigate = useNavigate();
  const [fingerprintUid, setFingerprintUid] = useState("");
  const [verifying, setVerifying] = useState(false);

  const voter = JSON.parse(
    sessionStorage.getItem("voter") || "null"
  );

  const handleFingerprint = async () => {
    if (!voter?.voterId) {
      alert("Voter information not found. Please start again.");
      navigate("/");
      return;
    }

    try {
      setVerifying(true);

      const response = await fetch(
        "http://localhost:3000/api/voters/verify-fingerprint",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voterId: voter.voterId,
            fingerprintTemplate: fingerprintUid,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Fingerprint verification failed.");
        return;
      }

      console.log("Fingerprint verified:", data);

      navigate("/voting");
    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="screen">

      <div className="success-icon">
        ✓
      </div>

      <h1>FACE VERIFIED</h1>

      <p className="welcome">
        Welcome, {voter?.name}!
      </p>

      <p className="instruction">
        Please place your finger on
        <br />
        the fingerprint scanner
      </p>

      <div className="fingerprint">
        🖐️
      </div>

      <input
        type="text"
        className="rfid-input"
        placeholder="Enter Fingerprint UID"
        value={fingerprintUid}
        onChange={(e) => setFingerprintUid(e.target.value)}
      />

      <button
        onClick={handleFingerprint}
        disabled={!fingerprintUid.trim() || verifying}
      >
        {verifying ? "VERIFYING..." : "SIMULATE FINGERPRINT"}
      </button>

    </div>
  );
}

export default Fingerprint;