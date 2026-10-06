import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  const [rfid, setRfid] = useState("");

  const handleVerifyRFID = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/voters/verify-rfid",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rfidUid: rfid,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("RFID verified:", data);

        // Temporarily store voter information
        sessionStorage.setItem(
          "voter",
          JSON.stringify(data.voter)
        );

        navigate("/fingerprint");
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
        disabled={!rfid.trim()}
        onClick={handleVerifyRFID}
      >
        VERIFY RFID
      </button>

    </div>
  );
}

export default Welcome;