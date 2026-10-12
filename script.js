// 1. Sidebar Navigation
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('.content-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        const target = link.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
    });
});

// API Key Storage handling
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');

// Load saved key if present
if (localStorage.getItem('gemini_api_key')) {
    apiKeyInput.value = localStorage.getItem('gemini_api_key');
}

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        alert('API Key saved securely in your browser!');
    } else {
        localStorage.removeItem('gemini_api_key');
        alert('API Key cleared.');
    }
});

// 2. Multi-Image Upload & Preview Handling
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const thumbnailsContainer = document.getElementById('thumbnails-container');
const clearImgsBtn = document.getElementById('clear-imgs-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const statusText = document.getElementById('status-text');
const resultsCard = document.getElementById('results-card');
const detectedWeakList = document.getElementById('detected-weak-list');
const analysisSummary = document.getElementById('analysis-summary');
const latestScoreDisplay = document.getElementById('latest-score');
const sendToVaultBtn = document.getElementById('send-to-vault-btn');

let selectedFiles = [];
let currentAnalysisWeakSpots = [];

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#4f46e5';
});

dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#cbd5e1';
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#cbd5e1';
    handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        if (selectedFiles.length < 10) { // Limit up to 10 files
            selectedFiles.push(files[i]);
        }
    }
    renderThumbnails();
}

function renderThumbnails() {
    thumbnailsContainer.innerHTML = '';
    if (selectedFiles.length > 0) {
        dropzone.style.display = 'none';
        previewArea.style.display = 'block';

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'thumbnail-item';
                div.innerHTML = `<img src="${e.target.result}" alt="Thumbnail ${index + 1}">`;
                thumbnailsContainer.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    } else {
        previewArea.style.display = 'none';
        dropzone.style.display = 'block';
    }
}

clearImgsBtn.addEventListener('click', () => {
    selectedFiles = [];
    fileInput.value = '';
    renderThumbnails();
    resultsCard.style.display = 'none';
    statusText.textContent = '';
});

// Helper to convert File to base64
function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 3. Direct Gemini API Multi-Image Analysis Engine
analyzeBtn.addEventListener('click', async () => {
    const apiKey = localStorage.getItem('gemini_api_key') || apiKeyInput.value.trim();
    const testName = document.getElementById('test-name-input').value || 'Allen Test Assessment';

    if (!apiKey) {
        alert('Please enter and save your Gemini API key in the Dashboard first.');
        document.querySelector('[data-target="dashboard"]').click();
        return;
    }

    if (selectedFiles.length === 0) {
        alert('Please upload at least one test screenshot.');
        return;
    }

    statusText.textContent = `Preparing ${selectedFiles.length} image(s) for Gemini AI...`;
    analyzeBtn.disabled = true;

    try {
        // Convert all selected images to base64 parts
        const imageParts = await Promise.all(selectedFiles.map(fileToGenerativePart));

        statusText.textContent = 'Sending to Gemini AI for deep analysis...';

        const promptText = `Analyze these ${selectedFiles.length} test screenshot(s) from an Allen coaching exam ("${testName}"). 
Identify specific weak topics, conceptual mistakes, or recurring error patterns. 
Return your answer strictly as a JSON object with two fields:
1. "weakSpots": an array of short, clear strings describing each weak topic or mistake to review.
2. "summary": a brief 1-sentence summary of overall performance.`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: promptText },
                        ...imageParts
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const rawJsonText = data.candidates[0].content.parts[0].text;
        const resultJson = JSON.parse(rawJsonText);

        currentAnalysisWeakSpots = resultJson.weakSpots || [];

        // Render results
        detectedWeakList.innerHTML = '';
        currentAnalysisWeakSpots.forEach(spot => {
            const li = document.createElement('li');
            li.textContent = spot;
            detectedWeakList.appendChild(li);
        });

        analysisSummary.textContent = resultJson.summary || `Analyzed ${selectedFiles.length} files successfully.`;
        latestScoreDisplay.textContent = testName;
        resultsCard.style.display = 'block';
        statusText.textContent = 'Analysis Complete!';

    } catch (err) {
        console.error(err);
        statusText.textContent = 'Error during API analysis. Check your API key and try again.';
    } finally {
        analyzeBtn.disabled = false;
    }
});

// 4. Mistake Vault Integration
const addMistakeBtn = document.getElementById('add-mistake-btn');
const mistakeInput = document.getElementById('mistake-input');
const mistakeList = document.getElementById('mistake-list');
const weakCountDisplay = document.getElementById('weak-count');

let mistakeCount = 0;

function addMistake(text) {
    if (text.trim() !== "") {
        const li = document.createElement('li');
        li.textContent = text;

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.className = 'btn-secondary';
        deleteBtn.style.padding = '0.25rem 0.5rem';
        deleteBtn.onclick = () => {
            li.remove();
            mistakeCount = Math.max(0, mistakeCount - 1);
            weakCountDisplay.textContent = mistakeCount;
        };

        li.appendChild(deleteBtn);
        mistakeList.appendChild(li);
        mistakeCount++;
        weakCountDisplay.textContent = mistakeCount;
    }
}

addMistakeBtn.addEventListener('click', () => {
    addMistake(mistakeInput.value);
    mistakeInput.value = '';
});

sendToVaultBtn.addEventListener('click', () => {
    currentAnalysisWeakSpots.forEach(spot => addMistake(spot));
    alert('Extracted weak topics sent straight to your Mistake Vault!');
    document.querySelector('[data-target="mistakes"]').click();
});
