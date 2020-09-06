chrome.browserAction.onClicked.addListener(function(){
    chrome.tabs.query({}, function(tabs){

      var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?open.spotify\.com/;

      var activaTabId = null;
      tabs.forEach(function(tab){

        if(tab.active == true) {
          console.log(tab);
          activaTabId = tab.id;
        }

        if (urlRegex.test(tab.url)) {
          console.log(tab);
          chrome.tabs.sendMessage(tab.id, "get_spotify_data");
        }
      });
      console.log(activaTabId);
      chrome.tabs.sendMessage(activaTabId, "toggle");
    })
});

var curActiveTabId = 0;
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.sendMessage(curActiveTabId, "remove_iframe");
  curActiveTabId = activeInfo.tabId;
  console.log(activeInfo.tabId);
});

'use strict';

const prefs = {
  'enabled': false,
  'overwrite-origin': true,
  'methods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'],
  'remove-x-frame': true,
  'allow-credentials': true,
  'allow-headers-value': '*',
  'expose-headers-value': '*',
  'allow-headers': true
};

const cors = {};
cors.onHeadersReceived = ({responseHeaders}) => {
  if (prefs['overwrite-origin'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-origin');
    if (o) {
      o.value = '*';
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Origin',
        'value': '*'
      });
    }
  }
  if (prefs.methods.length > 3) { // GET, POST, HEAD are mandatory
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-methods');
    if (o) {
      o.value = prefs.methods.join(', ');
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Methods',
        'value': prefs.methods.join(', ')
      });
    }
  }
  if (prefs['allow-credentials'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-credentials');
    if (o) {
      o.value = 'true';
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Credentials',
        'value': 'true'
      });
    }
  }
  if (prefs['allow-headers'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-headers');
    if (o) {
      o.value = prefs['allow-headers-value'];
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Headers',
        'value': prefs['allow-headers-value']
      });
    }
  }
  if (prefs['allow-headers'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-expose-headers');
    if (o) {
      o.value = prefs['expose-headers-value'];
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Expose-Headers',
        'value': prefs['expose-headers-value']
      });
    }
  }
  if (prefs['remove-x-frame'] === true) {
    const i = responseHeaders.findIndex(({name}) => name.toLowerCase() === 'x-frame-options');
    if (i !== -1) {
      responseHeaders.splice(i, 1);
    }
  }
  return {responseHeaders};
};

cors.install = () => {
//   cors.remove();
  const extra = ['blocking', 'responseHeaders'];
  if (/Firefox/.test(navigator.userAgent) === false) {
    extra.push('extraHeaders');
  }
  chrome.webRequest.onHeadersReceived.addListener(cors.onHeadersReceived, {
    urls: ['<all_urls>']
  }, extra);
};

cors.onCommand = () => {
	cors.install();
};

chrome.storage.onChanged.addListener(ps => {
  Object.keys(ps).forEach(name => prefs[name] = ps[name].newValue);
  cors.onCommand();
});

/* init */
chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  cors.onCommand();
});

