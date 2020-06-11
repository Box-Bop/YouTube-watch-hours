const axios = require('axios');
var express = require("express");
const moment = require('moment');

const watchHistoryTemp = require('../watch-history.json');
const apiKey = require('./yt-api-key.js');

const apiURL = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=${apiKey.key}&id=`;
let excludedMinutes = 0;

let videoIds = '';
let idAmount = 0;

let totalVidCount = 0;
let deletedVids = 0;
let excludedVids = 0;
let totalSeconds = moment.duration(0, 'seconds');

async function makeRequest(ids) {
	await axios.get(`${apiURL}${ids}`).then(response => {
		response.data.items.forEach(item => {
			totalVidCount++;

			let duration = item.contentDetails.duration.split(/[THMS]/);
			duration = duration.slice(1, -1); // Removes array elements which RegEX split doesn't remove

			const seconds = duration[duration.length - 1];
			const minutes = duration[duration.length - 2] && duration[duration.length - 2];
			const hours = duration[duration.length - 3] && duration[duration.length - 3];

			const tempTime = moment.duration(0, 'minutes');

			seconds ? tempTime.add(parseInt(seconds), 'seconds') : {};
			minutes ? tempTime.add(parseInt(minutes), 'minutes') : {};
			hours ? tempTime.add(parseInt(hours), 'hours') : {};

			if (excludedMinutes && tempTime.as('minutes') >= excludedMinutes) {
				excludedVids++;
				return;
			}

			seconds ? totalSeconds.add(parseInt(seconds), 'seconds') : {};
			minutes ? totalSeconds.add(parseInt(minutes), 'minutes') : {};
			hours ? totalSeconds.add(parseInt(hours), 'hours') : {};
		});
	}).catch(function (error) {
		console.log('ERROR:', error);
	});
}

async function start(watchHistory) {
	for (vid of watchHistory) {
		if (vid.titleUrl) {

			if (idAmount == 50 || watchHistory.indexOf(vid) == watchHistory.length - 1) {
				videoIds = videoIds.slice(0, -1);
				await makeRequest(videoIds);
				console.log('Videos requested:', totalVidCount);
				idAmount = 0;
				videoIds = '';
				continue;
			}

			vidID = vid.titleUrl.split('=')[1];
			videoIds += `${vidID},`;
			idAmount++;

		} else {
			deletedVids++;
		}
	};

	const timeData = totalSeconds._data;

	console.log(`Total watchtime: ${timeData.seconds} seconds, ${timeData.minutes} minutes, ${timeData.hours} hours, ${timeData.days} days and ${timeData.months} months`);
	console.log(`Total amount of videos watched: ${totalVidCount}`);

	const asSeconds = totalSeconds.as('seconds');
	const average = asSeconds / totalVidCount;

	console.log(`Average video lenght: ${moment.utc(moment.duration(average, 'seconds').as('seconds')).format('HH:mm:ss')}`);
	console.log(`Amount of videos longer than ${excludedMinutes} minutes: ${excludedVids}\nDeleted videos: ${deletedVids}`);

	return {
		totalWatchTime: {
			seconds: timeData.seconds,
			minutes: timeData.minutes,
			hours: timeData.hours,
			days: timeData.days,
			months: timeData.months
		},
		otherStats: {
			videosWatched: totalVidCount,
			avgVideoLenght: moment.utc(moment.duration(average, 'seconds').as('seconds')).format('HH:mm:ss'),
			longerThanLimit: excludedVids,
			deletedVideos: deletedVids
		},
	}
}

var app = express();
app.use(express.json({ limit: '50mb' })); // lets you get request JSON

app.listen(3000, () => {
	console.log("Server running on port 3000");
});

app.post("/get-stats/:limit?", async (req, res) => {
	console.log('started');
	const limitParam = parseInt(req.params.limit);
	req.params.limit && !isNaN(limitParam) ? excludedMinutes = limitParam : {};
	const responseData = await start(req.body);
	res.send(responseData);
});