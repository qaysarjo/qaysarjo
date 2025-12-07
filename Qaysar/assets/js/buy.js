import { auth, db, showLoader, hideLoader } from "./app.js";
import { qs, showToast, copyText } from "./utils.js";
import { CONFIG } from "./config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const id = qs("id");
const accountTitleEl = document.getElementById("accountTitle");
const methodSelect = document.getElementById("methodSelect");
const methodDetails = document.getElementById("methodDetails");
const methodInstructions = document.getElementById("methodInstructions");
const copyDetailsBtn = document.getElementById("copyDetailsBtn");
const amountEl = document.getElementById("amount");
const receiptEl = document.getElementById("receipt");
const sendOrderBtn = document.getElementById("sendOrderBtn");

let account = null;
let methods = [];

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

function renderMethod(){
  const mid = methodSelect.value;
  const m = methods.find(x=>x.id===mid);
  methodDetails.textContent = m?.details || "—";
  methodInstructions.textContent = m?.instructions || "—";
}

copyDetailsBtn.addEventListener("click", async ()=>{
  await copyText(methodDetails.textContent || "");
  showToast("تم النسخ ✅", "success");
});

methodSelect.addEventListener("change", renderMethod);

onAuthStateChanged(auth, async (user)=>{
  const next = `./buy.html?id=${encodeURIComponent(id||"")}`;
  if (!user){
    location.href = `./login.html?next=${encodeURIComponent(next)}`;
    return;
  }

  // require WhatsApp
  const usnap = await getDoc(doc(db,"users", user.uid));
  const udata = usnap.exists()? usnap.data() : {};
  if (!udata.whatsapp){
    location.href = `./complete-profile.html?next=${encodeURIComponent(next)}`;
    return;
  }

  if (!id){
    showToast("معرّف الحساب غير موجود", "error");
    return;
  }

  showLoader();
  try{
    const accSnap = await getDoc(doc(db,"accounts", id));
    if (!accSnap.exists()){
      hideLoader();
      showToast("الحساب غير موجود", "error");
      return;
    }
    account = { id, ...accSnap.data() };
    accountTitleEl.textContent = account.title || "—";

    const mSnap = await getDocs(query(collection(db,"payment_methods"), orderBy("createdAt","desc")));
    methods = mSnap.docs.map(d=>({ id:d.id, ...d.data() }));

    methodSelect.innerHTML = methods.map(m=>`<option value="${m.id}">${m.name}</option>`).join("");
    renderMethod();
    hideLoader();
  }catch{
    hideLoader();
    showToast("تعذر التحميل", "error");
  }
});

sendOrderBtn.addEventListener("click", async ()=>{
  const user = auth.currentUser;
  if (!user || !account) return;

  const methodId = methodSelect.value;
  const m = methods.find(x=>x.id===methodId);
  const paidAmount = Number(amountEl.value || 0);
  const file = receiptEl.files?.[0];

  if (!methodId || !m) return showToast("اختر طريقة الدفع", "error");
  if (!paidAmount || paidAmount <= 0) return showToast("أدخل مبلغ صحيح", "error");
  if (!file) return showToast("صورة الحوالة إجباري", "error");

  try{
    showLoader();
    const receiptUrl = await uploadToImgbb(file);

    await addDoc(collection(db,"orders"), {
      userId: user.uid,
      userEmail: user.email || "",
      accountId: account.id,
      accountTitle: account.title || "",
      paymentMethodId: methodId,
      paymentMethodName: m.name || "",
      paidAmount,
      receiptUrl,
      status: "pending",
      createdAt: Date.now()
    });

    hideLoader();
    showToast("تم إرسال طلب الشراء ✅", "success");
    location.href = "./orders.html";
  }catch(e){
    hideLoader();
    showToast("تعذر إرسال الطلب (تأكد من IMGBB KEY)", "error");
  }
});
