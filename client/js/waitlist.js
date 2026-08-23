// ============================================
// WAITLIST.JS (frontend) - Smart priority waitlist view
// Covers: sort, map, template literals, destructuring
// ============================================
import { Components } from './components.js';
import { API } from './api.js';

export const WaitlistPage = {
  async render(container, user) {
    const waitlist = await API.get('/api/waitlist');
    const mine = waitlist.filter(w => w.userId === user.id);

    container.innerHTML = `
      <div class="space-y-8 fade-in">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold">Smart Waitlist</h1>
          <div class="bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-lg text-sm font-medium text-primary-700 dark:text-primary-300">
            Your Reliability Score: ${user.reliabilityScore ?? 75}/100
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-lg font-semibold mb-4">My Requests</h2>
          ${mine.length === 0 ? '<p class="text-slate-500 py-4">No active waitlist requests. Join one from the catalog when an item is unavailable.</p>' : `
            <div class="space-y-3">
              ${mine.map(w => `
                <div class="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <p class="font-medium">${w.itemTitle}</p>
                    <p class="text-sm text-slate-500">Position #${w.position} in queue</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${w.priorityScore > 70 ? 'bg-emerald-100 text-emerald-700' : w.priorityScore > 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}">
                      Score: ${w.priorityScore}
                    </span>
                    <button data-cancel="${w.id}" class="text-rose-500 hover:text-rose-700 text-sm">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-lg font-semibold mb-4">Queue Overview</h2>
          <p class="text-xs text-slate-500 mb-4">Priority is transparent — it's a weighted blend of role, reliability, urgency, and how long you've waited.</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700 text-left text-slate-500">
                  <th class="pb-3">Rank</th><th class="pb-3">Item</th><th class="pb-3">User</th><th class="pb-3">Score</th><th class="pb-3">Breakdown</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                ${waitlist.map((w, i) => `
                  <tr>
                    <td class="py-3">${i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</td>
                    <td class="py-3 font-medium">${w.itemTitle}</td>
                    <td class="py-3">${w.userName}</td>
                    <td class="py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div class="h-full ${w.priorityScore > 70 ? 'bg-emerald-500' : w.priorityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}" style="width:${w.priorityScore}%"></div>
                        </div>
                        <span class="font-bold">${w.priorityScore}</span>
                      </div>
                    </td>
                    <td class="py-3 text-xs text-slate-400">Role ${w.breakdown.role.toFixed(0)} · Reliability ${w.breakdown.reliability.toFixed(0)} · Urgency ${w.breakdown.urgency.toFixed(0)} · Time ${w.breakdown.time.toFixed(0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await API.delete(`/api/waitlist/${btn.dataset.cancel}`);
          Components.showToast('Removed from waitlist', 'success');
          this.render(container, user);
        } catch (err) {
          Components.showToast(err.message, 'error');
        }
      });
    });
  }
};
