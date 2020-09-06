
/*
** On Click listener to toggle the side bar
**/
chrome.runtime.onMessage.addListener(function(msg, sender){
	if(msg == "toggle"){
		extractSongInfoLayer();
		toggle();
	}
	else if(msg == "get_spotify_data"){
		var songText = document.getElementsByClassName("now-playing")[0].innerText.replace(/\n/g, " ");
		var songIcon = document.getElementsByClassName("now-playing")[0].getElementsByTagName('img')[0].src;
		chrome.storage.local.set({'song_icon': songIcon});
		chrome.storage.local.set({'song_text': songText});
	}
	else if(msg == "remove_iframe") {
		remove_iframe();
	}
})

// Initialize an iframe for sidebar
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
