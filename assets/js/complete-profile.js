import { auth, db, showLoader, hideLoader } from "./app.js";
import { showToast, qs } from "./utils.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const whatsappEl = document.getElementById("whatsapp");
const saveBtn = document.getElementById("saveBtn");

const countryBtn = document.getElementById("countryBtn");
const countryMenu = document.getElementById("countryMenu");
const countryFlag = document.getElementById("countryFlag");
const countryCode = document.getElementById("countryCode");

const next = qs("next") || "./index.html";

const countries = [
  { name:"الأردن", flag:"🇯🇴", code:"+962" },
  { name:"السعودية", flag:"🇸🇦", code:"+966" },
  { name:"الإمارات", flag:"🇦🇪", code:"+971" },
  { name:"الكويت", flag:"🇰🇼", code:"+965" },
  { name:"قطر", flag:"🇶🇦", code:"+974" },
  { name:"البحرين", flag:"🇧🇭", code:"+973" },
  { name:"فلسطين", flag:"🇵🇸", code:"+970" },
  { name:"مصر", flag:"🇪🇬", code:"+20" },
  { name:"العراق", flag:"🇮🇶", code:"+964" },
  { name:"لبنان", flag:"🇱🇧", code:"+961" },
  { name:"سوريا", flag:"🇸🇾", code:"+963" },
  { name:"تركيا", flag:"🇹🇷", code:"+90" }
];

function renderCountries(){
  countryMenu.innerHTML = countries.map(c => `
    <div class="country-item" data-code="${c.code}" data-flag="${c.flag}">
      <div class="left"><span>${c.flag}</span><span>${c.name}</span></div>
      <div class="code">${c.code}</div>
    </div>
  `).join("");
  countryMenu.querySelectorAll(".country-item").forEach(item=>{
    item.addEventListener("click", ()=>{
      countryFlag.textContent = item.getAttribute("data-flag");
      countryCode.textContent = item.getAttribute("data-code");
      countryMenu.classList.add("hidden");
    });
  });
}
renderCountries();

countryBtn.addEventListener("click", ()=> countryMenu.classList.toggle("hidden"));
document.addEventListener("click", (e)=>{
  const inside = countryMenu.contains(e.target) || countryBtn.contains(e.target);
  if (!inside) countryMenu.classList.add("hidden");
});

function buildWhatsapp(){
  const code = (countryCode.textContent || "+962").trim();
  let num = (whatsappEl.value || "").trim().replace(/\D/g,"");
  if (!num) return "";
  return `${code}${num}`;
}

onAuthStateChanged(auth, async (user)=>{
  if (!user){
    const url = new URL("./login.html", location.href);
    url.searchParams.set("next", next);
    location.href = url.toString();
    return;
  }
  const snap = await getDoc(doc(db,"users", user.uid));
  const data = snap.exists()? snap.data(): {};
  if (data.whatsapp && String(data.whatsapp).trim().length >= 5){
    location.href = next;
  }
});

saveBtn.addEventListener("click", async ()=>{
  const user = auth.currentUser;
  if (!user) return;

  const whatsapp = buildWhatsapp();
  if (!whatsapp || whatsapp.length < 7){
    showToast("رقم الواتساب غير صحيح", "error");
    return;
  }

  try{
    showLoader();
    await updateDoc(doc(db,"users", user.uid), { whatsapp, updatedAt: Date.now() });
    hideLoader();
    location.href = next;
  }catch{
    hideLoader();
    showToast("تعذر الحفظ", "error");
  }
});
