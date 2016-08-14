


// function handleMessage(request, sender, sendResponse) {
//   console.log("message from the background script:");
//   console.log(request.greeting);
//   sendResponse({response: "hi from content script"});
// }

// chrome.runtime.onMessage.addListener(handleMessage);


function QuizerEmbed(options) {
  var module = this;

  module.iFrame = function(){
    var iFrame  = document.createElement ("iframe");
    iFrame.src  = chrome.extension.getURL ("layout.html");
    iFrame.style.position = 'fixed';
    // iFrame.style.top = '25%'
    // iFrame.style.right = '50%'
    iFrame.style.top = '0px'
    iFrame.style.right = '0'
    // iFrame.style.margin = "0px -420px 0px 0px";
    iFrame.style.zIndex = 999999
    iFrame.style.border = 'none'
    iFrame.id = 'thaoTp'
    // iFrame.height = '50%'
    // iFrame.width = '840'
    // iFrame.style.backgroundColor = "#000000";
    iFrame.style.display = 'none'
    iFrame.style.height = '100%'
    iFrame.style.width = '100%'
    return iFrame;
  }

  var defaults = {
    iframe: module.iFrame()
  };
  module.settings = $.extend({}, defaults, options);

  module.hideIframe = function(){
    $(module.settings.iframe).hide()
  }

  module.showIframe = function(){
    $(module.settings.iframe).show()
  }


  module.appendIframe = function(){
    document.body.appendChild (module.settings.iframe);
  }

  module.eventListenerCommand = function(){
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    // Listen to message from child window
    eventer(messageEvent,function(event) {
      if(event.data.from != 'owner-thaotp-page') return;

      switch (event.data.command) {
        case "do_hide":
          module.hideIframe();
          break;
        case "do_show":
          module.showIframe();
          break;
      }

    },false);
  }

  module.bindEvent = function(){
    module.eventListenerCommand();
    module.appendIframe();
    module.storageChange();
  }

  module.storageChange = function(){
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      for (key in changes) {
        var storageChange = changes[key];
        switch (key) {
          case "do_hide":
            break;
          case "do_show":
            if(storageChange.newValue == true){
              module.showIframe();
            }else if(storageChange.newValue == false){
              module.hideIframe();
              chrome.runtime.sendMessage({"setTimeout": true});
            }else if(storageChange.newValue == 'delay'){
              module.hideIframe();
              chrome.runtime.sendMessage({"delay": true});
            }

            break;
        }
      }
    });
  }

  module.init = function(){
    module.bindEvent();
  }
}

$(document).ready(function() {
  // Create IE + others compatible event handler

  var quizerEmbed = new QuizerEmbed()
  quizerEmbed.init();


})

