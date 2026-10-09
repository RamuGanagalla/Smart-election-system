import * as faceapi from "@vladmandic/face-api";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  Download,
  X,
  UserPlus,
  Fingerprint,
  ScanFace,
  Pencil,
  Trash2,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";

const API_BASE = "http://localhost:3000/api";

export default function Voters() {
  const [voters, setVoters] = useState([]);
  const [elections, setElections] = useState([]);
  const [capturedImage, setCapturedImage] = useState("");
  const [faceTemplate, setFaceTemplate] = useState([]);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [faceCapturing, setFaceCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  const [selectedElection, setSelectedElection] =
    useState("");

  const [search, setSearch] = useState("");

  const [showRegister, setShowRegister] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(false);

  const [selectedVoter, setSelectedVoter] =
    useState(null);

  const [openMenu, setOpenMenu] =
    useState(null);

  const [voteCount, setVoteCount] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [loadingElections, setLoadingElections] =
    useState(true);

  const [loadingVotes, setLoadingVotes] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // FETCH VOTERS
  // =====================================================

  const fetchVoters = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/voters`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch voters"
        );
      }

      setVoters(data.voters || []);
    } catch (err) {
      console.error(
        "Fetch voters error:",
        err
      );

      setError(
        err.message ||
        "Unable to load voters"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH ELECTIONS
  // =====================================================

  const fetchElections = async () => {
    try {
      setLoadingElections(true);

      const response = await fetch(
        `${API_BASE}/elections`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Failed to fetch elections"
        );
      }

      const electionList =
        data.elections || [];

      setElections(electionList);

      const activeElection =
        electionList.find(
          (election) =>
            election.status === "active"
        );

      if (activeElection) {
        setSelectedElection(
          activeElection.electionId
        );
      } else if (electionList.length > 0) {
        setSelectedElection(
          electionList[0].electionId
        );
      }
    } catch (err) {
      console.error(
        "Fetch elections error:",
        err
      );

      setError(
        err.message ||
        "Unable to load elections"
      );
    } finally {
      setLoadingElections(false);
    }
  };

  // =====================================================
  // FETCH REAL VOTE COUNT
  // =====================================================

  const fetchVoteCount = async (
    electionId
  ) => {
    if (!electionId) {
      setVoteCount(0);
      return;
    }

    try {
      setLoadingVotes(true);

      const response = await fetch(
        `${API_BASE}/votes/election/${encodeURIComponent(
          electionId
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Failed to fetch votes"
        );
      }

      setVoteCount(data.count || 0);
    } catch (err) {
      console.error(
        "Fetch vote count error:",
        err
      );

      setVoteCount(0);
    } finally {
      setLoadingVotes(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchVoters();
    fetchElections();
  }, []);

  // =====================================================
  // LOAD VOTES WHEN ELECTION CHANGES
  // =====================================================

  useEffect(() => {
    fetchVoteCount(selectedElection);
    fetchVoters();
    fetchElections();
  }, [selectedElection]);

  // =====================================================
  // GET STATUS FOR SELECTED ELECTION
  // =====================================================

  const getVoterStatus = (voter) => {
    if (!selectedElection) {
      return null;
    }

    return (
      voter.statuses?.find(
        (status) =>
          status.electionId ===
          selectedElection
      ) || null
    );
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredVoters = useMemo(() => {
    const query = search.trim().toLowerCase();

    // First: show only voters registered
    // for the selected election
    const electionVoters = selectedElection
      ? voters.filter((voter) =>
        voter.statuses?.some(
          (status) =>
            status.electionId === selectedElection
        )
      )
      : [];

    // If no search text, return only election voters
    if (!query) {
      return electionVoters;
    }

    // Then apply search filter
    return electionVoters.filter((voter) => {
      const profile = voter.profile || {};
      const credentials = voter.credentials || {};

      const searchableText = [
        profile.voterId,
        profile.name,
        profile.email,
        profile.gender,
        profile.age,
        credentials.rfidUid,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [voters, search, selectedElection]);
  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const total = filteredVoters.length;

    const voted = Math.min(
      voteCount,
      total
    );

    const notVoted = Math.max(
      total - voted,
      0
    );

    return {
      total,
      voted,
      notVoted,
    };
  }, [filteredVoters.length, voteCount]);
  const startFaceCamera = async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      setCameraStream(stream);
    } catch (error) {
      console.error("Camera error:", error);
      setError(
        "Unable to access camera. Please allow camera permission."
      );
    }
  };
  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;

    videoRef.current.srcObject = cameraStream;

    videoRef.current.play().catch((error) => {
      console.error("Video playback error:", error);
    });
  }, [cameraStream]);
  const stopFaceCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStream(null);
  };


  // =====================================================
  // REGISTER VOTER
  // =====================================================

  const handleFaceEnrollment = async () => {
    let stream = null;
    let video = null;

    try {
      setFaceCapturing(true);
      setError("");
      setSuccess("");

      // 1. Request camera access with explicit user permission
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });
      } catch (camErr) {
        if (camErr.name === "NotAllowedError" || camErr.name === "PermissionDeniedError") {
          throw new Error(
            "Camera permission denied. Please allow camera access in your browser."
          );
        } else if (camErr.name === "NotFoundError" || camErr.name === "DevicesNotFoundError") {
          throw new Error("No camera detected on this system.");
        }
        throw new Error(camErr.message || "Unable to access camera.");
      }

      // 2. Load face-api models (detection, landmarks, descriptor recognition)
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);

      // 3. Play camera in temporary video element for frame capture
      video = document.createElement("video");
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.srcObject = stream;

      await video.play();

      // Short delay for webcam exposure/focus calibration
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 4. Detect face with landmarks and 128-d descriptor
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.SsdMobilenetv1Options({
            minConfidence: 0.5,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      // 5. Presence and quality checks
      if (!detections || detections.length === 0) {
        throw new Error(
          "No face detected. Please position your face clearly in front of the camera with good lighting."
        );
      }

      if (detections.length > 1) {
        throw new Error(
          "Multiple faces detected. Please make sure only the voter is in the frame."
        );
      }

      const detection = detections[0];
      const box = detection.detection.box;

      if (box.width < 80 || box.height < 80) {
        throw new Error(
          "Face is too far from camera. Please move closer."
        );
      }

      if (detection.detection.score < 0.55) {
        throw new Error(
          "Face image quality is too low. Please improve lighting and face the camera directly."
        );
      }

      const descriptorArray = Array.from(detection.descriptor);

      if (descriptorArray.length !== 128) {
        throw new Error("Failed to extract valid 128-dimensional biometric template.");
      }
      // Capture the current frame from the visible camera preview
      if (videoRef.current) {
        const canvas = document.createElement("canvas");

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const context = canvas.getContext("2d");

        context.drawImage(
          videoRef.current,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const image = canvas.toDataURL("image/jpeg", 0.9);

        setCapturedImage(image);
      }

      setFaceTemplate(descriptorArray);
      setFaceCaptured(true);
      setSuccess("Face captured successfully (128-D biometric template generated).");
    } catch (error) {
      console.error("Face capture error:", error);
      setFaceCaptured(false);
      setFaceTemplate([]);
      setError(error.message || "Unable to capture face.");
    } finally {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (video) {
        video.srcObject = null;
      }
      setFaceCapturing(false);
    }
  };

  const registerVoter = async (event) => {
    event.preventDefault();
    if (!faceCaptured) {
      setError("Please capture the face before registering the voter.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData(
        event.currentTarget
      );

      const voterData = {
        voterId:
          formData
            .get("voterId")
            ?.trim(),

        name:
          formData
            .get("name")
            ?.trim(),

        email:
          formData
            .get("email")
            ?.trim(),

        gender:
          formData.get("gender"),

        age: Number(
          formData.get("age")
        ),

        rfidUid:
          formData
            .get("rfidUid")
            ?.trim(),

        fingerprintTemplate:
          formData
            .get(
              "fingerprintTemplate"
            )
            ?.trim() || null,

        faceTemplate:
          faceCaptured && Array.isArray(faceTemplate) && faceTemplate.length === 128
            ? faceTemplate
            : null,

        electionId:
          formData.get(
            "electionId"
          ),
      };

      const response = await fetch(
        `${API_BASE}/voters/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            voterData
          ),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to register voter"
        );
      }

      setSuccess(
        "Voter registered successfully."
      );


      // Stop the camera
      stopFaceCamera();

      // Clear captured face state
      setCapturedImage("");
      setFaceCaptured(false);
      setFaceTemplate([]);

      // Close registration modal
      setShowRegister(false);



      await fetchVoters();

      setSelectedElection(
        voterData.electionId
      );
    } catch (err) {
      console.error(
        "Register voter error:",
        err
      );

      setError(
        err.message ||
        "Unable to register voter"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = (voter) => {
    setSelectedVoter(voter);

    setOpenMenu(null);

    setError("");
    setSuccess("");

    setShowEdit(true);
  };

  // =====================================================
  // UPDATE VOTER
  // =====================================================

  const updateVoter = async (event) => {
    event.preventDefault();

    if (
      !selectedVoter?.profile?.voterId
    ) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData(
        event.currentTarget
      );

      const voterId =
        selectedVoter.profile.voterId;

      const voterData = {
        name:
          formData
            .get("name")
            .trim(),

        email:
          formData
            .get("email")
            .trim(),

        gender:
          formData.get("gender"),

        age: Number(
          formData.get("age")
        ),

        rfidUid:
          formData
            .get("rfidUid")
            .trim(),

        fingerprintTemplate:
          formData
            .get(
              "fingerprintTemplate"
            )
            ?.trim() || null,

        faceTemplate:
          formData.get("faceTemplate")?.trim() || undefined,
      };

      const response = await fetch(
        `${API_BASE}/voters/${encodeURIComponent(
          voterId
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            voterData
          ),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to update voter"
        );
      }

      setSuccess(
        "Voter updated successfully."
      );

      setShowEdit(false);
      setSelectedVoter(null);

      await fetchVoters();
    } catch (err) {
      console.error(
        "Update voter error:",
        err
      );

      setError(
        err.message ||
        "Unable to update voter"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // DELETE VOTER
  // =====================================================

  const deleteVoter = async (
    voterId
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete voter ${voterId}?`
      );

    if (!confirmed) {
      return;
    }

    setOpenMenu(null);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE}/voters/${encodeURIComponent(
          voterId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to delete voter"
        );
      }

      setSuccess(
        "Voter deleted successfully."
      );

      await fetchVoters();
    } catch (err) {
      console.error(
        "Delete voter error:",
        err
      );

      setError(
        err.message ||
        "Unable to delete voter"
      );
    }
  };

  // =====================================================
  // EXPORT
  // =====================================================

  const exportVoters = () => {
    if (!filteredVoters.length) {
      setError(
        "There are no voters to export."
      );
      return;
    }

    const headers = [
      "Voter ID",
      "Name",
      "Email",
      "Gender",
      "Age",
      "RFID UID",
      "Fingerprint",
      "Face",
      "Vote Status",
    ];

    const rows =
      filteredVoters.map(
        (voter) => {
          const profile =
            voter.profile || {};

          const credentials =
            voter.credentials ||
            {};

          const status =
            getVoterStatus(
              voter
            );

          return [
            profile.voterId || "",
            profile.name || "",
            profile.email || "",
            profile.gender || "",
            profile.age || "",
            credentials.rfidUid ||
            "",

            credentials.fingerprintTemplate
              ? "Enrolled"
              : "Not Enrolled",

            credentials.faceTemplate
              ? "Enrolled"
              : "Not Enrolled",

            status?.hasVoted
              ? "Voted"
              : "Not Voted",
          ];
        }
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "voters.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );

    setSuccess(
      "Voter data exported successfully."
    );
  };

  // =====================================================
  // VOTE STATUS
  // =====================================================

  const getVoteStatusLabel = (
    voter
  ) => {
    const status =
      getVoterStatus(voter);

    return status?.hasVoted
      ? "Voted"
      : "Not Voted";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* PAGE HEADER */}

      <div className="page-heading">
        <div>
          <h1>Voters</h1>

          <p>
            Register, search and
            manage voters in the
            election system.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary-btn"
            onClick={exportVoters}
          >
            <Download size={17} />
            Export
          </button>

          <button
            className="primary-btn"
            onClick={() => {
              setError("");
              setSuccess("");
              setFaceCaptured(false);
              setFaceTemplate([]);
              setShowRegister(true);
            }}
          >
            <UserPlus size={17} />
            Register Voter
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="info-box"
          style={{
            marginBottom: "18px",
            borderColor: "#ef4444",
          }}
        >
          <span>{error}</span>

          <button
            className="icon-btn"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          className="info-box"
          style={{
            marginBottom: "18px",
            borderColor: "#22c55e",
          }}
        >
          <span>{success}</span>

          <button
            className="icon-btn"
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="stats-grid compact">
        <div className="mini-card">
          <span>Total voters</span>

          <strong>
            {statistics.total}
          </strong>
        </div>

        <div className="mini-card">
          <span>Voted</span>

          <strong>
            {loadingVotes
              ? "..."
              : statistics.voted}
          </strong>
        </div>

        <div className="mini-card">
          <span>Not voted</span>

          <strong>
            {loadingVotes
              ? "..."
              : statistics.notVoted}
          </strong>
        </div>
      </div>

      {/* TABLE */}

      <section className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              placeholder="Search by voter ID, name, email or RFID..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <select
              className="filter-pill"
              value={selectedElection}
              onChange={(event) =>
                setSelectedElection(
                  event.target.value
                )
              }
              disabled={
                loadingElections
              }
            >
              <option value="">
                Select Election
              </option>

              {elections.map(
                (election) => (
                  <option
                    key={
                      election.electionId
                    }
                    value={
                      election.electionId
                    }
                  >
                    {election.title} (
                    {election.status})
                  </option>
                )
              )}
            </select>

            <button
              className="icon-btn"
              title="Refresh voters"
              onClick={() => {
                setError("");
                setSuccess("");

                fetchVoters();
                fetchVoteCount(
                  selectedElection
                );
              }}
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div
              style={{
                padding: "50px",
                textAlign: "center",
              }}
            >
              Loading voters...
            </div>
          ) : filteredVoters.length === 0 ? (
            <div
              style={{
                padding: "50px",
                textAlign: "center",
              }}
            >
              <UserPlus
                size={35}
                style={{
                  opacity: 0.5,
                  marginBottom: "10px",
                }}
              />

              <h3>No voters found</h3>

              <p>
                {search
                  ? "No voters match your search."
                  : "No voters have been registered yet."}
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Voter</th>
                  <th>Voter ID</th>
                  <th>Vote Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredVoters.map((voter) => {
                  const profile = voter.profile || {};

                  return (
                    <tr key={profile.voterId}>
                      {/* VOTER */}
                      <td>
                        <div className="person-cell">
                          <div className="small-avatar">
                            {profile.name
                              ?.charAt(0)
                              ?.toUpperCase() || "V"}
                          </div>

                          <div>
                            <strong>
                              {profile.name || "Unknown"}
                            </strong>

                            <small>
                              {profile.email || "-"}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* VOTER ID */}
                      <td>
                        <code>
                          {profile.voterId || "-"}
                        </code>
                      </td>

                      {/* VOTE STATUS */}
                      <td>
                        <StatusBadge
                          status={getVoteStatusLabel(voter)}
                        />
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div
                          style={{
                            position: "relative",
                          }}
                        >
                          <button
                            className="icon-btn"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === profile.voterId
                                  ? null
                                  : profile.voterId
                              )
                            }
                          >
                            <MoreVertical size={17} />
                          </button>

                          {openMenu === profile.voterId && (
                            <div
                              className="action-menu"
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "38px",
                                zIndex: 20,
                                minWidth: "150px",
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "10px",
                                boxShadow:
                                  "0 10px 25px rgba(0,0,0,0.12)",
                                padding: "6px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(voter)
                                }
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "9px 10px",
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  borderRadius: "7px",
                                }}
                              >
                                <Pencil size={15} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteVoter(
                                    profile.voterId
                                  )
                                }
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "9px 10px",
                                  border: "none",
                                  background: "transparent",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  borderRadius: "7px",
                                }}
                              >
                                <Trash2 size={15} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* =====================================================
          REGISTER VOTER
          ===================================================== */}

      {showRegister && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  Register Voter
                </h2>

                <p>
                  Add voter information
                  and verification
                  credentials.
                </p>
              </div>

              <button
                className="icon-btn"
                onClick={() => {
                  stopFaceCamera();
                  setFaceCaptured(false);
                  setFaceTemplate([]);
                  setCapturedImage("");
                  setShowRegister(false);
                }}
              >
                <X />
              </button>
            </div>

            <form
              onSubmit={
                registerVoter
              }
            >
              <h3>
                Personal Information
              </h3>

              <div className="form-grid">
                <label>
                  Full name

                  <input
                    name="name"
                    required
                    placeholder="Enter full name"
                  />
                </label>

                <label>
                  Email

                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="voter@example.com"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Voter ID

                  <input
                    name="voterId"
                    required
                    placeholder="V001"
                  />
                </label>

                <label>
                  Age

                  <input
                    name="age"
                    type="number"
                    min="18"
                    required
                    placeholder="18"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Gender

                  <select
                    name="gender"
                    required
                    defaultValue=""
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </label>

                <label>
                  Election

                  <select
                    name="electionId"
                    required
                    defaultValue={
                      selectedElection ||
                      ""
                    }
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select election
                    </option>

                    {elections.map(
                      (election) => (
                        <option
                          key={
                            election.electionId
                          }
                          value={
                            election.electionId
                          }
                        >
                          {
                            election.title
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <h3
                style={{
                  marginTop:
                    "24px",
                }}
              >
                Verification
                Credentials
              </h3>

              <div className="form-grid">
                <label>
                  RFID UID

                  <input
                    name="rfidUid"
                    required
                    placeholder="RFID001"
                  />
                </label>

                <label>
                  Fingerprint
                  Template

                  <input
                    name="fingerprintTemplate"
                    placeholder="Enter fingerprint template"
                  />
                </label>
              </div>

              <div>
                <label>Face Capture</label>

                <div
                  style={{
                    marginTop: "8px",
                    padding: "14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "#f8fafc",
                  }}
                >
                  {/* Live camera preview */}

                  {/* CAMERA PREVIEW */}
                  <div
                    style={{
                      width: "286px",
                      height: "210px",
                      margin: "0 auto 12px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "#111827",
                    }}
                  >
                    {capturedImage ? (
                      <img
                        src={capturedImage}
                        alt="Captured face"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transform: "scaleX(-1)",
                        }}
                      />
                    ) : cameraStream ? (
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
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#9ca3af",
                          fontSize: "13px",
                        }}
                      >
                        Camera preview
                      </div>
                    )}
                  </div>

                  {/* STATUS TEXT */}
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "12px",
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    {capturedImage
                      ? "Face captured successfully."
                      : cameraStream
                        ? "Position your face clearly inside the camera frame."
                        : "Open the camera to see the live preview."}
                  </div>

                  {/* BUTTONS */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    {!cameraStream && !capturedImage && (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={startFaceCamera}
                        disabled={faceCapturing || submitting}
                      >
                        <ScanFace size={17} />
                        Open Camera
                      </button>
                    )}

                    {cameraStream && !capturedImage && (
                      <>
                        <button
                          type="button"
                          className="primary-btn"
                          onClick={handleFaceEnrollment}
                          disabled={faceCapturing || submitting}
                        >
                          <ScanFace size={17} />
                          {faceCapturing
                            ? "Capturing..."
                            : "Capture Face"}
                        </button>

                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={stopFaceCamera}
                          disabled={faceCapturing || submitting}
                        >
                          Close Camera
                        </button>
                      </>
                    )}

                    {capturedImage && (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setCapturedImage("");
                          setFaceCaptured(false);
                          setFaceTemplate([]);
                          startFaceCamera();
                        }}
                        disabled={submitting}
                      >
                        Retake
                      </button>
                    )}
                  </div>

                </div>

                <div className="info-box">
                  <Fingerprint
                    size={18}
                  />

                  <span>
                    RFID, fingerprint and
                    face credentials are
                    stored separately from
                    personal voter data.
                  </span>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {

                      stopFaceCamera();
                      setFaceCaptured(false);
                      setFaceTemplate([]);
                      setCapturedImage("");
                      setShowRegister(false);

                    }}
                    disabled={
                      submitting
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={
                      submitting
                    }
                  >
                    <UserPlus
                      size={17}
                    />

                    {submitting
                      ? "Registering..."
                      : "Register Voter"}
                  </button>
                </div>
              </div>
            </form>
          </div >
        </div >
      )
      }

      {/* =====================================================
          EDIT VOTER
          ===================================================== */}

      {
        showEdit &&
        selectedVoter && (
          <div className="modal-backdrop">
            <div className="modal">
              <div className="modal-header">
                <div>
                  <h2>
                    Edit Voter
                  </h2>

                  <p>
                    Update voter
                    information and
                    verification
                    credentials.
                  </p>
                </div>

                <button
                  className="icon-btn"
                  onClick={() => {
                    setShowEdit(
                      false
                    );

                    setSelectedVoter(
                      null
                    );
                  }}
                >
                  <X />
                </button>
              </div>

              <form
                onSubmit={
                  updateVoter
                }
              >
                <div className="form-grid">
                  <label>
                    Voter ID

                    <input
                      value={
                        selectedVoter
                          .profile
                          ?.voterId ||
                        ""
                      }
                      disabled
                    />
                  </label>

                  <label>
                    Full name

                    <input
                      name="name"
                      required
                      defaultValue={
                        selectedVoter
                          .profile
                          ?.name ||
                        ""
                      }
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Email

                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={
                        selectedVoter
                          .profile
                          ?.email ||
                        ""
                      }
                    />
                  </label>

                  <label>
                    Age

                    <input
                      name="age"
                      type="number"
                      min="18"
                      required
                      defaultValue={
                        selectedVoter
                          .profile
                          ?.age ||
                        ""
                      }
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Gender

                    <select
                      name="gender"
                      required
                      defaultValue={
                        selectedVoter
                          .profile
                          ?.gender ||
                        ""
                      }
                    >
                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </label>

                  <label>
                    RFID UID

                    <input
                      name="rfidUid"
                      required
                      defaultValue={
                        selectedVoter
                          .credentials
                          ?.rfidUid ||
                        ""
                      }
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Fingerprint
                    Template

                    <input
                      name="fingerprintTemplate"
                      defaultValue={
                        selectedVoter
                          .credentials
                          ?.fingerprintTemplate ||
                        ""
                      }
                      placeholder="Fingerprint template"
                    />
                  </label>

                  <label>
                    Face Template

                    <input
                      name="faceTemplate"
                      defaultValue={
                        selectedVoter
                          .credentials
                          ?.faceTemplate ||
                        ""
                      }
                      placeholder="Face template"
                    />
                  </label>
                </div>

                <div className="info-box">
                  <ScanFace
                    size={18}
                  />

                  <span>
                    Existing credential
                    values are loaded
                    from voter_credentials.
                    Leave them unchanged
                    if you do not want to
                    replace them.
                  </span>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setShowEdit(
                        false
                      );

                      setSelectedVoter(
                        null
                      );
                    }}
                    disabled={
                      submitting
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={
                      submitting
                    }
                  >
                    <Pencil
                      size={17}
                    />

                    {submitting
                      ? "Updating..."
                      : "Update Voter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </>
  );
}