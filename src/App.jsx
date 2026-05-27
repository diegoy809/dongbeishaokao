import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, getDocs, getDoc
} from "firebase/firestore";

/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */
const SHOP_KEY = "dongbei-shop-id";
const safeGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k,v) => { try { localStorage.setItem(k,v); } catch {} };
const genId = () => "db-" + Math.random().toString(36).slice(2,10);

/* ════════════════════════════════════════════════════════════════
   EU 14 ALLERGENS (Reg. UE 1169/2011)
════════════════════════════════════════════════════════════════ */
const ALLERGENS = [
  { id:"gluten",      icon:"🌾", zh:"麸质",     it:"Glutine",        color:"#C8860A" },
  { id:"crustaceans", icon:"🦐", zh:"甲壳类",   it:"Crostacei",      color:"#E84040" },
  { id:"eggs",        icon:"🥚", zh:"鸡蛋",     it:"Uova",           color:"#E8C840" },
  { id:"fish",        icon:"🐟", zh:"鱼类",     it:"Pesce",          color:"#4080E8" },
  { id:"peanuts",     icon:"🥜", zh:"花生",     it:"Arachidi",       color:"#A0692A" },
  { id:"soy",         icon:"🫘", zh:"大豆",     it:"Soia",           color:"#70A040" },
  { id:"milk",        icon:"🥛", zh:"乳制品",   it:"Latte",          color:"#60C0E8" },
  { id:"nuts",        icon:"🌰", zh:"坚果",     it:"Frutta a guscio",color:"#886030" },
  { id:"celery",      icon:"🥬", zh:"芹菜",     it:"Sedano",         color:"#50A850" },
  { id:"mustard",     icon:"🌿", zh:"芥末",     it:"Senape",         color:"#C8B820" },
  { id:"sesame",      icon:"⚪", zh:"芝麻",     it:"Sesamo",         color:"#B8A080" },
  { id:"sulphites",   icon:"🍷", zh:"亚硫酸盐", it:"Anidride solforosa", color:"#9060A0" },
  { id:"lupin",       icon:"🌼", zh:"羽扇豆",   it:"Lupini",         color:"#E8C040" },
  { id:"molluscs",    icon:"🐚", zh:"软体动物", it:"Molluschi",      color:"#C07040" },
];

/* ════════════════════════════════════════════════════════════════
   FULL MENU
════════════════════════════════════════════════════════════════ */
const MENU_DATA = [
  /* ── 冷菜 ── */
  {id:"c01",cat:"lengcai",code:"01",
   zh:{name:"擂椒皮蛋",desc:"炭烤青辣椒研磨，与皮蛋的浓郁碰撞，蒜香提味，香菜画龙点睛"},
   it:{name:"Uova centenarie con peperoncino pestato",desc:"peperoncino verde, uova centenarie, aglio, coriandolo, salsa di soia"},
   price:12, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["eggs","soy"]},

  {id:"c02",cat:"lengcai",code:"02",
   zh:{name:"捞汁海鲜",desc:"精选鲜活海产，浸入秘制捞汁，蚝油层叠，香菜点睛"},
   it:{name:"Frutti di mare in salsa aromatica",desc:"frutti di mare, salsa di soia, coriandolo, salsa di ostriche"},
   price:14, spicy:false, frozen:false, preorder:false, badge:"popolare", status:"active", image:null,
   allergens:["crustaceans","molluscs","soy"]},

  {id:"c03",cat:"lengcai",code:"03",
   zh:{name:"捞汁金针菇",desc:"脆嫩金针菇冷泡捞汁，蚝油渗透每一丝菌体，清爽开胃"},
   it:{name:"Enoki in salsa aromatica",desc:"funghi enoki, salsa di soia, coriandolo, salsa di ostriche"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy","molluscs"]},

  {id:"c04",cat:"lengcai",code:"04",
   zh:{name:"东北大拌菜",desc:"东北家常凉菜，白菜丝、豆腐、黄瓜、胡萝卜，大酱汁拌匀，清脆爽口"},
   it:{name:"Insalata mista del Nord-est",desc:"cavolo cinese, tofu, cetriolo, carota, coriandolo, salsa di soia"},
   price:10, spicy:false, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["soy","gluten"]},

  {id:"c05",cat:"lengcai",code:"05",
   zh:{name:"东北大拉皮",desc:"宽幅粉皮Q弹透亮，黄瓜丝叠加，芝麻酱拌出浓郁香气"},
   it:{name:"Tagliatelle fredde di fecola Lapi",desc:"cetriolo, noodles di fecola, amido"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["sesame"]},

  {id:"c09",cat:"lengcai",code:"09",
zh:{name:"爽口莴笋",desc:"新鲜莴笋茎薄片，清水焯出翡翠色，口感脆爽清新"},
   it:{name:"Lattuga stelo croccante",desc:"gambo di lattuga"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:[]},

  {id:"c10",cat:"lengcai",code:"10",
   zh:{name:"拍黄瓜",desc:"重刀拍碎，蒜泥爆香，生抽浸透，简单即是经典"},
   it:{name:"Insalata di cetrioli schiacciati",desc:"cetriolo, salsa di soia"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"c11",cat:"lengcai",code:"11",
   zh:{name:"皮蛋豆腐",desc:"嫩滑内酯豆腐托起皮蛋，秘制酱汁浇淋，香菜点睛，层次分明"},
   it:{name:"Tofu con uova centenarie",desc:"uova centenarie, tofu, salsa di soia, coriandolo"},
   price:10, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["eggs","soy"]},

  {id:"c12",cat:"lengcai",code:"12",
   zh:{name:"水煮花生",desc:"带壳花生慢火煮透，咸香入骨，配酒配菜两相宜"},
   it:{name:"Arachidi bollite",desc:"arachidi con buccia"},
   price:5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["peanuts"]},

  {id:"c13",cat:"lengcai",code:"13",
   zh:{name:"水煮毛豆",desc:"嫩绿毛豆盐水煮熟，豆香清甜，餐前小食首选"},
   it:{name:"Edamame bolliti",desc:"edamame"},
   price:5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},
{id:"y63",cat:"lengcai",code:"63",
zh:{name:"牛肚凉串", desc:"牛肚 洋葱 香菜 青辣椒 芥辣 酱油 蚝油 小葱 芝麻"},
it:{name:"Trippa fredda in spiedino",
desc:"trippa di manzo, cipolla, coriandolo, peperone verde, senape, salsa di soia, salsa di ostriche, cipollotto, sesamo"},
price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null},

{id:"y64",cat:"lengcai",code:"64",
zh:{name:"海蜇凉串", desc:"海蜇 洋葱 香菜 青辣椒 辣椒 芥辣 酱油 蚝油 小葱 芝麻"},
it:{name:"Medusa fredda in spiedino",
desc:"medusa, cipolla, coriandolo, peperone verde, peperoncino, senape, salsa di soia, salsa di ostriche, cipollotto, sesamo"},
price:10, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null},

{id:"y74",cat:"lengcai",code:"74",
zh:{name:"肉酱拌茄子", desc:"茄子 猪肉 酱油 黄豆酱 葱 香菜"},
it:{name:"Melanzane con ragù di maiale",
desc:"melanzane, maiale, salsa di soia, pasta di soia, cipollotto, coriandolo"},
price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null},
  /* ── 蔬菜类 ── */
    {id:"y75",cat:"shucai",code:"75",
   zh:{name:"铁板芋头",desc:"芋头软糯，铁板烧热烙出焦边，蚝油鸡蛋汁浇淋，香气弥漫整桌"},
   it:{name:"Taro su piastra calda",desc:"salsa di soia, salsa di ostriche, amido, uova, taro"},
   price:12, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["eggs","soy","molluscs"]},

  {id:"y56",cat:"shucai",code:"56",
   zh:{name:"蒜蓉香菇菜",desc:"时令蔬菜与香菇同炒，蒜蓉旺火逼出香气，翠绿鲜嫩，清口解腻"},
   it:{name:"Verdure cinesi con funghi e aglio",desc:"cipollotto, amido, aglio, verdure cinesi"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:[]},

  {id:"y57",cat:"shucai",code:"57",
   zh:{name:"白灼菜心",desc:"广东菜心焯水保翠，热油泼过葱姜丝，生抽蚝油淋面，清甜爽脆"},
   it:{name:"Cavolo Cantonese sbollentato",desc:"cavolo di Guangdong, salsa di soia, salsa di ostriche, cipollotto, zenzero"},
   price:12, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy","molluscs"]},
{id:"y70",cat:"shucai",code:"70",
zh:{name:"尖椒干豆腐", desc:"干豆腐 辣椒 酱油 淀粉"},
it:{name:"Tofu secco con peperoni",
desc:"tofu secco, peperone, salsa di soia, amido"},
price:10, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null},

{id:"y71",cat:"shucai",code:"71",
zh:{name:"干锅花菜", desc:"花菜 干辣椒 酱油 洋葱 芹菜"},
it:{name:"Cavolfiore in pentola secca",
desc:"cavolfiore, peperoncino secco, salsa di soia, cipolla, sedano"},
price:8, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null},

{id:"y72",cat:"shucai",code:"72",
zh:{name:"干锅包菜", desc:"包菜 干辣椒 酱油 洋葱 芹菜"},
it:{name:"Cavolo cappuccio in pentola secca",
desc:"cavolo cappuccio, peperoncino secco, salsa di soia, cipolla, sedano"},
price:8, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null},
  
  {id:"y73",cat:"shucai",code:"73",
zh:{name:"麻婆豆腐", desc:"豆腐 酱油 猪肉 辣椒酱 淀粉"},
it:{name:"Tofu Mapo",
desc:"tofu, salsa di soia, maiale, pasta di peperoncino, amido"},
price:8, spicy:true, frozen:false, preorder:false, badge:"popolare", status:"active", image:null},

  /* ── 烧烤 ── */
  {id:"b21",cat:"bbq",code:"21",
   zh:{name:"特色大油边",desc:"猪肉精修油边，炭火逼出多余油脂，外皮酥脆焦香，蚝油收尾"},
   it:{name:"Pancetta croccante speciale (1pz)",desc:"maiale, salsa di soia, salsa di ostriche"},
   price:5, spicy:false, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["soy","molluscs"]},

  {id:"b22",cat:"bbq",code:"22",
   zh:{name:"吊炉烤羊腿",desc:"整只羊腿悬炉慢烤，外皮金黄焦脆，内里酥嫩多汁 · 需提前预定"},
   it:{name:"Cosciotto di agnello alla griglia sospesa",desc:"solo su prenotazione · coscia di agnello, salsa di ostriche"},
   price:68, spicy:false, frozen:false, preorder:true, badge:"consigliato", status:"active", image:null,
   allergens:["soy","molluscs"]},

  {id:"b23",cat:"bbq",code:"23",
   zh:{name:"吊炉烤羊排",desc:"法式切割羊排，吊炉旋转受热均匀，骨肉分离，孜然留香 · 需提前预定"},
   it:{name:"Costolette di agnello alla griglia sospesa",desc:"solo su prenotazione · costolette, salsa di soia, salsa di ostriche"},
   price:28, spicy:false, frozen:false, preorder:true, badge:"consigliato", status:"active", image:null,
   allergens:["soy","molluscs"]},

  {id:"b24",cat:"bbq",code:"24",
   zh:{name:"炭烤生蚝",desc:"鲜活生蚝炭火烤至壳边微卷，蒜蓉汁渗入蚝肉，海鲜甜味与蒜香交融"},
   it:{name:"Ostriche alla brace con aglio",desc:"ostriche, aglio, salsa di soia, salsa di ostriche"},
   price:4, spicy:false, frozen:false, preorder:false, badge:"popolare", status:"active", image:null,
   allergens:["molluscs","soy"]},

  {id:"b25",cat:"bbq",code:"25",
   zh:{name:"炭烤扇贝",desc:"扇贝与蒜蓉相遇炭火，贝汁沸腾锁鲜，每口都是海洋的馈赠"},
   it:{name:"Capesante alla brace con aglio",desc:"capesante, aglio, salsa di soia, salsa di ostriche"},
   price:4, spicy:false, frozen:false, preorder:false, badge:"popolare", status:"active", image:null,
   allergens:["molluscs","soy"]},

  {id:"b26",cat:"bbq",code:"26",
   zh:{name:"锡纸金针菇",desc:"锡纸密封锁住水分，金针菇在蒸汽与炭香中变得滑嫩鲜美"},
   it:{name:"Enoki al cartoccio",desc:"funghi enoki, salsa di soia, salsa di ostriche"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy","molluscs"]},

  {id:"b27",cat:"bbq",code:"27",
   zh:{name:"牛肉串",desc:"精选黄牛腿肉，按纹切块穿串，炭火高温锁住肉汁，孜然飘香"},
   it:{name:"Spiedini di manzo",desc:"manzo, salsa di soia"},
   price:1.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"b27b",cat:"bbq",code:"27B",
   zh:{name:"羊肉串",desc:"内蒙古草原羔羊，肥瘦3:7黄金比例，炭烤至外焦里嫩，东北烤串灵魂"},
   it:{name:"Spiedini di agnello",desc:"agnello, salsa di soia"},
   price:1.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},
  {id:"b28",cat:"bbq",code:"28",
   zh:{name:"宫后加肉（牛）",desc:"牛肉加量版，满足食量大的你，酱香浓郁，每串分量十足"},
   it:{name:"Manzo Gonghou extra porzione (1pz)",desc:"manzo, salsa di soia"},
   price:5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"b29",cat:"bbq",code:"29",
   zh:{name:"牛蹄筋",desc:"胶质丰富的牛蹄筋穿串炭烤，弹牙Q韧，越嚼越香"},
   it:{name:"Tendine di manzo alla griglia",desc:"tendine di manzo"},
   price:1.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:[]},

  {id:"b30",cat:"bbq",code:"30",
   zh:{name:"烤辣椒（3个）",desc:"整只青椒直火烤至表皮焦黑，剥壳后辣味加倍，嗜辣者的秘密武器"},
   it:{name:"Peperone alla brace (3pz)",desc:"peperone, salsa di soia"},
   price:2, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"b31",cat:"bbq",code:"31",
   zh:{name:"烤火腿肠",desc:"东北儿时记忆，炭火让外皮酥脆爆裂，内里弹嫩飘香"},
   it:{name:"Salsiccia cinese alla brace",desc:"salsiccia di prosciutto, amido, salsa di soia"},
   price:1, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["gluten","soy"]},

  {id:"b32",cat:"bbq",code:"32",
   zh:{name:"烤鸡心",desc:"鸡心肌肉紧实，炭烤后弹韧多汁，孜然辣椒撒上，一串不够"},
   it:{name:"Cuori di pollo alla brace",desc:"cuori di pollo, salsa di soia"},
   price:1, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"b33",cat:"bbq",code:"33",
   zh:{name:"烤鸡翅",desc:"整翅腌制入味，炭火慢烤至皮酥骨脆，金黄油亮，香气四溢"},
   it:{name:"Alette di pollo alla brace",desc:"alette di pollo, salsa di soia"},
   price:2.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"b34",cat:"bbq",code:"34",
   zh:{name:"吊炉五花肉（一份）",desc:"精选三层五花，吊炉悬烤油脂自然流淌，皮脆肉嫩，东北烧烤精华"},
   it:{name:"Pancetta maiale griglia sospesa (1 porz.)",desc:"pancetta di maiale, salsa di soia, salsa di ostriche"},
   price:12, spicy:false, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["soy","molluscs"]},

  {id:"b35",cat:"bbq",code:"35",
   zh:{name:"五花肉金针菇",desc:"五花肉裹着金针菇同烤，油脂渗入菌中，荤素相融，绝妙组合"},
   it:{name:"Pancetta con enoki alla griglia",desc:"pancetta di maiale, funghi enoki, salsa di soia"},
   price:1.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"b36",cat:"bbq",code:"36",
   zh:{name:"烤五花肉",desc:"薄切五花炭烤，肥瘦交替，入口即化，最纯粹的烧烤滋味"},
   it:{name:"Pancetta di maiale alla griglia",desc:"pancetta di maiale, salsa di soia"},
   price:1.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["soy"]},

  {id:"b37",cat:"bbq",code:"37",
   zh:{name:"涮肚锅",desc:"哈尔滨风味火锅，牛肚与金针菇、黄豆芽、白菜在浓汤中翻涌，粉丝吸足精华"},
   it:{name:"Pentola di trippa alla Harbin",desc:"trippa di manzo, funghi enoki, germogli di soia, cavolo cinese, vermicelli"},
   price:18, spicy:false, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["soy","gluten"]},

  /* ── 海鲜热菜 ── */
  {id:"h40",cat:"haixian",code:"40",
   zh:{name:"辣炒花蚬",desc:"新鲜花蚬旺火爆炒，辣椒与蚝油激发贝类的天然甜鲜，壳壳都是精华"},
   it:{name:"Vongole saltate piccanti",desc:"vongole, coriandolo, salsa di soia, salsa di ostriche"},
   price:20, spicy:true, frozen:false, preorder:false, badge:"popolare", status:"active", image:null,
   allergens:["molluscs","soy"]},

  {id:"h41",cat:"haixian",code:"41",
   zh:{name:"辣炒螺蛳",desc:"淡水螺蛳清洗入味，旺火猛炒，嗦一口满是香辣汤汁，停不下来"},
   it:{name:"Lumachine saltate piccanti",desc:"lumachine d'acqua dolce, coriandolo, salsa di soia, salsa di ostriche"},
   price:20, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["molluscs","soy"]},

    {id:"h42",cat:"haixian",code:"42",
   zh:{name:"辣炒蛏子",desc:"蛏子鲜嫩细长，旺火辣炒至壳开，鲜汁四溢，辣香扑鼻"},
   it:{name:"Cannolicchi saltati piccanti",desc:"cannolicchi d'acqua dolce, coriandolo, salsa di soia, salsa di ostriche"},
   price:20, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["molluscs","soy"]},

  {id:"h43",cat:"haixian",code:"43",
   zh:{name:"海鲜大咖",desc:"虾、蟹、贝、鱿鱼齐聚一锅，大海的馈赠浓缩于此，分量豪迈"},
   it:{name:"Stufato di frutti di mare",desc:"frutti di mare, salsa di soia, amido, salsa di ostriche"},
   price:28, spicy:false, frozen:false, preorder:false, badge:"consigliato", status:"active", image:null,
   allergens:["crustaceans","fish","molluscs","soy"]},

  {id:"h44",cat:"haixian",code:"44",
   zh:{name:"香辣蟹",desc:"鲜活肉蟹斩件爆炒，香辣酱包裹每块蟹肉，蟹黄浓郁，辣而不燥"},
   it:{name:"Granchio piccante",desc:"granchio, salsa di soia, coriandolo, amido"},
   price:28, spicy:true, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["crustaceans","soy"]},

  {id:"h45",cat:"haixian",code:"45",
   zh:{name:"香辣大虾",desc:"鲜活大虾整只爆炒，辣椒香料层层包裹，剥壳那一刻香气扑面"},
   it:{name:"Gamberoni piccanti",desc:"gamberi, salsa di soia, amido, coriandolo"},
   price:18, spicy:true, frozen:false, preorder:false, badge:"popolare", status:"active", image:null,
   allergens:["crustaceans","soy"]},
  {id:"y46",cat:"haixian",code:"46",
   zh:{name:"剁椒鲈鱼",desc:"新鲜鲈鱼铺满自制剁椒，蒸制后辣香渗入鱼肉每一层，肉质细嫩"},
   it:{name:"Branzino al peperoncino tritato",desc:"branzino, salsa di soia"},
   price:22, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["fish","soy"]},

  {id:"y47",cat:"haixian",code:"47",
   zh:{name:"川味酸菜鱼",desc:"酸菜的酸爽与鲈鱼的鲜嫩完美融合，莴笋增脆，花椒麻香暗涌"},
   it:{name:"Pesce al cavolo fermentato alla Sichuanese",desc:"branzino, cavolo fermentato, gambo di lattuga, salsa di soia, amido"},
   price:24, spicy:true, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["fish","soy"]},

  {id:"y48",cat:"haixian",code:"48",
   zh:{name:"川味水煮鱼",desc:"鱼片在红汤中翻滚，豆芽豆皮垫底吸满麻辣，热油泼椒瞬间激香"},
   it:{name:"Pesce bollito piccante alla Sichuanese",desc:"branzino, germogli di soia, cavolo, gambo di lattuga, salsa di soia, amido"},
   price:26, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["fish","soy"]},

  
  {id:"y50",cat:"haixian",code:"50",
   zh:{name:"蒜蓉粉丝蒸虾",desc:"大虾背开铺满蒜蓉，粉丝在虾汁中吸饱蒜香，蒸出鲜甜本味"},
   it:{name:"Gamberi al vapore con vermicelli e aglio",desc:"aglio, salsa di ostriche, amido, salsa di soia, peperoncino, gamberi"},
   price:18, spicy:false, frozen:false, preorder:false, badge:"consigliato", status:"active", image:null,
   allergens:["crustaceans","soy","molluscs"]},

  {id:"y51",cat:"haixian",code:"51",
   zh:{name:"清蒸海鲈鱼",desc:"整条鲈鱼清蒸，葱姜祛腥，热油泼淋生抽，鱼肉嫩白，原汁原味"},
   it:{name:"Branzino al vapore",desc:"cipollotto, zenzero, salsa di soia, branzino"},
   price:22, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["fish","soy"]},

  {id:"y52",cat:"haixian",code:"52",
   zh:{name:"葱姜炒肉蟹",desc:"肉蟹斩块，葱段姜片爆香，大火翻炒至蟹壳泛红，鲜味锁于壳中"},
   it:{name:"Granchio saltato con cipollotto e zenzero",desc:"cipollotto, zenzero, salsa di soia, salsa di ostriche, granchio"},
   price:18, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["crustaceans","soy","molluscs"]},

  {id:"y53",cat:"haixian",code:"53",
   zh:{name:"葱油海蛏子",desc:"蛏子蒸开，葱姜丝铺面，热油泼淋激发葱香，鲜而不腥"},
   it:{name:"Cannolicchi con olio al cipollotto",desc:"cipollotto, zenzero, salsa di soia, cannolicchi, salsa di ostriche"},
   price:14, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["molluscs","soy"]},

  {id:"y54",cat:"haixian",code:"54",
   zh:{name:"蛋黄焗肉蟹",desc:"咸蛋黄研碎炒香，裹住每块肉蟹，金沙翻滚，沙感细腻，奢华享受"},
   it:{name:"Granchio con tuorlo d'uovo",desc:"amido, uova, granchio"},
price:20, spicy:false, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["crustaceans","eggs"]},
  /* ── 炒菜菜品 ── */

{id:"y49",cat:"chaocai",code:"49",
   zh:{name:"锅包肉",desc:"东北名菜，猪里脊裹浆炸至金黄酥脆，糖醋汁裹匀，酸甜爽口"},
   it:{name:"Maiale croccante in agrodolce",desc:"maiale, salsa di soia, amido"},
   price:14, spicy:false, frozen:false, preorder:false, badge:"popolare", status:"active", image:null,
   allergens:["gluten","soy","eggs"]},



{id:"y61",cat:"chaocai",code:"61",
zh:{name:"溜肉段", desc:"猪肉 洋葱 尖椒 酱油 淀粉 蚝油"},
it:{name:"Bocconcini di maiale fritti in salsa",
desc:"maiale, cipolla, peperone, salsa di soia, amido, salsa di ostriche"},
price:12, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null},


  /* ── 主食面食 ── */
  {id:"z60",cat:"zhushi",code:"60",
   zh:{name:"鸡汤鲜肉大馄饨",desc:"手工大馄饨皮薄馅厚，猪肉鲜嫩，浸入浓郁鸡汤，干虾米增鲜，一口暖胃"},
   it:{name:"Ravioloni ripieni di maiale in brodo di pollo",desc:"pasta per ravioli, maiale, brodo di pollo, salsa di soia, gamberetti secchi"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"consigliato", status:"active", image:null,
   allergens:["gluten","crustaceans","soy","eggs"]},

  {id:"z61",cat:"zhushi",code:"61",
   zh:{name:"重庆小面",desc:"细面劲道爽滑，牛肉火腿双重加持，辣椒花椒蚝油调出麻辣鲜香"},
   it:{name:"Spaghetti piccanti alla Chongqingnese",desc:"noodles, salsa di soia, manzo, prosciutto, amido, salsa di ostriche"},
   price:10, spicy:true, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["gluten","soy","molluscs"]},

  {id:"z62",cat:"zhushi",code:"62",
   zh:{name:"三丁打卤面",desc:"土豆丁、茄子丁、猪肉丁炒制浓卤，手擀面条挂卤均匀，东北家常味道"},
   it:{name:"Noodles con salsa San Ding",desc:"noodles, patate, melanzane, maiale, salsa di soia, amido, salsa di ostriche"},
   price:10, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["gluten","soy","molluscs"]},

  {id:"z63",cat:"zhushi",code:"63",
   zh:{name:"朝鲜冷面",desc:"朝鲜族风味冷面，细细荞麦面条浸冰凉酸甜汤底，牛肉片与卤蛋并肩"},
   it:{name:"Noodles freddi coreani Naengmyeon",desc:"noodles, manzo, uovo, cavolo cinese, salsa di soia"},
   price:10, spicy:false, frozen:false, preorder:false, badge:"speciale", status:"active", image:null,
   allergens:["gluten","eggs","soy"]},

  {id:"z65",cat:"zhushi",code:"65",
   zh:{name:"三鲜嘎达汤",desc:"面疙瘩柔软舒适，大虾、鱿鱼、蟹肉三鲜齐聚，海鲜清汤暖意浓浓"},
   it:{name:"Zuppa Tre Delizie con gnocchetti di pasta",desc:"pasta a gnocchetti, gamberi, calamaro, polpa di granchio, salsa di soia"},
   price:8, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["gluten","crustaceans","fish","molluscs","soy"]},

  {id:"z66",cat:"zhushi",code:"66",
   zh:{name:"白米饭",desc:""},
   it:{name:"Riso bianco",desc:""},
   price:1.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:[]},

  /* ── 甜品 ── */
  {id:"d1",cat:"dolci",code:"D1",
   zh:{name:"樱桃脆皮冰淇淋",desc:"酸甜黑樱桃内芯，脆壳外衣，冰凉一击"},
   it:{name:"Croccante all'Amarena (Bindi)",desc:""},
   price:6, spicy:false, frozen:true, preorder:false, badge:"", status:"active", image:null,
   allergens:["milk","eggs","gluten"]},

  {id:"d2",cat:"dolci",code:"D2",
   zh:{name:"开心果脆皮冰淇淋",desc:"西西里开心果奶香浓郁，外壳轻薄酥脆，冰火交融"},
   it:{name:"Croccante al Pistacchio (Bindi)",desc:""},
   price:6, spicy:false, frozen:true, preorder:false, badge:"", status:"active", image:null,
   allergens:["milk","eggs","gluten","nuts"]},

  {id:"d3",cat:"dolci",code:"D3",
   zh:{name:"杏仁冰淇淋",desc:"淡淡杏仁清香，质地细腻绵密，回味悠长"},
   it:{name:"Mandorla (Bindi)",desc:""},
   price:6, spicy:false, frozen:true, preorder:false, badge:"", status:"active", image:null,
   allergens:["milk","eggs","nuts"]},

  {id:"d4",cat:"dolci",code:"D4",
   zh:{name:"经典松露冰淇淋",desc:"黑巧克力外衣包裹香草芯，入口即化，经典不败"},
   it:{name:"Tartufo Classico (Bindi)",desc:""},
   price:6, spicy:false, frozen:true, preorder:false, badge:"", status:"active", image:null,
   allergens:["milk","eggs","gluten"]},

  {id:"d5",cat:"dolci",code:"D5",
   zh:{name:"白松露冰淇淋",desc:"白巧克力裹覆奶香冰芯，清甜优雅，餐后完美落幕"},
   it:{name:"Tartufo Bianco (Bindi)",desc:""},
   price:6, spicy:false, frozen:true, preorder:false, badge:"", status:"active", image:null,
   allergens:["milk","eggs","gluten"]},

  {id:"d7",cat:"dolci",code:"D7",
   zh:{name:"咖啡",desc:""},
   it:{name:"Caffè",desc:""},
   price:1.5, spicy:false, frozen:false, preorder:false, badge:"", status:"active", image:null,
   allergens:["milk"]},
];

const SHOP_DEFAULT = {
  namezh:"东北烧烤", nameit:"Dong Bei Shao Kao",
  address:"Via Luigi Tosti 51 · 00179 Roma", phone:"06 30329952",
  hoursOpen:"12:30", hoursClose:"15:00",
  hoursOpen2:"18:30", hoursClose2:"23:00",
  daysClosed:"Martedì / 周二"
};
const CATS = [
  {id:"lengcai", zh:"冷菜",     it:"Antipasti Freddi",      icon:"🥗", col:"#4A7C59"},
  {id:"shucai", zh:"蔬菜", it:"Verdure", icon:"🥦", col:"#2E7D32"},
  {id:"bbq",     zh:"烧烤",     it:"BBQ Griglia",           icon:"🔥", col:"#C0392B"},
  {id:"haixian", zh:"海鲜热菜", it:"Piatti Caldi di Mare",  icon:"🦐", col:"#1565C0"},
  {id:"chaocai",   zh:"炒菜", it:"Piatti Saltati",        icon:"🥘", col:"#E67E22"},
  {id:"zhushi",  zh:"主食面食", it:"Piatti di Pasta",       icon:"🍜", col:"#6A3D9A"},
  {id:"dolci",   zh:"甜品",     it:"Dolci & Caffè",         icon:"🍨", col:"#AD1457"},
];

const BADGE_IT = ["","popolare","novità","speciale","consigliato"];
const BADGE_ZH = ["","热销","新品","招牌","推荐"];

/* ════════════════════════════════════════════════════════════════
   LOGO SVG — redrawn from reference image (烤炉 BBQ grill style)
════════════════════════════════════════════════════════════════ */
function Logo({ size = 130, onClick }) {
  const s = size;
  return (
    <div onClick={onClick} style={{ width:s, height:s*1.15, position:"relative", cursor:"default", userSelect:"none", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
      <style>{`
        @keyframes flame1 { 0%,100%{transform:scaleY(1) translateX(0);opacity:.9} 50%{transform:scaleY(1.18) translateX(-2px);opacity:1} }
        @keyframes flame2 { 0%,100%{transform:scaleY(1) translateX(0);opacity:.8} 50%{transform:scaleY(1.25) translateX(2px);opacity:1} }
        @keyframes flame3 { 0%,100%{transform:scaleY(1);opacity:.7} 50%{transform:scaleY(1.1);opacity:.95} }
        @keyframes ember  { 0%{transform:translateY(0) translateX(0);opacity:1} 100%{transform:translateY(-14px) translateX(var(--dx));opacity:0} }
        .fl1{animation:flame1 1.2s ease-in-out infinite;transform-origin:bottom center;}
        .fl2{animation:flame2 1.5s ease-in-out infinite;transform-origin:bottom center;}
        .fl3{animation:flame3 0.9s ease-in-out infinite;transform-origin:bottom center;}
        .em1{--dx:-5px;animation:ember 1.6s ease-out 0s infinite;}
        .em2{--dx:4px; animation:ember 1.9s ease-out 0.6s infinite;}
        .em3{--dx:0px; animation:ember 1.4s ease-out 1.1s infinite;}
      `}</style>

      {/* 静态 logo 图片 */}
      <img
        src="/logo.jpg"
        alt="东北烧烤"
        style={{ width:s, height:s, objectFit:"contain" ,mixBlendMode:"multiply"}}
      />

      {/* 火焰 */}
      <div style={{ position:"relative", width:s*0.5, height:s*0.28, marginTop:-s*0.06 }}>
        <svg width="100%" height="100%" viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg">
          {/* 外层大火 */}
          <g className="fl2">
            <ellipse cx="40" cy="38" rx="18" ry="12" fill="url(#fg2)" opacity="0.85"/>
          </g>
          {/* 中层火 */}
          <g className="fl1">
            <ellipse cx="40" cy="36" rx="11" ry="16" fill="url(#fg1)"/>
          </g>
          {/* 内芯亮火 */}
          <g className="fl3">
            <ellipse cx="40" cy="37" rx="5.5" ry="9" fill="url(#fg3)"/>
          </g>
          {/* 火星 */}
          <circle className="em1" cx="33" cy="30" r="1.5" fill="#FF9500"/>
          <circle className="em2" cx="47" cy="28" r="1.2" fill="#FFCC00"/>
          <circle className="em3" cx="40" cy="26" r="1"   fill="#FF6600"/>
          <defs>
            <radialGradient id="fg1" cx="50%" cy="90%" r="60%">
              <stop offset="0%"   stopColor="#FFE066"/>
              <stop offset="40%"  stopColor="#FF6A00"/>
              <stop offset="100%" stopColor="#CC1500" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="fg2" cx="50%" cy="80%" r="65%">
              <stop offset="0%"   stopColor="#FF8C00"/>
              <stop offset="100%" stopColor="#8B0000" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="fg3" cx="50%" cy="85%" r="60%">
              <stop offset="0%"   stopColor="#FFFBE0"/>
              <stop offset="60%"  stopColor="#FFD200"/>
              <stop offset="100%" stopColor="#FF4400" stopOpacity="0"/>
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ALLERGEN PILLS (display)
════════════════════════════════════════════════════════════════ */
function AllergenPills({ ids, lang }) {
  if (!ids || ids.length === 0) return null;
  const list = ids.map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
      {list.map(a => (
        <span key={a.id} title={lang==="zh"?a.zh:a.it} style={{
          display:"inline-flex", alignItems:"center", gap:2,
          padding:"1px 6px", borderRadius:999,
          background:`${a.color}18`, border:`1px solid ${a.color}55`,
          fontSize:".58rem", color:a.color, fontWeight:700,
        }}>
          <span style={{ fontSize:".7rem" }}>{a.icon}</span>
          <span>{lang==="zh"?a.zh:a.it}</span>
        </span>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   QR CODE
════════════════════════════════════════════════════════════════ */
function loadQR() {
  return new Promise(res=>{
    if (window.QRCode) return res();
    const s = document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload=res; s.onerror=res; document.head.appendChild(s);
  });
}
function QRBlock({ shopId }) {
  const ref = useRef(null);
  const url = `${window.location.origin}${window.location.pathname}?shop=${shopId}&view=menu`;
  useEffect(()=>{
    loadQR().then(()=>{
      if (!ref.current) return;
      ref.current.innerHTML="";
      if (window.QRCode) new window.QRCode(ref.current,{text:url,width:200,height:200,colorDark:"#0D0500",colorLight:"#FFF8F0"});
    });
  },[shopId]);
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
      <div ref={ref} style={{ background:"#FFF8F0",padding:14,borderRadius:16,boxShadow:"0 8px 30px rgba(0,0,0,.2)" }}/>
      <div style={{ fontSize:".7rem",color:"#D4A017",letterSpacing:1 }}>ID: {shopId}</div>
      <div style={{ fontSize:".62rem",color:"#999",wordBreak:"break-all",textAlign:"center",maxWidth:240,lineHeight:1.6 }}>{url}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   OPENING HOURS BANNER
════════════════════════════════════════════════════════════════ */
function HoursBanner({ shop, lang }) {
  return (
    <div style={{
      display:"flex", justifyContent:"center", alignItems:"center",
      gap:16, flexWrap:"wrap",
      padding:"10px 20px",
      background:"rgba(212,160,23,.08)",
      borderBottom:"1px solid rgba(212,160,23,.18)",
    }}>
      <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:".72rem",color:"#D4A017",fontWeight:700 }}>
        🕐 {lang==="zh"?"午市":"Pranzo"}:&nbsp;
        <span style={{ color:"rgba(255,255,255,.8)",fontWeight:400 }}>
          {shop.hoursOpen} – {shop.hoursClose}
        </span>
      </span>
      <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:".72rem",color:"#D4A017",fontWeight:700 }}>
        🌙 {lang==="zh"?"晚市":"Cena"}:&nbsp;
        <span style={{ color:"rgba(255,255,255,.8)",fontWeight:400 }}>
          {shop.hoursOpen2} – {shop.hoursClose2}
        </span>
      </span>
      {shop.daysClosed && (
        <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:".72rem",color:"#E65100",fontWeight:700 }}>
          🚫 {lang==="zh"?"休息日":"Chiuso"}:&nbsp;
          <span style={{ color:"rgba(255,255,255,.7)",fontWeight:400 }}>{shop.daysClosed}</span>
        </span>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CUSTOMER MENU VIEW
════════════════════════════════════════════════════════════════ */
function MenuView({ menu, lang, setLang, shop, onLogoTap }) {
  const [cat, setCat] = useState("lengcai");
  const items   = menu.filter(m => m.cat===cat && m.status!=="hidden");
  const catInfo = CATS.find(c=>c.id===cat);

  return (
    <div style={{ minHeight:"100vh", background:"#FFF8F0", fontFamily:"'Noto Serif SC',serif", paddingBottom:100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;400;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');
        @keyframes slideUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes heroFade { from{opacity:0} to{opacity:1} }
        ::-webkit-scrollbar { display:none }
        *{-webkit-tap-highlight-color:transparent}
      `}</style>

      {/* ══ HERO ══ */}
      <div style={{
        position:"relative", overflow:"hidden",
        background:"#000",
        paddingBottom:24,
      }}>
         
        {/* lang toggle */}
        <div style={{ position:"absolute",top:14,right:14,zIndex:10,display:"flex",borderRadius:999,overflow:"hidden",border:"1px solid rgba(212,160,23,.35)" }}>
          {["it","zh"].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{
              padding:"7px 14px",border:"none",cursor:"pointer",fontFamily:"'Noto Serif SC',serif",
              fontSize:".75rem",fontWeight:700,
              background:lang===l?"#D4A017":"rgba(26,10,0,.7)",
              color:lang===l?"#0D0500":"rgba(255,255,255,.5)",transition:"all .25s",
            }}>{l==="zh"?"中文":"IT"}</button>
          ))}
        </div>

        {/* logo + name */}
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",paddingTop:46,position:"relative",zIndex:1,animation:"heroFade 1s ease" }}>
          <Logo size={130} onClick={onLogoTap}/>
          <div style={{ marginTop:22,textAlign:"center" }}>
            <h1 style={{
              fontFamily:"'Ma Shan Zheng',serif",
              fontSize:"clamp(36px,8vw,58px)", color:"#D4A017",
              letterSpacing:9, lineHeight:1, margin:0,
              textShadow:"0 0 40px rgba(212,160,23,.55)",
            }}>{shop.namezh}</h1>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:"clamp(13px,2.5vw,17px)",color:"rgba(255,255,255,.42)",
              letterSpacing:5,textTransform:"uppercase",margin:"8px 0 0",
            }}>{shop.nameit}</p>
            <div style={{ display:"flex",gap:10,justifyContent:"center",marginTop:20,flexWrap:"wrap" }}>
              {[{icon:"📍",text:shop.address},{icon:"📞",text:shop.phone}].map((p,i)=>(
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:"rgba(255,255,255,.065)",backdropFilter:"blur(8px)",
                  border:"1px solid rgba(212,160,23,.22)",borderRadius:999,
                  padding:"6px 16px",fontSize:".74rem",color:"rgba(255,255,255,.58)",
                }}>
                  <span>{p.icon}</span>{p.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hours banner */}
        <div style={{ marginTop:20 }}>
          <HoursBanner shop={shop} lang={lang}/>
        </div>

        {/* Legend pills */}
        <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:18,flexWrap:"wrap",padding:"0 16px" }}>
          {[
            {icon:"🌶",l:{zh:"辛辣",it:"Piccante"},       bg:"rgba(192,57,43,.2)",  bd:"rgba(192,57,43,.35)", col:"#FF8A80"},
            {icon:"❄️",l:{zh:"冷冻",it:"Surgelato"},       bg:"rgba(80,140,220,.14)",bd:"rgba(80,140,220,.3)", col:"#90CAF9"},
            {icon:"📋",l:{zh:"需预定",it:"Prenotazione"},  bg:"rgba(212,160,23,.1)", bd:"rgba(212,160,23,.3)", col:"#D4A017"},
          ].map((t,i)=>(
            <span key={i} style={{
              display:"flex",alignItems:"center",gap:5,padding:"5px 13px",
              borderRadius:999,background:t.bg,border:`1px solid ${t.bd}`,
              fontSize:".69rem",color:t.col,fontWeight:600,letterSpacing:.5,
            }}>{t.icon} {t.l[lang]}</span>
          ))}
        </div>
      </div>

      {/* ══ STICKY CATEGORY TABS ══ */}
      <div style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(255,248,240,.96)",backdropFilter:"blur(14px)",
        borderBottom:"1px solid rgba(192,57,43,.1)",
        display:"flex",overflowX:"auto",scrollbarWidth:"none",
      }}>
        {CATS.map(c=>{
          const active = cat===c.id;
          return (
            <button key={c.id} onClick={()=>setCat(c.id)} style={{
              flexShrink:0,padding:"13px 17px",border:"none",cursor:"pointer",
              background:"transparent",
              borderBottom:active?`3px solid ${c.col}`:"3px solid transparent",
              color:active?c.col:"#aaa",
              fontFamily:"'Noto Serif SC',serif",fontSize:".77rem",
              fontWeight:active?700:400,transition:"all .2s",whiteSpace:"nowrap",
            }}>
              {c.icon} {lang==="zh"?c.zh:c.it}
            </button>
          );
        })}
      </div>

      {/* ══ SECTION HEADER ══ */}
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"22px 20px 14px" }}>
        <span style={{ fontSize:"2rem" }}>{catInfo?.icon}</span>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"1.38rem",color:"#1A0A00",fontWeight:600,lineHeight:1 }}>
            {lang==="zh"?catInfo?.zh:catInfo?.it}
          </div>
          <div style={{ fontSize:".68rem",color:"#ccc",marginTop:3 }}>
            {items.filter(i=>i.status!=="soldout").length} {lang==="zh"?"道菜可选":"piatti disponibili"}
          </div>
        </div>
        <div style={{ flex:1,height:1,background:`linear-gradient(90deg,${catInfo?.col}50,transparent)`,marginLeft:4 }}/>
      </div>

      {/* ══ ITEM CARDS ══ */}
      <div style={{ padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:11 }}>
        {items.length===0&&(
          <div style={{ textAlign:"center",color:"#ccc",padding:"50px 0",fontSize:".9rem" }}>
            {lang==="zh"?"暂无菜品":"Nessun piatto disponibile"}
          </div>
        )}
        {items.map((item,idx)=>{
          const info  = item[lang]||item.zh;
          const bidx  = BADGE_IT.indexOf(item.badge);
          const bLbl  = lang==="zh"?BADGE_ZH[bidx]:BADGE_IT[bidx];
          const sold  = item.status==="soldout";
          const cInfo = CATS.find(c=>c.id===item.cat)||CATS[0];

          return (
            <div key={item.id} style={{
              background:"#fff",borderRadius:16,overflow:"hidden",
              display:"flex",flexDirection:"column",
              boxShadow:"0 2px 16px rgba(26,10,0,.07)",
              opacity:sold?0.6:1,
              borderLeft:`3.5px solid ${sold?"#ddd":cInfo.col}`,
              animation:`slideUp .32s ease ${Math.min(idx,12)*.038}s both`,
            }}>
              <div style={{ display:"flex" }}>
                {/* icon / image column */}
                <div style={{
                  width:92,minHeight:92,flexShrink:0,
                  background:`linear-gradient(145deg,${cInfo.col}18,${cInfo.col}06)`,
                  display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",position:"relative",
                }}>
                  {item.image
                    ? <img src={item.image} alt={info.name} style={{ width:"100%",height:"100%",objectFit:"cover",filter:sold?"grayscale(70%)":"none" }}/>
                    : <span style={{ fontSize:"2.1rem",filter:sold?"grayscale(1)":"none" }}>{cInfo.icon}</span>
                  }
                  <div style={{
                    position:"absolute",bottom:4,left:4,
                    background:"rgba(13,5,0,.55)",color:"rgba(255,255,255,.65)",
                    fontSize:".54rem",padding:"1px 5px",borderRadius:4,letterSpacing:.5,
                  }}>#{item.code}</div>
                  {sold&&(
                    <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.3)",
                      display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <span style={{ color:"#fff",fontSize:".55rem",fontWeight:700,letterSpacing:1,
                        background:"rgba(0,0,0,.45)",padding:"2px 6px",borderRadius:4 }}>
                        {lang==="zh"?"售罄":"ESAURITO"}
                      </span>
                    </div>
                  )}
                </div>

                {/* text column */}
                <div style={{ flex:1,padding:"13px 14px 12px 12px",display:"flex",flexDirection:"column",justifyContent:"space-between",minWidth:0 }}>
                  <div>
                    <div style={{ fontSize:".94rem",fontWeight:700,color:sold?"#bbb":"#1A0A00",lineHeight:1.25 }}>
                      {info.name}
                    </div>
                    {info.desc&&(
                      <div style={{ fontSize:".68rem",color:"#b0a090",marginTop:5,lineHeight:1.6,fontStyle:"italic" }}>
                        {info.desc}
                      </div>
                    )}
                    <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginTop:6 }}>
                      {item.spicy    &&<Pill col="#C0392B">🌶 {lang==="zh"?"辣":"Piccante"}</Pill>}
                      {item.frozen   &&<Pill col="#1565C0">❄️ {lang==="zh"?"冷冻":"Surgelato"}</Pill>}
                      {item.preorder &&<Pill col="#D4A017">📋 {lang==="zh"?"需预定":"Prenotazione"}</Pill>}
                      {bLbl&&bidx>0&&!sold&&(
                        <span style={{
                          fontSize:".6rem",padding:"2px 8px",borderRadius:999,fontWeight:700,
                          background:item.badge==="novità"?"#FFF8E1":"#FDE8E8",
                          color:item.badge==="novità"?"#B8860B":"#C0392B",
                          border:`1px solid ${item.badge==="novità"?"#FFD54F":"#FFCDD2"}`,
                        }}>{bLbl}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex",justifyContent:"flex-end",marginTop:9 }}>
                    <span style={{
                      fontFamily:"'Cormorant Garamond',serif",
                      fontSize:"1.22rem",fontWeight:600,
                      color:sold?"#ccc":cInfo.col,
                    }}>
                      € {item.price%1===0?item.price+",00":item.price.toFixed(2).replace(".",",")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Allergens row */}
              {item.allergens && item.allergens.length > 0 && (
                <div style={{
                  padding:"6px 12px 10px 12px",
                  borderTop:"1px solid rgba(212,160,23,.1)",
                  background:"rgba(212,160,23,.03)",
                }}>
                  <div style={{ fontSize:".58rem",color:"#D4A017",fontWeight:700,marginBottom:4,letterSpacing:.5 }}>
                    {lang==="zh"?"⚠ 过敏原":"⚠ Allergeni"}
                  </div>
                  <AllergenPills ids={item.allergens} lang={lang}/>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ EU ALLERGEN LEGEND ══ */}
      <div style={{ margin:"8px 16px 16px",padding:"16px 18px",
        background:"rgba(212,160,23,.04)",border:"1px solid rgba(212,160,23,.16)",
        borderRadius:12,fontSize:".68rem",color:"#b0a090",lineHeight:1.9 }}>
        <div style={{ color:"#D4A017",fontWeight:700,marginBottom:10,fontSize:".72rem",letterSpacing:1 }}>
          ⚠ {lang==="zh"?"欧盟14种过敏原 (Reg. UE 1169/2011)":"14 Allergeni UE (Reg. UE 1169/2011)"}
        </div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"6px 10px" }}>
          {ALLERGENS.map(a=>(
            <span key={a.id} style={{
              display:"inline-flex",alignItems:"center",gap:3,
              fontSize:".62rem",color:a.color,fontWeight:600,
            }}>
              {a.icon} {lang==="zh"?a.zh:a.it}
            </span>
          ))}
        </div>
        <div style={{ marginTop:10,fontSize:".62rem",color:"#bbb",lineHeight:1.8 }}>
          {lang==="zh"
            ?"如您有任何食物过敏或不耐受，请在点餐前告知服务员。交叉污染风险不可排除。"
            :"Informare il personale in caso di allergie o intolleranze alimentari. Il rischio di contaminazione crociata non può essere escluso."}
        </div>
      </div>

      {/* ══ EU HYGIENE DECLARATION (footer) ══ */}
      <div style={{ margin:"0 16px 20px",padding:"16px 18px",
        background:"rgba(26,10,0,.04)",border:"1px solid rgba(26,10,0,.1)",
        borderRadius:12,fontSize:".62rem",color:"#bbb",lineHeight:2 }}>
        <div style={{ color:"#888",fontWeight:700,marginBottom:6,fontSize:".64rem",letterSpacing:1 }}>
          📋 {lang==="zh"?"卫生标准声明":"Dichiarazione Igienico-Sanitaria"}
        </div>
        <div>
          {lang==="zh" ? (
            <>
              本餐厅严格遵守以下欧盟法规：<br/>
              • <strong>Reg. CE 852/2004</strong> — 食品卫生通用法规<br/>
              • <strong>Reg. CE 853/2004</strong> — 动物源性食品卫生特别规定<br/>
              • <strong>Reg. UE 1169/2011</strong> — 食品标签及过敏原信息披露<br/>
              • <strong>Reg. CE 1333/2008</strong> — 食品添加剂使用规定<br/>
              • <strong>HACCP体系认证</strong> — 危害分析与关键控制点<br/>
              本餐厅持有有效的食品经营许可证，所有食品均在符合法规要求的条件下储存、处理和供应。
            </>
          ) : (
            <>
              Il presente esercizio rispetta le seguenti normative europee:<br/>
              • <strong>Reg. CE 852/2004</strong> — Igiene dei prodotti alimentari<br/>
              • <strong>Reg. CE 853/2004</strong> — Norme specifiche per alimenti di origine animale<br/>
              • <strong>Reg. UE 1169/2011</strong> — Informazioni sugli alimenti ai consumatori<br/>
              • <strong>Reg. CE 1333/2008</strong> — Additivi alimentari<br/>
              • <strong>Piano HACCP certificato</strong> — Analisi dei pericoli e punti critici di controllo<br/>
              L'esercizio è in possesso di regolare autorizzazione sanitaria. Tutti gli alimenti sono conservati, manipolati e somministrati nel rispetto delle normative vigenti.
            </>
          )}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ textAlign:"center",padding:"36px 20px 40px",
      background:"#000",}}>
        <Logo size={72}/>
        <div style={{ fontFamily:"'Ma Shan Zheng',serif",color:"#D4A017",fontSize:"1.55rem",
          marginTop:14,letterSpacing:6,textShadow:"0 0 20px rgba(212,160,23,.4)" }}>
          {shop.namezh}
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",
          color:"rgba(255,255,255,.3)",fontSize:".82rem",letterSpacing:4,marginTop:5 }}>
          {shop.nameit}
        </div>
        <div style={{ color:"rgba(255,255,255,.22)",fontSize:".68rem",marginTop:16,lineHeight:2.4 }}>
          <div>{shop.address}</div>
          <div>{shop.phone}</div>
          <div>🕐 {shop.hoursOpen}–{shop.hoursClose} &nbsp;🌙 {shop.hoursOpen2}–{shop.hoursClose2} &nbsp;|&nbsp; 🚫 {shop.daysClosed}</div>
          <div style={{ marginTop:6,color:"rgba(255,255,255,.1)",fontSize:".58rem" }}>
            Reg. CE 852/2004 · Reg. CE 853/2004 · Reg. UE 1169/2011 · Reg. CE 1333/2008 · HACCP
          </div>
        </div>
      </div>
    </div>
  );
}

/* tiny pill helper */
function Pill({ col, children }) {
  return (
    <span style={{ fontSize:".6rem",padding:"2px 8px",borderRadius:999,
      background:`${col}18`,color:col,border:`1px solid ${col}35`,fontWeight:600 }}>
      {children}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   ALLERGEN SELECTOR (for EditModal)
════════════════════════════════════════════════════════════════ */
function AllergenSelector({ selected, onChange }) {
  const toggle = id => {
    if (selected.includes(id)) onChange(selected.filter(x=>x!==id));
    else onChange([...selected, id]);
  };
  return (
    <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
      {ALLERGENS.map(a => {
        const active = selected.includes(a.id);
        return (
          <button key={a.id} onClick={()=>toggle(a.id)} style={{
            display:"flex",alignItems:"center",gap:4,
            padding:"5px 10px",borderRadius:999,border:"none",cursor:"pointer",
            fontSize:".68rem",fontWeight:700,transition:"all .15s",
            background:active?a.color:"#F0E8E0",
            color:active?"#fff":"#888",
            boxShadow:active?`0 0 0 2px ${a.color}55`:"none",
          }}>
            <span>{a.icon}</span><span>{a.zh}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN PANEL
════════════════════════════════════════════════════════════════ */
function AdminPanel({ menu, shopId, saving, shop, setShop, onExit }) {
  const [tab,      setTab]      = useState("menu");
  const [editItem, setEditItem] = useState(null);
  const [editShop, setEditShop] = useState(false);
  const [shopForm, setShopForm] = useState(shop);

  const blank = { id:"item-"+Date.now(), cat:"bbq", code:"", zh:{name:"",desc:""}, it:{name:"",desc:""},
    price:0, spicy:false, frozen:false, preorder:false, image:null, badge:"", status:"active", allergens:[] };

  const save   = async item => { await setDoc(doc(db,"menu",item.id),item); setEditItem(null); };
  const del    = async id   => { if(window.confirm("确认删除？")) await deleteDoc(doc(db,"menu",id)); };
  const toggle = async (item,s) => { await setDoc(doc(db,"menu",item.id),{...item,status:s}); };
  const saveShop = async () => { await setDoc(doc(db,"settings","shopInfo"),shopForm); setShop(shopForm); setEditShop(false); };

  const SC = {active:"#27AE60",soldout:"#E65100",hidden:"#BBB"};
  const SL = {active:"正常",soldout:"售罄",hidden:"下架"};
  const inp = (x={})=>({ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #E0D8D0",
    fontFamily:"'Noto Serif SC',serif",fontSize:".85rem",background:"#FFF8F0",outline:"none",boxSizing:"border-box",...x });

  return (
    <div style={{ minHeight:"100vh",background:"#F5F0EB",fontFamily:"'Noto Serif SC',serif",paddingBottom:80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600&display=swap');`}</style>

      {/* top bar */}
      <div style={{ background:"#0D0500",padding:"18px 20px 0" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <Logo size={42}/>
            <div>
              <div style={{ fontFamily:"'Ma Shan Zheng',serif",color:"#D4A017",fontSize:"1.1rem" }}>东北烧烤</div>
              <div style={{ color:"rgba(255,255,255,.32)",fontSize:".62rem",letterSpacing:1 }}>后台管理系统</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <span style={{ fontSize:".68rem",color:saving?"#D4A017":"#27AE60" }}>{saving?"⏳ 同步中...":"☁ 已同步"}</span>
            <button onClick={onExit} style={{ background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.14)",color:"rgba(255,255,255,.5)",padding:"6px 14px",borderRadius:999,cursor:"pointer",fontSize:".74rem" }}>退出</button>
          </div>
        </div>
        <div style={{ display:"flex",marginTop:16 }}>
          {[["menu","🍖 菜单"],["shop","🏪 店铺"],["qr","📲 二维码"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              padding:"10px 18px",border:"none",cursor:"pointer",fontFamily:"'Noto Serif SC',serif",
              fontSize:".82rem",background:tab===id?"#F5F0EB":"transparent",
              color:tab===id?"#1A0A00":"rgba(255,255,255,.42)",
              borderRadius:tab===id?"8px 8px 0 0":0,fontWeight:tab===id?700:400,
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:16 }}>

        {/* ── SHOP TAB ── */}
        {tab==="shop"&&(
          <div style={{ background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 14px rgba(0,0,0,.06)" }}>
            <div style={{ fontWeight:700,fontSize:"1rem",marginBottom:18 }}>店铺信息 / Info Negozio</div>
            {!editShop?(
              <div>
                {[["中文名","namezh"],["意大利语名","nameit"],["地址","address"],["电话","phone"],["营业开始","hoursOpen"],["营业结束","hoursClose"],["休息日","daysClosed"]].map(([l,k])=>(
                  <div key={k} style={{ marginBottom:12,padding:"12px 16px",background:"#FFF8F0",borderRadius:10 }}>
                    <div style={{ fontSize:".7rem",color:"#D4A017",marginBottom:4,letterSpacing:1 }}>{l}</div>
                    <div style={{ fontWeight:600 }}>{shop[k]}</div>
                  </div>
                ))}
                <button onClick={()=>{setShopForm(shop);setEditShop(true);}} style={{ width:"100%",background:"#1A0A00",color:"#D4A017",border:"none",padding:"13px",borderRadius:12,cursor:"pointer",fontWeight:700 }}>✏️ 编辑</button>
              </div>
            ):(
              <div>
                {[
                  ["中文名","namezh","东北烧烤"],
                  ["意大利语","nameit","Dong Bei Shao Kao"],
                  ["地址","address","Via Luigi Tosti 51"],
                  ["电话","phone","06 30329952"],
                  ["上午营业时间","hoursOpen","12:00"],["上午结束时间","hoursClose","23:00"],["晚上营业时间","hoursOpen2","18:30"],
["晚上结束时间","hoursClose2","23:00"],
                  ["休息日","daysClosed","Martedì / 周二"],
                ].map(([l,k,ph])=>(
                  <div key={k} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:".76rem",color:"#999",marginBottom:5 }}>{l}</div>
                    <input style={inp()} value={shopForm[k]||""} onChange={e=>setShopForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}/>
                  </div>
                ))}
                <div style={{ display:"flex",gap:10,marginTop:10 }}>
                  <button onClick={()=>setEditShop(false)} style={{ flex:1,background:"#EEE",color:"#666",border:"none",padding:"12px",borderRadius:12,cursor:"pointer" }}>取消</button>
                  <button onClick={saveShop} style={{ flex:2,background:"#C0392B",color:"#fff",border:"none",padding:"12px",borderRadius:12,cursor:"pointer",fontWeight:700 }}>保存 Salva</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QR TAB ── */}
        {tab==="qr"&&(
          <div style={{ background:"#fff",borderRadius:16,padding:26,textAlign:"center",boxShadow:"0 2px 14px rgba(0,0,0,.06)" }}>
            <div style={{ fontWeight:700,fontSize:"1rem",marginBottom:6 }}>专属二维码 · QR Code</div>
            <div style={{ fontSize:".76rem",color:"#999",marginBottom:22,lineHeight:1.8 }}>
              顾客扫码永远看到最新菜单<br/>
              <span style={{ color:"#C0392B" }}>修改菜单后无需重新生成二维码</span>
            </div>
            <QRBlock shopId={shopId}/>
          </div>
        )}

        {/* ── MENU TAB ── */}
        {tab==="menu"&&(
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontSize:".82rem",color:"#999" }}>共 {menu.length} 道菜品</div>
              <button onClick={()=>setEditItem({...blank,id:"item-"+Date.now()})} style={{ background:"#C0392B",color:"#fff",border:"none",padding:"9px 20px",borderRadius:999,cursor:"pointer",fontWeight:700,fontSize:".85rem" }}>+ 添加菜品</button>
            </div>
            {CATS.map(c=>{
              const its = menu.filter(m=>m.cat===c.id);
              if (!its.length) return null;
              return (
                <div key={c.id} style={{ marginBottom:20 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                    <span>{c.icon}</span>
                    <div style={{ fontSize:".8rem",fontWeight:700,color:c.col }}>{c.zh} / {c.it}</div>
                    <div style={{ flex:1,height:1,background:`${c.col}30`,marginLeft:4 }}/>
                  </div>
                  {its.map(item=>(
                    <div key={item.id} style={{
                      background:"#fff",borderRadius:12,padding:"11px 14px",marginBottom:8,
                      display:"flex",alignItems:"center",gap:10,boxShadow:"0 1px 6px rgba(0,0,0,.05)",
                      borderLeft:`3px solid ${item.status==="hidden"?"#ddd":c.col}`,
                      opacity:item.status==="hidden"?0.5:1,
                    }}>
                      <div style={{ width:44,height:44,borderRadius:8,overflow:"hidden",
                        background:`linear-gradient(135deg,${c.col}20,${c.col}08)`,
                        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        {item.image?<img src={item.image} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:"1.3rem" }}>{c.icon}</span>}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:".82rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                          #{item.code} {item.zh.name}
                        </div>
                        <div style={{ fontSize:".67rem",color:"#bbb" }}>
                          € {item.price.toFixed(2)}{item.spicy?" 🌶":""}{item.frozen?" ❄️":""}{item.preorder?" 📋":""}
                        </div>
                        <div style={{ fontSize:".64rem",color:SC[item.status||"active"],marginTop:1 }}>● {SL[item.status||"active"]}</div>
                        {item.allergens&&item.allergens.length>0&&(
                          <div style={{ fontSize:".6rem",color:"#D4A017",marginTop:2 }}>
                            {item.allergens.map(id=>ALLERGENS.find(a=>a.id===id)?.icon||"").join(" ")}
                          </div>
                        )}
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                        <div style={{ display:"flex",gap:3 }}>
                          {[["active","正"],["soldout","罄"],["hidden","架"]].map(([s,lb])=>(
                            <button key={s} onClick={()=>toggle(item,s)} style={{
                              width:26,height:26,borderRadius:6,border:"none",cursor:"pointer",
                              background:(item.status||"active")===s?SC[s]:"#F0E8E0",
                              color:(item.status||"active")===s?"#fff":"#aaa",
                              fontSize:".58rem",fontWeight:700,
                            }}>{lb}</button>
                          ))}
                        </div>
                        <div style={{ display:"flex",gap:3 }}>
                          <button onClick={()=>setEditItem(item)} style={{ background:"#F0E8E0",border:"none",borderRadius:6,padding:"4px 9px",cursor:"pointer",fontSize:".72rem" }}>编辑</button>
                          <button onClick={()=>del(item.id)} style={{ background:"#FDE8E8",border:"none",borderRadius:6,padding:"4px 7px",cursor:"pointer",fontSize:".72rem",color:"#C0392B" }}>删</button>
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
      {editItem&&<EditModal item={editItem} onSave={save} onClose={()=>setEditItem(null)}/>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EDIT MODAL
════════════════════════════════════════════════════════════════ */
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify({...item, allergens: item.allergens||[]})));
  const [saving, setSav] = useState(false);
  const fileRef = useRef();

  const handleImg = e => {
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{ const img=new Image(); img.onload=()=>{
      const c=document.createElement("canvas"),M=640; let w=img.width,h=img.height;
      if(w>h){if(w>M){h=h*M/w;w=M;}}else{if(h>M){w=w*M/h;h=M;}}
      c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
      setForm(f=>({...f,image:c.toDataURL("image/jpeg",.78)}));
    }; img.src=ev.target.result; }; r.readAsDataURL(f);
  };

  const submit = async()=>{ setSav(true); await onSave(form); setSav(false); };
  const inp=(x={})=>({ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #E0D8D0",fontFamily:"'Noto Serif SC',serif",fontSize:".85rem",background:"#FFF8F0",outline:"none",boxSizing:"border-box",...x });

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.62)",display:"flex",alignItems:"flex-end",zIndex:300 }} onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:"22px 22px 0 0",padding:22,width:"100%",maxHeight:"93vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontWeight:600 }}>
            {item.zh?.name?"编辑菜品":"添加菜品"}
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:"1.5rem",cursor:"pointer",color:"#ccc" }}>✕</button>
        </div>

        {/* image */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:6 }}>图片</div>
          <div style={{ display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ width:72,height:72,borderRadius:12,overflow:"hidden",background:"linear-gradient(135deg,#F5E8D8,#EDE0CC)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {form.image?<img src={form.image} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:"2rem" }}>🔥</span>}
            </div>
            <button onClick={()=>fileRef.current.click()} style={{ flex:1,padding:"11px",border:"1.5px dashed #D4A017",borderRadius:12,background:"#FFFBF0",cursor:"pointer",color:"#D4A017",fontSize:".82rem" }}>
              📷 上传图片
            </button>
            {form.image&&<button onClick={()=>setForm(f=>({...f,image:null}))} style={{ padding:"11px",border:"1.5px solid #FFCDD2",borderRadius:12,background:"#FDE8E8",cursor:"pointer",color:"#C0392B",fontSize:".82rem" }}>✕</button>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImg}/>
          </div>
        </div>

        {/* status */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:6 }}>状态</div>
          <div style={{ display:"flex",gap:8 }}>
            {[["active","🟢 正常"],["soldout","🟠 售罄"],["hidden","⚫ 下架"]].map(([s,lb])=>(
              <button key={s} onClick={()=>setForm(f=>({...f,status:s}))} style={{ flex:1,padding:"9px 0",borderRadius:9,border:"none",cursor:"pointer",fontSize:".75rem",background:form.status===s?"#1A0A00":"#F0E8E0",color:form.status===s?"#D4A017":"#666" }}>{lb}</button>
            ))}
          </div>
        </div>
        {/* cat + code */}
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          <div style={{ flex:2 }}>
            <div style={{ fontSize:".75rem",color:"#999",marginBottom:5 }}>分类</div>
            <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={inp()}>
              {CATS.map(c=><option key={c.id} value={c.id}>{c.zh} / {c.it}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:".75rem",color:"#999",marginBottom:5 }}>编号</div>
            <input style={inp()} value={form.code||""} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="01"/>
          </div>
        </div>

        {/* zh */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:5 }}>中文名称</div>
          <input style={inp({marginBottom:6})} value={form.zh?.name||""} onChange={e=>setForm(f=>({...f,zh:{...f.zh,name:e.target.value}}))} placeholder="例：炭烤生蚝"/>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:5 }}>中文描述</div>
          <textarea style={{...inp(),height:70,resize:"vertical"}} value={form.zh?.desc||""} onChange={e=>setForm(f=>({...f,zh:{...f.zh,desc:e.target.value}}))} placeholder="例：鲜活生蚝炭火烤至壳边微卷，蒜蓉汁渗入…"/>
        </div>

        {/* it */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:5 }}>Nome Italiano</div>
          <input style={inp({marginBottom:6})} value={form.it?.name||""} onChange={e=>setForm(f=>({...f,it:{...f.it,name:e.target.value}}))} placeholder="Es: Ostriche alla brace"/>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:5 }}>Descrizione / Ingredienti</div>
          <input style={inp()} value={form.it?.desc||""} onChange={e=>setForm(f=>({...f,it:{...f.it,desc:e.target.value}}))} placeholder="Es: ostriche, aglio, salsa di soia"/>
        </div>

        {/* price */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:5 }}>价格 / Prezzo (€)</div>
          <input style={inp()} type="number" step="0.5" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:parseFloat(e.target.value)||0}))}/>
        </div>

        {/* flags */}
        <div style={{ display:"flex",gap:8,marginBottom:14 }}>
          {[["spicy","🌶 辛辣"],["frozen","❄️ 冷冻"],["preorder","📋 需预定"]].map(([k,lb])=>(
            <button key={k} onClick={()=>setForm(f=>({...f,[k]:!f[k]}))} style={{ flex:1,padding:"9px 4px",borderRadius:9,border:"none",cursor:"pointer",fontSize:".75rem",background:form[k]?"#1A0A00":"#F0E8E0",color:form[k]?"#D4A017":"#666" }}>{lb}</button>
          ))}
        </div>

        {/* badge */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:6 }}>标签 / Badge</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
            {BADGE_IT.map((b,i)=>(
              <button key={b} onClick={()=>setForm(f=>({...f,badge:b}))} style={{ padding:"5px 14px",borderRadius:999,border:"none",cursor:"pointer",fontSize:".76rem",background:form.badge===b?"#C0392B":"#F0E8E0",color:form.badge===b?"#fff":"#666" }}>
                {i===0?"无标签":`${BADGE_ZH[i]} / ${b}`}
              </button>
            ))}
          </div>
        </div>

        {/* ── ALLERGENS ── */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:".75rem",color:"#999",marginBottom:6 }}>
            过敏原 / Allergeni &nbsp;<span style={{ color:"#D4A017",fontSize:".65rem" }}>(Reg. UE 1169/2011)</span>
          </div>
          <AllergenSelector
            selected={form.allergens||[]}
            onChange={ids=>setForm(f=>({...f,allergens:ids}))}
          />
          {form.allergens&&form.allergens.length>0&&(
            <div style={{ marginTop:8,fontSize:".65rem",color:"#999" }}>
              已选: {form.allergens.map(id=>{ const a=ALLERGENS.find(x=>x.id===id); return a?`${a.icon}${a.zh}`:""; }).join("  ")}
            </div>
          )}
        </div>

        <button onClick={submit} disabled={saving} style={{ width:"100%",background:saving?"#ccc":"#C0392B",color:"#fff",border:"none",padding:"15px",borderRadius:14,fontSize:"1rem",cursor:saving?"not-allowed":"pointer",fontWeight:700,letterSpacing:1 }}>
          {saving?"保存中...":"保存 / Salva"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view,    setView]  = useState("customer");
  const [lang,    setLang]  = useState("it");
  const [menu,    setMenu]  = useState([]);
  const [loading, setLoad]  = useState(true);
  const [saving,  setSave]  = useState(false);
  const [shop,    setShop]  = useState(SHOP_DEFAULT);
  const [showPin, setPin]   = useState(false);
  const [pinVal,  setPinV]  = useState("");
  const [pinErr,  setPinE]  = useState(false);
  const [adminOK, setAdmin] = useState(false);
  const taps = useRef(0), tapT = useRef(null);

  const [shopId] = useState(()=>{ let id=safeGet(SHOP_KEY); if(!id){id=genId();safeSet(SHOP_KEY,id);} return id; });

  /* init default data */
  useEffect(()=>{
    (async()=>{
      try {
        const snap = await getDocs(collection(db,"menu"));
        if (snap.empty) {
          setSave(true);
          for (const item of MENU_DATA) await setDoc(doc(db,"menu",item.id),item);
          setSave(false);
        }
      } catch(e) { console.error(e); }
    })();
  },[]);

  /* load shop info */
  useEffect(()=>{
    (async()=>{
      try { const s=await getDoc(doc(db,"settings","shopInfo")); if(s.exists()) setShop({...SHOP_DEFAULT,...s.data()}); } catch{}
    })();
  },[]);

  /* real-time menu */
  useEffect(()=>{
    const ord = CATS.map(c=>c.id);
    const unsub = onSnapshot(collection(db,"menu"), snap=>{
      const items = snap.docs
        .map(d=>({allergens:[],...d.data(),id:d.id}))
        .sort((a,b)=>{
          const ai=ord.indexOf(a.cat), bi=ord.indexOf(b.cat);
          return ai!==bi ? ai-bi : (a.code||"").localeCompare(b.code||"",undefined,{numeric:true});
        });
      setMenu(items); setLoad(false);
    }, err=>{ console.error(err); setMenu(MENU_DATA); setLoad(false); });
    return ()=>unsub();
  },[]);

  /* URL param */
  useEffect(()=>{ if(new URLSearchParams(window.location.search).get("view")==="menu") setView("customer"); },[]);

  /* logo tap → admin */
  const handleLogoTap = ()=>{
    taps.current++; clearTimeout(tapT.current);
    tapT.current=setTimeout(()=>{taps.current=0;},2000);
    if(taps.current>=5){ taps.current=0; setPin(true); setPinV(""); setPinE(false); }
  };
  const submitPin = ()=>{
    if(pinVal==="dongbei"){ setAdmin(true); setPin(false); setView("admin"); }
    else { setPinE(true); setPinV(""); setTimeout(()=>setPinE(false),1500); }
  };

  /* loading screen */
  if (loading) return (
    <div style={{ minHeight:"100vh",background:"#0D0500",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:22 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap');
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
      `}</style>
      <div style={{ animation:"breathe 2.2s ease-in-out infinite" }}><Logo size={120}/></div>
      <div style={{ fontFamily:"'Ma Shan Zheng',serif",color:"#D4A017",fontSize:"1.85rem",letterSpacing:9 }}>东北烧烤</div>
      <div style={{ color:"rgba(255,255,255,.3)",fontSize:".78rem",letterSpacing:2 }}>Caricamento… / 加载中…</div>
    </div>
  );

  return (
    <>
      {/* PIN MODAL */}
      {showPin&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }} onClick={()=>setPin(false)}>
          <div style={{ background:"#fff",borderRadius:22,padding:34,width:300,textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,.35)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ marginBottom:10,display:"flex",justifyContent:"center" }}><Logo size={64}/></div>
            <div style={{ fontFamily:"'Ma Shan Zheng',serif",fontSize:"1.25rem",color:"#1A0A00",marginBottom:4 }}>后台入口</div>
            <div style={{ fontSize:".75rem",color:"#bbb",marginBottom:20 }}>请输入密码 / Inserisci password</div>
            <input type="password" value={pinVal} autoFocus
              onChange={e=>setPinV(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submitPin()}
              style={{ width:"100%",padding:"13px",borderRadius:12,textAlign:"center",
                border:pinErr?"2px solid #C0392B":"2px solid #E0D8D0",
                fontSize:"1.3rem",letterSpacing:".35em",outline:"none",
                background:pinErr?"#FFF0F0":"#FFF8F0",boxSizing:"border-box",transition:"all .2s" }}
              placeholder="••••••"
            />
            {pinErr&&<div style={{ color:"#C0392B",fontSize:".75rem",marginTop:8 }}>密码错误 / Password errata</div>}
            <button onClick={submitPin} style={{ width:"100%",marginTop:16,background:"#1A0A00",color:"#D4A017",border:"none",padding:"13px",borderRadius:12,cursor:"pointer",fontFamily:"'Ma Shan Zheng',serif",fontSize:"1.05rem",letterSpacing:2 }}>
              进入 Entra
            </button>
          </div>
        </div>
      )}

      {view==="customer"&&<MenuView menu={menu} lang={lang} setLang={setLang} shop={shop} onLogoTap={handleLogoTap}/>}
      {view==="admin"&&adminOK&&(
        <AdminPanel menu={menu} shopId={shopId} saving={saving} shop={shop} setShop={setShop}
          onExit={()=>{setAdmin(false);setView("customer");}}/>
      )}
    </>
  );
     }
