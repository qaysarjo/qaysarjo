import { fbApp, auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getCurrency, setCurrency, showToast, applyTheme, getTheme, setTheme } from "./utils.js";

const loader = document.getElementById("pageLoader");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("sidebarOverlay");

const logoutBtn = document.getElementById("logoutBtn");
const loginNav  = document.getElementById("loginNav");

const currencyBtn = document.getElementById("currencyBtn");
const currencyLabel = document.getElementById("currencyLabel");

const themeBtn = document.getElementById("themeBtn");
const themeLabel = document.getElementById("themeLabel");

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

/* Theme */
applyTheme();
if (themeLabel) themeLabel.textContent = getTheme() === "light" ? "فاتح" : "داكن";

/* Loader: transparent ring + logo */
export function showLoader(){
  if (!loader) return;
  loader.classList.remove("hidden");
}
export function hideLoader(){
  if (!loader) return;
  loader.classList.add("hidden");
}

/* Drawer controls */
function openSidebar(){
  if (!sidebar) return;
  sidebar.classList.add("open");
  sidebar.setAttribute("aria-hidden","false");
  if (overlay){
    overlay.classList.remove("hidden");
    requestAnimationFrame(()=> overlay.classList.add("show"));
  }
  document.body.style.overflow = "hidden";
}
function closeSidebar(){
  if (!sidebar) return;
  sidebar.classList.remove("open");
  sidebar.setAttribute("aria-hidden","true");
  if (overlay){
    overlay.classList.remove("show");
    setTimeout(()=> overlay.classList.add("hidden"), 180);
  }
  document.body.style.overflow = "";
}
function toggleSidebar(){
  if (!sidebar) return;
  if (sidebar.classList.contains("open")) closeSidebar();
  else openSidebar();
}

function initSidebar(){
  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener("click", (e)=>{
    e.preventDefault();
    toggleSidebar();
  });

  overlay?.addEventListener("click", closeSidebar);

  // close on ESC
  document.addEventListener("keydown",(e)=>{
    if (e.key === "Escape" && sidebar.classList.contains("open")) closeSidebar();
  });

  // close when clicking nav link (on any screen)
  sidebar.addEventListener("click",(e)=>{
    const link = e.target.closest("[data-nav]");
    if (link) closeSidebar();
  });

  // close if resized and overlay open weird
  window.addEventListener("resize", ()=>{
    if (sidebar.classList.contains("open")) {
      // keep open; but if width becomes very large it still behaves fine
    }
  });
}

/* Navigation loading */
function bindNavLoading(){
  document.querySelectorAll("[data-nav]").forEach(a=>{
    a.addEventListener("click",(e)=>{
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

      e.preventDefault();
      showLoader();
      setTimeout(()=> location.href = href, 120);
    });
  });
}

/* Currency */
function updateCurrencyUI(){
  if (currencyLabel) currencyLabel.textContent = getCurrency();
}
if (currencyBtn){
  currencyBtn.addEventListener("click", ()=>{
    const cur = getCurrency();
    const next = cur === "JOD" ? "USD" : "JOD";
    setCurrency(next);
    updateCurrencyUI();
    window.dispatchEvent(new CustomEvent("currencyChanged", { detail:{ currency: next }}));
    showToast(`تم تغيير العملة إلى ${next}`, "success");
  });
}
updateCurrencyUI();

/* Theme toggle */
if (themeBtn){
  themeBtn.addEventListener("click", ()=>{
    const t = getTheme();
    const next = t === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme();
    if (themeLabel) themeLabel.textContent = next === "light" ? "فاتح" : "داكن";
    showToast("تم تغيير الوضع ✅","success");
  });
}

export async function getSettings(){
  const ref = doc(db, "settings", "app");
  const snap = await getDoc(ref);
  if (!snap.exists()) return { usdToJod: 0.72 };
  return snap.data();
}

bindNavLoading();
initSidebar();

/* Auth UI */
onAuthStateChanged(auth, (user)=>{
  const logged = !!user;
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !logged);
  if (loginNav) loginNav.classList.toggle("hidden", logged);
});

if (logoutBtn){
  logoutBtn.addEventListener("click", async ()=>{
    try{
      showLoader();
      await signOut(auth);
      location.href = "./index.html";
    }catch{
      hideLoader();
      showToast("تعذر تسجيل الخروج", "error");
    }
  });
}

/* Ensure loaders hide on bfcache */
window.addEventListener("pageshow", ()=> hideLoader());

export { auth, db, fbApp };
