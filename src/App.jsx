import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, getDocs, getDoc
} from "firebase/firestore";

const SHOP_ID_KEY = "dongbei-shop-id";
function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
function generateShopId() { return "db-" + Math.random().toString(36).slice(2, 10); }

// ══════════ 默认菜单数据 / Dati menu predefiniti ══════════
const DEFAULT_MENU = [
  // 串烧 Spiedini
  { id: "item-1", category: "chuanshao", zh: { name: "孜然羊肉串 (3串)", desc: "内蒙古羔羊肉，孜然飘香，外焦里嫩" }, it: { name: "Spiedini d'Agnello al Cumin (3 pz)", desc: "Agnello della Mongolia Interna, croccante fuori e succoso dentro" }, price: 8.9, image: null, badge: "popolare", status: "active" },
  { id: "item-2", category: "chuanshao", zh: { name: "牛肉串 (3串)", desc: "精选黄牛肉，酱香浓郁，鲜嫩多汁" }, it: { name: "Spiedini di Manzo (3 pz)", desc: "Manzo selezionato marinato, succulento e saporito" }, price: 9.5, image: null, badge: "consigliato", status: "active" },
  { id: "item-3", category: "chuanshao", zh: { name: "五花肉烤串 (3串)", desc: "东北特色五花肉，肥瘦相间，入口即化" }, it: { name: "Pancetta Grigliata BBQ (3 pz)", desc: "Pancetta di maiale stile Dongbei, scioglievole" }, price: 7.5, image: null, badge: "", status: "active" },
  { id: "item-4", category: "chuanshao", zh: { name: "香辣鸡翅 (2件)", desc: "腌制12小时，外皮酥脆，骨肉分离" }, it: { name: "Ali di Pollo Piccanti (2 pz)", desc: "Marinate 12 ore, pelle croccante, carne tenera" }, price: 7.0, image: null, badge: "novità", status: "active" },
  { id: "item-5", category: "chuanshao", zh: { name: "烤鸡心 (6粒)", desc: "精致小串，口感弹韧，撒孜然辣椒" }, it: { name: "Cuori di Pollo Grigliati (6 pz)", desc: "Bocconcini elastici con cumin e peperoncino" }, price: 6.0, image: null, badge: "", status: "active" },
  { id: "item-6", category: "chuanshao", zh: { name: "烤腰子 (2个)", desc: "东北烧烤必点，去腥处理，鲜嫩弹牙" }, it: { name: "Rognoni Grigliati (2 pz)", desc: "Specialità Dongbei, trattati senza odore, teneri" }, price: 8.0, image: null, badge: "speciale", status: "active" },
  // 海鲜 Frutti di Mare
  { id: "item-7", category: "haixian", zh: { name: "烤大虾 (3只)", desc: "鲜活基围虾，炭火炙烤，鲜甜爆汁" }, it: { name: "Gamberi alla Griglia (3 pz)", desc: "Gamberi freschi, grigliati a carbone, dolci e succosi" }, price: 11.5, image: null, badge: "popolare", status: "active" },
  { id: "item-8", category: "haixian", zh: { name: "蒜蓉扇贝 (2个)", desc: "蒜香四溢，粉丝吸满鲜汁，必点神器" }, it: { name: "Capesante con Aglio (2 pz)", desc: "Aglio abbondante, vermicelli assorbono il sugo" }, price: 10.0, image: null, badge: "consigliato", status: "active" },
  { id: "item-9", category: "haixian", zh: { name: "孜然鱿鱼 (1整只)", desc: "新鲜鱿鱼改花刀，孜然辣椒烤至微焦" }, it: { name: "Calamaro al Cumin (1 intero)", desc: "Calamaro fresco inciso, cumin e peperoncino" }, price: 12.0, image: null, badge: "", status: "active" },
  { id: "item-10", category: "haixian", zh: { name: "生蚝 (2个)", desc: "新鲜生蚝，蒜蓉或原味可选，鲜美肥嫩" }, it: { name: "Ostriche Fresche (2 pz)", desc: "Ostriche fresche, con aglio o naturali" }, price: 9.0, image: null, badge: "", status: "active" },
  // 蔬菜 Verdure
  { id: "item-11", category: "shucai", zh: { name: "烤金针菇 (1份)", desc: "锡纸包裹，蒜蓉酱油，鲜嫩多汁" }, it: { name: "Funghi Enoki al Cartoccio", desc: "In foglio di alluminio con aglio e salsa di soia" }, price: 5.5, image: null, badge: "", status: "active" },
  { id: "item-12", category: "shucai", zh: { name: "黄油烤玉米 (1根)", desc: "甜玉米刷黄油蜂蜜，香甜焦脆" }, it: { name: "Mais al Burro e Miele", desc: "Mais dolce con burro e miele, croccante" }, price: 4.5, image: null, badge: "", status: "active" },
  { id: "item-13", category: "shucai", zh: { name: "烤豆腐 (4块)", desc: "老豆腐两面金黄，蘸料秘制" }, it: { name: "Tofu Grigliato (4 pz)", desc: "Tofu dorato su entrambi i lati, salsa speciale" }, price: 5.0, image: null, badge: "", status: "active" },
  { id: "item-14", category: "shucai", zh: { name: "烤茄子 (1份)", desc: "东北大茄子，蒜蓉香辣酱，软糯入味" }, it: { name: "Melanzane Grigliate", desc: "Melanzane Dongbei con salsa piccante all'aglio" }, price: 6.0, image: null, badge: "popolare", status: "active" },
  // 凉菜 Antipasti Freddi
  { id: "item-15", category: "liangcai", zh: { name: "拍黄瓜", desc: "蒜泥+香醋+辣椒油，清爽开胃" }, it: { name: "Cetrioli in Salsa Piccante", desc: "Aglio·aceto di riso·olio di peperoncino" }, price: 5.0, image: null, badge: "", status: "active" },
  { id: "item-16", category: "liangcai", zh: { name: "皮蛋豆腐", desc: "嫩滑豆腐+皮蛋，浇秘制酱汁，口感层次丰富" }, it: { name: "Tofu con Uovo in Salmoia", desc: "Tofu morbido con uovo cinese conservato, salsa speciale" }, price: 6.5, image: null, badge: "", status: "active" },
  { id: "item-17", category: "liangcai", zh: { name: "东北大拉皮", desc: "透明宽粉+黄瓜丝+芝麻酱，Q弹爽滑" }, it: { name: "Spaghetti Dongbei in Salsa Sesamo", desc: "Amidi trasparenti larghi, cetriolo, salsa di sesamo" }, price: 7.0, image: null, badge: "speciale", status: "active" },
  // 主食 Piatti Principali
  { id: "item-18", category: "zhushi"}];
   const DEFAULT_SHOP_INFO = {
  name: "东北烧烤",
  nameit: "Dongbei BBQ Roma",
  address: "Piazza Dante 5, 00185 Roma",
  phone: "06 77076392",
};

const CATEGORIES = [
  { id: "chuanshao", zh: "串烧", it: "Spiedini BBQ", icon: "🔥" },
  { id: "haixian",  zh: "海鲜", it: "Frutti di Mare", icon: "🦐" },
  { id: "shucai",   zh: "蔬菜", it: "Verdure", icon: "🥦" },
  { id: "liangcai", zh: "凉菜", it: "Antipasti Freddi", icon: "🥗" },
  { id: "zhushi",   zh: "主食", it: "Piatti Principali", icon: "🍜" },
  { id: "yinpin",   zh: "饮品", it: "Bevande", icon: "🍺" },
];

// 成份/过敏原图标
const ALLERGEN_ICONS = {
  chuanshao: ["🥩","🌶️","🌾"],
  haixian:   ["🦐","🐟","⚠️"],
  shucai:    ["🥦","🌿","🥛"],
  liangcai:  ["🥗","🥜","🌾"],
  zhushi:    ["🌾","🥚","🌶️"],
  yinpin:    ["🍺","🌰","✅"],
};

const BADGES_IT = ["", "popolare", "novità", "speciale", "consigliato", "pranzo"];
const BADGES_ZH = ["", "热销", "新品", "招牌", "推荐", "午餐"];

// ══════════ QR CODE ══════════
function loadQRScript() {
  return new Promise((resolve) => {
    if (window.QRCode) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = resolve; s.onerror = resolve;
    document.head.appendChild(s);
  });
}

function QRDisplay({ shopId }) {
  const ref = useRef(null);
  const menuUrl = `${window.location.origin}${window.location.pathname}?shop=${shopId}&view=menu`;
  useEffect(() => {
    loadQRScript().then(() => {
      if (!ref.current) return;
      ref.current.innerHTML = "";
      if (window.QRCode) {
        new window.QRCode(ref.current, {
          text: menuUrl, width: 200, height: 200,
          colorDark: "#1A0A00", colorLight: "#FAF6F0",
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      }
    });
  }, [shopId]);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div ref={ref} style={{ background:"#FAF6F0", padding:14, borderRadius:14, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }} />
      <div style={{ fontSize:"0.72rem", color:"#D4A017", fontWeight:600 }}>店铺ID / ID Negozio: {shopId}</div>
      <div style={{ fontSize:"0.68rem", color:"#aaa", wordBreak:"break-all", textAlign:"center", maxWidth:240, lineHeight:1.5 }}>{menuUrl}</div>
    </div>
  );
}

// ══════════ INGREDIENT BADGE ROW ══════════
function IngredientBadges({ category, lang }) {
  const icons = ALLERGEN_ICONS[category] || [];
  const labels = {
    chuanshao: { zh:["红肉","辣椒","麸质"],      it:["Carni rosse","Piccante","Glutine"] },
    haixian:   { zh:["甲壳类","鱼类","过敏原"],   it:["Crostacei","Pesce","Allergeni"] },
    shucai:    { zh:["蔬菜","素食","乳制品"],      it:["Verdure","Vegetariano","Latticini"] },
    liangcai:  { zh:["蔬菜","花生","麸质"],        it:["Verdure","Arachidi","Glutine"] },
    zhushi:    { zh:["麸质","蛋类","辣椒"],        it:["Glutine","Uova","Piccante"] },
    yinpin:    { zh:["酒精","坚果","无酒精可选"],  it:["Alcol","Frutta secca","Senza alcol disp."] },
  };
  const lb = labels[category] || { zh:[], it:[] };
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
      {icons.map((icon, i) => (
        <span key={i} style={{
          fontSize:"0.65rem", padding:"2px 7px", borderRadius:999,
          background:"rgba(212,160,23,0.12)", color:"#D4A017",
          border:"1px solid rgba(212,160,23,0.25)"
        }}>{icon} {(lb[lang] || lb.zh)[i]}</span>
      ))}
    </div>
  );
}

// ══════════ CUSTOMER MENU VIEW ══════════
function MenuView({ menu, lang, setLang, shopInfo, onLogoTap }) {
  const [activeCat, setActiveCat] = useState("chuanshao");
  const filtered = menu.filter(i => i.category === activeCat && i.status !== "hidden");

  // Colors
  const C = { red:"#C0392B", gold:"#D4A017", dark:"#1A0A00", smoke:"#FAF6F0" };

  return (
    <div style={{ minHeight:"100vh", background:C.smoke, fontFamily:"'Noto Serif SC', serif", paddingBottom:80 }}>

      {/* ── HEADER ── */}
      <div style={{
        padding:"36px 20px 24px", textAlign:"center",
        background:"linear-gradient(160deg, #0D0500 0%, #1A0A00 50%, #2C1500 100%)",
        position:"relative", overflow:"hidden"
      }}>
        {/* Ember glow */}
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse at 30% 100%, rgba(192,57,43,.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(255,107,26,.15) 0%, transparent 40%)",
          pointerEvents:"none"
        }}/>
        {/* Grid */}
        <div style={{ position:"absolute", inset:0,
          backgroundImage:"linear-gradient(rgba(212,160,23,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,160,23,.04) 1px,transparent 1px)",
          backgroundSize:"50px 50px", pointerEvents:"none"
        }}/>

        <div style={{ position:"relative", zIndex:1 }}>
          {/* Logo */}
          <div onClick={onLogoTap} style={{
            width:100, height:100, borderRadius:"50%", margin:"0 auto 16px",
            background:"radial-gradient(circle at 40% 40%, #3D1F00, #1A0A00)",
            border:"2px solid #D4A017",
            boxShadow:"0 0 24px rgba(212,160,23,.4)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            cursor:"default", userSelect:"none"
          }}>
            <span style={{ fontSize:"2.4rem", filter:"drop-shadow(0 0 10px #FF6B1A)" }}>🔥</span>
            <span style={{ fontFamily:"'Ma Shan Zheng', serif", fontSize:"14px", color:C.gold, letterSpacing:3 }}>东北</span>
          </div>

          <div style={{ fontFamily:"'Ma Shan Zheng', serif", fontSize:"clamp(28px,7vw,44px)", color:C.gold,
            letterSpacing:6, textShadow:"0 0 30px rgba(212,160,23,.4)" }}>
            {shopInfo.name}
          </div>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:"0.85rem", color:"rgba(255,255,255,.5)",
            letterSpacing:3, textTransform:"uppercase", marginTop:4 }}>
            {shopInfo.nameit}
          </div>
          <div style={{ color:"rgba(255,255,255,.5)", fontSize:"0.75rem", marginTop:10, lineHeight:2 }}>
            <div>📍 {shopInfo.address}</div>
            <div>📞 {shopInfo.phone}</div>
          </div>

          {/* Hours pill */}
          <div style={{ display:"inline-block", marginTop:14, padding:"8px 20px",
            background:"rgba(192,57,43,.25)", border:"1px solid rgba(192,57,43,.4)",
            borderRadius:999, fontSize:"0.72rem", color:"rgba(255,255,255,.8)", lineHeight:1.8 }}>
            🕐 Lun–Ven: 11:30–15:00 / 18:30–23:30 &nbsp;|&nbsp; Dom: 12:00–23:00
          </div>
        </div>
      </div>

      {/* ── LANG TOGGLE ── */}
      <div style={{ background:C.red, display:"flex", justifyContent:"center" }}>
        {["zh","it"].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            flex:1, maxWidth:140, padding:"10px 0", border:"none",
            background:"transparent", cursor:"pointer",
            color: lang===l ? "#fff" : "rgba(255,255,255,.5)",
            fontFamily:"'Noto Serif SC', serif", fontSize:"0.85rem",
            borderBottom: lang===l ? "2px solid #D4A017" : "2px solid transparent",
            fontWeight: lang===l ? 600 : 400, transition:"all .2s"
          }}>{l==="zh" ? "中文" : "Italiano"}</button>
        ))}
      </div>

      {/* ── AYCE BANNER ── */}
      <div style={{
        background:"linear-gradient(135deg, #C0392B, #8B0000)",
        padding:"14px 20px", textAlign:"center",
        borderBottom:"1px solid rgba(212,160,23,.3)"
      }}>
        <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"1.05rem", color:"#fff", fontWeight:700 }}>
          {lang==="zh" ? "🔥 全场 ALL YOU CAN EAT — 晚餐 €21.90" : "🔥 ALL YOU CAN EAT — Cena €21.90"}
        </span>
        <div style={{ fontSize:"0.72rem", color:"rgba(255,255,255,.6)", marginTop:4 }}>
          {lang==="zh" ? "130cm以下儿童半价 · 不含饮料和甜点" : "Bambini sotto 130cm metà prezzo · Escluso bevande e dessert"}
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{ display:"flex", overflowX:"auto", gap:8, padding:"14px 16px 8px", scrollbarWidth:"none" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
            whiteSpace:"nowrap", padding:"7px 16px", borderRadius:999,
            border: activeCat===cat.id ? "1.5px solid #C0392B" : "1.5px solid #ddd",
            background: activeCat===cat.id ? "#C0392B" : "#fff",
            color: activeCat===cat.id ? "#fff" : "#666",
            fontFamily:"'Noto Serif SC', serif", fontSize:"0.82rem",
            cursor:"pointer", transition:"all .2s"
          }}>
            {cat.icon} {lang==="zh" ? cat.zh : cat.it}
          </button>
        ))}
      </div>

      {/* ── SECTION TITLE ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px 10px",
        borderBottom:"1px solid #e8ddd5", margin:"0 16px",
        fontFamily:"'Playfair Display', serif", fontSize:"1.05rem", color:C.red }}>
        <div style={{ width:4, height:18, background:C.gold, borderRadius:2 }}/>
        {CATEGORIES.find(c=>c.id===activeCat)?.[lang==="zh"?"zh":"it"]}
      </div>

      {/* ── ALLERGEN ROW for category ── */}
      <div style={{ padding:"8px 16px 0" }}>
        <IngredientBadges category={activeCat} lang={lang} />
      </div>

      {/* ── ITEMS ── */}
      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length===0 && (
          <div style={{ textAlign:"center", color:"#bbb", padding:40, fontSize:"0.85rem" }}>
            {lang==="zh" ? "暂无菜品" : "Nessun piatto disponibile"}
          </div>
        )}
        {filtered.map((item, idx) => {
          const info = item[lang] || item.zh;
          const badgeIdx = BADGES_IT.indexOf(item.badge);
          const badgeLabel = lang==="zh" ? BADGES_ZH[badgeIdx] : BADGES_IT[badgeIdx];
          const isSoldout = item.status==="soldout";
          return (
            <div key={item.id} style={{
         background:"#fff", borderRadius:14, display:"flex", overflow:"hidden",
              boxShadow:"0 2px 10px rgba(0,0,0,.07)", opacity: isSoldout ? .65 : 1,
              animation:`fadeUp 0.35s ease ${idx*0.05}s both`
            }}>
              <div style={{ width:90, minHeight:90, flexShrink:0, overflow:"hidden",
                background:"linear-gradient(135deg,#f5e8d8,#ede0cc)",
                display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                {item.image
                  ? <img src={item.image} alt={info.name} style={{ width:"100%", height:"100%", objectFit:"cover", filter:isSoldout?"grayscale(60%)":"none" }}/>
                  : <span style={{ fontSize:"2.2rem" }}>{CATEGORIES.find(c=>c.id===item.category)?.icon || "🔥"}</span>
                }
                {isSoldout && (
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.3)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ color:"#fff", fontSize:"0.65rem", fontWeight:700 }}>
                      {lang==="zh" ? "售罄" : "ESAURITO"}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex:1, padding:"12px 12px 12px 10px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:"0.95rem", fontWeight:600, color:isSoldout?"#aaa":"#1A0A00", lineHeight:1.3 }}>{info.name}</div>
                  <div style={{ fontSize:"0.73rem", color:"#999", marginTop:4, lineHeight:1.5 }}>{info.desc}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8, flexWrap:"wrap", gap:4 }}>
                  <div style={{ fontFamily:"'Playfair Display', serif", fontSize:"1.1rem",
                    color:isSoldout?"#bbb":"#C0392B", fontWeight:700 }}>
                    €{item.price.toFixed(2)}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {isSoldout && <div style={{ fontSize:"0.65rem", padding:"3px 8px", borderRadius:999, background:"#fff3e0", color:"#e65100", fontWeight:600 }}>{lang==="zh"?"售罄":"Esaurito"}</div>}
                    {badgeLabel && badgeIdx>0 && !isSoldout && (
                      <div style={{ fontSize:"0.65rem", padding:"3px 8px", borderRadius:999,
                        background: item.badge==="novità" ? "#fff8e1" : "#f8eaea",
                        color: item.badge==="novità" ? "#b8860b" : "#C0392B" }}>
                        {badgeLabel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SAFETY NOTE ── */}
      <div style={{ margin:"16px", padding:"14px 16px",
        background:"rgba(192,57,43,.06)", border:"1px solid rgba(192,57,43,.2)",
        borderRadius:10, fontSize:"0.72rem", color:"#888", lineHeight:1.8 }}>
        ⚠️ {lang==="zh"
          ? "海鲜经-20°C急冻处理 · 含过敏原：麸质、甲壳类、鱼、蛋、大豆、芝麻 · 有过敏请告知服务员"
          : "Frutti di mare abbattuti a -20°C · Allergeni: glutine, crostacei, pesce, uova, soia, sesamo · Informare il personale in caso di allergie"
        }
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign:"center", padding:"28px 20px",
        background:"#1A0A00", color:"rgba(255,255,255,.4)",
        fontSize:"0.7rem", letterSpacing:"0.1em", marginTop:20 }}>
        <div style={{ fontFamily:"'Ma Shan Zheng', serif", color:C.gold, fontSize:"1.2rem", marginBottom:6 }}>
          {shopInfo.name}
        </div>
        <div>{shopInfo.address}</div>
        <div style={{ marginTop:4 }}>{shopInfo.phone}</div>
        <div style={{ marginTop:8, fontSize:"0.65rem", color:"rgba(255,255,255,.2)" }}>
          Reg. CE 853/2004 · Reg. UE 1169/2011 · 1333/2008
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;400;600&family=Playfair+Display:wght@400;700&display=swap');
      `}</style>
    </div>
  );
}
// ══════════ ADMIN PANEL ══════════
function AdminPanel({ menu, shopId, saving, shopInfo, setShopInfo, onExit }) {
  const [tab, setTab] = useState("menu");
  const [editItem, setEditItem] = useState(null);
  const [editingShop, setEditingShop] = useState(false);
  const [shopForm, setShopForm] = useState(shopInfo);

  const blank = { id:"item-"+Date.now(), category:"chuanshao",
    zh:{name:"",desc:""}, it:{name:"",desc:""}, price:0, image:null, badge:"", status:"active" };

  async function saveItem(item) { await setDoc(doc(db,"menu",item.id), item); setEditItem(null); }
  async function deleteItem(id) { if (window.confirm("确认删除？")) await deleteDoc(doc(db,"menu",id)); }
  async function toggleStatus(item, s) { await setDoc(doc(db,"menu",item.id), {...item, status:s}); }
  async function saveShopInfo() { await setDoc(doc(db,"settings","shopInfo"), shopForm); setShopInfo(shopForm); setEditingShop(false); }

  const statusColor = { active:"#27ae60", soldout:"#e65100", hidden:"#bbb" };
  const statusLabel = { active:"正常", soldout:"售罄", hidden:"下架" };
  const inp = (s={}) => ({
    width:"100%", padding:"9px 12px", borderRadius:8,
    border:"1.5px solid #e0d8d0", fontFamily:"'Noto Serif SC', serif",
    fontSize:"0.85rem", background:"#faf6f0", outline:"none", boxSizing:"border-box", ...s
  });

  return (
    <div style={{ minHeight:"100vh", background:"#f5f0eb", fontFamily:"'Noto Serif SC', serif", paddingBottom:80 }}>
      {/* TOP BAR */}
      <div style={{ background:"#1A0A00", padding:"20px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"'Ma Shan Zheng', serif", color:"#D4A017", fontSize:"1.4rem" }}>
            东北烧烤 <span style={{ color:"rgba(255,255,255,.5)", fontSize:"0.72rem", fontFamily:"sans-serif" }}>后台管理</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:"0.7rem", color:saving?"#D4A017":"#27ae60" }}>
              {saving ? "⏳ 同步中..." : "☁️ 已同步"}
            </div>
            <button onClick={onExit} style={{ background:"rgba(255,255,255,.1)", border:"none",
              color:"rgba(255,255,255,.6)", padding:"6px 12px", borderRadius:999,
              cursor:"pointer", fontSize:"0.75rem", fontFamily:"'Noto Serif SC', serif" }}>退出</button>
          </div>
        </div>
        <div style={{ display:"flex", marginTop:16 }}>
          {[["menu","🍖 菜单"],["shop","🏪 店铺"],["qr","📲 二维码"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:"10px 16px", border:"none", cursor:"pointer",
              background: tab===id ? "#FAF6F0" : "transparent",
              color: tab===id ? "#1A0A00" : "rgba(255,255,255,.6)",
              fontFamily:"'Noto Serif SC', serif", fontSize:"0.82rem",
              borderRadius: tab===id ? "8px 8px 0 0" : 0,
              fontWeight: tab===id ? 600 : 400
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:16 }}>
        {/* 店铺信息 */}
        {tab==="shop" && (
          <div style={{ background:"#fff", borderRadius:16, padding:20 }}>
            <div style={{ fontSize:"1rem", fontWeight:600, marginBottom:16 }}>店铺信息 / Info Negozio</div>
            {!editingShop ? (
              <div>
                {[["店铺中文名","name"],["意大利语名","nameit"],["地址 / Indirizzo","address"],["电话 / Telefono","phone"]].map(([label,key]) => (
                  <div key={key} style={{ marginBottom:12, padding:"12px 14px", background:"#faf6f0", borderRadius:10 }}>
                    <div style={{ fontSize:"0.72rem", color:"#D4A017", marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:"0.9rem", fontWeight:600 }}>{shopInfo[key]}</div>
                  </div>
                ))}
     <button onClick={() => { setShopForm(shopInfo); setEditingShop(true); }} style={{
                  width:"100%", background:"#1A0A00", color:"#fff", border:"none",
                  padding:"12px", borderRadius:12, fontFamily:"'Noto Serif SC', serif",
                  fontSize:"0.9rem", cursor:"pointer"
                }}>✏️ 编辑店铺信息</button>
              </div>
            ) : (
              <div>
                {[["中文名称","name","东北烧烤"],["意大利语名","nameit","Dongbei BBQ Roma"],["地址","address","Piazza Dante 5, 00185 Roma"],["电话","phone","06 77076392"]].map(([label,key,ph]) => (
                  <div key={key} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>{label}</div>
                    <input style={inp()} value={shopForm[key]} onChange={e => setShopForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}/>
                  </div>
                ))}
                <div style={{ display:"flex", gap:10, marginTop:8 }}>
                  <button onClick={() => setEditingShop(false)} style={{ flex:1, background:"#f0e8e0", color:"#666", border:"none", padding:"12px", borderRadius:12, fontFamily:"'Noto Serif SC', serif", fontSize:"0.9rem", cursor:"pointer" }}>取消</button>
                  <button onClick={saveShopInfo} style={{ flex:2, background:"#C0392B", color:"#fff", border:"none", padding:"12px", borderRadius:12, fontFamily:"'Noto Serif SC', serif", fontSize:"0.9rem", cursor:"pointer", fontWeight:600 }}>保存 / Salva</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 二维码 */}
        {tab==="qr" && (
          <div style={{ background:"#fff", borderRadius:16, padding:24, textAlign:"center" }}>
            <div style={{ fontSize:"1rem", fontWeight:600, marginBottom:6 }}>专属二维码 / QR Code Unico</div>
            <div style={{ fontSize:"0.78rem", color:"#999", marginBottom:20, lineHeight:1.7 }}>
              顾客扫码永远看到最新菜单<br/>
              <span style={{ color:"#C0392B" }}>修改菜单/价格后，二维码无需重新生成</span>
            </div>
            <QRDisplay shopId={shopId}/>
            <div style={{ marginTop:20, padding:"12px 16px", background:"#f8eaea", borderRadius:10, fontSize:"0.78rem", color:"#C0392B", lineHeight:1.7 }}>
              💡 此ID唯一且永久绑定您的店铺<br/>即使重新部署，ID也不会改变
            </div>
          </div>
        )}

        {/* 菜单管理 */}
        {tab==="menu" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:"0.85rem", color:"#666" }}>共 {menu.length} 道菜品</div>
              <button onClick={() => setEditItem({...blank})} style={{
                background:"#C0392B", color:"#fff", border:"none",
                padding:"9px 18px", borderRadius:999, cursor:"pointer",
                fontFamily:"'Noto Serif SC', serif", fontSize:"0.85rem"
              }}>+ 添加菜品</button>
            </div>
            {CATEGORIES.map(cat => {
              const items = menu.filter(i => i.category===cat.id);
              if (!items.length) return null;
              return (
                <div key={cat.id} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:"0.8rem", color:"#D4A017", letterSpacing:"0.1em", marginBottom:8, fontWeight:600 }}>
                    {cat.icon} {cat.zh} / {cat.it}
                  </div>
                  {items.map(item => (
                    <div key={item.id} style={{
                      background:"#fff", borderRadius:12, padding:"12px 14px",
                      marginBottom:8, display:"flex", alignItems:"center", gap:10,
                      boxShadow:"0 1px 6px rgba(0,0,0,.06)", opacity:item.status==="hidden"?.5:1
                    }}>
                      <div style={{ width:46, height:46, borderRadius:8, overflow:"hidden",
                        background:"linear-gradient(135deg,#f5e8d8,#ede0cc)",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {item.image ? <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:"1.4rem" }}>{cat.icon}</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.85rem", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.zh.name}</div>
                        <div style={{ fontSize:"0.7rem", color:"#999" }}>{item.it.name}</div>
                        <div style={{ fontSize:"0.7rem", color:statusColor[item.status||"active"], marginTop:2 }}>
                          ● {statusLabel[item.status||"active"]}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
                        <div style={{ display:"flex", gap:4 }}>
                               </div>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={() => setEditItem(item)} style={{ background:"#f0e8e0", border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:"0.75rem", color:"#1A0A00" }}>编辑</button>
                          <button onClick={() => deleteItem(item.id)} style={{ background:"#f8eaea", border:"none", borderRadius:6, padding:"5px 8px", cursor:"pointer", fontSize:"0.75rem", color:"#C0392B" }}>删</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {editItem && <EditModal item={editItem} onSave={saveItem} onClose={() => setEditItem(null)}/>}
    </div>
  );
}

// ══════════ EDIT MODAL ══════════
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify(item)));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function handleImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX=600; let w=img.width, h=img.height;
        if (w>h) { if (w>MAX) { h=h*MAX/w; w=MAX; } } else { if (h>MAX) { w=w*MAX/h; h=MAX; } }
        canvas.width=w; canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        setForm(f=>({...f, image:canvas.toDataURL("image/jpeg",0.7)}));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() { setSaving(true); await onSave(form); setSaving(false); }
  const inp = (s={}) => ({
    width:"100%", padding:"9px 12px", borderRadius:8,
    border:"1.5px solid #e0d8d0", fontFamily:"'Noto Serif SC', serif",
    fontSize:"0.85rem", background:"#faf6f0", outline:"none", boxSizing:"border-box", ...s
  });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end", zIndex:200 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:20, width:"100%", maxHeight:"92vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:"1.1rem" }}>{item.zh?.name ? "编辑菜品" : "添加菜品"}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#999" }}>✕</button>
        </div>
        {/* 图片 */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>菜品图片 / Immagine</div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:70, height:70, borderRadius:10, overflow:"hidden", background:"linear-gradient(135deg,#f5e8d8,#ede0cc)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {form.image ? <img src={form.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:"1.8rem" }}>🔥</span>}
            </div>
            <button onClick={() => fileRef.current.click()} style={{ flex:1, padding:"10px", border:"1.5px dashed #D4A017", borderRadius:10, background:"#fffbf0", cursor:"pointer", color:"#D4A017", fontSize:"0.82rem", fontFamily:"'Noto Serif SC', serif" }}>
              📷 上传图片 / Carica immagine
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImage}/>
          </div>
        </div>

        {/* 状态 */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>状态 / Stato</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["active","🟢 正常"],["soldout","🟠 售罄"],["hidden","⚫ 下架"]].map(([s,label]) => (
              <button key={s} onClick={() => setForm(f=>({...f,status:s}))} style={{
                flex:1, padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer",
                background:form.status===s ? "#1A0A00" : "#f0e8e0",
                color:form.status===s ? "#fff" : "#666",
                fontSize:"0.75rem", fontFamily:"'Noto Serif SC', serif"
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 分类 */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>分类 / Categoria</div>
          <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inp()}>
            {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.zh} / {c.it}</option>)}
          </select>
        </div>

        {/* 中文 */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>中文名称 & 描述</div>
          <input style={inp({marginBottom:6})} value={form.zh.name} onChange={e=>setForm(f=>({...f,zh:{...f.zh,name:e.target.value}}))} placeholder="例：孜然羊肉串 (3串)"/>
          <input style={inp()} value={form.zh.desc} onChange={e=>setForm(f=>({...f,zh:{...f.zh,desc:e.target.value}}))} placeholder="例：内蒙古羔羊肉，孜然飘香"/>
        </div>

        {/* 意大利语 */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>Nome & Descrizione Italiano</div>
          <input style={inp({marginBottom:6})} value={form.it.name} onChange={e=>setForm(f=>({...f,it:{...f.it,name:e.target.value}}))} placeholder="Es: Spiedini d'Agnello al Cumin"/>
          <input style={inp()} value={form.it.desc} onChange={e=>setForm(f=>({...f,it:{...f.it,desc:e.target.value}}))} placeholder="Es: Agnello della Mongolia Interna"/>
        </div>

        {/* 价格 */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>价格 / Prezzo (€)</div>
          <input style={inp()} type="number" step="0.5" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:parseFloat(e.target.value)||0}))}/>
        </div>

        {/* 标签 */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:"0.78rem", color:"#888", marginBottom:6 }}>标签 / Badge</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {BADGES_IT.map((b,i) => (
              <button key={b} onClick={() => setForm(f=>({...f,badge:b}))} style={{
                padding:"5px 14px", borderRadius:999, border:"none", cursor:"pointer",
                background:form.badge===b ? "#C0392B" : "#f0e8e0",
                color:form.badge===b ? "#fff" : "#666",
                fontSize:"0.78rem", fontFamily:"'Noto Serif SC', serif"
              }}>{i===0 ? "无" : `${BADGES_ZH[i]} / ${b}`}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width:"100%", background:saving?"#aaa":"#C0392B", color:"#fff", border:"none",
          padding:"14px", borderRadius:12, fontFamily:"'Noto Serif SC', serif",
          fontSize:"1rem", cursor:saving?"not-allowed":"pointer", fontWeight:600
        }}>{saving ? "保存中..." : "保存 / Salva"}</button>
      </div>
    </div>
  );
}

// ══════════ ROOT APP ══════════
export default function App() {
  const [view, setView]       = useState("customer");
  const [lang, setLang]       = useState("it");
  const [menu, setMenu]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [shopInfo, setShopInfo] = useState(DEFAULT_SHOP_INFO);

  const [shopId] = useState(() => {
    let id = safeGet(SHOP_ID_KEY);
    if (!id) { id = generateShopId(); safeSet(SHOP_ID_KEY, id); }
    return id;
  });

  // Init default menu
  useEffect(() => {
    async function init() {
      try {
        const snap = await getDocs(collection(db,"menu"));
        if (snap.empty) {
          setSaving(true);
          for (const item of DEFAULT_MENU) await setDoc(doc(db,"menu",item.id), item);
          setSaving(false);
        }
      } catch(e) { console.error(e); }
    }
    init();
  }, []);

  // Load shop info
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db,"settings","shopInfo"));
        if (snap.exists()) setShopInfo(snap.data());
      } catch(e) { console.error(e); }
    }
    load();
  }, []);

  // Real-time menu listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db,"menu"), (snap) => {
      const items = snap.docs.map(d=>({id:d.id,...d.data()}));
      const order = CATEGORIES.map(c=>c.id);
      items.sort((a,b)=>order.indexOf(a.category)-order.indexOf(b.category));
      setMenu(items);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setMenu(DEFAULT_MENU);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("view")==="menu") setView("customer");
  }, []);

  // Admin PIN logic
  const SECRET_PIN = "dongbei";
  const tapCount  = useRef(0);
  const tapTimer  = useRef(null);
  const [showPin, setShowPin]         = useState(false);
  const [pinInput, setPinInput]       = useState("");
  const [pinError, setPinError]       = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  function handleLogoTap() {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current=0; }, 2000);
    if (tapCount.current >= 5) { tapCount.current=0; setShowPin(true); setPinInput(""); setPinError(false); }
  }
  function handlePinSubmit() {
    if (pinInput===SECRET_PIN) { setAdminUnlocked(true); setShowPin(false); setView("admin"); }
    else { setPinError(true); setPinInput(""); setTimeout(()=>setPinError(false),1500); }
  }
  function handleAdminExit() { setAdminUnlocked(false); setView("customer"); }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#1A0A00", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Playfair Display', serif", gap:16 }}>
      <span style={{ fontSize:"3rem", animation:"pulse 1s ease infinite" }}>🔥</span>
      <div style={{ fontFamily:"'Ma Shan Zheng', serif", color:"#D4A017", fontSize:"1.4rem" }}>东北烧烤</div>
      <div style={{ color:"#aaa", fontSize:"0.8rem" }}>加载中... / Caricamento...</div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}`}</style>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;400;600&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet"/>

      {/* PIN MODAL */}
      {showPin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }} onClick={() => setShowPin(false)}>
          <div style={{ background:"#fff", borderRadius:20, padding:32, width:280, textAlign:"center" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Ma Shan Zheng', serif", fontSize:"1.3rem", color:"#1A0A00", marginBottom:6 }}>🔐 后台入口</div>
            <div style={{ fontSize:"0.8rem", color:"#999", marginBottom:20 }}>请输入密码 / Inserisci password</div>
            <input
              type="password" value={pinInput}
              onChange={e=>setPinInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handlePinSubmit()}
              autoFocus
              style={{
                width:"100%", padding:"12px", borderRadius:10, textAlign:"center",
                border: pinError ? "2px solid #C0392B" : "2px solid #e0d8d0",
                fontSize:"1.2rem", letterSpacing:"0.3em", outline:"none",
                background: pinError ? "#fff0f0" : "#faf6f0", boxSizing:"border-box", transition:"all .2s"
              }}
              placeholder="••••••"
            />
            {pinError && <div style={{ color:"#C0392B", fontSize:"0.78rem", marginTop:8 }}>密码错误 / Password errata</div>}
            <button onClick={handlePinSubmit} style={{
              width:"100%", marginTop:16, background:"#1A0A00", color:"#D4A017",
              border:"none", padding:"12px", borderRadius:10, cursor:"pointer",
              fontFamily:"'Ma Shan Zheng', serif", fontSize:"1rem"
            }}>进入 / Entra</button>
          </div>
        </div>
      )}

      {view==="customer" && <MenuView menu={menu} lang={lang} setLang={setLang} shopInfo={shopInfo} onLogoTap={handleLogoTap}/>}
      {view==="admin" && adminUnlocked && <AdminPanel menu={menu} shopId={shopId} saving={saving} shopInfo={shopInfo} setShopInfo={setShopInfo} onExit={handleAdminExit}/>}
    </>
  );
}
