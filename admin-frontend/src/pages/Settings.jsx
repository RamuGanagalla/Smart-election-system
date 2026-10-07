import { Save, Shield, Server, KeyRound, Building2 } from "lucide-react";

export default function Settings() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage administrator, election system and security preferences.</p>
        </div>
        <button className="primary-btn"><Save size={17}/> Save Changes</button>
      </div>

      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="panel-header">
            <div><h3>Administrator Profile</h3><p>Basic administrator information</p></div>
            <Shield size={20}/>
          </div>
          <div className="form-grid">
            <label>Full name<input defaultValue="Administrator"/></label>
            <label>Email address<input defaultValue="admin@smartelection.com"/></label>
          </div>
          <label>Role<input defaultValue="Super Administrator" disabled/></label>
          <button className="secondary-btn"><KeyRound size={16}/> Change Password</button>
        </section>

        <section className="panel settings-panel">
          <div className="panel-header">
            <div><h3>Election System</h3><p>Basic institution and election configuration</p></div>
            <Building2 size={20}/>
          </div>
          <label>Institution name<input defaultValue="MVGR College of Engineering"/></label>
          <label>System name<input defaultValue="Smart Election System"/></label>
          <div className="form-grid">
            <label>Voting start time<input type="time" defaultValue="09:00"/></label>
            <label>Voting end time<input type="time" defaultValue="17:00"/></label>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="panel-header">
            <div><h3>Security & System Status</h3><p>Monitor core services and security controls</p></div>
            <Server size={20}/>
          </div>
          <div className="system-row"><div><strong>Admin authentication</strong><span>Protected by password hashing</span></div><b className="system-ok">Active</b></div>
          <div className="system-row"><div><strong>Backend API</strong><span>Node.js / Express service</span></div><b className="system-ok">Online</b></div>
          <div className="system-row"><div><strong>Database</strong><span>MongoDB election database</span></div><b className="system-ok">Connected</b></div>
          <div className="system-row"><div><strong>Vote integrity</strong><span>SHA-256 vote hash verification</span></div><b className="system-ok">Enabled</b></div>
        </section>
      </div>
    </>
  );
}
