var win = undefined;
chrome.browserAction.onClicked.addListener(function() {
    if(win != undefined) {
      console.log("here1", win);
      chrome.windows.remove(win.id, function(){});
      win=undefined;
    }
    else {
      chrome.tabs.query({}, function(tabs){
        var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?open.spotify\.com/;
        var activaTabId = null;
        tabs.forEach(function(tab){
          if(tab.active == true) {
            activaTabId = tab.id;
          }

          if (urlRegex.test(tab.url)) {
            console.log("inside  spot");
            chrome.tabs.sendMessage(tab.id, "get_spotify_data");
          }
        });
        // chrome.tabs.sendMessage(activaTabId, "toggle");

        chrome.windows.create({
          url: chrome.runtime.getURL("src/popup.html"),
          type: "popup",
          width: 400,
          height: 400,
          left: (screen.width/2)-(200),
          top: (screen.height/2)-(200/2)
        }, function(w) {
          win = w;
          extractSongInfoLayer();
        });
      });
    }
});

var curActiveTabId = 0;
// chrome.tabs.onActivated.addListener(function(activeInfo) {
//   chrome.tabs.sendMessage(curActiveTabId, "remove_iframe");
//   console.log(curActiveTabId);
//   curActiveTabId = activeInfo.tabId;
//   console.log(activeInfo);
//   chrome.tabs.sendMessage(curActiveTabId, "toggle");
// });

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



var repoContentIframe = document.createElement('iframe');
repoContentIframe.style.background = "white";
repoContentIframe.style.height = "50%";
repoContentIframe.style.width = "0px";
repoContentIframe.style.position = "fixed";
repoContentIframe.style.bottom = "0px";
repoContentIframe.style.right = "0px";
repoContentIframe.style.zIndex = "9000000000000000000";
repoContentIframe.style.borderRadius = "20px";

/*
** Helper function to toggle the side bar
** Credits: https://stackoverflow.com/questions/39610205/how-to-make-side-panel-in-chrome-extension?rq=1
*/
function toggle() {
	if(repoContentIframe.style.width == "0px"){
		repoContentIframe.style.width="500px";
	}
	else{
		repoContentIframe.style.width="0px";
	}
}

function remove_iframe() {
	repoContentIframe.style.width="0px";
}

function extractSongInfoLayer() {
	var songText;
	chrome.storage.local.get('song_text', function(result) {
		songText = result.song_text;
		extractSongInfo(songText);
	});
}
const extractSongInfo = async(songText) => {
	const response = await searchSongLyrics(songText);
	var find = '<br>';
	var re = new RegExp(find, 'g');
	const responseAlt = response.replace(re, "\\n");
	var doc = new DOMParser().parseFromString(responseAlt, "text/html");
	lyrics = doc.getElementsByClassName('PZPZlf')[2].innerText;
	chrome.storage.local.set({'lyrics': lyrics});
	getSongLyrics();
}

function searchSongLyrics(songStr) {

	var songSearchStr = songStr.replace(/ /g,"+");
	const API =  "https://google.com/search";
	const page = '?q=' + songSearchStr + "+Lyrics";

	const headerObj = {
		'User-Agent': 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19'
	}

	const request = new Request(`${API}${page}`, {
		headers: new Headers(headerObj)
	})

	return fetch(request)
		.then(response => {
			return response.text();
	})
}

const getCurrentSongObject = () => {
	const content = window.content;
	return {}
  }


const getSongLyrics = () => {
	const songObject = getCurrentSongObject();

	repoContentIframe.src = chrome.extension.getURL("src/popup.html")
	document.body.appendChild(repoContentIframe);
}
