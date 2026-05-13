function doGet(e) {
  var properties = PropertiesService.getScriptProperties();
  
  // 取得目前資料庫分數
  var scoresStr = properties.getProperty('sgTriviaScores');
  var teams = scoresStr ? JSON.parse(scoresStr) : [];
  
  // 1. 處理分數增減 (避免整包覆寫的快照衝突)
  if (e.parameter.action === 'updateScore') {
    var teamId = e.parameter.teamId;
    var points = parseInt(e.parameter.points, 10);
    
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) {
        teams[i].score = (teams[i].score || 0) + points;
        break;
      }
    }
    properties.setProperty('sgTriviaScores', JSON.stringify(teams));
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: teams })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 2. 處理班級分數重設
  if (e.parameter.action === 'resetClass') {
    var classId = e.parameter.classId;
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].class === classId) {
        teams[i].score = 0;
      }
    }
    properties.setProperty('sgTriviaScores', JSON.stringify(teams));
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: teams })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 如果是舊的 save 寫法，或是初始化空陣列
  if (e.parameter.action === 'save' && e.parameter.data) {
      if (teams.length === 0) { // 只允許在空的時候整包寫入初始化
         properties.setProperty('sgTriviaScores', e.parameter.data);
         teams = JSON.parse(e.parameter.data);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: teams })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 預設行為：讀取分數
  return ContentService.createTextOutput(JSON.stringify(teams))
    .setMimeType(ContentService.MimeType.JSON);
}
