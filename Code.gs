function doPost(e) {
  // 處理 CORS 問題，GAS 接受 text/plain 然後我們自己 parse
  var data = e.postData.contents;
  if (!data) return ContentService.createTextOutput("No data").setMimeType(ContentService.MimeType.TEXT);
  
  // 儲存到 Script Properties (類似輕量級資料庫)
  var properties = PropertiesService.getScriptProperties();
  properties.setProperty('sgTriviaScores', data);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // 讀取分數
  var properties = PropertiesService.getScriptProperties();
  var scores = properties.getProperty('sgTriviaScores');
  
  if (!scores) {
    scores = "[]";
  }
  
  return ContentService.createTextOutput(scores)
    .setMimeType(ContentService.MimeType.JSON);
}
