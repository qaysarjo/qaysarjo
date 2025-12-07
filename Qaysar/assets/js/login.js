import { auth, db, showLoader, hideLoader } from "./app.js";
import { showToast, qs } from "./utils.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginBox = document.getElementById("loginBox");
const signupBox = document.getElementById("signupBox");

const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");
const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.getElementById("googleBtn");

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("pass");
const whatsappEl = document.getElementById("whatsapp");
const signupBtn = document.getElementById("signupBtn");

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

function switchTab(mode){
  const isLogin = mode === "login";
  tabLogin?.classList.toggle("active", isLogin);
  tabSignup?.classList.toggle("active", !isLogin);
  loginBox?.classList.toggle("hidden", !isLogin);
  signupBox?.classList.toggle("hidden", isLogin);
}
tabLogin?.addEventListener("click", ()=> switchTab("login"));
tabSignup?.addEventListener("click", ()=> switchTab("signup"));

function renderCountries(){
  if (!countryMenu) return;
  countryMenu.innerHTML = countries.map(c => `
    <div class="country-item" data-code="${c.code}" data-flag="${c.flag}">
      <div class="left"><span>${c.flag}</span><span>${c.name}</span></div>
      <div class="code">${c.code}</div>
    </div>
  `).join("");
  countryMenu.querySelectorAll(".country-item").forEach(item=>{
    item.addEventListener("click", ()=>{
      countryFlag.textContent = item.getAttribute("data-flag") || "🇯🇴";
      countryCode.textContent = item.getAttribute("data-code") || "+962";
      countryMenu.classList.add("hidden");
    });
  });
}
renderCountries();

countryBtn?.addEventListener("click", ()=> countryMenu?.classList.toggle("hidden"));
document.addEventListener("click", (e)=>{
  if (!countryMenu || !countryBtn) return;
  const inside = countryMenu.contains(e.target) || countryBtn.contains(e.target);
  if (!inside) countryMenu.classList.add("hidden");
});

function buildWhatsapp(){
  const code = (countryCode?.textContent || "+962").trim();
  let num = (whatsappEl?.value || "").trim().replace(/\D/g, "");
  if (!num) return "";
  return `${code}${num}`;
}

/* Email login */
loginBtn?.addEventListener("click", async ()=>{
  const email = (loginEmail?.value || "").trim();
  const pass = loginPass?.value || "";
  if (!email || !pass) return showToast("أدخل الإيميل وكلمة المرور", "error");

  try{
    showLoader();
    await signInWithEmailAndPassword(auth, email, pass);
    hideLoader();
    location.href = next;
  }catch{
    hideLoader();
    showToast("بيانات الدخول غير صحيحة", "error");
  }
});

/* Google login — WhatsApp mandatory */
googleBtn?.addEventListener("click", async ()=>{
  try{
    showLoader();
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);

    const u = res.user;
    const uref = doc(db, "users", u.uid);
    const usnap = await getDoc(uref);

    if (!usnap.exists()){
      await setDoc(uref, {
        name: u.displayName || "User",
        email: u.email || "",
        whatsapp: "",
        role: "user",
        createdAt: Date.now()
      });
    }

    const finalSnap = await getDoc(uref);
    const data = finalSnap.exists() ? finalSnap.data() : {};
    hideLoader();

    if (!data.whatsapp || String(data.whatsapp).trim().length < 5){
      showToast("اكمل رقم الواتساب لإتمام التسجيل", "error");
      const url = new URL("./complete-profile.html", location.href);
      url.searchParams.set("next", next);
      location.href = url.toString();
      return;
    }

    location.href = next;
  }catch{
    hideLoader();
    showToast("تعذر دخول Google", "error");
  }
});

/* Email signup */
signupBtn?.addEventListener("click", async ()=>{
  const name = (nameEl?.value || "").trim();
  const email = (emailEl?.value || "").trim();
  const pass = passEl?.value || "";
  const whatsapp = buildWhatsapp();

  if (!name || !email || !pass) return showToast("أكمل البيانات المطلوبة", "error");
  if (!whatsapp) return showToast("رقم الواتساب إجباري", "error");

  try{
    showLoader();
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = res.user.uid;

    await setDoc(doc(db,"users", uid), {
      name, email, whatsapp,
      role: "user",
      createdAt: Date.now()
    });

    hideLoader();
    location.href = next;
  }catch{
    hideLoader();
    showToast("تعذر إنشاء الحساب (قد يكون الإيميل مستخدم)", "error");
  }
});
