/**
 * 墾丁三日遊手冊：Google 試算表後端
 *
 * 名單：讀取「名單分頁」（預設第一個分頁，gid=0），只回傳「姓名」「房號」兩欄，其他欄位一律不外流。
 * 費用：存在「費用」分頁（第一次執行時自動建立），一筆費用一列。
 * 行程：讀取「行程」分頁（第一次執行時自動建立並填入預設行程），直接在試算表改，App 重新打開就會更新。
 *
 * 部署：擴充功能 → Apps Script → 貼上本檔 → 部署 → 新增部署作業 → 類型「網頁應用程式」
 *       執行身分：我　／　誰可以存取：所有人 → 複製網址，貼到 index.html 的 API_URL。
 */

const PEOPLE_SHEET_GID = 0;      // 名單所在分頁的 gid（網址 #gid= 後面的數字）
const EXPENSE_SHEET = '費用';
const PASSWORD = '605288';      // 記帳密碼：沒帶正確密碼的寫入一律拒絕
const ITINERARY_SHEET = '行程';

// 「行程」分頁的欄位：表頭文字 → 程式用的名稱（欄位順序可以自己調整，表頭文字不要改）
const ITINERARY_COLS = [
  ['編號', 'id'], ['天', 'day'], ['日期', 'date'], ['時間', 'time'], ['圖示', 'icon'], ['用餐', 'meal'],
  ['標題', 'title'], ['一句話', 'teaser'], ['介紹', 'text'], ['提醒', 'note'],
  ['地圖搜尋', 'mapQuery'], ['地址', 'address'], ['民宿連結', 'hotelLink']
];
const ICON_CHOICES = ['巴士', '麥克風', '餐點', '水族', '民宿', '夜市', '燈塔', '海灘', '夕陽', '卡丁車', '退房', '客家傘', '回家', '咖啡'];

function doGet() {
  return json_(load_());
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (String(body.pw || '') !== PASSWORD) return json_({ error: 'auth' });
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = expenseSheet_();
    const data = sh.getDataRange().getValues();
    const rowOf = {};
    for (let r = 1; r < data.length; r++) rowOf[data[r][0]] = { row: r + 1, updatedAt: Number(data[r][2]) || 0 };

    (body.ops || []).forEach(function (op) {
      const record = op.type === 'delete'
        ? { id: op.id, deleted: true, updatedAt: op.updatedAt }
        : op.expense;
      if (!record || !record.id) return;
      const row = [record.id, JSON.stringify(record), record.updatedAt || Date.now()];
      const hit = rowOf[record.id];
      if (hit) {
        if (hit.updatedAt > (record.updatedAt || 0)) return;   // 試算表上的比較新，不覆蓋
        sh.getRange(hit.row, 1, 1, 3).setValues([row]);
      } else {
        sh.appendRow(row);
        rowOf[record.id] = { row: sh.getLastRow(), updatedAt: record.updatedAt || 0 };
      }
    });
  } finally {
    lock.releaseLock();
  }
  return json_(load_());
}

function load_() {
  return { people: people_(), expenses: expenses_(), stops: stops_() };
}

function stops_() {
  const sh = itinerarySheet_();
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const head = values[0].map(function (h) { return String(h).trim(); });
  const col = {};
  ITINERARY_COLS.forEach(function (c) { col[c[1]] = head.indexOf(c[0]); });
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const row = {};
    ITINERARY_COLS.forEach(function (c) { row[c[1]] = col[c[1]] >= 0 ? values[r][col[c[1]]] : ''; });
    if (String(row.title).trim()) out.push(row);
  }
  return out;
}

function itinerarySheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(ITINERARY_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(ITINERARY_SHEET);
  const head = ITINERARY_COLS.map(function (c) { return c[0]; });
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.getRange(2, 1, DEFAULT_ITINERARY.length, head.length).setValues(DEFAULT_ITINERARY);
  sh.setFrozenRows(1);
  sh.getRange(2, 9, DEFAULT_ITINERARY.length, 1).setWrap(true);   // 介紹欄自動換行
  const rows = 200;
  sh.getRange(2, 5, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ICON_CHOICES, true).setAllowInvalid(false).build());
  sh.getRange(2, 6, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['早餐', '午餐', '晚餐'], true).build());
  sh.getRange(2, 13, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['是'], true).build());
  sh.getRange(1, 1).setNote('編號不要改、不要重複：費用是掛在編號上的。新增行程時取一個新的編號，例如 s21。');
  sh.autoResizeColumns(1, head.length);
  sh.setColumnWidth(9, 360);
  return sh;
}

// 第一次建立「行程」分頁時填入的預設行程
const DEFAULT_ITINERARY = [["s01",1,"10/30（五）","06:50–07:00","巴士","","芎林家門口集合出發","搭乘豪華氣墊遊覽巴士，出發囉！","大家在芎林家門口集合，06:50～07:00 搭乘豪華氣墊遊覽巴士往南出發。\n出門前再檢查一次：健保卡、常備藥品、防曬用品、水壺，穿一雙好走的鞋。","","新竹縣芎林鄉","",""],
  ["s02",1,"10/30（五）","07:00–11:00","麥克風","","國道風光．卡拉OK大賽","車上欣賞沿途風景，一起歡唱。","沿著國道一路南下，可以看看窗外風景、休息補眠，也可以拿起麥克風來場卡拉OK大賽。\n車程較長，中途會停休息站，記得起來走一走、喝點水。","","","",""],
  ["s03",1,"10/30（五）","11:30–12:30","餐點","午餐","午餐．阿達海鮮風味餐","第一頓合菜，品嚐在地海鮮。","在阿達海鮮享用海鮮風味合菜（每餐約 500 元／人，酒水另計）。","吃素的家人請事先告知領隊。","阿達海鮮 屏東","",""],
  ["s04",1,"10/30（五）","13:30–17:00","水族","","國立海洋生物博物館","走進海底世界，看魚群與珊瑚。","海生館分為「台灣水域館」、「珊瑚王國館」、「世界水域館」三大展館，從台灣的溪流、海岸，一路看到珊瑚礁與世界各大洋的海洋生物。\n館內步行距離不短，累了隨時找位子坐下休息。","","國立海洋生物博物館","屏東縣車城鄉後灣村後灣路2號",""],
  ["s05",1,"10/30（五）","17:30–18:00","民宿","","入住天水月民宿（第一晚）","放下行李，入住今明兩晚的家。","抵達天水月民宿辦理入住，這兩晚都住這裡（包棟）。\n先把行李放好、稍作休息，再一起出門吃晚餐。","","屏東縣恆春鎮南灣路891號","屏東縣恆春鎮南灣路891號","是"],
  ["s06",1,"10/30（五）","18:00–19:30","夜市","晚餐","墾丁大街．自理晚餐","逛大街、吃小吃，自由活動。","晚上到墾丁大街自由逛逛，晚餐自理，各式小吃、海產、飲料都有。\n人潮較多，請和家人結伴同行，約好集合時間。","","墾丁大街","",""],
  ["s07",2,"10/31（六）","07:00–08:30","咖啡","早餐","民宿活力早餐","吃飽飽，準備出門玩一整天。","在民宿享用早餐，補充一整天的體力。","今晚還會住同一間民宿，行李不用收。","","","是"],
  ["s08",2,"10/31（六）","09:00–11:00","燈塔","","鵝鑾鼻公園","台灣最南端的白色燈塔。","鵝鑾鼻公園有著名的白色鵝鑾鼻燈塔，位在台灣最南端，園區約 59 公頃。\n園區步道平緩，可以慢慢散步、看海、拍照。","","鵝鑾鼻公園","屏東縣恆春鎮鵝鑾鼻路100號",""],
  ["s09",2,"10/31（六）","11:30–12:30","餐點","午餐","午餐．阿興海鮮風味餐","海鮮合菜，休息充電。","在阿興海鮮享用海鮮風味合菜（每餐約 500 元／人，酒水另計）。","","阿興海鮮 恆春","",""],
  ["s10",2,"10/31（六）","13:00–16:00","海灘","","白沙灣海灘＆水上活動","白色沙灘踏浪，玩水消暑。","白沙灣有一大片細白沙灘，可以踏浪、散步、玩沙。\n想玩水上活動的人可以請司機幫忙代訂，費用另計。","下水請注意安全，大人要看好孩子，長輩在岸邊休息就好。","白沙灣 墾丁","",""],
  ["s11",2,"10/31（六）","16:30–17:30","夕陽","","關山夕照＆高山巖福德宮","世界級的夕陽美景。","關山夕照曾被 CNN 評選為世界十二大夕陽之一，從高處望向海面，看太陽慢慢落下。\n山上的高山巖福德宮也可以順道參拜。","","關山夕照 恆春","",""],
  ["s12",2,"10/31（六）","18:00–19:30","夜市","晚餐","墾丁大街夜遊．夜宿民宿（第二晚）","再逛一次大街，晚上回民宿休息。","晚上再到墾丁大街走走，晚餐自理。\n逛完回到天水月民宿，第二晚住同一間。","","墾丁大街","","是"],
  ["s13",3,"11/1（日）","07:00–09:40","咖啡","早餐","民宿活力早餐．準備退房","吃完早餐，慢慢整理行李。","在民宿享用早餐，之後回房間整理行李，準備退房。","","","","是"],
  ["s14",3,"11/1（日）","09:40–09:50","退房","","民宿 check-out","辦理退房，上車出發。","辦理退房，把行李搬上遊覽車。","離開前再確認一次：行李、手機、充電器、貴重物品都帶了嗎？","","",""],
  ["s15",3,"11/1（日）","10:00–11:00","卡丁車","","墾丁卡丁車賽車場","大人小孩都能開的卡丁車。","到卡丁車賽車場體驗駕駛的樂趣，大人與小孩分開跑道，安全又好玩。\n不想開車的家人可以在場邊加油、拍照。","","墾丁 卡丁車賽車場","",""],
  ["s16",3,"11/1（日）","12:00–13:00","餐點","午餐","午餐．陳記甕缸雞屏東旗艦店","甕缸雞合菜。","在陳記甕缸雞屏東旗艦店享用合菜（每餐約 500 元／人，酒水另計）。","","陳記甕缸雞 屏東旗艦店","",""],
  ["s17",3,"11/1（日）","13:30–15:00","客家傘","","六堆客家文化園區","認識南台灣客家文化。","六堆客家文化園區佔地約 30 公頃，分為四大區域，可以認識六堆客家的歷史、生活與工藝。\n園區寬闊，可以搭配樹蔭慢慢走，累了就找地方坐。","","六堆客家文化園區","屏東縣內埔鄉建興村信義路588號",""],
  ["s18",3,"11/1（日）","15:00–18:00","巴士","","回程．國道風光","車上看電影，休息站動一動。","搭車北返，車上可以看電影、休息。\n停休息站時記得下車活動筋骨、上洗手間。","","","",""],
  ["s19",3,"11/1（日）","18:00–19:00","餐點","晚餐","晚餐．范師父客家風味餐","旅程最後一餐，客家合菜。","在范師父享用客家風味合菜（每餐約 500 元／人，酒水另計），為這趟旅程畫下句點。","","范師父客家菜","",""],
  ["s20",3,"11/1（日）","19:00–20:00","回家","","平安返家","回到芎林，行程圓滿結束。","回到芎林，行程圓滿結束。\n謝謝大家一起出遊，回家好好休息！","","新竹縣芎林鄉","",""]];

function people_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheets().filter(function (s) { return s.getSheetId() === PEOPLE_SHEET_GID; })[0] || ss.getSheets()[0];
  const values = sh.getDataRange().getDisplayValues();

  // 在前 10 列找表頭：含「姓名」的欄是名字，含「房」的欄是房號
  let headerRow = -1, nameCol = -1, roomCol = -1;
  for (let r = 0; r < Math.min(10, values.length) && headerRow < 0; r++) {
    values[r].forEach(function (v, c) {
      const t = String(v).trim();
      if (nameCol < 0 && t.indexOf('姓名') >= 0) { nameCol = c; headerRow = r; }
    });
    if (headerRow >= 0) {
      values[headerRow].forEach(function (v, c) {
        const t = String(v).trim();
        if (roomCol < 0 && (t.indexOf('房號') >= 0 || t === '房間' || t === '房')) roomCol = c;
      });
    }
  }
  if (nameCol < 0) { headerRow = -1; nameCol = 0; }

  const seen = {};
  const out = [];
  for (let r = headerRow + 1; r < values.length; r++) {
    const name = String(values[r][nameCol] || '').replace(/[（(][^）)]*[）)]/g, '').trim();
    if (!name || seen[name]) continue;
    seen[name] = true;
    const room = roomCol >= 0 ? String(values[r][roomCol] || '').trim() : '';
    out.push({ name: name, room: room });
  }
  return out;
}

function expenses_() {
  const sh = expenseSheet_();
  const values = sh.getDataRange().getValues();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    try { const e = JSON.parse(values[r][1]); if (e && e.id && !e.deleted) out.push(e); } catch (err) {}
  }
  return out;
}

function expenseSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(EXPENSE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(EXPENSE_SHEET);
    sh.appendRow(['id', '內容（JSON，請勿手動修改）', '更新時間']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
