import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "@vladmandic/face-api";

function FaceVerification() {
  const voter = JSON.parse(
    sessionStorage.getItem("voter") || "null"
  );

  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);

  const [descriptor, setDescriptor] = useState([]);
  const [capturing, setCapturing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!voter || !voter.voterId) {
      navigate("/");
    }
  }, [voter, navigate]);

  // Load face-api models
  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {

        setError("");
        setMessage("Loading face models...");

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);

        if (mounted) {
          setModelsLoaded(true);
          setMessage("Face models loaded.");
        }
      } catch (error) {
        console.error("Model loading error:", error);

        if (mounted) {
          setMessage("");
          setError(
            "Unable to load face models. Check the public/models folder."
          );
        }
      }
    };


    loadModels();


    return () => {
      mounted = false;
    };
  }, []);

  // Start camera after models are loaded
  useEffect(() => {
    if (!modelsLoaded) return;

    let mounted = true;

    const startCamera = async () => {
      try {
        setError("");
        setMessage("Starting camera...");

        const stream = await navigator.mediaDevices.getUserMedia({
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
          setMessage("Camera ready. Position your face inside the guide.");
        }
      } catch (error) {
        console.error("Camera error:", error);

        if (mounted) {
          setError(
            "Unable to access camera. Please allow camera permission."
          );
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      }
    };
  }, [modelsLoaded]);

  // Detect faces continuously
  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;

    let mounted = true;
    let detecting = false;

    const detectFace = async () => {
      if (!mounted || !videoRef.current || detecting) return;

      detecting = true;

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({
            minConfidence: 0.5,
          })
        );

        if (mounted) {
          const count = detections?.length || 0;

          setFaceCount(count);
          setFaceDetected(count === 1);
        }
      } catch (error) {
        console.error("Face detection error:", error);
      } finally {
        detecting = false;

        if (mounted) {
          setTimeout(detectFace, 500);
        }
      }
    };

    detectFace();

    return () => {
      mounted = false;
    };
  }, [cameraReady]);

  // Capture face and generate 128-D descriptor
  const captureFaceDescriptor = async () => {
    if (!videoRef.current || !faceDetected || capturing) {
      return;
    }

    try {
      setCapturing(true);
      setError("");
      setMessage("Capturing face...");

      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({
            minConfidence: 0.5,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      // No face
      if (!detections || detections.length === 0) {
        throw new Error(
          "No face detected. Please position your face clearly."
        );
      }

      // More than one face
      if (detections.length > 1) {
        throw new Error(
          "Multiple faces detected. Please make sure only one face is visible."
        );
      }

      const detection = detections[0];

      // Detection confidence
      if (detection.detection.score < 0.55) {
        throw new Error(
          "Face quality is too low. Please improve lighting."
        );
      }

      // Get 128-dimensional descriptor
      const faceDescriptor = detection.descriptor;

      // Convert Float32Array -> normal JavaScript array
      const descriptorArray = Array.from(faceDescriptor);

      // Verify descriptor length
      if (descriptorArray.length !== 128) {
        throw new Error(
          "Invalid face descriptor. Expected 128 values."
        );
      }

      // Store descriptor in React state
      setDescriptor(descriptorArray);

      setMessage(
        "Face descriptor generated successfully. Sending data..."
      );

      try {
        setMessage("Sending face descriptor to server...");
        const response = await fetch(
          "http://localhost:3000/api/voters/verify-face",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              voterId: voter.voterId,
              faceTemplate: descriptorArray,
            }),
          }
        );

        if (!response.ok) {
          let message = `Server error: ${response.status}`;

          try {
            const errorData = await response.json();
            message = errorData.message || message;
          } catch { }

          throw new Error(message);
        }

        const data = await response.json();
        if (!data.match) {
          setMessage("");
          setError(data.message || "Face verification failed.");
          throw new Error(data.message || "Face verification failed.");

        }
        else if (data.match) {
          setMessage("Face verified successfully. Proceeding to fingerprint verification...");
          stopCamera();

        }
        setMessage(data.message || "Face data sent successfully.");

      } catch (error) {
        console.error(error);
        setError(error.message || "Failed to contact server.");
      }



    } catch (error) {
      console.error("Face capture error:", error);

      setDescriptor([]);


      setError(
        error.message || "Unable to generate face descriptor."
      );

    } finally {
      setCapturing(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setFaceDetected(false);
    setFaceCount(0);
    navigate("/fingerprint");

  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
        }}
      >
        {/* Welcome */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              color: "#172554",
            }}
          >
            Welcome, {voter?.name || "Voter"}
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Your RFID verification has been completed successfully.
          </p>

          {/* RFID completed */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "14px",
              padding: "8px 14px",
              borderRadius: "20px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <span>✓</span>
            RFID Verification Completed
          </div>
        </div>

        {/* Face Verification heading */}
        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "21px",
              color: "#1e293b",
              fontFamily:
                "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: "600",
            }}
          >
            Face Verification
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Look directly at the camera and position your face inside the guide.
          </p>
        </div>

        {/* Camera */}
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            height: "390px",
            margin: "0 auto",
            borderRadius: "16px",
            overflow: "hidden",
            background: "#0f172a",
            position: "relative",
            border: "1px solid #e2e8f0",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />

          {/* Face guide */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "210px",
                height: "270px",
                border: `3px solid ${faceDetected ? "#22c55e" : "#ffffff"
                  }`,
                borderRadius: "50%",
                boxShadow:
                  "0 0 0 9999px rgba(15, 23, 42, 0.15)",
              }}
            />
          </div>

          {/* Camera status */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              padding: "7px 11px",
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.75)",
              color: "#ffffff",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: cameraReady
                  ? "#22c55e"
                  : "#f59e0b",
              }}
            />

            {cameraReady
              ? "Camera Active"
              : "Starting Camera"}
          </div>
        </div>

        {/* Face detection status */}
        <div
          style={{
            marginTop: "18px",
            padding: "14px 16px",
            borderRadius: "12px",
            background: faceDetected
              ? "#f0fdf4"
              : "#f8fafc",
            border: `1px solid ${faceDetected
              ? "#bbf7d0"
              : "#e2e8f0"
              }`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: faceDetected
                ? "#15803d"
                : "#475569",
            }}
          >
            {faceDetected
              ? "✓ Face detected"
              : "Waiting for one face"}
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            Faces detected: {faceCount}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Success / information */}
        {message && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: "13px",
            }}
          >
            {message}
          </div>
        )}

        {/* Verify button */}
        <button
          type="button"
          onClick={captureFaceDescriptor}
          disabled={
            !cameraReady ||
            !faceDetected ||
            capturing
          }
          style={{
            width: "100%",
            marginTop: "22px",
            border: "none",
            borderRadius: "10px",
            padding: "14px 18px",
            background:
              !cameraReady ||
                !faceDetected ||
                capturing
                ? "#cbd5e1"
                : "#2563eb",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "600",
            cursor:
              !cameraReady ||
                !faceDetected ||
                capturing
                ? "not-allowed"
                : "pointer",
          }}
        >
          {capturing
            ? "Checking..."
            : "Verify Face"}
        </button>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            margin: "16px 0 0",
            fontSize: "11px",
            color: "#94a3b8",
          }}
        >
          Ensure your face is clearly visible and well lit.
        </p>
      </div>
    </div>
  );
}
export default FaceVerification;