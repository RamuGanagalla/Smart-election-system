import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LockKeyhole, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(
      "http://localhost:3000/api/admin/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed");
      return;
    }

    sessionStorage.setItem(
      "admin",
      JSON.stringify(data.admin)
    );

    navigate("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    alert("Unable to connect to the server");
  }
};

  return (
    <div className="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />
      <div className="login-card">
        <div className="login-brand">
          <div className="login-mark"><ShieldCheck size={28}/></div>
          <div>
            <strong>SMART ELECTION</strong>
            <span>ADMIN PORTAL</span>
          </div>
        </div>
        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to manage your election system.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <div className="input-wrap"><Mail size={18}/><input type="email" 
          placeholder="admin@smartelection.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
           required /></div>
          <label>Password</label>
          <div className="input-wrap"><LockKeyhole size={18}/><input type={show ? "text" : "password"} placeholder="Enter password" 
          value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          <div className="login-options"><label className="checkbox-label"><input type="checkbox" /> Remember me</label><a href="#forgot">Forgot password?</a></div>
          <button className="primary-btn login-btn">Sign in <ArrowRight size={18}/></button>
        </form>
        <div className="login-footer"><ShieldCheck size={15}/> Protected administrator access</div>
      </div>
    </div>
  );
}