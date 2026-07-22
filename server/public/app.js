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
      // Support various object shapes from room managers
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

    statTotalPlayers.textContent = totalPlayers.toString();
  } catch (err) {
    console.error('Failed to load games list:', err);
  }
}