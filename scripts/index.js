const BASE_URL = "";

// Function to calculate "time ago" from a timestamp
function timeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
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
            const items = document.querySelectorAll("[data-location]");
            items.forEach(item => {
                const location = item.dataset.location;
                const report = data[location] || { status: "Unknown", timestamp: null };
                const statusText = report.status;
                const timeText = report.timestamp ? `(Updated: ${new Date(report.timestamp).toLocaleTimeString()})` : "";
                // Update only the status part, preserve button and list
                const header = item.querySelector(".location-header");
                const button = header.querySelector(".history-toggle") || document.createElement("button");
                if (!button.classList.contains("history-toggle")) {
                    button.className = "history-toggle";
                    button.textContent = "▼ History";
                    header.appendChild(button);
                }
                header.firstChild.textContent = `${location}: ${statusText} `;
                const span = header.querySelector("span") || document.createElement("span");
                span.textContent = timeText;
                if (!header.contains(span)) header.insertBefore(span, button);
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
            listElement.innerHTML = "";
            if (history.length === 0) {
                listElement.innerHTML = "<li>No history yet</li>";
            } else {
                history.forEach(report => {
                    const li = document.createElement("li");
                    li.textContent = `${report.status} - ${new Date(report.timestamp).toLocaleString()} (${timeAgo(report.timestamp)})`;
                    li.classList.add(report.status === "Power On" ? "status-on" : "status-off");
                    listElement.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error("Error fetching history:", error);
            listElement.innerHTML = "<li>Failed to load history</li>";
        });
}

// Function to update "time ago" dynamically
function updateTimeAgo() {
    document.querySelectorAll(".history-list.visible").forEach(list => {
        const location = list.closest("[data-location]").dataset.location;
        renderHistory(location, list);
    });
}

// Function to toggle history visibility
function attachHistoryListeners() {
    console.log("Attaching history listeners...");
    document.querySelectorAll(".history-toggle").forEach(button => {
        button.addEventListener("click", () => {
            console.log("History toggle clicked!");
            const list = button.parentElement.nextElementSibling;
            const isVisible = list.classList.contains("visible");
            list.classList.toggle("visible", !isVisible);
            button.textContent = isVisible ? "▼ History" : "▲ History";
            button.classList.toggle("active", !isVisible);

            if (!isVisible && !list.dataset.loaded) {
                const location = button.closest("[data-location]").dataset.location;
                renderHistory(location, list);
                list.dataset.loaded = "true";
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

// Auto-update "time ago" every 30s
setInterval(updateTimeAgo, 30000);