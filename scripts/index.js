// Use relative URLs since frontend and backend are on the same domain
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
                item.innerHTML = `${location}: ${statusText} <span>${timeText}</span>`;
            });
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
        .then(() => fetchAndRenderStatuses()) // Refresh the list after posting
        .catch(error => console.error("Error submitting report:", error));
}

// Wire up the buttons
document.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
        const location = document.querySelector("select").value;
        const status = button.textContent;
        submitReport(location, status);
    });
});

// Initial render
fetchAndRenderStatuses();