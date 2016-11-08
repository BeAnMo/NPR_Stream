/*
TODOS:
- reload stream automatically
  - may not be possible through npr's data
	- possibly updated at specific times of the day
	- will often reload to same stream
*/

chrome.browserAction.onClicked.addListener(get_filter_play);
	
var apiKey = 'get your own key!!';
var nprURL = "http://api.npr.org/query?orgId=1&requiredAssets=image,audio&dateType=story&output=JSON&apiKey=" + apiKey;
var streamData = []; // values are mp3 streams
var btnState = 1;

function toggle(audObj){
	if(btnState === 1){
		console.log('off');
		btnState = 0;
		audObj.pause();
	} else if(btnState === 0){
		console.log('on');
		btnState = 1;
		audObj.play();
	}
}

function get_filter_play(){
	get_URL(nprURL).then(function(response){
		console.log(response);
		return filter_req(response, streamData);
	}, function(reason){
		console.log('FAILED: ' + reason);
	}).then(function(){
		play_audio(0);
		console.log('audio playing');
	}, function(reason){
		console.log('unable to play audio: ' + reason);
	});
	console.log('loaded');
	
	chrome.browserAction.onClicked.removeListener(get_filter_play);
}

function play_audio(n){
	if(n === streamData.length - 3){// last 2 streams are different format?
		console.log('end of stream');
		return; // npr api calls are updated at certain points in the day?
		// possible to reload to same stream
	} else {
		var aud = new Audio(streamData[n]);
		chrome.browserAction.onClicked.addListener(function(){
			// toggle only works on streamData[0]?
			toggle(aud);
		});
		aud.addEventListener('ended', function(){
			console.log('stream ' + n + ' completed');
			play_audio(n + 1);
		});
		// aud.paused will return false if audio is playing, true otherwise
		aud.play();
	}
}

function get_URL(url){
	return new Promise(function(succeed, fail){
		var req = new XMLHttpRequest();
		req.open('GET', url, true);
		req.responseType = 'json';
		req.addEventListener('load', function(){
			if(req.status < 400){
				succeed(req.response.list.story);
			} else {
				fail(new Error('request failed: ' + req.statusText));
			}
		});
		req.addEventListener('error', function(){
			fail(new Error('network error'));
		});
		req.send(null);
	});
}

function filter_req(streamArr, storage){
	return streamArr.forEach(function(current, index){
		if(current.hasOwnProperty('audio')){
			try {
				storage.push(current.audio[0].format.mp3[0]['$text']);
			} catch(error){
				console.log('caught: ' + error);
			}
		} else {
			console.log(current);
		}
	});
}