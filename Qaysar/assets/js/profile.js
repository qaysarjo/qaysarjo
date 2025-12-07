import { auth, db, showLoader, hideLoader } from "./app.js";
import { showToast, copyText } from "./utils.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const waEl = document.getElementById("whatsapp");
const copyBtn = document.getElementById("copyWaBtn");

onAuthStateChanged(auth, async (user)=>{
  if (!user){
    const url = new URL("./login.html", location.href);
    url.searchParams.set("next","./profile.html");
    location.href = url.toString();
    return;
  }
  showLoader();
  const snap = await getDoc(doc(db,"users", user.uid));
  hideLoader();

  const data = snap.exists()? snap.data() : {};
  nameEl.textContent = data.name || user.displayName || "—";
  emailEl.textContent = data.email || user.email || "—";
  waEl.textContent = data.whatsapp || "—";

  if (!data.whatsapp){
    const url = new URL("./complete-profile.html", location.href);
    url.searchParams.set("next","./profile.html");
    location.href = url.toString();
  }
});

copyBtn?.addEventListener("click", async ()=>{
  const t = waEl.textContent || "";
  if (t === "—") return showToast("لا يوجد واتساب", "error");
  await copyText(t);
  showToast("تم النسخ ✅", "success");
});
