import { auth, db, showLoader, hideLoader, getSettings } from "./app.js";
import { showToast, convertPrice } from "./utils.js";
import { CONFIG } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const titleEl = document.getElementById("title");
const currencyEl = document.getElementById("currency");
const priceEl = document.getElementById("price");
const priceHint = document.getElementById("priceHint");
const descEl = document.getElementById("desc");
const videoEl = document.getElementById("videoUrl");
const imagesFilesEl = document.getElementById("imagesFiles");
const imgsPreview = document.getElementById("imgsPreview");
const sendBtn = document.getElementById("sendBtn");

let settings = { usdToJod: 0.72 };
let uploadedUrls = [];

function renderImgs(){
  imgsPreview.innerHTML = "";
  for (const url of uploadedUrls){
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `<img class="img" style="height:120px" src="${url}" alt="img">`;
    imgsPreview.appendChild(c);
  }
}

function updateHint(){
  const cur = currencyEl.value;
  const p = Number(priceEl.value || 0);
  const conv = convertPrice(p, cur, settings.usdToJod);
  priceHint.textContent = cur === "USD"
    ? `يعادل تقريباً: ${conv.JOD.toFixed(2)} د.أ`
    : `يعادل تقريباً: $ ${(conv.USD).toFixed(2)}`;
}
currencyEl.addEventListener("change", updateHint);
priceEl.addEventListener("input", updateHint);

async function uploadToImgbb(file){
  if (!CONFIG.IMGBB_KEY || CONFIG.IMGBB_KEY === "PASTE_KEY_HERE"){
    throw new Error("Missing IMGBB key");
  }
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${CONFIG.IMGBB_URL}?key=${encodeURIComponent(CONFIG.IMGBB_KEY)}`, {
    method:"POST",
    body: fd
  });
  const json = await res.json();
  if (!json?.success) throw new Error("imgbb");
  return json.data.url;
}

imagesFilesEl.addEventListener("change", async ()=>{
  const files = Array.from(imagesFilesEl.files || []);
  if (!files.length) return;

  try{
    showLoader();
    uploadedUrls = [];
    for (const f of files){
      const url = await uploadToImgbb(f);
      uploadedUrls.push(url);
      renderImgs();
    }
    hideLoader();
    showToast("تم رفع الصور ✅", "success");
  }catch(e){
    hideLoader();
    showToast("تعذر رفع الصور (تأكد من IMGBB KEY)", "error");
  }
});

onAuthStateChanged(auth, async (user)=>{
  if (!user){
    const url = new URL("./login.html", location.href);
    url.searchParams.set("next","./sell.html");
    location.href = url.toString();
    return;
  }
  const usnap = await getDoc(doc(db,"users", user.uid));
  const udata = usnap.exists()? usnap.data() : {};
  if (!udata.whatsapp){
    const url = new URL("./complete-profile.html", location.href);
    url.searchParams.set("next","./sell.html");
    location.href = url.toString();
    return;
  }
  settings = await getSettings();
  updateHint();
});

sendBtn.addEventListener("click", async ()=>{
  const user = auth.currentUser;
  if (!user) return;

  const title = (titleEl.value || "").trim();
  const priceCurrency = currencyEl.value;
  const price = Number(priceEl.value || 0);
  const description = (descEl.value || "").trim();
  const videoUrl = (videoEl.value || "").trim();

  if (!title || !price || price <= 0 || !description){
    showToast("أكمل البيانات (العنوان/السعر/الوصف)", "error"); return;
  }
  if (!uploadedUrls.length){
    showToast("اختر صور وارفعها أولاً", "error"); return;
  }

  try{
    showLoader();
    await addDoc(collection(db,"sell_requests"), {
      userId: user.uid,
      title,
      priceCurrency,
      price,
      description,
      images: uploadedUrls,
      videoUrl,
      status: "pending",
      createdAt: Date.now()
    });
    hideLoader();
    showToast("تم إرسال الطلب ✅", "success");

    titleEl.value=""; priceEl.value=""; descEl.value=""; videoEl.value="";
    imagesFilesEl.value = "";
    uploadedUrls = [];
    renderImgs();
    updateHint();
  }catch{
    hideLoader();
    showToast("تعذر إرسال الطلب", "error");
  }
});
