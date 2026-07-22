const BASE = window.location.origin;
let refreshTimer = null;
let currentView = 'main'; // 'main' or 'admin'

// --- View Switching ---
const navToggle = document.getElementById('nav-toggle');
const mainView = document.getElementById('main-view');
const adminView = document.getElementById('admin-view');
const refreshInfo = document.getElementById('refresh-info');
const headerSubtitle = document.getElementById('header-subtitle');

navToggle.addEventListener('click', () => {
    if (currentView === 'main') {
        switchView('admin');
    } else {
        switchView('main');
    }
});

function switchView(view) {
    currentView = view;
    if (view === 'admin') {
        mainView.classList.add('hidden');
        adminView.classList.remove('hidden');
        refreshInfo.classList.remove('hidden');
        navToggle.textContent = 'Switch to Main View';
        headerSubtitle.textContent = '(Admin)';
        loadGames();
        startAutoRefresh();
    } else {
        adminView.classList.add('hidden');
        mainView.classList.remove('hidden');
        refreshInfo.classList.add('hidden');
        navToggle.textContent = 'Switch to Admin View';
        headerSubtitle.textContent = '(Main)';
        clearInterval(refreshTimer);
    }
}

// --- Admin Auto Refresh & Logic ---
document.getElementById('btn-refresh').addEventListener('click', () => {
    loadGames();
    startAutoRefresh();
});

function startAutoRefresh() {
    clearInterval(refreshTimer);
    let countdown = 5;
    refreshTimer = setInterval(() => {
        if (currentView !== 'admin') return;
        countdown--;
        if (countdown <= 0) {
            countdown = 5;
            loadGames();
        }
        refreshInfo.textContent = `Auto-refresh: ${countdown}s`;
    }, 1000);
}

async function loadGames() {
    if (currentView !== 'admin') return;
    refreshInfo.classList.add('text-[#7c5cfc]');
    refreshInfo.textContent = 'Refreshing…';
    try {
        const res = await fetch(`${BASE}/api/admin/games`);
        const games = await res.json();
        document.getElementById('game-count').textContent = games.length;
        renderGames(games);
    } catch {
        toast('Failed to load games', 'error');
    } finally {
        refreshInfo.classList.remove('text-[#7c5cfc]');
    }
}

function renderGames(games) {
    const grid = document.getElementById('games-grid');
    const empty = document.getElementById('empty-state');
    grid.innerHTML = '';

    if (!games.length) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    games.forEach(g => {
        const card = document.createElement('div');
        card.className = 'bg-[#1a1a24] border border-[#2e2e42] hover:border-[#7c5cfc] rounded-xl p-[18px] flex flex-col gap-[14px] transition-colors';

        const sortedPlayers = [...g.players].sort((a, b) => b.score - a.score);
        const playersHtml = sortedPlayers.length
            ? sortedPlayers.map(p => `
          <div class="flex items-center justify-between p-[5px_8px] rounded-md bg-white/[0.04] text-[0.82rem] gap-2">
            <span class="w-[7px] h-[7px] rounded-full shrink-0 ${p.connected ? 'bg-[#3dba7e]' : 'bg-[#e05252]'}" title="${p.connected ? 'Connected' : 'Disconnected'}"></span>
            <span class="flex-1 font-medium">${esc(p.name)}</span>
            ${p.streak >= 3 ? `<span class="text-[0.7rem] text-[#e09a30]">🔥${p.streak}</span>` : ''}
            <span class="font-bold text-[#7c5cfc] min-w-[34px] text-right">${p.score}pts</span>
          </div>`).join('')
            : '<p class="text-[#8888aa] text-[0.82rem] italic">No players yet</p>';

        const statusClasses = {
            LOBBY: 'bg-[#1e3b2e] text-[#3dba7e]',
            QUESTION: 'bg-[#231a3f] text-[#7c5cfc]',
            RESULT: 'bg-[#3b2e10] text-[#e09a30]',
            COUNTDOWN: 'bg-[#3b2e10] text-[#e09a30]',
            ROUND_INTRO: 'bg-[#1a2e3b] text-[#5cb8e4]',
            FINAL_SCORE: 'bg-[#3b1a1a] text-[#e05252]'
        };

        card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span class="text-[1.4rem] font-extrabold tracking-[3px] text-[#7c5cfc]">${esc(g.code)}</span>
        <span class="text-[0.7rem] font-bold px-[10px] py-[4px] rounded-[20px] uppercase tracking-[1px] ${statusClasses[g.status] || 'bg-[#2e2e42] text-[#8888aa]'}">${g.status.replace('_', ' ')}</span>
      </div>
      <div class="flex gap-3 flex-wrap">
        <span class="text-[0.78rem] text-[#8888aa]">Players: <strong class="text-[#e8e8f0]">${g.playerCount}</strong></span>
        <span class="text-[0.78rem] text-[#8888aa]">Round: <strong class="text-[#e8e8f0]">${g.currentRoundIndex + 1}/${g.totalRounds}</strong></span>
        <span class="text-[0.78rem] text-[#8888aa]">Q: <strong class="text-[#e8e8f0]">${g.currentQuestionIndex + 1}/${g.questionsInRound}</strong></span>
        ${g.roundTitle ? `<span class="text-[0.78rem] text-[#8888aa]">📦 <strong class="text-[#e8e8f0]">${esc(g.roundTitle)}</strong></span>` : ''}
      </div>
      <div>
        <p class="text-[0.72rem] font-bold tracking-[1px] uppercase text-[#8888aa] mb-2">Settings</p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-[6px]">${renderSettings(g.settings)}</div>
      </div>
      <div>
        <p class="text-[0.72rem] font-bold tracking-[1px] uppercase text-[#8888aa] mb-2">Players</p>
        <div class="flex flex-col gap-1 max-h-[180px] overflow-y-auto">${playersHtml}</div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn-reset flex-1 p-[8px_10px] text-[0.8rem] bg-[#e09a30] text-black hover:bg-[#f0b450] font-semibold rounded-lg transition-colors border-0 cursor-pointer" data-code="${esc(g.code)}">↺ Reset to Lobby</button>
        <button class="btn-kill flex-1 p-[8px_10px] text-[0.8rem] bg-[#e05252] text-white hover:bg-[#f07070] font-semibold rounded-lg transition-colors border-0 cursor-pointer" data-code="${esc(g.code)}">✕ Kill Game</button>
      </div>`;

        grid.appendChild(card);
    });

    document.querySelectorAll('.btn-kill').forEach(btn =>
        btn.addEventListener('click', () => confirmAction(
            `Kill game ${btn.dataset.code}?`,
            'All players will be disconnected and the game will be removed.',
            () => killGame(btn.dataset.code)
        ))
    );
    document.querySelectorAll('.btn-reset').forEach(btn =>
        btn.addEventListener('click', () => confirmAction(
            `Reset game ${btn.dataset.code}?`,
            'The game will be sent back to the lobby and all scores will be cleared.',
            () => resetGame(btn.dataset.code)
        ))
    );
}

function renderSettings(s) {
    if (!s) return '';
    const bool = (label, val, icon) => {
        const on = val !== false;
        return `<div class="flex flex-col items-center justify-center gap-[3px] p-[7px_8px] rounded-lg bg-white/[0.04] border ${on ? 'border-[#2a3d2a]' : 'border-[#3d2a2a]'} text-center">
      <span class="text-[#8888aa] text-[0.62rem] uppercase tracking-[0.5px]">${label}</span>
      <span class="font-bold text-[0.78rem] ${on ? 'text-[#3dba7e]' : 'text-[#e05252]'}">${icon} ${on ? 'On' : 'Off'}</span>
    </div>`;
    };
    const dur = (label, v) => `<div class="flex flex-col items-center justify-center gap-[3px] p-[7px_8px] rounded-lg bg-white/[0.04] border border-[#2e2e42] text-center">
      <span class="text-[#8888aa] text-[0.62rem] uppercase tracking-[0.5px]">${label}</span>
      <span class="font-bold text-[#e8e8f0] text-[0.78rem]">${v != null ? v + 's' : '—'}</span>
    </div>`;
    return [
        dur('Timer', s.timerDuration),
        dur('Result', s.resultDuration),
        dur('Lobby', s.lobbyDuration),
        bool('Jokers', s.jokersEnabled, '🃏'),
        bool('Blocks', s.blocksEnabled, '🛡'),
        bool('Streaks', s.streaksEnabled, '🔥'),
        bool('Fastest', s.fastestFingerEnabled, '⚡'),
        bool('Sound', s.soundEnabled, '🔊'),
        bool('Music', s.musicEnabled, '🎵'),
        s.musicEnabled !== false && s.bgmTrack
            ? `<div class="col-span-full flex flex-col items-center justify-center gap-[3px] p-[7px_8px] rounded-lg bg-white/[0.04] border border-[#2e2e42] text-center">
          <span class="text-[#8888aa] text-[0.62rem] uppercase tracking-[0.5px]">BGM Track</span>
          <span class="font-bold text-[#e8e8f0] text-[0.78rem]">🎵 ${esc(s.bgmTrack.replace(/\.mp3$/i, ''))}</span>
        </div>`
            : '',
    ].join('');
}

document.getElementById('btn-kill-all').addEventListener('click', () => {
    const count = parseInt(document.getElementById('game-count').textContent) || 0;
    if (count === 0) {
        toast('No active games to kill', 'error');
        return;
    }
    confirmAction(`Kill ALL ${count} game(s)?`, 'Every active game will be terminated immediately.', killAll);
});

async function killGame(code) {
    try {
        const res = await fetch(`${BASE}/api/admin/games/${code}/kill`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            toast(`Game ${code} killed`, 'success');
            loadGames();
        } else {
            toast(data.error || 'Failed', 'error');
        }
    } catch {
        toast('Request failed', 'error');
    }
}

async function resetGame(code) {
    try {
        const res = await fetch(`${BASE}/api/admin/games/${code}/reset`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            toast(`Game ${code} reset to lobby`, 'success');
            loadGames();
        } else {
            toast(data.error || 'Failed', 'error');
        }
    } catch {
        toast('Request failed', 'error');
    }
}