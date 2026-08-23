// ============================================
// FINES.JS - View and pay fines
// Covers: reduce, filter, template literals, async/await
// ============================================
import { Components } from './components.js';
import { API } from './api.js';

export const FinesPage = {
  async render(container, user) {
    const fines = await API.get('/api/fines');
    const unpaid = fines.filter(f => !f.paid);
    const totalDue = unpaid.reduce((sum, f) => sum + f.amount, 0);

    container.innerHTML = `
      <div class="space-y-8 fade-in">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold">Fines &amp; History</h1>
          <div class="bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-lg text-sm font-medium text-rose-700 dark:text-rose-300">
            Total Due: $${totalDue.toFixed(2)}
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          ${fines.length === 0 ? '<p class="text-slate-500 py-8 text-center">No fines on record 🎉</p>' : `
            <div class="space-y-3">
              ${fines.map(f => `
                <div class="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <p class="font-medium">${f.itemTitle}</p>
                    <p class="text-sm text-slate-500">${f.reason} · ${new Date(f.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-bold ${f.paid ? 'text-slate-400 line-through' : 'text-rose-600'}">$${f.amount.toFixed(2)}</span>
                    ${f.paid
                      ? '<span class="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Paid</span>'
                      : `<button data-pay="${f.id}" class="px-3 py-1 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700">Pay Now</button>`}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-pay]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await API.post(`/api/fines/${btn.dataset.pay}/pay`);
          Components.showToast('Fine paid', 'success');
          this.render(container, user);
        } catch (err) {
          Components.showToast(err.message, 'error');
        }
      });
    });
  }
};
