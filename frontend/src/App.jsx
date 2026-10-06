import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "./pages/Welcome";
import Fingerprint from "./pages/Fingerprint";
import FaceVerification from "./pages/FaceVerification";
import Voting from "./pages/Voting";
import Confirmation from "./pages/Confirmation";
import Success from "./pages/Success";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>

          <Route path="/" element={<Welcome />} />

          <Route
            path="/fingerprint"
            element={<Fingerprint />}
          />

          <Route
            path="/face"
            element={<FaceVerification />}
          />

          <Route
            path="/voting"
            element={<Voting />}
          />

          <Route
            path="/confirmation"
            element={<Confirmation />}
          />

          <Route
            path="/success"
            element={<Success />}
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;