/**
 * 墾丁三日遊手冊：Google 試算表後端
 *
 * 名單：讀取「名單分頁」（預設第一個分頁，gid=0），只回傳「姓名」「房號」兩欄，其他欄位一律不外流。
 * 費用：存在「費用」分頁（第一次執行時自動建立），一筆費用一列。
 *
 * 部署：擴充功能 → Apps Script → 貼上本檔 → 部署 → 新增部署作業 → 類型「網頁應用程式」
 *       執行身分：我　／　誰可以存取：所有人 → 複製網址，貼到 index.html 的 API_URL。
 */

const PEOPLE_SHEET_GID = 0;      // 名單所在分頁的 gid（網址 #gid= 後面的數字）
const EXPENSE_SHEET = '費用';
const PASSWORD = '605288';      // 記帳密碼：沒帶正確密碼的寫入一律拒絕

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
  return { people: people_(), expenses: expenses_() };
}


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
