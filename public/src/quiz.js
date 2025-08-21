const quizData = [
    {
        q: 'Favorite donkey?',
        a: 'Srip',
        c: ['Srip', 'Eeyore', 'Donkey (Shrek)']
    },
    {
        q: 'Favorite food?',
        a: 'Anything healthy (we are dieting!)',
        c: ['Biryani', 'Anything healthy (we are dieting!)', 'Only desserts']
    },
    {
        q: 'Favorite emoji?',
        a: '🥰',
        c: ['😂', '🥰', '🪔']
    },
    {
        q: 'Favorite drink?',
        a: 'Coffee',
        c: ['Tea', 'Coffee', 'Buttermilk']
    },
    {
        q: 'What would we be doing on a boring day?',
        a: 'Run! and eat!',
        c: ['Scroll endlessly', 'Run! and eat!', 'Sleep']
    }
];

const quizForm = document.getElementById('quizForm');
const scoreEl = document.getElementById('score');
const resEl = document.getElementById('quizResult');

function renderQuiz() {
    quizForm.innerHTML = quizData.map((item, idx) => {
        const name = `q_${idx}`;
        return `
            <div class="q">
                <h4>${idx + 1}. ${item.q}</h4>
                <div class="choices">
                    ${item.c.map(opt =>
                        `<label><input type="radio" name="${name}" value="${opt}"> ${opt}</label>`
                    ).join('')}
                </div>
            </div>
        `;
    }).join('');
}

renderQuiz();

function getScore() {
    let s = 0;
    quizData.forEach((item, i) => {
        const chosen = quizForm.querySelector(`input[name="q_${i}"]:checked`);
        if (chosen && chosen.value === item.a) s++;
    });
    return s;
}

document.getElementById('submitQuiz').addEventListener('click', () => {
    const s = getScore();
    scoreEl.textContent = s;
    resEl.textContent =
        s >= 4 ? '🔥 winner! you know the sisters.' :
        s >= 2 ? '👍 good but try again!' :
        '😅 read the bios and retry.';
});

document.getElementById('resetQuiz').addEventListener('click', () => {
    renderQuiz();
    scoreEl.textContent = '0';
    resEl.textContent = '';
});
