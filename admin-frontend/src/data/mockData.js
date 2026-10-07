export const elections = [
  {
    id: "EL-2026-001",
    name: "College Student Council Election 2026",
    date: "10 Oct 2026 – 12 Oct 2026",
    status: "Active",
    voters: 850,
    votes: 632,
    turnout: 74.35,
  },
  {
    id: "EL-2026-002",
    name: "Department Representative Election",
    date: "18 Nov 2026 – 19 Nov 2026",
    status: "Upcoming",
    voters: 420,
    votes: 0,
    turnout: 0,
  },
  {
    id: "EL-2025-004",
    name: "Student Union Election 2025",
    date: "05 Oct 2025 – 07 Oct 2025",
    status: "Ended",
    voters: 790,
    votes: 688,
    turnout: 87.09,
  },
];

export const voters = [
  { id: "V001", name: "Ramu", email: "ramu@example.com", rfid: "RFID001", status: "Not Voted" },
  { id: "V002", name: "Arun", email: "arun@example.com", rfid: "RFID002", status: "Voted" },
  { id: "V003", name: "Ravi", email: "ravi@example.com", rfid: "RFID003", status: "Not Voted" },
  { id: "V004", name: "Kiran", email: "kiran@example.com", rfid: "RFID004", status: "Voted" },
  { id: "V005", name: "Suresh", email: "suresh@example.com", rfid: "RFID005", status: "Not Voted" },
  { id: "V006", name: "Priya", email: "priya@example.com", rfid: "RFID006", status: "Voted" },
];

export const candidates = [
  { id: "C001", name: "Candidate A", group: "Progressive Group", symbol: "🌳", election: "College Student Council Election 2026", votes: 280 },
  { id: "C002", name: "Candidate B", group: "Student Alliance", symbol: "⭐", election: "College Student Council Election 2026", votes: 210 },
  { id: "C003", name: "Candidate C", group: "Unity Group", symbol: "🪷", election: "College Student Council Election 2026", votes: 142 },
];