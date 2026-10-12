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

// 2. Test Score Logger Logic
const testForm = document.getElementById('test-form');
const latestScoreDisplay = document.getElementById('latest-score');

if (testForm) {
    testForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const testName = document.getElementById('test-name').value;
        const subject = document.getElementById('test-subject').value;
        const score = document.getElementById('score-obtained').value;
        latestScoreDisplay.textContent = `${score} (${subject})`;
        alert(`Score logged successfully for ${testName}!`);
        testForm.reset();
        document.querySelector('[data-target="dashboard"]').click();
    });
}

// 3. Mistake Vault Logic
const addMistakeBtn = document.getElementById('add-mistake-btn');
const mistakeInput = document.getElementById('mistake-input');
const mistakeList = document.getElementById('mistake-list');
const weakCountDisplay = document.getElementById('weak-count');

let mistakeCount = 0;

if (addMistakeBtn) {
    addMistakeBtn.addEventListener('click', () => {
        const text = mistakeInput.value.trim();
        if (text !== "") {
            const li = document.createElement('li');
            li.textContent = text;
            mistakeList.appendChild(li);
            mistakeCount++;
            weakCountDisplay.textContent = mistakeCount;
            mistakeInput.value = "";
        }
    });
}
