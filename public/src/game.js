(function () {
    const C = document.getElementById('feedCanvas');
    const ctx = C.getContext('2d');
    const gScoreEl = document.getElementById('gScore');
    const gBestEl = document.getElementById('gBest');
    const gTimeEl = document.getElementById('gTime');
    const gMsg = document.getElementById('gMsg');

    const sistersImg = new Image();
    sistersImg.src = './images/sisters-sprite.png';

    let sisters = { x: C.width / 2, y: C.height - 60, w: 95, h: 90 };
    let items = [];
    let score = 0;
    let best = parseInt(localStorage.getItem('iyer_feed_best') || '0');
    let playing = false;
    let timeLeft = 30;
    let raf = null;
    let clock = null;

    gBestEl.textContent = best || '—';

    function addItem() {
        const t = Math.random() < 0.15
            ? '🪨'
            : (Math.random() < 0.5 ? '🥗' : (Math.random() < 0.5 ? '🍎' : '☕'));
        items.push({
            x: Math.random() * (C.width - 24) + 12,
            y: -14,
            t,
            v: 1.4 + Math.random() * 1.6
        });
    }

    function drawSisters() {
        ctx.fillStyle = 'rgba(0,0,0,.06)';
        ctx.beginPath();
        ctx.ellipse(sisters.x, C.height - 12, sisters.w * 0.32, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        const { w, h } = sisters;
        ctx.drawImage(sistersImg, sisters.x - w / 2, sisters.y - h / 2, w, h);
    }

    function draw() {
        ctx.clearRect(0, 0, C.width, C.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, C.width, C.height);
        ctx.font = '24px system-ui';
        ctx.textAlign = 'center';

        items.forEach(it => {
            ctx.fillText(it.t, it.x, it.y += it.v);
        });

        drawSisters();

        items = items.filter(it => {
            const withinX = Math.abs(it.x - sisters.x) < sisters.w * 0.28;
            const nearY = it.y > sisters.y - 10 && it.y < sisters.y + 8;
            if (withinX && nearY) {
                if (it.t === '🪨') {
                    score = Math.max(0, score - 2);
                } else {
                    score += it.t === '☕' ? 1 : 2;
                }
                gScoreEl.textContent = score;
                return false;
            }
            return it.y < C.height + 22;
        });
    }

    function loop() {
        if (!playing) return;
        if (Math.random() < 0.22) addItem();
        draw();
        raf = requestAnimationFrame(loop);
    }

    function start() {
        if (playing) return;
        playing = true;
        items = [];
        score = 0;
        gScoreEl.textContent = 0;
        timeLeft = 30;
        gTimeEl.textContent = timeLeft;
        gMsg.textContent = '';
        loop();
        clock = setInterval(() => {
            timeLeft--;
            gTimeEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                end();
            }
        }, 1000);
    }

    function end() {
        playing = false;
        cancelAnimationFrame(raf);
        clearInterval(clock);
        if (score > best) {
            best = score;
            localStorage.setItem('iyer_feed_best', best);
        }
        gBestEl.textContent = best || '—';
        gMsg.textContent = 'Nice! Press Start to play again.';
    }

    function reset() {
        playing = false;
        cancelAnimationFrame(raf);
        clearInterval(clock);
        items = [];
        score = 0;
        gScoreEl.textContent = 0;
        gTimeEl.textContent = '30';
        ctx.clearRect(0, 0, C.width, C.height);
        drawSisters();
        gMsg.textContent = 'Reset!';
    }

    sistersImg.onload = () => drawSisters();

    document.getElementById('gStart').addEventListener('click', start);
    document.getElementById('gReset').addEventListener('click', reset);

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A')
            sisters.x = Math.max(40, sisters.x - 18);
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D')
            sisters.x = Math.min(C.width - 40, sisters.x + 18);
    });
})();
