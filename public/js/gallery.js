// Photo Gallery Feature - DTC Marketing

window.fetchAndRenderGallery = async function() {
  const container = document.getElementById('galleryGroupsContainer');
  const officerFilter = document.getElementById('galleryOfficerFilter');
  const countSummary = document.getElementById('galleryCountSummary');
  if (!container) return;

  container.innerHTML = '<div class="text-center py-12 text-zinc-400 animate-pulse">ফটো গ্যালারি লোড হচ্ছে...</div>';

  try {
    // Load team dropdown for filter if admin and empty
    if (api.isAdmin() && officerFilter && officerFilter.options.length <= 1) {
      loadTeamDropdown(officerFilter);
    }

    const selectedOfficerId = officerFilter ? officerFilter.value : '';
    let url = '/api/visits/gallery';
    if (selectedOfficerId) {
      url += `?officer_id=${selectedOfficerId}`;
    }

    const res = await fetch(url, { headers: api.getAuthHeaders() });
    const json = await res.json();

    if (!json.success) {
      container.innerHTML = `<div class="text-center py-12 text-rose-400">ত্রুটি: ${json.error || 'গ্যালারি লোড করতে ব্যর্থ হয়েছে'}</div>`;
      return;
    }

    const photos = json.data || [];
    if (countSummary) {
      countSummary.textContent = `মোট ছবি: ${photos.length} টি`;
    }

    if (photos.length === 0) {
      container.innerHTML = `
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <svg class="w-12 h-12 text-zinc-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <h3 class="text-base font-bold text-white">কোনো ভিজিট ছবি পাওয়া যায়নি</h3>
          <p class="text-xs text-zinc-400">কর্মকর্তাগণ ফিল্ড ভিজিট এন্ট্রি করার সময় ছবি আপলোড করলে এখানে কর্মকর্তার নাম অনুযায়ী স্বয়ংক্রিয়ভাবে জমা হবে।</p>
        </div>
      `;
      return;
    }

    // Group photos by member_id / member_name
    const groups = {};
    photos.forEach(item => {
      const mId = item.member_id;
      if (!groups[mId]) {
        groups[mId] = {
          name: item.member_name,
          role: item.member_role || 'Marketing Officer',
          items: []
        };
      }
      groups[mId].items.push(item);
    });

    let html = '';
    for (const [mId, group] of Object.entries(groups)) {
      html += `
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
          <!-- Officer Header Banner -->
          <div class="bg-zinc-950 px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-black text-sm border border-primary-500/30">
                ${group.name.charAt(0)}
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                  <span>${group.name}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-primary-950 text-primary-300 border border-primary-800">${group.role}</span>
                </h3>
                <p class="text-[11px] text-zinc-400">সর্বমোট জমা দেওয়া ছবি: ${group.items.length} টি</p>
              </div>
            </div>
            <div class="text-xs font-semibold text-primary-400 bg-primary-950/50 px-3 py-1 rounded-xl border border-primary-900/50">
              অটো-সেভড গ্যালারি
            </div>
          </div>

          <!-- Photo Grid for this Officer -->
          <div class="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      `;

      group.items.forEach(visit => {
        const badgeColor =
          visit.status === 'Closed/Won' ? 'bg-purple-950 text-purple-300 border-purple-800' :
          visit.status === 'Interested' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
          visit.status === 'Follow-up' ? 'bg-amber-950 text-amber-300 border-amber-800' :
          visit.status === 'Need Quotation' ? 'bg-blue-950 text-blue-300 border-blue-800' :
          'bg-zinc-800 text-zinc-300 border-zinc-700';

        // Escape JSON for safe inline attribute
        const visitJsonStr = encodeURIComponent(JSON.stringify(visit));

        html += `
          <div class="bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-hidden group hover:border-primary-500/50 transition-all flex flex-col shadow-md">
            <div class="relative aspect-video sm:aspect-square bg-zinc-900 overflow-hidden cursor-pointer" onclick='openPhotoLightboxFromStr("${visitJsonStr}")'>
              <img src="${visit.photo_data}" alt="Visit Photo" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
              <div class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor} shadow">
                ${visit.status}
              </div>
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                🔍 বড় করে দেখুন
              </div>
            </div>
            <div class="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <div class="font-bold text-white text-xs sm:text-sm truncate" title="${visit.customer_name}">${visit.customer_name}</div>
                <div class="text-[11px] text-primary-400 font-medium truncate" title="${visit.site_name}">${visit.site_name}</div>
                <div class="text-[10px] text-zinc-400 truncate mt-0.5" title="${visit.address}">📍 ${visit.address}</div>
              </div>
              <div class="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                <span>📅 ${visit.visit_date}</span>
                <button onclick='openPhotoLightboxFromStr("${visitJsonStr}")' class="text-primary-400 hover:text-primary-300 font-bold underline">বিস্তারিত</button>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

  } catch (err) {
    console.error('Error fetching gallery:', err);
    container.innerHTML = `<div class="text-center py-12 text-rose-400">গ্যালারি লোড করতে সমস্যা হয়েছে: ${err.message}</div>`;
  }
};

window.openPhotoLightboxFromStr = function(encodedStr) {
  try {
    const visit = JSON.parse(decodeURIComponent(encodedStr));
    openPhotoLightbox(visit);
  } catch (e) {
    console.error('Lightbox error:', e);
  }
};

window.openPhotoLightbox = function(visit) {
  const modal = document.getElementById('photoLightboxModal');
  const img = document.getElementById('lightboxImage');
  const title = document.getElementById('lightboxTitle');
  const subtitle = document.getElementById('lightboxSubtitle');
  const details = document.getElementById('lightboxDetails');
  if (!modal) return;

  img.src = visit.photo_data;
  title.textContent = `${visit.customer_name} (${visit.site_name})`;
  subtitle.textContent = `কর্মকর্তা: ${visit.member_name} (${visit.member_role || 'Officer'})`;

  details.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div><span class="text-zinc-500">তারিখ:</span> <span class="font-semibold text-white">${visit.visit_date}</span></div>
      <div><span class="text-zinc-500">স্ট্যাটাস:</span> <span class="font-semibold text-primary-400">${visit.status}</span></div>
      <div><span class="text-zinc-500">মোবাইল:</span> <span class="font-semibold text-white">${visit.phone_number}</span></div>
      <div><span class="text-zinc-500">ঠিকানা:</span> <span class="font-semibold text-white">${visit.address}</span></div>
    </div>
    ${visit.notes ? `<div class="mt-2 pt-2 border-t border-zinc-900"><span class="text-zinc-500">মন্তব্য:</span> <span class="text-zinc-200">${visit.notes}</span></div>` : ''}
  `;

  modal.classList.remove('hidden');
};

window.closePhotoLightbox = function() {
  const modal = document.getElementById('photoLightboxModal');
  if (modal) modal.classList.add('hidden');
};
