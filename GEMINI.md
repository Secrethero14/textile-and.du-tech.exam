# Habib's Care Exam Portal — Project Context & System Architecture

## 1. Project Overview & Identity
- **Project Name:** Habib's Care Textile & Engineering Exam Preparation Platform
- **Live Production URL:** [https://textile-du-tech-exam.vercel.app/](https://textile-du-tech-exam.vercel.app/)
- **GitHub Repository:** `https://github.com/Secrethero14/textile-and.du-tech.exam.git` (Branch: `main`)
- **Local Project Path:** `E:\my own exam web site\textile-and.du-tech.exam-main\`
- **Target Audience:** Textile Engineering & BUTEX admission candidates in Bangladesh.
- **Language & Numbers Policy:** Complete Bengali language (`বাংলা`) and Bengali digits (`০-৯`) across all UI elements, cards, and fees. English is only reserved for brand names (`Habib's Care`) and technical terms where necessary.

---

## 2. Core Architecture & Tech Stack
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (modular scripts: `main.js`, `exam.js`, `mistakes.js`, etc.).
- **Backend / Authentication:** Firebase Authentication (Google Login & Email) and Firestore.
- **Dynamic Content & Pricing:**
  - Google Sheet acts as the CMS (managed via custom Google Apps Script).
  - The Sheet pushes JSON files to GitHub (`public/questions/settings.json`, `Exam_Index.json`, etc.).
  - `main.js` fetches `public/questions/settings.json` dynamically to load:
    - `Course_Fee` (Current: 149 TK / `১৪৯ টাকা`)
    - `Course_Features` (Comma-separated 7 core features)
    - Payment numbers (`bkash_number`, `nagad_number`, `rocket_number`)
    - `whatsapp_number` and `Telegram_Link`
- **Hosting & CI/CD:** Vercel auto-deploys upon push to GitHub `main` branch.

---

## 3. Key Design Decisions & Visual Standards
1. **Promo / Payment Banner (`#promoBanner`):**
   - **Position:** Placed right below `.nav-header` and *above* `#loader` / `#examContainer` (so students see fee and enrollment immediately without scrolling down 100+ exams).
   - **Layout:** Sleek, compact, minimal size (~200px height on mobile).
   - **Alignment:** Completely centered (`text-align: center; justify-content: center;`).
   - **Color Scheme:** Rich, fresh green background (`#d1fae5`) with deep emerald border (`#10b981`).
   - **Header:** Course title `টেক্সটাইল ইঞ্জিনিয়ারিং অ্যাডমিশন ফুল কোর্স` in bold dark green (`#064e3b`). No distracting generic subtitles.
   - **Action Button:** Centered green button `কোর্সে ভর্তি হন • ১৪৯ টাকা` (`#059669`).
   - **Feature Grid:** 7 compact white chips (`background: #ffffff; border: 1px solid #a7f3d0; color: #065f46`). Mobile shows 2 columns with the 7th item spanning full width.
2. **Harmonious Quote Card (`#siteAboutNote`):**
   - Located right above the footer.
   - Rich, vibrant blue/cyan gradient (`linear-gradient(145deg, #ffffff 0%, #f0fafc 50%, #e2f6f9 100%)`).
   - Deep teal-cyan quote marks (`#0e7490`) with high contrast text.
3. **Glacier Footer (`.site-footer.glacier-footer`):**
   - Deep glacier dark card (`rgba(13, 20, 36, 0.94)`) with cyan accent borders (`rgba(56, 189, 248, 0.25)`).
   - 2-color accent bar (`#10b981` to `#3b82f6`) and left-aligned structured links.
4. **Payment Modal (`#paymentModal`):**
   - Compact and minimal popup (`max-width: 405px`, padding `16px 18px`).
   - Dropdown payment selector (bKash Merchant, Nagad Personal Send Money, Rocket Personal Send Money).
   - Constrained app guide image height (`max-height: 105px`) so it never extends beyond phone screens.
   - Clean number copy buttons, support link, and submission form button (`give_access.html`).

---

## 4. Google Sheets & Dynamic Settings Setup
- **Active Sheet Format:** `Key` | `Value` tab.
  - Rows: `Course_Fee`, `Course_Features`, `Telegram_Link`, `bkash_number`, `nagad_number`, `rocket_number`, `whatsapp_number`.
  - The Google Apps Script menu "Website Update" pushes these rows into `public/questions/settings.json`.
  - The multi-column table format (`Course Name | Course Fee...`) is redundant and not needed.

---

## 5. Development Workflow Guidelines
- **Always pull rebase before push:** `git pull --rebase origin main && git push origin main`.
- **Node.js Scripting:** For file edits or checks in Powershell, write standalone `.js` scripts in the scratch directory to avoid quote-escaping syntax issues.
- **Communication:** Always communicate with the user in Bengali.
