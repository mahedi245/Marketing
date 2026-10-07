// Bilingual translation system (Bangla / English) - DTC Marketing
const translations = {
  en: {
    app_title: "DTC Marketing",
    app_subtitle: "Field Visit & Customer Lead Management",
    nav_entry: "Quick Entry",
    nav_my_visits: "My Visits",
    nav_dashboard: "Admin Dashboard",
    nav_team: "Team",
    nav_share: "Mobile Link",
    nav_admin_btn: "Admin Panel",
    nav_officer_btn: "Officer Login",
    btn_logout: "Logout",
    lang_btn: "বাংলা",

    // Officer Auth
    officer_select_title: "Officer Identification",
    officer_select_subtitle: "Select your name and enter your 4-digit PIN",
    officer_pin_placeholder: "Enter 4-digit PIN (default: 1234)",
    btn_officer_login: "Access My Portal",
    my_visits_title: "My Logged Visits",
    my_visits_subtitle: "Personal customer visit history (Only visible to you)",

    // Admin Auth
    admin_login_title: "Main Admin Security Lock",
    admin_login_subtitle: "Only authorized administrators can view all entries",
    admin_pin_placeholder: "Enter Admin PIN",
    btn_admin_unlock: "Unlock Full Dashboard",
    admin_active_badge: "Admin Mode Active",

    // Quick Entry Form
    entry_title: "New Customer Visit Entry",
    entry_subtitle: "Record field meeting details in 30 seconds",
    officer_label: "Marketing Officer",
    officer_placeholder: "-- Select Team Member --",
    customer_label: "Customer / Contact Person",
    customer_placeholder: "e.g. Engr. Mahbubul Alam",
    site_label: "Site / Organization / Project Name",
    site_placeholder: "e.g. Green City Project / ABC Ltd",
    address_label: "Address / Location",
    address_placeholder: "e.g. Plot 45, Road 11, Banani, Dhaka",
    phone_label: "Phone / Mobile Number",
    phone_placeholder: "e.g. 01711-223344",
    date_label: "Visit Date",
    status_label: "Visit Status",
    notes_label: "Discussion Notes / Remarks",
    notes_placeholder: "Key points discussed, client requirements, pricing remarks...",
    followup_label: "Next Follow-up Date (Optional)",
    btn_submit: "Save Visit Log",
    btn_saving: "Saving...",
    btn_reset: "Clear Form",
    success_toast: "Visit logged successfully!",

    // Statuses
    status_interested: "Interested",
    status_followup: "Follow-up",
    status_quotation: "Need Quotation",
    status_closed: "Closed/Won",
    status_not_interested: "Not Interested",

    // Dashboard KPIs
    kpi_total: "Total Visits",
    kpi_today: "Today's Visits",
    kpi_month: "This Month",
    kpi_closed: "Closed / Won",
    kpi_followup: "Pending Follow-ups",
    kpi_top: "Top Performer",
    kpi_visits: "visits",

    // Charts
    chart_trend_title: "Visit Trends (Last 30 Days)",
    chart_status_title: "Status Distribution",
    chart_members_title: "Top Officer Activity",

    // Filter & Table
    search_placeholder: "Search by customer, site, address, phone...",
    filter_all_members: "All Officers",
    filter_all_status: "All Statuses",
    filter_date_start: "From Date",
    filter_date_end: "To Date",
    btn_export: "Export to Excel (CSV)",
    btn_add_member: "Add Member",
    table_date: "Date",
    table_officer: "Officer",
    table_customer_site: "Customer & Site",
    table_contact: "Contact & Address",
    table_status: "Status",
    table_notes: "Notes & Follow-up",
    table_actions: "Actions",
    no_records: "No visit records found matching your filters.",

    // Modals
    edit_title: "Edit Visit Record",
    delete_confirm_title: "Confirm Delete",
    delete_confirm_msg: "Are you sure you want to delete this visit record? This action cannot be undone.",
    btn_delete: "Delete",
    btn_cancel: "Cancel",
    btn_update: "Update Record",

    // Team Modal
    team_title: "Marketing Team Roster",
    team_name_col: "Name",
    team_role_col: "Role",
    team_phone_col: "Phone",
    team_visits_col: "Total Visits",
    team_status_col: "Status",
    btn_add_officer: "Add New Officer",

    // Mobile Connect
    share_title: "Mobile Field Access",
    share_desc: "Marketing officers can open this link on their smartphones over office Wi-Fi to submit visits directly:"
  },
  bn: {
    app_title: "DTC Marketing",
    app_subtitle: "ফিল্ড ভিজিট ও কাস্টমার লিড ম্যানেজমেন্ট",
    nav_entry: "দ্রুত এন্ট্রি",
    nav_my_visits: "আমার ভিজিট",
    nav_dashboard: "অ্যাডমিন ড্যাশবোর্ড",
    nav_team: "টিম তালিকা",
    nav_share: "মোবাইল লিংক",
    nav_admin_btn: "মেইন অ্যাডমিন",
    nav_officer_btn: "অফিসার পরিবর্তন",
    btn_logout: "লগআউট",
    lang_btn: "English",

    // Officer Auth
    officer_select_title: "অফিসার নির্বাচন ও পিন",
    officer_select_subtitle: "আপনার নাম নির্বাচন করুন এবং ৪ ডিজিটের পিন দিন",
    officer_pin_placeholder: "৪ ডিজিটের পিন (ডিফল্ট: 1234)",
    btn_officer_login: "প্রবেশ করুন",
    my_visits_title: "আমার এন্ট্রি করা ভিজিটসমূহ",
    my_visits_subtitle: "আপনার ব্যক্তিগত কাস্টমার ভিজিট হিস্ট্রি (শুধুমাত্র আপনি দেখতে পাবেন)",

    // Admin Auth
    admin_login_title: "মেইন অ্যাডমিন নিরাপত্তা লক",
    admin_login_subtitle: "শুধুমাত্র অনুমোদিত অ্যাডমিন সবার ভিজিট দেখতে পাবেন",
    admin_pin_placeholder: "অ্যাডমিন পিন দিন",
    btn_admin_unlock: "ড্যাশবোর্ড আনলক করুন",
    admin_active_badge: "অ্যাডমিন মোড সক্রিয়",

    // Quick Entry Form
    entry_title: "নতুন কাস্টমার ভিজিট এন্ট্রি",
    entry_subtitle: "ফিল্ড ভিজিটের বিবরণ ৩০ সেকেন্ডে লিখে রাখুন",
    officer_label: "মার্কেটিং কর্মকর্তা",
    officer_placeholder: "-- কর্মকর্তা নির্বাচন করুন --",
    customer_label: "কাস্টমার / যোগাযোগের ব্যক্তি",
    customer_placeholder: "যেমন: ইঞ্জিনিয়ার মাহবুবুল আলম",
    site_label: "সাইট / প্রতিষ্ঠান / প্রজেক্টের নাম",
    site_placeholder: "যেমন: গ্রীন সিটি প্রজেক্ট / স্কয়ার ফার্মা",
    address_label: "ঠিকানা / এলাকা",
    address_placeholder: "যেমন: প্লট ৪৫, রোড ১১, বনানী, ঢাকা",
    phone_label: "মোবাইল নম্বর",
    phone_placeholder: "যেমন: 01711-223344",
    date_label: "ভিজিটের তারিখ",
    status_label: "বর্তমান অবস্থা (স্ট্যাটাস)",
    notes_label: "আলোচনা / বিস্তারিত মন্তব্য",
    notes_placeholder: "কী কথা হলো, ক্লায়েন্টের চাহিদা, পণ্যের দরদাম সংক্রান্ত আলোচনা...",
    followup_label: "পরবর্তী ফলো-আপের তারিখ (যদি থাকে)",
    btn_submit: "ভিজিট সংরক্ষণ করুন",
    btn_saving: "সংরক্ষণ হচ্ছে...",
    btn_reset: "ফর্ম খালি করুন",
    success_toast: "ভিজিট সফলভাবে সংরক্ষণ করা হয়েছে!",

    // Statuses
    status_interested: "আগ্রহী (Interested)",
    status_followup: "ফলো-আপ প্রয়োজন",
    status_quotation: "কোটেশন প্রয়োজন",
    status_closed: "সফল চুক্তি (Closed)",
    status_not_interested: "আগ্রহী নয়",

    // Dashboard KPIs
    kpi_total: "মোট ভিজিট",
    kpi_today: "আজকের ভিজিট",
    kpi_month: "চলতি মাস",
    kpi_closed: "সফল চুক্তি",
    kpi_followup: "পেন্ডিং ফলো-আপ",
    kpi_top: "সেরা কর্মকর্তা",
    kpi_visits: "টি ভিজিট",

    // Charts
    chart_trend_title: "ভিজিট ট্রেন্ড (গত ৩০ দিন)",
    chart_status_title: "স্ট্যাটাস অনুপাত",
    chart_members_title: "কর্মকর্তা অনুযায়ী পারফরম্যান্স",

    // Filter & Table
    search_placeholder: "কাস্টমার, সাইট, ঠিকানা বা মোবাইল নম্বর দিয়ে খুঁজুন...",
    filter_all_members: "সকল কর্মকর্তা",
    filter_all_status: "সকল স্ট্যাটাস",
    filter_date_start: "শুরুর তারিখ",
    filter_date_end: "শেষ তারিখ",
    btn_export: "এক্সেলে ডাউনলোড (CSV)",
    btn_add_member: "নতুন মেম্বার",
    table_date: "তারিখ",
    table_officer: "কর্মকর্তা",
    table_customer_site: "কাস্টমার ও সাইট",
    table_contact: "যোগাযোগ ও ঠিকানা",
    table_status: "স্ট্যাটাস",
    table_notes: "মন্তব্য ও ফলো-আপ",
    table_actions: "অ্যাকশন",
    no_records: "কোনো ভিজিট রেকর্ড পাওয়া যায়নি।",

    // Modals
    edit_title: "ভিজিট তথ্য পরিবর্তন",
    delete_confirm_title: "ডিলিট নিশ্চিত করুন",
    delete_confirm_msg: "আপনি কি নিশ্চিত যে এই ভিজিট রেকর্ডটি ডিলিট করতে চান?",
    btn_delete: "ডিলিট করুন",
    btn_cancel: "বাতিল",
    btn_update: "আপডেট সংরক্ষণ করুন",

    // Team Modal
    team_title: "মার্কেটিং টিম মেম্বারদের তালিকা",
    team_name_col: "নাম",
    team_role_col: "পদবী",
    team_phone_col: "মোবাইল",
    team_visits_col: "মোট ভিজিট",
    team_status_col: "স্ট্যাটাস",
    btn_add_officer: "নতুন কর্মকর্তা যুক্ত করুন",

    // Mobile Connect
    share_title: "মোবাইলে ব্যবহারের নিয়ম",
    share_desc: "মার্কেটিং টিমের সদস্যরা অফিসের একই ওয়াইফাই-তে যুক্ত হয়ে এই লিংকে ঢুকে মোবাইল থেকেই সরাসরি ভিজিট এন্ট্রি করতে পারবেন:"
  }
};

let currentLang = localStorage.getItem('app_lang') || 'bn';

function t(key) {
  return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('app_lang', lang);
  updateDOMTranslations();
}

function toggleLanguage() {
  setLanguage(currentLang === 'bn' ? 'en' : 'bn');
}

function updateDOMTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang]?.[key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[currentLang]?.[key]) {
      el.placeholder = translations[currentLang][key];
    }
  });

  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) {
    langBtn.textContent = t('lang_btn');
  }
  const langBtnMob = document.getElementById('langToggleBtnMob');
  if (langBtnMob) {
    langBtnMob.textContent = t('lang_btn');
  }

  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
}

window.t = t;
window.setLanguage = setLanguage;
window.toggleLanguage = toggleLanguage;
window.updateDOMTranslations = updateDOMTranslations;
