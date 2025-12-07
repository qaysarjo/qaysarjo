import { auth, db, showLoader, hideLoader } from "./app.js";
import { showToast } from "./utils.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const list = document.getElementById("list");
const empty = document.getElementById("empty");
const filterEl = document.getElementById("filter");

let orders = [];

function pill(status){
  if (status === "approved") return `<span class="state approved">مقبول</span>`;
  if (status === "rejected") return `<span class="state rejected">مرفوض</span>`;
  return `<span class="state pending">قيد الانتظار</span>`;
}

function esc(s){
  return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

function render(){
  const f = filterEl.value;
  const items = orders.filter(o=> !f || o.status === f);

  list.innerHTML = "";
  if (!items.length){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  for (const o of items){
    const el = document.createElement("div");
    el.className = "list-item";
    el.innerHTML = `
      <div>
        <div class="list-title">${esc(o.accountTitle || "—")}</div>
        <div class="list-sub">
          طريقة الدفع: <b>${esc(o.paymentMethodName || "—")}</b><br>
          المبلغ: <b>${esc(o.paidAmount || 0)}</b><br>
          ${o.status === "approved" ? "<b>سيتم التواصل معك قريباً ✅</b>" : ""}
        </div>
      </div>
      <div>${pill(o.status)}</div>
    `;
    list.appendChild(el);
  }
}

filterEl?.addEventListener("change", render);

onAuthStateChanged(auth, async (user)=>{
  if (!user){
    const url = new URL("./login.html", location.href);
    url.searchParams.set("next", "./orders.html");
    location.href = url.toString();
    return;
  }

  showLoader();
  try{
    const snap = await getDocs(query(
      collection(db,"orders"),
      where("userId","==", user.uid),
      orderBy("createdAt","desc")
    ));
    orders = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    hideLoader();
    render();
  }catch(e){
    hideLoader();
    showToast("تعذر تحميل الطلبات", "error");
  }
});
