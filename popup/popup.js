/*global chrome */

(function () {

    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('js-submit').addEventListener('click', function (e) {
        var value = document.getElementById('js-minute').value
        chrome.runtime.sendMessage({ minute: value });
        window.close();
      });

      document.getElementById('js-submit-lesson').addEventListener('click', function (e) {
        var value = document.getElementById('js-lesson').value

        var url = 'https://jp-learn.herokuapp.com/api/v1/settings/1?value=' + value;
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            var resp = JSON.parse(xhr.responseText);
            window.close();
          }
        }
        xhr.send();
      });

    });
}());
