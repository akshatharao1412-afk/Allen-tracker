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

// 2. Image Drag & Drop / Preview
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const imagePreview = document.getElementById('image-preview');
const removeImgBtn = document.getElementById('remove-img');
const analyzeBtn = document.getElementById('analyze-btn');
const statusText = document.getElementById('status-text');
const resultsCard = document.getElementById('results-card');
const detectedWeakList = document.getElementById('detected-weak-list');
const analysisSummary = document.getElementById('analysis-summary');
const latestScoreDisplay = document.getElementById('latest-score');
const sendToVaultBtn = document.getElementById('send-to-vault-btn');

let currentAnalysisWeakSpots = [];

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showPreview(file);
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
    const file = e.dataTransfer.files[0];
    if (file) {
        fileInput.files = e.dataTransfer.files;
        showPreview(file);
    }
});

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        dropzone.style.display = 'none';
        previewArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

removeImgBtn.addEventListener('click', () => {
    fileInput.value = '';
    imagePreview.src = '';
    previewArea.style.display = 'none';
    dropzone.style.display = 'block';
    resultsCard.style.display = 'none';
    statusText.textContent = '';
});

// 3. Client-Side Image OCR Analysis Engine
analyzeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const testName = document.getElementById('test-name-input').value || 'Allen Practice Test';

    if (!file) {
        alert('Please select or drop a screenshot image first.');
        return;
    }

    statusText.textContent = 'Scanning image text... (this takes a few seconds)';
    analyzeBtn.disabled = true;

    try {
        // Run client-side Tesseract OCR on the uploaded image
        const result = await Tesseract.recognize(file, 'eng');
        const extractedText = result.data.text;

        statusText.textContent = 'Processing mistakes and topic keywords...';

        // Keywords to detect weak topics directly from scanned text
        const topicKeywords = [
            'lens', 'mirror', 'focal', 'refraction', 'reflection', 'optics',
            'acid', 'base', 'salt', 'reaction', 'equation', 'mole', 'stoichiometry',
            'triangle', 'similarity', 'quadratic', 'polynomial', 'algebra', 'force', 'motion',
            'incorrect', 'wrong', 'marks', 'attempted', 'negative'
        ];

        const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        currentAnalysisWeakSpots = [];

        // Search scanned lines for matching problem topics or numbers
        lines.forEach(line => {
            const lower = line.toLowerCase();
            topicKeywords.forEach(keyword => {
                if (lower.includes(keyword) && !currentAnalysisWeakSpots.includes(line)) {
                    if (line.length < 80) { // Keep clean concise lines
                        currentAnalysisWeakSpots.push(line);
                    }
                }
            });
        });

        // Fallback if the image text is purely symbols or clean numbers
        if (currentAnalysisWeakSpots.length === 0) {
            currentAnalysisWeakSpots = [
                `Review questions flagged in ${testName}`,
                'Re-check calculation steps and formula substitutions'
            ];
        }

        // Render extracted findings
        detectedWeakList.innerHTML = '';
        currentAnalysisWeakSpots.forEach(spot => {
            const li = document.createElement('li');
            li.textContent = spot;
            detectedWeakList.appendChild(li);
        });

        analysisSummary.textContent = `Scanned ${lines.length} lines of text directly from your screenshot. Found ${currentAnalysisWeakSpots.length} potential weak spot(s) to review.`;
        latestScoreDisplay.textContent = testName;
        resultsCard.style.display = 'block';
        statusText.textContent = 'Analysis Complete!';

    } catch (err) {
        console.error(err);
        statusText.textContent = 'Error reading image. Please ensure it is a clear image file.';
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
