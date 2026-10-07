
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function FaceVerification() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const voter = JSON.parse(
    sessionStorage.getItem("voter")
  );

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setCameraReady(true);
      } catch (error) {
        console.error("Camera error:", error);

        setCameraError(
          "Unable to access camera. Please allow camera permission."
        );

        setCameraReady(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleFaceVerification = () => {
    // Temporary demo verification.
    // Later we can add a non-identifying face-presence check here.
    navigate("/fingerprint");
  };

  return (
    <div className="screen">

      <div className="success-icon">
        ✓
      </div>
      <h1>RFID VERIFIED</h1>

      <p className="welcome">
        Thank you, {voter?.name}!
      </p>

      <p className="instruction">
        Please look at the camera
        <br />
        for facial verification
      </p>

      <div className="camera-box">
        {cameraError ? (
          <p>{cameraError}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-preview"
          />
        )}
      </div>

      <button
        onClick={handleFaceVerification}
        disabled={!cameraReady}
      >
        {cameraReady ? "VERIFY FACE" : "STARTING CAMERA..."}
      </button>

    </div>
  );
}

export default FaceVerification;
