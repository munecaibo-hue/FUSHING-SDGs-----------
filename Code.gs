function doGet(e) {
  var properties = PropertiesService.getScriptProperties();
  
  // 如果網址有帶 ?action=save&data=... 代表是要寫入分數
  if (e.parameter.action === 'save') {
    if (e.parameter.data) {
      properties.setProperty('sgTriviaScores', e.parameter.data);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 預設行為：讀取分數
  var scores = properties.getProperty('sgTriviaScores');
  if (!scores) {
    scores = "[]";
  }
  
  return ContentService.createTextOutput(scores)
    .setMimeType(ContentService.MimeType.JSON);
}
