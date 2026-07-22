document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const serverStatus = document.getElementById('server-status');
  const statActiveGames = document.getElementById('stat-active-games');
  const statTotalPlayers = document.getElementById('stat-total-players');
  const statCpu = document.getElementById('stat-cpu');
  const statMemory = document.getElementById('stat-memory');
  const statUptime = document.getElementById('stat-uptime');
  
  const logTerminal = document.getElementById('log-terminal');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  
  const gamesGrid = document.getElementById('games-grid');
  const emptyState = document.getElementById('empty-state');
  const btnKillAll = document.getElementById('btn-kill-all');
  const btnRefresh = document.getElementById('btn-refresh');

  const confirmModal = document.getElementById('confirm-modal');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmBody = document.getElementById('confirm-body');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk = document.getElementById('confirm-ok');

  let pendingAction = null;

  // 1. Toast Notifications
  function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `px-4 py-2.5 rounded-lg text-xs font-semibold text-white shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 ${
      isError ? 'bg-[#e05252]' : 'bg-[#3dba7e]'
    }`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // 2. Custom Confirmation Modal
  function askConfirmation({ title, body, onConfirm }) {
    confirmTitle.textContent = title;
    confirmBody.textContent = body;
    pendingAction = onConfirm;
    confirmModal.classList.remove('hidden');
    confirmModal.classList.add('flex');
  }

  confirmCancel.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    confirmModal.classList.remove('flex');
    pendingAction = null;
  });

  confirmOk.addEventListener('click', async () => {
    confirmModal.classList.add('hidden');
    confirmModal.classList.remove('flex');
    if (pendingAction) {
      await pendingAction();
      pendingAction = null;
    }
  });

  // 3. Format Uptime Helper
  function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

  // 4. Fetch Metrics & Active Games
  async function fetchServerStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      serverStatus.innerHTML = '● Online';
      serverStatus.className = 'font-semibold text-[#3dba7e]';

      statActiveGames.textContent = data.games?.total || 0;
      statMemory.textContent = `${data.memory?.used || 0} MB`;
      statUptime.textContent = formatUptime(data.uptime || 0);

      // Fetch detailed games list from admin endpoint
      fetchGamesList();
    } catch (err) {
      serverStatus.innerHTML = '● Offline';
      serverStatus.className = 'font-semibold text-[#e05252]';
    }
  }

  async function fetchGamesList() {
    try {
      const res = await fetch('/api/admin/games');
      if (!res.ok) return;
      const games = await res.json();

      gamesGrid.innerHTML = '';
      let totalPlayers = 0;

      if (!games || games.length === 0) {
        emptyState.classList.remove('hidden');
        statTotalPlayers.textContent = '0';
        return;
      }

      emptyState.classList.add('hidden');

      games.forEach(game => {
        totalPlayers += game.playerCount || 0;

        const card = document.createElement('div');
        card.className = 'bg-[#1a1a24] border border-[#2e2e42] rounded-xl p-4 flex flex-col justify-between gap-4';
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-mono text-[#8888aa]">CODE:</span>
              <span class="font-outfit font-black text-lg text-white ml-1">${game.code}</span>
            </div>
            <span class="text-[0.7rem] px-2 py-0.5 rounded bg-[#2e2e42] text-[#8888aa] uppercase font-bold">${game.status}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-[#0f0f13] p-2 rounded border border-[#2e2e42]">
              <span class="text-[#8888aa] block text-[0.65rem] uppercase">Players</span>
              <span class="font-bold text-white">${game.playerCount || 0}</span>
            </div>
            <div class="bg-[#0f0f13] p-2 rounded border border-[#2e2e42]">
              <span class="text-[#8888aa] block text-[0.65rem] uppercase">Round</span>
              <span class="font-bold text-white">${game.currentRound || 0} / ${game.totalRounds || 0}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-[#2e2e42]">
            <button data-action="restart" data-code="${game.code}" class="flex-1 bg-[#2e2e42] hover:bg-[#3e3e56] text-white text-xs py-1.5 px-3 rounded font-medium transition-colors cursor-pointer">
              ↺ Restart
            </button>
            <button data-action="kill" data-code="${game.code}" class="flex-1 bg-[#e05252]/20 hover:bg-[#e05252] text-[#e05252] hover:text-white text-xs py-1.5 px-3 rounded font-medium transition-colors cursor-pointer">
              ✕ Kill
            </button>
          </div>
        `;

        gamesGrid.appendChild(card);
      });

      statTotalPlayers.textContent = totalPlayers.toString();
    } catch (err) {
      console.error('Failed to load games list:', err);
    }
  }

  // 5. Game Control Actions (Kill / Restart)
  gamesGrid.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const gameCode = button.getAttribute('data-code');

    if (action === 'kill') {
      askConfirmation({
        title: `Kill Game ${gameCode}?`,
        body: 'This will terminate the room and disconnect all active players in this game.',
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/admin/games/${gameCode}/kill`, { method: 'POST' });
            if (res.ok) {
              showToast(`Game ${gameCode} killed`);
              fetchServerStatus();
            } else {
              showToast(`Failed to kill game ${gameCode}`, true);
            }
          } catch (err) {
            showToast('Network error while killing game', true);
          }
        }
      });
    } else if (action === 'restart') {
      askConfirmation({
        title: `Restart Game ${gameCode}?`,
        body: 'This will reset the room score and return players to the lobby.',
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/admin/games/${gameCode}/restart`, { method: 'POST' });
            if (res.ok) {
              showToast(`Game ${gameCode} restarted`);
              fetchServerStatus();
            } else {
              showToast(`Failed to restart game ${gameCode}`, true);
            }
          } catch (err) {
            showToast('Network error while restarting game', true);
          }
        }
      });
    }
  });

  // Kill All Games Button
  btnKillAll.addEventListener('click', () => {
    askConfirmation({
      title: 'Kill ALL Active Games?',
      body: 'This will terminate every room currently running on the server. Active players will be disconnected.',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/games/kill-all', { method: 'POST' });
          if (res.ok) {
            showToast('All games killed');
            fetchServerStatus();
          } else {
            showToast('Failed to kill all games', true);
          }
        } catch (err) {
          showToast('Network error execution failed', true);
        }
      }
    });
  });

  btnRefresh.addEventListener('click', () => {
    fetchServerStatus();
    showToast('Dashboard refreshed');
  });

  // 6. Real-time Live Log Streaming via SSE
  function initLogStream() {
    const eventSource = new EventSource('/api/logs/stream');

    eventSource.onopen = () => {
      appendLog('[SYSTEM] Connected to server log stream', 'info');
    };

    eventSource.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data);
        const msg = typeof entry === 'string' ? entry : `[${entry.level || 'LOG'}] ${entry.message || JSON.stringify(entry)}`;
        appendLog(msg, entry.level);
      } catch (err) {
        appendLog(event.data);
      }
    };

    eventSource.onerror = () => {
      appendLog('[SYSTEM] Log stream disconnected. Reconnecting...', 'error');
      eventSource.close();
      setTimeout(initLogStream, 3000); // Auto reconnect
    };
  }

  function appendLog(message, level = 'info') {
    const logLine = document.createElement('div');
    
    let colorClass = 'text-[#8888aa]';
    if (level === 'error' || message.includes('error') || message.includes('ERR')) {
      colorClass = 'text-[#e05252]';
    } else if (level === 'warn' || message.includes('warn')) {
      colorClass = 'text-[#e09a30]';
    } else if (message.includes('[SYSTEM]')) {
      colorClass = 'text-[#7c5cfc]';
    }

    logLine.className = colorClass;
    logLine.textContent = message;
    logTerminal.appendChild(logLine);

    // Auto-scroll to bottom
    logTerminal.scrollTop = logTerminal.scrollHeight;
  }

  btnClearLogs.addEventListener('click', () => {
    logTerminal.innerHTML = '<div class="text-[#7c5cfc]">[SYSTEM] Logs cleared.</div>';
  });

  // Initial Load & Poll Timer
  fetchServerStatus();
  initLogStream();
  setInterval(fetchServerStatus, 5000);
});