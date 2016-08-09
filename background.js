function BgQuiz(options) {
  var module = this;

  var defaults = {
    timeout: null,
    TIME: 300000,
    type: 'R' //Q: quiz, R: reader
  };
  module.settings = defaults

  module.handleResponse = function(message){
    console.log(message.response);
  }

  module.sendMessageToTab = function(message){
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {greeting: "hi from background script"},
        module.handleResponse
      );
    }
  }

  module.sendToTab = function(){
    chrome.tabs.query({currentWindow: true, active: true}, module.sendMessageToTab);
  }

  module.clearTimeout = function(){
     clearTimeout( module.settings.timeout );
  }

  module.setTimeout = function(callback){
    module.settings.timeout = setTimeout(function(){
      callback();
      module.clearTimeout();
    }, module.settings.TIME);
  }

  module.clearStorage = function(callback){
    chrome.storage.local.clear(function() {
        var error = chrome.runtime.lastError;
        if (error) {
          console.error(error);
        }else{
          if(callback) callback();
        }
    });
  }

  module.getQuiz = function(callback){
    var urlLocal = 'http://localhost:4500/api/v1/sentences'
    var url = 'https://jp-learn.herokuapp.com/api/v1/randoms/quiz'
    if(module.settings.type == 'Q'){
      var url = 'https://jp-learn.herokuapp.com/api/v1/randoms/quiz'
    }else{
      var url = 'https://jp-learn.herokuapp.com/api/v1/randoms/read'
    }



    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var resp = JSON.parse(xhr.responseText);
        callback(resp)
      }
    }
    xhr.send();
  }

  module.bindEvents = function(){
    chrome.runtime.onMessage.addListener(module.processRepsonse);
    module.clearStorage(null);
    module.resetData()
  }

  module.processRepsonse = function(message){
    if(message.setTimeout){
      module.clearTimeout();
      module.setTimeout(module.resetData)
    }else if(message.minute){
      module.settings.TIME = +message.minute
      module.clearTimeout();
      module.setTimeout(module.resetData)
    }

  }

  module.setData = function(data, callback){
    chrome.storage.local.set(data, function() {
      if (chrome.runtime.error) {
        console.log("Runtime error.");
      }else if(callback){
        callback(data)
      }
    });
  }

  module.resetData = function(){
    module.getQuiz(function(data){
      var response = {}
      if(module.settings.type == 'Q'){
        response.quiz = data
      }else{
        response.reader = data
      }

      response.do_show = true
      module.setData(response)
    })
  }

  module.init = function(){
    module.bindEvents();
  }


}

var bgQuizer = new BgQuiz()
bgQuizer.init();








