import { db } from "./firebase.js";
import { getSettings } from "./app.js";
import { getCurrency, formatMoney, convertPrice, showToast, copyText, qs } from "./utils.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const id = qs("id");

const titleEl = document.getElementById("title");
const mainImg = document.getElementById("mainImg");
const thumbs = document.getElementById("thumbs");
const videoEl = document.getElementById("video");
const priceBadge = document.getElementById("priceBadge");
const descEl = document.getElementById("desc");

const downloadBtn = document.getElementById("downloadBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyDescBtn = document.getElementById("copyDescBtn");
const buyBtn = document.getElementById("buyBtn");

let acc = null;
let settings = { usdToJod: 0.72 };

function esc(s){
  return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

function render(){
  titleEl.textContent = acc?.title || "—";
  descEl.textContent = acc?.description || "—";

  const images = acc?.images || [];
  if (images.length){
    mainImg.src = images[0];
    thumbs.innerHTML = "";
    images.forEach((url)=>{
      const im = document.createElement("img");
      im.className = "thumb";
      im.src = url;
      im.addEventListener("click", ()=> mainImg.src = url);
      thumbs.appendChild(im);
    });
  }

  if (acc?.videoUrl){
    videoEl.classList.remove("hidden");
    videoEl.src = acc.videoUrl;
  }else{
    videoEl.classList.add("hidden");
  }

  const baseCur = acc?.priceCurrency || "JOD";
  const conv = convertPrice(acc?.price || 0, baseCur, settings.usdToJod);
  const userCur = getCurrency();
  const shown = userCur === "USD" ? conv.USD : conv.JOD;
  priceBadge.innerHTML = `<i class="fa-solid fa-coins"></i> ${esc(formatMoney(shown, userCur))}`;
}

async function load(){
  if (!id) return showToast("معرّف الحساب غير موجود", "error");
  settings = await getSettings();

  const snap = await getDoc(doc(db,"accounts", id));
  if (!snap.exists()) return showToast("الحساب غير موجود", "error");
  acc = { id:snap.id, ...snap.data() };
  render();
}

window.addEventListener("currencyChanged", render);

copyLinkBtn.addEventListener("click", async ()=>{
  await copyText(location.href);
  showToast("تم نسخ الرابط ✅", "success");
});

copyDescBtn.addEventListener("click", async ()=>{
  await copyText(acc?.description || "");
  showToast("تم نسخ الوصف ✅", "success");
});

downloadBtn.addEventListener("click", async ()=>{
  const urls = acc?.images || [];
  if (!urls.length) return showToast("لا توجد صور", "error");
  // تحميل بسيط: فتح الصور واحدة تلو الأخرى (أفضل لGitHub Pages)
  urls.forEach((u)=> window.open(u, "_blank"));
  showToast("تم فتح الصور للتحميل ✅", "success");
});

buyBtn.addEventListener("click", ()=>{
  // لو مش مسجل—نوديه لصفحة الدخول ثم يرجعه
  const next = `./buy.html?id=${encodeURIComponent(id)}`;
  location.href = `./login.html?next=${encodeURIComponent(next)}`;
});

load().catch(()=> showToast("تعذر التحميل", "error"));
