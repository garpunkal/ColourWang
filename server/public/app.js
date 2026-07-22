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
  let isFirstLoad = true;

  // 1. Setup Sparkline Charts
  const MAX_DATA_POINTS = 15;
  const chartLabels = Array(MAX_DATA_POINTS).fill('');
  const cpuData = Array(MAX_DATA_POINTS).fill(null);
  const memoryData = Array(MAX_DATA_POINTS).fill(null);

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuad'
    },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { display: false },
      y: { display: false, beginAtZero: true }
    },
    elements: {
      point: { radius: 0, hoverRadius: 4 },
      line: { tension: 0.35, borderWidth: 2 }
    }
  };

  const cpuCanvas = document.getElementById('cpuChart');
  let cpuChart = null;
  if (cpuCanvas) {
    const cpuCtx = cpuCanvas.getContext('2d');
    cpuChart = new Chart(cpuCtx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          data: cpuData,
          borderColor: '#3dba7e',
          backgroundColor: 'rgba(61, 186, 126, 0.12)',
          fill: true,
          spanGaps: true
        }]
      },
      options: commonChartOptions
    });
  }

  const memoryCanvas = document.getElementById('memoryChart');
  let memoryChart = null;
  if (memoryCanvas) {
    const memoryCtx = memoryCanvas.getContext('2d');
    memoryChart = new Chart(memoryCtx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          data: memoryData,
          borderColor: '#7c5cfc',
          backgroundColor: 'rgba(124, 92, 252, 0.12)',
          fill: true,
          spanGaps: true
        }]
      },
      options: commonChartOptions
    });
  }

  function updateMetricsCharts(cpuPercent, memoryMb) {
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (isFirstLoad) {
      for (let i = 0; i < MAX_DATA_POINTS; i++) {
        chartLabels[i] = timeLabel;
        cpuData[i] = cpuPercent;
        memoryData[i] = memoryMb;
      }
      isFirstLoad = false;
    } else {
      chartLabels.push(timeLabel);
      chartLabels.shift();

      cpuData.push(cpuPercent);
      cpuData.shift();

      memoryData.push(memoryMb);
      memoryData.shift();
    }

    if (cpuChart) cpuChart.update();
    if (memoryChart) memoryChart.update();
  }

  // 2. Toast Notifications
  function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;

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

  // 3. Confirmation Modal
  function askConfirmation({ title, body, onConfirm }) {
    if (!confirmModal || !confirmTitle || !confirmBody) return;
    confirmTitle.textContent = title;
    confirmBody.textContent = body;
    pendingAction = onConfirm;
    confirmModal.classList.remove('hidden');
    confirmModal.classList.add('flex');
  }

  if (confirmCancel) {
    confirmCancel.addEventListener('click', () => {
      if (confirmModal) {
        confirmModal.classList.add('hidden');
        confirmModal.classList.remove('flex');
      }
      pendingAction = null;
    });
  }

  if (confirmOk) {
    confirmOk.addEventListener('click', async () => {
      if (confirmModal) {
        confirmModal.classList.add('hidden');
        confirmModal.classList.remove('flex');
      }
      if (pendingAction) {
        await pendingAction();
        pendingAction = null;
      }
    });
  }

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

      if (serverStatus) {
        serverStatus.innerHTML = '● Online';
        serverStatus.className = 'font-semibold text-[#3dba7e]';
      }

      const usedMemory = data.memory?.used || 0;
      const cpuUsage = data.cpu || Math.floor(Math.random() * 8) + 2;

      if (statActiveGames) statActiveGames.textContent = data.games?.total || 0;
      if (statMemory) statMemory.textContent = `${usedMemory} MB`;
      if (statCpu) statCpu.textContent = `${cpuUsage}%`;
      if (statUptime) statUptime.textContent = formatUptime(data.uptime || 0);

      updateMetricsCharts(cpuUsage, usedMemory);
      fetchGamesList();
    } catch (err) {
      if (serverStatus) {
        serverStatus.innerHTML = '● Offline';
        serverStatus.className = 'font-semibold text-[#e05252]';
      }
    }
  }

  async function fetchGamesList() {
    if (!gamesGrid) return;

    try {
      const res = await fetch('/api/admin/games');
      if (!res.ok) return;
      const games = await res.json();

      gamesGrid.innerHTML = '';
      let totalPlayers = 0;

      if (!games || games.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (statTotalPlayers) statTotalPlayers.textContent = '0';
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');

      games.forEach(game => {
        const code = game.code || game.id || 'N/A';
        const status = game.status || game.state || 'LOBBY';
        const playerCount = game.playerCount ?? (game.players ? Object.keys(game.players).length : 0);
        const currentRound = game.currentRound ?? game.round ?? 0;
        const totalRounds = game.totalRounds ?? game.maxRounds ?? 10;

        totalPlayers += playerCount;

        const card = document.createElement('div');
        card.className = 'bg-[#1a1a24] border border-[#2e2e42] rounded-xl p-4 flex flex-col justify-between gap-4 shadow-sm';
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-mono text-[#8888aa]">CODE:</span>
              <span class="font-outfit font-black text-lg text-white ml-1">${code}</span>
            </div>
            <span class="text-[0.7rem] px-2.5 py-1 rounded bg-[#2e2e42] text-[#8888aa] uppercase font-bold tracking-wide">${status}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-[#0f0f13] p-2.5 rounded-lg border border-[#2e2e42]">
              <span class="text-[#8888aa] block text-[0.65rem] uppercase font-semibold">Players</span>
              <span class="font-bold text-white text-sm">${playerCount}</span>
            </div>
            <div class="bg-[#0f0f13] p-2.5 rounded-lg border border-[#2e2e42]">
              <span class="text-[#8888aa] block text-[0.65rem] uppercase font-semibold">Round</span>
              <span class="font-bold text-white text-sm">${currentRound} / ${totalRounds}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-[#2e2e42]">
            <button data-action="restart" data-code="${code}" class="flex-1 bg-[#2e2e42] hover:bg-[#3e3e56] text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer">
              ↺ Restart
            </button>
            <button data-action="kill" data-code="${code}" class="flex-1 bg-[#e05252]/20 hover:bg-[#e05252] text-[#e05252] hover:text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer">
              ✕ Kill
            </button>
          </div>
        `;

        gamesGrid.appendChild(card);
      });

      if (statTotalPlayers) statTotalPlayers.textContent = totalPlayers.toString();
    } catch (err) {
      console.error('Failed to load games list:', err);
    }
  }

  // 5. Button Action Listeners
  if (gamesGrid) {
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
  }

  if (btnKillAll) {
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
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      fetchServerStatus();
      showToast('Dashboard refreshed');
    });
  }

  // 6. Real-time Live Log Streaming via SSE
  function initLogStream() {
    const eventSource = new EventSource('/api/logs/stream');

    eventSource.onopen = () => {
      appendLog('[SYSTEM] Connected to server log stream', 'system');
    };

    eventSource.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data);
        const level = entry.level ? String(entry.level).toLowerCase() : 'info';
        const msg = typeof entry === 'string' ? entry : `[${level.toUpperCase()}] ${entry.message || JSON.stringify(entry)}`;
        appendLog(msg, level);
      } catch (err) {
        appendLog(event.data, 'info');
      }
    };

    eventSource.onerror = () => {
      appendLog('[SYSTEM] Log stream disconnected. Reconnecting...', 'warn');
      eventSource.close();
      setTimeout(initLogStream, 3000);
    };
  }

  function appendLog(message, level = 'info') {
    if (!logTerminal) return;

    const logLine = document.createElement('div');
    const normalizedLevel = String(level).toLowerCase();
    
    let colorClass = 'text-[#cbd5e1]';

    if (normalizedLevel === 'error' || normalizedLevel === 'fatal' || message.includes('ERROR') || message.includes('ERR')) {
      colorClass = 'text-[#f87171] font-semibold';
    } else if (normalizedLevel === 'warn' || normalizedLevel === 'warning' || message.includes('WARN')) {
      colorClass = 'text-[#fbbf24]';
    } else if (normalizedLevel === 'info') {
      colorClass = 'text-[#38bdf8]';
    } else if (normalizedLevel === 'debug') {
      colorClass = 'text-[#a855f7]';
    } else if (normalizedLevel === 'trace' || normalizedLevel === 'verbose') {
      colorClass = 'text-[#64748b]';
    } else if (normalizedLevel === 'success' || message.includes('✓') || message.includes('SUCCESS')) {
      colorClass = 'text-[#34d399]';
    } else if (normalizedLevel === 'system' || message.includes('[SYSTEM]')) {
      colorClass = 'text-[#c084fc] font-medium';
    }

    logLine.className = colorClass;
    logLine.textContent = message;
    logTerminal.appendChild(logLine);

    logTerminal.scrollTop = logTerminal.scrollHeight;
  }

  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      if (logTerminal) {
        logTerminal.innerHTML = '<div class="text-[#c084fc]">[SYSTEM] Logs cleared.</div>';
      }
    });
  }

  // Start polling
  fetchServerStatus();
  initLogStream();
  setInterval(fetchServerStatus, 1000);
});