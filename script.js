// 1. Sidebar Tab Switching Logic
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

// 2. Screenshot Analyzer Logic
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const imagePreview = document.getElementById('image-preview');
const removeImgBtn = document.getElementById('remove-img');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsCard = document.getElementById('results-card');
const detectedWeakList = document.getElementById('detected-weak-list');
const analysisSummary = document.getElementById('analysis-summary');
const latestScoreDisplay = document.getElementById('latest-score');
const sendToVaultBtn = document.getElementById('send-to-vault-btn');

let currentAnalysisWeakSpots = [];

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        showPreview(file);
    }
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
});

// Simulate AI analysis outcome when an image is processed
analyzeBtn.addEventListener('click', () => {
    const testName = document.getElementById('test-name-input').value || 'Allen Test Assessment';
    
    if (!fileInput.files[0]) {
        alert('Please upload a test screenshot first.');
        return;
    }

    analyzeBtn.textContent = 'Analyzing Screenshot...';
    
    setTimeout(() => {
        analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Test Screenshot';
        resultsCard.style.display = 'block';
        
        // Dynamic simulated smart findings based on test uploads
        currentAnalysisWeakSpots = [
            'Convex lens sign convention errors in optical formulas',
            'Calculation mistakes in stoichiometry mole concepts',
            'Algebraic rearrangement errors in quadratic equations'
        ];

        detectedWeakList.innerHTML = '';
        currentAnalysisWeakSpots.forEach(spot => {
            const li = document.createElement('li');
            li.textContent = spot;
            detectedWeakList.appendChild(li);
        });

        analysisSummary.textContent = `Analysis complete for "${testName}". Identified 3 primary areas of error requiring immediate revision.`;
        latestScoreDisplay.textContent = `${testName} (Analyzed)`;
    }, 1200);
});

// 3. Mistake Vault Logic & Integration
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
    alert('Weak topics successfully transferred to your Mistake Vault!');
    document.querySelector('[data-target="mistakes"]').click();
});
