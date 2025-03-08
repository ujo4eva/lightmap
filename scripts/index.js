const BASE_URL = "";

// Function to fetch and render latest statuses
function fetchAndRenderStatuses() {
    fetch(`${BASE_URL}/api/status`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch statuses");
            return response.json();
        })
        .then(data => {
            const locationsDiv = document.getElementById("locations");
            const items = locationsDiv.querySelectorAll("[data-location]");
            items.forEach(item => {
                const location = item.dataset.location;
                const report = data[location] || { status: "Unknown", timestamp: null };
                const statusText = report.status;
                const timeText = report.timestamp ? `(Updated: ${new Date(report.timestamp).toLocaleTimeString()})` : "";
                item.innerHTML = `${location}: ${statusText} <span>${timeText}</span> <button class="history-btn">History</button>`;
            });
            // Reattach history button listeners after DOM update
            attachHistoryListeners();
        })
        .catch(error => console.error("Error fetching statuses:", error));
}

// Function to submit a new report
function submitReport(location, status) {
    fetch(`${BASE_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, status })
    })
        .then(response => {
            if (!response.ok) throw new Error("Failed to submit report");
            return response.json();
        })
        .then(() => fetchAndRenderStatuses())
        .catch(error => console.error("Error submitting report:", error));
}

// Function to fetch and show history
function showHistory(location) {
    fetch(`${BASE_URL}/api/history/${encodeURIComponent(location)}`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch history");
            return response.json();
        })
        .then(history => {
            if (history.length === 0) {
                alert(`No history yet for ${location}`);
                return;
            }
            const historyText = history.map(report => 
                `${report.status} - ${new Date(report.timestamp).toLocaleString()}`
            ).join("\n");
            alert(`History for ${location}:\n\n${historyText}`);
        })
        .catch(error => {
            console.error("Error fetching history:", error);
            alert("Couldn’t load history—try again!");
        });
}

// Function to attach history button listeners
function attachHistoryListeners() {
    document.querySelectorAll(".history-btn").forEach(button => {
        button.addEventListener("click", () => {
            const location = button.parentElement.dataset.location;
            showHistory(location);
        });
    });
}

// Wire up the report buttons
document.querySelectorAll(".power-on, .power-off").forEach(button => {
    button.addEventListener("click", () => {
        const location = document.querySelector("select").value;
        const status = button.textContent;
        submitReport(location, status);
    });
});

// Initial render
fetchAndRenderStatuses();