async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    const loadingDiv = document.getElementById("loading");
    const resultDiv = document.getElementById("result");

    if (!file) {
        alert("Please select a file first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Show loading animation
    loadingDiv.classList.remove("hidden");
    resultDiv.textContent = "Processing file...";

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Error uploading file.");
        }

        const data = await response.json();
        resultDiv.textContent = data.content || "No text found in the file.";
    } catch (error) {
        resultDiv.textContent = "Error: " + error.message;
    } finally {
        // Hide loading animation after request completes
        loadingDiv.classList.add("hidden");
    }
}
