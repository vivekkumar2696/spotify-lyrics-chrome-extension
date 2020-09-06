function getRepoData() {
    console.log("out ingest");
	chrome.storage.local.get('lyrics', function(result) {

		var lyrics = result.lyrics;
        str = "<div>"+ lyrics.replace(/\\n/g, "<br>"); +"</div>";
		document.getElementById("lyricsContainer").innerHTML = str;
		chrome.storage.local.get('song_icon', function(res) {
			console.log("hey", res.song_icon);
			document.getElementById("lyricsContainer").style.backgroundImage = "linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.6)), url('" + res.song_icon.replace("4851","1e02") +"')";
		});
	});

	chrome.storage.local.get('song_text', function(result) {
		var song_text = result.song_text;
        str = "<div>"+ song_text +"</div>";
		document.getElementById("song").innerHTML = str;
	});
}

getRepoData();
