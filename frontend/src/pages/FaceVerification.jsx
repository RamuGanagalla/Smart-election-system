import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "@vladmandic/face-api";

function FaceVerification() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimerRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceCount, setFaceCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [checking, setChecking] = useState(false);

  const voter = JSON.parse(
    sessionStorage.getItem("voter") || "null"
  );

  // Load SSD face detection model
  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        setCameraError("");

        await faceapi.nets.ssdMobilenetv1.loadFromUri(
          "/models"
        );

        if (mounted) {
          setModelsLoaded(true);
        }
      } catch (error) {
        console.error("Face model loading error:", error);

        if (mounted) {
          setCameraError(
            "Unable to load face detection models."
          );
        }
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  // Start camera after model loading
  useEffect(() => {
    if (!modelsLoaded) return;

    let mounted = true;

    const startCamera = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
            audio: false,
          });

        streamRef.current = stream;

        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;

          await videoRef.current.play();

          setCameraReady(true);
        }
      } catch (error) {
        console.error("Camera error:", error);

        if (mounted) {
          setCameraError(
            "Unable to access camera. Please allow camera permission."
          );
          setCameraReady(false);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, [modelsLoaded]);

  // Detect faces continuously
  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;

    const detectFaces = async () => {
      try {
        if (!videoRef.current) return;

        const detections =
          await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.5,
            })
          );

        const count = detections.length;

        setFaceCount(count);
        setFaceDetected(count === 1);
      } catch (error) {
        console.error("Face detection error:", error);
      }
    };

    // Check every 500ms
    detectionTimerRef.current = setInterval(
      detectFaces,
      500
    );

    return () => {
      if (detectionTimerRef.current) {
        clearInterval(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
    };
  }, [cameraReady]);

  const handleFaceVerification = () => {
    if (!faceDetected) return;

    setChecking(true);

    // Face-presence check completed.
    // Continue to fingerprint authentication.
    setTimeout(() => {
      navigate("/fingerprint");
    }, 500);
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

      {!modelsLoaded && !cameraError && (
        <p className="face-status">
          Loading face detection...
        </p>
      )}

      {modelsLoaded &&
        !cameraReady &&
        !cameraError && (
          <p className="face-status">
            Starting camera...
          </p>
        )}

      {cameraReady && !cameraError && (
        <p className="face-status">

          {faceCount === 0 && (
            <>● No face detected — look at the camera</>
          )}

          {faceCount === 1 && (
            <>● One face detected — ready</>
          )}

          {faceCount > 1 && (
            <>
              ● Multiple faces detected — only one
              person should be visible
            </>
          )}

        </p>
      )}

      <button
        onClick={handleFaceVerification}
        disabled={!faceDetected || checking}
      >
        {checking
          ? "VERIFYING..."
          : faceDetected
          ? "VERIFY FACE"
          : "LOOK AT CAMERA"}
      </button>

    </div>
  );
}

export default FaceVerification;