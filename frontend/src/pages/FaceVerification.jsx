import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function FaceVerification() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [cameraError, setCameraError] = useState("");

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

        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Camera error:", error);
        setCameraError(
          "Unable to access camera. Please allow camera permission."
        );
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
    // Temporary demo verification
    navigate("/voting");
  };

  return (
    <div className="screen">
      <div className="success-icon">✓</div>

      <h1>FINGERPRINT VERIFIED</h1>

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
        disabled={!!cameraError}
      >
        VERIFY FACE
      </button>
    </div>
  );
}

export default FaceVerification;