document.addEventListener('DOMContentLoaded', () => {
    // Initialize teams data
    const heClassCount = 9;
    const pingClassCount = 8;
    
    // Load scores from localStorage or initialize
    let teams = JSON.parse(localStorage.getItem('sgTriviaScores')) || [];
    
    // Cloud URL from env.js
    const scriptUrl = typeof window !== 'undefined' && window.ENV ? window.ENV.SCRIPT_URL : '';

    if (teams.length === 0) {
        for (let i = 1; i <= heClassCount; i++) {
            teams.push({ id: `he-${i}`, name: `和班 第${i}小隊`, class: 'he', score: 0 });
        }
        for (let i = 1; i <= pingClassCount; i++) {
            teams.push({ id: `ping-${i}`, name: `平班 第${i}小隊`, class: 'ping', score: 0 });
        }
        saveScores();
    }

    // Initial fetch from cloud
    if (scriptUrl) {
        fetch(scriptUrl)
            .then(res => res.json())
            .then(cloudTeams => {
                if (cloudTeams && Array.isArray(cloudTeams) && cloudTeams.length > 0) {
                    teams = cloudTeams;
                    localStorage.setItem('sgTriviaScores', JSON.stringify(teams));
                    // Dispatch custom event to trigger re-renders
                    window.dispatchEvent(new Event('scoresUpdated'));
                }
            })
            .catch(err => console.error('Initial fetch error:', err));
    }

    function saveScores() {
        localStorage.setItem('sgTriviaScores', JSON.stringify(teams));
        
        // Sync to cloud
        if (scriptUrl) {
            try {
                const url = new URL(scriptUrl);
                url.searchParams.append('action', 'save');
                url.searchParams.append('data', JSON.stringify(teams));
                fetch(url.toString()).catch(err => console.error('Sync error:', err));
            } catch (e) {
                console.error('Invalid URL:', e);
            }
        }
    }

    function addScore(teamId, points) {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            team.score += points;
            saveScores();
            renderAdminTeams();
        }
    }

    // ========== PUBLIC SCOREBOARD LOGIC ==========
    const podiumContainer = document.getElementById('podium');
    const allTeamsGrid = document.getElementById('all-teams-grid');

    if (podiumContainer && allTeamsGrid) {
        function renderPublic() {
            podiumContainer.innerHTML = '';
            allTeamsGrid.innerHTML = '';
            
            // Sort teams by score descending
            const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
            const top4 = sortedTeams.filter(t => t.score > 0).slice(0, 4);

            if (top4.length === 0) {
                podiumContainer.innerHTML = '<div style="color: var(--text-secondary);">目前尚未有隊伍得分</div>';
            } else {
                const podiumOrder = [
                    { rank: 2, icon: '🥈' },
                    { rank: 1, icon: '🥇' },
                    { rank: 3, icon: '🥉' },
                    { rank: 4, icon: '🏅' }
                ];

                const displayTeams = [];
                if (top4[0]) displayTeams[1] = { team: top4[0], ...podiumOrder[1] };
                if (top4[1]) displayTeams[0] = { team: top4[1], ...podiumOrder[0] };
                if (top4[2]) displayTeams[2] = { team: top4[2], ...podiumOrder[2] };
                if (top4[3]) displayTeams[3] = { team: top4[3], ...podiumOrder[3] };

                displayTeams.forEach(item => {
                    if (!item) return;
                    const wrapper = document.createElement('div');
                    wrapper.style.display = 'flex';
                    wrapper.style.flexDirection = 'column';
                    wrapper.style.alignItems = 'center';

                    const el = document.createElement('div');
                    el.className = `podium-item rank-${item.rank}`;
                    el.innerHTML = `
                        <div class="podium-rank">${item.icon}</div>
                        <div class="podium-name">${item.team.name}</div>
                    `;
                    
                    const scoreEl = document.createElement('div');
                    scoreEl.className = 'podium-score';
                    scoreEl.style.marginTop = '0.5rem';
                    scoreEl.innerHTML = `${item.team.score} 分`;

                    wrapper.appendChild(el);
                    wrapper.appendChild(scoreEl);
                    podiumContainer.appendChild(wrapper);
                });
            }

            // Render all teams leaderboard (without buttons)
            sortedTeams.forEach((team, index) => {
                const card = document.createElement('div');
                card.className = 'team-card';
                card.style.padding = '1rem';
                let rankLabel = index + 1;
                card.innerHTML = `
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">第 ${rankLabel} 名</div>
                    <div class="team-name" style="margin-bottom: 0.5rem; font-size: 1rem;">${team.name}</div>
                    <div class="team-score" style="font-size: 2rem;">${team.score}</div>
                `;
                allTeamsGrid.appendChild(card);
            });
        }
        
        renderPublic();
        
        // Listen to cloud updates initialized on load
        window.addEventListener('scoresUpdated', renderPublic);

        // Auto-refresh public page periodically
        setInterval(async () => {
            if (scriptUrl) {
                try {
                    const res = await fetch(scriptUrl);
                    const cloudTeams = await res.json();
                    if (cloudTeams && Array.isArray(cloudTeams) && JSON.stringify(cloudTeams) !== JSON.stringify(teams)) {
                        teams = cloudTeams;
                        localStorage.setItem('sgTriviaScores', JSON.stringify(teams));
                        renderPublic();
                    }
                } catch (e) {
                    console.error('Fetch error:', e);
                }
            } else {
                const freshTeams = JSON.parse(localStorage.getItem('sgTriviaScores'));
                if (freshTeams && JSON.stringify(freshTeams) !== JSON.stringify(teams)) {
                    teams = freshTeams;
                    renderPublic();
                }
            }
        }, 3000);
    }

    // ========== ADMIN LOGIC ==========
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('gm-password');
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const adminTitle = document.getElementById('admin-title');
    const adminClassTitle = document.getElementById('admin-class-title');
    const adminTeamsGrid = document.getElementById('admin-teams');
    const loginError = document.getElementById('login-error');
    const resetBtn = document.getElementById('reset-btn');

    let currentAdminClass = null;

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });

        function handleLogin() {
            const pwd = passwordInput.value;
            if (pwd === '0001') {
                currentAdminClass = 'he';
                adminTitle.textContent = 'ＧＭ操作-和班';
                adminClassTitle.textContent = '和班 計分控制台';
                showAdmin();
            } else if (pwd === '0002') {
                currentAdminClass = 'ping';
                adminTitle.textContent = 'ＧＭ操作-平班';
                adminClassTitle.textContent = '平班 計分控制台';
                showAdmin();
            } else {
                loginError.style.display = 'block';
            }
        }

        function showAdmin() {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            renderAdminTeams();
        }

        resetBtn.addEventListener('click', () => {
            if (confirm(`確定要重設 ${currentAdminClass === 'he' ? '和班' : '平班'} 的所有分數嗎？`)) {
                teams.forEach(t => {
                    if (t.class === currentAdminClass) t.score = 0;
                });
                saveScores();
                renderAdminTeams();
            }
        });
    }

    function renderAdminTeams() {
        if (!adminTeamsGrid) return;
        adminTeamsGrid.innerHTML = '';
        const classTeams = teams.filter(t => t.class === currentAdminClass);

        classTeams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.innerHTML = `
                <div class="team-name">${team.name}</div>
                <div class="team-score">${team.score}</div>
                <div class="team-score-label">分</div>
                <button class="btn btn-add admin-btn-add" data-id="${team.id}">答對 (+2)</button>
                <button class="btn btn-sub admin-btn-sub" data-id="${team.id}">扣除 (-2)</button>
            `;
            adminTeamsGrid.appendChild(card);
        });

        // Re-attach listeners for admin buttons
        document.querySelectorAll('.admin-btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => addScore(e.target.getAttribute('data-id'), 2));
        });
        document.querySelectorAll('.admin-btn-sub').forEach(btn => {
            btn.addEventListener('click', (e) => addScore(e.target.getAttribute('data-id'), -2));
        });
    }

    window.addEventListener('scoresUpdated', () => {
        if (adminSection && adminSection.style.display !== 'none') {
            renderAdminTeams();
        }
    });
});
