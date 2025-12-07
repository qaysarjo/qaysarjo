import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getSettings } from "./app.js";
import { getCurrency, formatMoney, convertPrice } from "./utils.js";

const accountsGrid = document.getElementById("accountsGrid");
const accountsEmpty = document.getElementById("accountsEmpty");
const searchInput = document.getElementById("searchInput");
const usdToJodEl = document.getElementById("usdToJod");
const skeletonGrid = document.getElementById("skeletonGrid");

const toTopBtn = document.getElementById("toTopBtn");
const toBottomBtn = document.getElementById("toBottomBtn");

let settings = { usdToJod: 0.72 };
let accounts = [];

function esc(s){
  return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

/* ===== Skeleton ===== */
function showSkeleton(count = 8){
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = "";
  for (let i=0;i<count;i++){
    const el = document.createElement("div");
    el.className = "skel-card shimmer";
    el.innerHTML = `
      <div class="skel-img"></div>
      <div class="skel-line md"></div>
      <div class="skel-line sm"></div>
      <div class="skel-row">
        <div class="skel-pill"></div>
        <div class="skel-pill" style="width:28%"></div>
      </div>
    `;
    skeletonGrid.appendChild(el);
  }
  skeletonGrid.classList.remove("hidden");
  accountsGrid?.classList.add("hidden");
  accountsEmpty?.classList.add("hidden");
}
function hideSkeleton(){
  skeletonGrid?.classList.add("hidden");
  accountsGrid?.classList.remove("hidden");
}

/* ===== Cards ===== */
function accCard(a){
  const el = document.createElement("div");
  el.className = "card";

  const baseCur = a.priceCurrency || "JOD";
  const conv = convertPrice(a.price || 0, baseCur, settings.usdToJod);
  const userCur = getCurrency();
  const shown = userCur === "USD" ? conv.USD : conv.JOD;

  const thumb = (a.images && a.images[0]) ? a.images[0] : "./assets/img/logo.png";

  el.innerHTML = `
    <img class="img" src="${thumb}" alt="img"/>
    <div class="card-title" style="margin-top:10px">${esc(a.title || "حساب")}</div>
    <div class="card-sub">${esc((a.description||"").slice(0,90))}${(a.description||"").length>90?"...":""}</div>
    <div class="card-row">
      <span class="badge primary"><i class="fa-solid fa-coins"></i> ${esc(formatMoney(shown, userCur))}</span>
      <span class="badge"><i class="fa-solid fa-star"></i> متاح</span>
    </div>
  `;
  el.addEventListener("click", ()=> location.href = `./accountpreview.html?id=${encodeURIComponent(a.id)}`);
  return el;
}

function render(){
  const q = (searchInput?.value || "").trim().toLowerCase();
  const filtered = accounts.filter(a=>{
    const okText = !q || String(a.title||"").toLowerCase().includes(q);
    return okText && (a.status || "active") === "active";
  });

  if (accountsGrid) accountsGrid.innerHTML = "";

  if (!filtered.length){
    accountsEmpty?.classList.remove("hidden");
    return;
  }
  accountsEmpty?.classList.add("hidden");
  filtered.forEach(a => accountsGrid.appendChild(accCard(a)));
}

async function load(){
  showSkeleton(8);

  settings = await getSettings();
  if (usdToJodEl) usdToJodEl.textContent = Number(settings.usdToJod || 0.72).toFixed(2);

  const accSnap = await getDocs(query(collection(db,"accounts"), orderBy("createdAt","desc")));
  accounts = accSnap.docs.map(d=>({ id:d.id, ...d.data() }));

  hideSkeleton();
  render();
}

searchInput?.addEventListener("input", render);
window.addEventListener("currencyChanged", render);

/* ===== Hero slider ===== */
function initHeroSlider(){
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  if (!slides.length) return;
  let cur = 0;

  setInterval(()=>{
    slides[cur].classList.remove("active");
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add("active");
  }, 5200);
}
initHeroSlider();

/* ===== Scroll Up/Down buttons ===== */
function updateFab(){
  const y = window.scrollY || 0;
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  if (toTopBtn) toTopBtn.classList.toggle("hidden", y < 260);
  if (toBottomBtn) toBottomBtn.classList.toggle("hidden", max - y < 260);
}

toTopBtn?.addEventListener("click", ()=>{
  window.scrollTo({ top: 0, behavior: "smooth" });
});
toBottomBtn?.addEventListener("click", ()=>{
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
});
window.addEventListener("scroll", updateFab, { passive:true });
window.addEventListener("resize", updateFab);
updateFab();

load().catch(()=>{
  hideSkeleton();
  accountsEmpty?.classList.remove("hidden");
});
