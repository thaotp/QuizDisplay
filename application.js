$( document ).ready(function() {
  var quizer = new Quizer()
  quizer.init();
});

function Quizer(options) {
  var module = this;
  module.bindEvents = function() {
    module.initData();
    module.eventSubmit();
    module.eventStoreChange();
    module.wordSearch();
  }

  module.init = function(){
    module.bindEvents();
  }

  module.initData = function(){
    module.getData('do_show', function(items){
      if(items.do_show == true){
        module.doShow()
        // module.appendData()
        module.appendReader()
      }
    })
  }

  module.appendData = function(){
    module.getData('quiz', function(items){
      var empty = Object.keys(items).length === 0 && items.constructor === Object
      if(!empty){
        module.renderQuiz(items)
        module.bindEventCountType()
      }
    })
  }

  module.appendReader = function(){
    module.getData('reader', function(items){
      var empty = Object.keys(items).length === 0 && items.constructor === Object
      if(!empty){
        module.renderReader(items)
      }
    })
  }

  module.eventStoreChange = function(){
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      for (key in changes) {
        var storageChange = changes[key];
        switch (key) {
          case "quiz":
            module.appendData()
            break;
          case "reader":
            module.appendReader()
            break;
          case "do_show":
            if(storageChange.oldValue == "delay"){
              module.appendReader();
            }
            break;
        }
      }
    });
  }

  module.eventSubmit = function(){
    $('.js-form-primary').on('submit', function(e){
      e.preventDefault();
      // For Quiz
      // $('.js-quiz').each(function(index, quiz){
      //   if($(quiz).data('name') != $(quiz).val()){
      //     $(quiz).addClass('add-red')
      //   }else{
      //     $(quiz).removeClass('add-red')
      //   }
      // });

      // var stop = $('.js-quiz').hasClass('add-red')

      // For Reader
      var stop = false
      if(!stop){
        module.setData({ do_show: false } )
      }

    })

    $('#iCancel').on('click', function(e){
      module.setData({ do_show: 'delay' } )
    })

  }

  module.doShow = function(options){
    var data = {
      from: "owner-thaotp-page",
      command: "do_show",
      owner: 'page'
    }
    var command = jQuery.extend(data, options);
    module.postMessage(command)
  }

  //Send to content script
  module.doHidden = function(){
    module.postMessage({
      from: "owner-thaotp-page",
      command: "do_hide",
      owner: 'page'
    })
  }

  module.postMessage = function(data){
    parent.postMessage(data, "*");
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

  module.getQuiz = function(callback){
    var urlLocal = 'http://localhost:4500/api/v1/sentences'
    var url = 'https://jp-learn.herokuapp.com/api/v1/randoms'

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var resp = JSON.parse(xhr.responseText);
        callback({quiz: resp})
      }
    }
    xhr.send();
  }

  module.getData = function(key, callback){
    chrome.storage.local.get(key, function(items) {
      if (!chrome.runtime.error) {
        callback(items)
      }
    });
  }

  module.renderQuiz = function(items){

    var content = ''
    $.each(items.quiz.words, function(index, word){
      content += tmpl("js-quiz-2", word);
    });
    $('.js-quizes').html(content)
    $('.js-sentence').html(tmpl("js-sentence", items.quiz.sentence))

  }

  module.bindEventCountType = function(){
    $('#iButton').hide()
    $('.js-quizType:enabled').first().focus()
    $('.js-quizType').on('keydown', function(e){
      if(e.keyCode == 13){
        event.preventDefault();
        var correct = $(e.currentTarget).data('correct')

        if($(e.currentTarget).val() == correct){
          var count = +$(e.currentTarget).parent().find('.js-count').text() + 1
          $(e.currentTarget).parent().find('.js-count').text(count)

          if(count >= 5){
            $(e.currentTarget).prop('disabled', true);
            $('.js-quizType:enabled').first().focus()
          }else{
            $(e.currentTarget).val('')
          }
          if($('.js-quizType:enabled').length == 0){
            module.setData({ do_show: false } )
          }

        }
        return false;
      }
    })
  }

  module.renderReader = function(items){
    var content = ''
    var reader = items.reader
    // reader.audio_url = 'https://s3-us-west-2.amazonaws.com/jplearn/audio/12+-+Dai+1+ka-+Bunkei.mp3'
    content += tmpl("js-reader", reader);
    $('.js-quizes').html(content)
    $('.js-sentence').html(reader.lesson + " Nghỉ ngơi 1 lát đi")
    return;
    module.getGrammar(reader)
  }

  module.renderGrammar = function(grammar){
    var content = ''
    $.each(grammar.urls, function(index, url){
      content += tmpl("js-render-grammar", {url: url});
    });
    $('.js-grammar').html(content)
    // $('.js-grammar').show();
  }

  module.getGrammar = function(reader){
    var xhr = new XMLHttpRequest();
    var url = "https://jp-learn.herokuapp.com/api/v1/grammars/1"
    xhr.open("GET", url + '?lesson='+reader.lesson, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var grammar = JSON.parse(xhr.responseText);
        if(grammar.urls){
          module.renderGrammar(grammar)
        }
      }
    }
    xhr.send();
  }

  module.wordSearch = function(){
    var minlength = 2;
    var searchRequest = null;
    $("#wordSearch").focus();
    $("#wordSearch").keyup(function () {
        $('.js-seach-result').html('')
        var _this = this,
        value = $(this).val().trim();
        if (value.length >= minlength ) {
          if (searchRequest != null) searchRequest.abort();
          searchRequest = $.ajax({
            type: "GET",
            url: "https://jp-learn.herokuapp.com/api/v1/words/search",
            data: {
                'word' : value
            },
            dataType: "text",
            success: function(data){
              module.renderResults(JSON.parse(data))
            }
          });
        }
    });
  }
  module.renderResults = function(words){
    var content = ''
    $.each(words, function(index, word){
      content += tmpl("js-render-result", word);
    });
    $('.js-seach-result').html(content)
  }

}
