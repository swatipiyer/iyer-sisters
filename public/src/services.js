const services = [
    {
        title: 'Emotional Support',
        desc: 'A listening ear for anything',
        tags: ['care', 'chat']
    },
    {
        title: 'Music Class',
        desc: 'Casual vocal practice, rāga basics & bhajans.',
        tags: ['sruti', 'tāla']
    },
    {
        title: 'Motivation Support',
        desc: 'The sisters will motivate you for anything',
        tags: ['goals', 'check-ins']
    },
    {
        title: 'Homework Accountability',
        desc: 'Study buddies who motivate you with boba!',
        tags: ['focus']
    },
    {
        title: 'Birthday Hype Video',
        desc: 'Customized birthday videos for your special day. If you think you can reach out to someone, WE WILL!',
        tags: ['surprise']
    },
    {
        title: 'Meal Services',
        desc: 'Are you ever hungry? Fear not, because the Iyer Sisters will feed you before they feed themselves!',
        tags: ['yum', 'care']
    }
];

const svcGrid = document.getElementById('svcGrid');
const svcOutput = document.getElementById('svcOutput');

function renderServices() {
    svcGrid.innerHTML = services.map((s, i) => `
        <article class="card" style="padding:14px">
            <h3>${s.title}</h3>
            <p class="tiny">${s.desc}</p>
            <div class="mt">
                ${s.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}
            </div>
            <button class="btn" data-i="${i}" style="margin-top:10px">I'm interested</button>
        </article>
    `).join('');
}

renderServices();

svcGrid.addEventListener('click', e => {
    if (e.target.matches('button[data-i]')) {
        const i = e.target.getAttribute('data-i');
        const key = 'iyer_requests';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        const chosen = services[i].title;
        if (!arr.includes(chosen)) arr.push(chosen);
        localStorage.setItem(key, JSON.stringify(arr));
        e.target.textContent = 'Saved ✓';
        e.target.disabled = true;
    }
});

document.getElementById('viewRequests').addEventListener('click', () => {
    const arr = JSON.parse(localStorage.getItem('iyer_requests') || '[]');
    svcOutput.textContent = arr.length
        ? 'You selected: ' + arr.join(', ')
        : 'No services selected yet.';
});

document.getElementById('clearRequests').addEventListener('click', () => {
    localStorage.removeItem('iyer_requests');
    svcOutput.textContent = 'Cleared.';
    [...svcGrid.querySelectorAll('button[data-i]')].forEach(b => {
        b.textContent = "I'm interested";
        b.disabled = false;
    });
});
