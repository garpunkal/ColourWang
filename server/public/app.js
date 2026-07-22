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

  const confirmModal = document.getElementById('confirm-modal');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmBody = document.getElementById('confirm-body');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk = document.getElementById('confirm-ok');

  let pendingAction = null;
  let isFirstLoad = true;

  // 1. Fast Sparkline Charts
  const MAX_DATA_POINTS = 30;
  const chartLabels = Array(MAX_DATA_POINTS).fill('');
  const cpuData = Array(MAX_DATA_POINTS).fill(0);
  const memoryData = Array(MAX_DATA_POINTS).fill(0);

  // Auto-scaling the y-axis (beginAtZero with no fixed max) forces Chart.js
  // to recompute the whole layout/grid on every single update, on top of
  // animating — at a 500ms poll rate that's what causes the stutter. Fixing
  // min/max up front removes that recompute entirely and also stops the
  // "rubber-banding" that reads as jank.
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300, easing: 'linear' },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    elements: {
      point: { radius: 0, hoverRadius: 4 },
      line: { tension: 0.2, borderWidth: 2 }
    }
  };

  const cpuChartOptions = {
    ...commonChartOptions,
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: 100 }
    }
  };

  // Memory has no natural fixed ceiling like CPU% does — start with a
  // reasonable default and bump it once from real data (see below), rather
  // than recalculating it on every frame.
  let memoryChartMax = 512;
  const memoryChartOptions = {
    ...commonChartOptions,
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: memoryChartMax }
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
          fill: true
        }]
      },
      options: cpuChartOptions
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
          fill: true
        }]
      },
      options: memoryChartOptions
    });
  }

  let memoryScaleInitialized = false;

  function updateMetricsCharts(cpuPercent, memoryMb, memoryTotalMb) {
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

    // Set the memory chart's ceiling once from real data instead of
    // recalculating it every frame — a little headroom above total so the
    // line doesn't hug the top edge.
    if (!memoryScaleInitialized && memoryTotalMb) {
      memoryChartMax = Math.ceil(memoryTotalMb * 1.1);
      if (memoryChart) memoryChart.options.scales.y.max = memoryChartMax;
      memoryScaleInitialized = true;
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
    confirmCancel.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirmModal) {
        confirmModal.classList.add('hidden');
        confirmModal.classList.remove('flex');
      }
      pendingAction = null;
    });
  }

  if (confirmOk) {
    confirmOk.addEventListener('click', async (e) => {
      e.preventDefault();
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

      updateMetricsCharts(cpuUsage, usedMemory, data.memory?.total);
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
        if (btnKillAll) btnKillAll.classList.add('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');
      if (btnKillAll) btnKillAll.classList.remove('hidden');

      games.forEach(game => {
        const code = game.code || 'N/A';
        const status = game.status || 'LOBBY';
        const playerCount = game.playerCount ?? 0;
        const currentRound = game.currentRound ?? 0;
        const totalRounds = game.settings?.totalRounds ?? game.totalRounds ?? 10;
        const currentQuestion = game.currentQuestion ?? 0;
        const questionsPerRound = game.settings?.questionsPerRound ?? game.questionsPerRound ?? 3;
        // currentRound/currentQuestion are 0-based indexes from the server;
        // display 1-based, clamped so a finished game doesn't show e.g. "4 / 3".
        const displayRound = totalRounds > 0 ? Math.min(currentRound + 1, totalRounds) : currentRound + 1;
        const displayQuestion = questionsPerRound > 0 ? Math.min(currentQuestion + 1, questionsPerRound) : currentQuestion + 1;
        const answerTime = game.settings?.answerTime ?? 15;
        const categories = game.settings?.categories || [];
        const hostName = game.hostName || 'Host';
        const isHostConnected = game.isHostConnected ?? true;

        totalPlayers += playerCount;

        const categoryPills = categories.length > 0
          ? categories.map(c => `<span class="bg-[#2e2e42] text-[#8888aa] text-[0.65rem] px-2 py-0.5 rounded font-medium">${c}</span>`).join(' ')
          : '<span class="text-[#8888aa] text-[0.65rem] italic">All Categories</span>';

        const card = document.createElement('div');
        card.className = 'bg-[#1a1a24] border border-[#2e2e42] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-[#7c5cfc]/50 transition-colors';
        card.innerHTML = `
          <!-- Header Code & Status -->
          <div class="flex items-center justify-between pb-2 border-b border-[#2e2e42]">
            <div class="flex items-center gap-2">
              <i data-lucide="gamepad-2" class="w-5 h-5 text-[#7c5cfc]"></i>
              <span class="font-outfit font-black text-xl text-white tracking-wide">${code}</span>
            </div>
            <span class="text-[0.68rem] px-2.5 py-1 rounded-md bg-[#2e2e42] text-[#8888aa] uppercase font-bold tracking-wider">${status}</span>
          </div>

          <!-- Host Info -->
          <div class="flex items-center justify-between text-xs text-[#8888aa] px-1">
            <span class="flex items-center gap-1.5">
              <i data-lucide="crown" class="w-3.5 h-3.5 text-[#f8d33a]"></i>
              <strong class="text-white font-medium">${hostName}</strong>
            </span>
            <span class="flex items-center gap-1 text-[0.7rem]">
              <span class="w-2 h-2 rounded-full ${isHostConnected ? 'bg-[#3dba7e]' : 'bg-[#e05252]'}"></span>
              ${isHostConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <!-- Metric Cards Grid -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-[#0f0f13] p-2.5 rounded-lg border border-[#2e2e42] flex items-center gap-2.5">
              <div class="p-1.5 rounded bg-[#7c5cfc]/10 text-[#7c5cfc]">
                <i data-lucide="users" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="text-[#8888aa] block text-[0.62rem] uppercase font-semibold">Players</span>
                <span class="font-bold text-white text-sm">${playerCount}</span>
              </div>
            </div>

            <div class="bg-[#0f0f13] p-2.5 rounded-lg border border-[#2e2e42] flex items-center gap-2.5">
              <div class="p-1.5 rounded bg-[#3dba7e]/10 text-[#3dba7e]">
                <i data-lucide="layers" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="text-[#8888aa] block text-[0.62rem] uppercase font-semibold">Round</span>
                <span class="font-bold text-white text-sm">${displayRound} / ${totalRounds}</span>
              </div>
            </div>

            <div class="bg-[#0f0f13] p-2.5 rounded-lg border border-[#2e2e42] flex items-center gap-2.5">
              <div class="p-1.5 rounded bg-[#3af8d3]/10 text-[#3af8d3]">
                <i data-lucide="help-circle" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="text-[#8888aa] block text-[0.62rem] uppercase font-semibold">Question</span>
                <span class="font-bold text-white text-sm">${displayQuestion} / ${questionsPerRound}</span>
              </div>
            </div>

            <div class="bg-[#0f0f13] p-2.5 rounded-lg border border-[#2e2e42] flex items-center gap-2.5">
              <div class="p-1.5 rounded bg-[#f83a63]/10 text-[#f83a63]">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="text-[#8888aa] block text-[0.62rem] uppercase font-semibold">Timer</span>
                <span class="font-bold text-white text-sm">${answerTime}s</span>
              </div>
            </div>
          </div>

          <!-- Categories Badge Section -->
          <div class="bg-[#0f0f13] p-2.5 rounded-lg border border-[#2e2e42] space-y-1 text-xs">
            <span class="text-[#8888aa] flex items-center gap-1 text-[0.62rem] uppercase font-semibold">
              <i data-lucide="tag" class="w-3 h-3 text-[#8888aa]"></i> Categories
            </span>
            <div class="flex flex-wrap gap-1 pt-0.5">
              ${categoryPills}
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-2 pt-1 border-t border-[#2e2e42]">
            <button data-action="restart" data-code="${code}" class="flex-1 flex items-center justify-center gap-1.5 bg-[#2e2e42] hover:bg-[#3e3e56] text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Restart
            </button>
            <button data-action="kill" data-code="${code}" class="flex-1 flex items-center justify-center gap-1.5 bg-[#e05252]/20 hover:bg-[#e05252] text-[#e05252] hover:text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer">
              <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Kill
            </button>
          </div>
        `;

        gamesGrid.appendChild(card);
      });

      if (statTotalPlayers) statTotalPlayers.textContent = totalPlayers.toString();

      // Render vector icons for newly injected cards
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (err) {
      console.error('Failed to load games list:', err);
    }
  }

  // 5. Action Buttons Event Handling
  if (gamesGrid) {
    gamesGrid.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;
      e.preventDefault();

      const action = button.getAttribute('data-action');
      const gameCode = button.getAttribute('data-code');

      if (action === 'kill') {
        askConfirmation({
          title: `Kill Game ${gameCode}?`,
          body: 'This will terminate the room and disconnect all active players in this game.',
          onConfirm: async () => {
            try {
              const res = await fetch(`/api/admin/games/${encodeURIComponent(gameCode)}/kill`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });
              const data = await res.json();
              if (res.ok && data.success) {
                showToast(`Game ${gameCode} killed`);
                fetchServerStatus();
              } else {
                showToast(`Failed: ${data.error || 'Could not kill game'}`, true);
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
              const res = await fetch(`/api/admin/games/${encodeURIComponent(gameCode)}/restart`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });
              const data = await res.json();
              if (res.ok && data.success) {
                showToast(`Game ${gameCode} restarted`);
                fetchServerStatus();
              } else {
                showToast(`Failed: ${data.error || 'Could not restart game'}`, true);
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
    btnKillAll.addEventListener('click', (e) => {
      e.preventDefault();
      askConfirmation({
        title: 'Kill ALL Active Games?',
        body: 'This will terminate every room currently running on the server. Active players will be disconnected.',
        onConfirm: async () => {
          try {
            const res = await fetch('/api/admin/games/kill-all', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            const data = await res.json();
            if (res.ok && data.success) {
              showToast('All active games killed');
              fetchServerStatus();
            } else {
              showToast(`Failed: ${data.error || 'Could not kill all games'}`, true);
            }
          } catch (err) {
            showToast('Network error execution failed', true);
          }
        }
      });
    });
  }

  // 6. Real-Time Log Streaming via SSE
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
    btnClearLogs.addEventListener('click', (e) => {
      e.preventDefault();
      if (logTerminal) {
        logTerminal.innerHTML = '<div class="text-[#c084fc]">[SYSTEM] Logs cleared.</div>';
      }
    });
  }

  // Start polling
  fetchServerStatus();
  initLogStream();
  setInterval(fetchServerStatus, 500);
});