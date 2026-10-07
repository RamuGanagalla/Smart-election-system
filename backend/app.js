const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const adminRoutes = require("./routes/adminRoutes");
const electionRoutes = require("./routes/electionRoutes.js");
const voterRoutes = require("./routes/voterRoutes.js");
const candidateRoutes = require("./routes/candidateRoutes");
const voteRoutes = require("./routes/voteRoutes");
const faceRoutes = require("./routes/faceRoutes");
const connectDB = require("./config/db");


const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/voters", voterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/voters", faceRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "Smart Election System API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});