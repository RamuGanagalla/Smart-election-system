import { useNavigate } from "react-router-dom";
import { useState } from "react";


function Fingerprint() {
  const navigate = useNavigate();
  const [fingerprintUid, setFingerprintUid] = useState("");

  const voter = JSON.parse(
    sessionStorage.getItem("voter")
  );

  const handleFingerprint = async() => {
    try{
      const response = await fetch("http://localhost:3000/api/voters/verify-fingerprint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          voterId: voter.voterId,
          fingerprintTemplate: fingerprintUid
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      navigate("/face");
    } catch (error) {
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="screen">

      <div className="success-icon">
        ✓
      </div>

      <h1>RFID VERIFIED</h1>

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
      <button onClick={handleFingerprint}
      disabled={!fingerprintUid.trim()}>
        SIMULATE FINGERPRINT
      </button>

    </div>
  );
}

export default Fingerprint;