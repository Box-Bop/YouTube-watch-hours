const axios = require('axios');
const watchHistory = require('../watch-history.json');
const apiKey = require('./yt-api-key.js');

const apiURL = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=${apiKey.key}&id=`;

let videoIds;
let idAmount = 0;
let deletedVids = 0;

function makeRequest(ids) {
	axios.get(`${apiURL}${ids}`).then(response => {
		response.data.items.forEach(item => {
			// TODO calculate time together
			// Also, have the ability to exclude videos that are > X minutes.
		})
	}).catch(function (error) {
		console.log('ERROR:', error);
	});
}

function start() {
	watchHistory.forEach(vid => {
		if (vid.titleUrl) {
			// TODO: see if this works
			console.log(watchHistory.indexOf(vid) - (watchHistory.length - 1));

			if (idAmount == 50 || watchHistory.indexOf(vid) == watchHistory.length - 1) {
				videoIds = videoIds.replace('undefined', '').slice(0, -1);
				makeRequest(videoIds);
				idAmount = 0;
				videoIds = '';
				return;
			}

			vidID = vid.titleUrl.split('=')[1];
			videoIds += `${vidID},`;
			idAmount++;

		} else {
			deletedVids++;
		}
	});
}


start();