const express = require("express");
const app = express();

app.use(express.json());

let powerReports = [];

app.get("/api/status", (req, res) => {
    const latestStatuses = {};
    powerReports.forEach(report => {
        latestStatuses[report.location] = {
            status: report.status,
            timestamp: report.timestamp
        };
    });
    res.json(latestStatuses);
});

app.post("/api/report", (req, res) => {
    const { location, status } = req.body;
    if (!location || !status) {
        return res.status(400).json({ error: "Missing location or status" });
    }
    const timestamp = new Date().toISOString();
    powerReports.push({ location, status, timestamp });
    res.status(201).json({ message: "Report added", location, status, timestamp });
});

app.get("/api/history/:location", (req, res) => {
    const location = req.params.location;
    const history = powerReports.filter(report => report.location === location);
    res.json(history);
});

// Export for Vercel
module.exports = app;