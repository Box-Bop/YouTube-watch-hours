const axios = require('axios');
var express = require("express");
const moment = require('moment');
const fs = require('fs');

const apiKey = require('./yt-api-key.js');
const filepath = 'retrievedApiData.json';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const apiURL = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&fields=items(id,snippet(publishedAt,channelId,channelTitle,title),contentDetails(duration))&key=${apiKey.key}&id=`;
let excludedMinutes = 0;

let totalVidCount = 0;
let excludedVids = 0;
let totalSeconds = moment.duration(0, 'seconds');
let returnedData = {};

let somethingRandom = 0;

somethingRandom.toString();

let totalAppendedData = [];

function isoTextToTime(incomingDuration) {
	const duration = moment.duration(incomingDuration);

	return { seconds: duration.seconds(), minutes: duration.minutes(), hours: duration.hours()}
}

async function makeRequest(videoIdsAndTime) {
	await sleep(200);
	let ids = '';
	videoIdsAndTime.map(vid => { ids += `${vid.id},`});
	ids = ids.slice(0, -1); // TODO: MAYBE NOT NEEDED

	return await axios.get(`${apiURL}${ids}`, {headers: ''}).then(response => {
		if (typeof response.data === 'string') {
			// response.data = JSON.parse(response.data);
			console.log('Response is a string, retrying');
			
			return false;
		} 
		const data = response.data.items;

		const combinedArray = data.reduce((acc, curr) => {

			curr.processedTime = isoTextToTime(curr.contentDetails.duration);
	
			acc.push({...curr, ...videoIdsAndTime.find(item => item.id === curr.id)});
			return acc;
		}, []);

		//TODO: filestreams should be used instead
		fs.readFile(filepath, 'utf-8', (err, fileData) => {
			if (err) {
				console.error(err);
				return;
			}
			
			let jsonData = [];
			try {
				jsonData = JSON.parse(fileData);
			} catch (e) {
				console.error('Error parsing JSON:', e);
			}
			
			jsonData.push(...combinedArray);
			
			const jsonString = JSON.stringify(jsonData);
			
			fs.writeFile(filepath, jsonString, 'utf-8', (err) => {
				if (err) {
				console.error(err);
				}
			});
		});

		return data;
	}).catch(function (error) {
		if (error.code === 'ECONNRESET') {
			return false;
		} else {
			console.log('ERROR:', error);

			return false;
		}
	});
};

async function processAttributes(videos) {
	videos.forEach(vid => {
		let duration = vid.contentDetails.duration;

		const { seconds, minutes, hours } = isoTextToTime(duration);

		const tempTime = moment.duration(0, 'minutes');

		seconds ? tempTime.add(seconds, 'seconds') : {};
		minutes ? tempTime.add(minutes, 'minutes') : {};
		hours ? tempTime.add(hours, 'hours') : {};

		if (excludedMinutes && tempTime.as('minutes') >= excludedMinutes) {
			excludedVids++;
			return;
		}
		totalVidCount++;

		seconds ? totalSeconds.add(seconds, 'seconds') : {};
		minutes ? totalSeconds.add(minutes, 'minutes') : {};
		hours ? totalSeconds.add(hours, 'hours') : {};
	});
}

async function start(watchHistory) {
	let videoIdsAndTime = [];
	let videoIds = '';
	let idAmount = 0;
	let deletedVids = 0;
	totalVidCount = 0;
	excludedVids = 0;
	for (vid of watchHistory) {
		if (vid.titleUrl) {
			
			vidID = vid.titleUrl.split('=')[1];
			videoIdsAndTime.push({
				id: vidID,
				timeWatched: vid.time
			});
			// videoIds += `${vidID},`;
			idAmount++;

			if (idAmount == 50 || watchHistory.indexOf(vid) == watchHistory.length - 1) {
				// videoIds = videoIds.slice(0, -1);
				let videos = false;
				
				while (!videos) {
					videos = await makeRequest(videoIdsAndTime);
				}

				await processAttributes(videos);
				console.log('Videos requested:', totalVidCount);
				idAmount = 0;
				// videoIds = '';
				videoIdsAndTime = [];
				continue;
			}

		} else {
			deletedVids++;
		}
	};

	const timeData = totalSeconds._data;

	console.log(`Total watchtime: ${timeData.seconds} seconds, ${timeData.minutes} minutes, ${timeData.hours} hours, ${timeData.days} days and ${timeData.months} months`);
	console.log(`Total amount of videos watched: ${totalVidCount}`);

	const asSeconds = totalSeconds.as('seconds');
	const average = asSeconds / totalVidCount;

	console.log(`Average video lenght: ${moment.utc(moment.duration(average, 'seconds').as('milliseconds')).format('HH:mm:ss')}`);
	console.log(`Amount of videos longer than ${excludedMinutes} minutes: ${excludedVids}\nDeleted videos: ${deletedVids}`);

	returnedData = {
		totalWatchTime: {
			seconds: timeData.seconds,
			minutes: timeData.minutes,
			hours: timeData.hours,
			days: timeData.days,
			months: timeData.months
		},
		otherStats: {
			videosWatched: totalVidCount,
			avgVideoLenght: moment.utc(moment.duration(average, 'seconds').as('milliseconds')).format('HH:mm:ss'),
			longerThanLimit: excludedVids,
			deletedVideos: deletedVids
		},
	}
}

var app = express();
app.use(express.json({ limit: '50mb' })); // Can handle a history of roughly ~100k videos

app.listen(3000, () => {
	console.log("Server running on port 3000");
});

app.post("/send-data/:limit?", (req, res) => {
	const limitParam = parseInt(req.params.limit);
	req.params.limit && !isNaN(limitParam) ? excludedMinutes = limitParam : {};
	start(req.body);
	res.status(202);
	res.json({accepted: true, message: 'Your data is being processed. Periodically send a GET request to /get-stats to retrieve processed data.'});
});

app.get("/get-data", (req, res) => {
	Object.keys(returnedData).length != 0 ?
		res.json({success: true, data: returnedData}) :
		res.json({success: false, message: 'Not done processsing your data.'});
});
