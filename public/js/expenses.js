// CRM Expenses & TA/DA Management
async function initExpenses() {
    const expensesContainer = document.getElementById('viewExpenses');
    // Simplified expense listing + adding modal structure
    expensesContainer.innerHTML = `
        <div class="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 mt-4">
            <h3 class="text-lg font-black text-white mb-4">খরচের তালিকা</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-zinc-300">
                    <thead class="text-xs uppercase text-zinc-500 font-bold border-b border-zinc-800">
                        <tr>
                            <th class="py-2">তারিখ</th>
                            <th class="py-2">বিবরণ</th>
                            <th class="py-2">ক্যাটাগরি</th>
                            <th class="py-2 text-right">পরিমান (টাকা)</th>
                            <th class="py-2 text-center">স্ট্যাটাস</th>
                        </tr>
                    </thead>
                    <tbody id="expensesTableBody">
                    </tbody>
                </table>
            </div>
            <button onclick="openAddExpenseModal()" class="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold">খরচ যোগ করুন</button>
        </div>
    `;
    loadExpenses();
}

async function loadExpenses() {
    // Current user context
    const officer = api.getCurrentOfficer();
    const res = await api.getExpenses(officer ? { memberId: officer.id } : {});
    const tbody = document.getElementById('expensesTableBody');
    if (res.success) {
        tbody.innerHTML = res.data.map(e => `
            <tr class="border-b border-zinc-800">
                <td class="py-3">${e.expense_date}</td>
                <td class="py-3">${e.description}</td>
                <td class="py-3">${e.category}</td>
                <td class="py-3 text-right font-bold text-white">${e.amount}</td>
                <td class="py-3 text-center">
                    <span class="px-2 py-1 rounded text-[10px] font-bold ${e.status === 'Approved' ? 'bg-emerald-900 text-emerald-300' : e.status === 'Rejected' ? 'bg-rose-900 text-rose-300' : 'bg-amber-900 text-amber-300'}">${e.status}</span>
                </td>
            </tr>
        `).join('');
    }
}

// Minimal placeholder for the modal function needed for the button
function openAddExpenseModal() {
    alert('খরচ যোগ করার ফর্মটি শীঘ্রই আসছে!');
}

window.initExpenses = initExpenses;
window.openAddExpenseModal = openAddExpenseModal;
