const BASE_URL = "";

// Function to calculate "time ago" from a timestamp
function timeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000); // Milliseconds to minutes
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

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
                item.querySelector(".location-header").innerHTML = `${location}: ${statusText} <span>${timeText}</span> <button class="history-toggle">▼ History</button>`;
            });
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

// Function to fetch and render history
function renderHistory(location, listElement) {
    fetch(`${BASE_URL}/api/history/${encodeURIComponent(location)}`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch history");
            return response.json();
        })
        .then(history => {
            listElement.innerHTML = ""; // Clear previous list
            if (history.length === 0) {
                listElement.innerHTML = "<li>No history yet</li>";
            } else {
                history.forEach(report => {
                    const li = document.createElement("li");
                    li.textContent = `${report.status} - ${new Date(report.timestamp).toLocaleString()} (${timeAgo(report.timestamp)})`;
                    listElement.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error("Error fetching history:", error);
            listElement.innerHTML = "<li>Failed to load history</li>";
        });
}

// Function to toggle history visibility
function attachHistoryListeners() {
    document.querySelectorAll(".history-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const list = button.parentElement.nextElementSibling; // .history-list
            const isVisible = list.style.display === "block";
            list.style.display = isVisible ? "none" : "block";
            button.textContent = isVisible ? "▼ History" : "▲ History";
            button.classList.toggle("active", !isVisible);

            // Fetch history only if opening and not yet loaded
            if (!isVisible && !list.dataset.loaded) {
                const location = button.closest("[data-location]").dataset.location;
                renderHistory(location, list);
                list.dataset.loaded = "true"; // Mark as loaded
            }
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