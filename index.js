const axios = require('axios');
const watchHistory = require('../watch-history.json');
const apiKey = require('./yt-api-key.js');

const apiURL = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=${apiKey.key}&id=`;

let videoIds;
let idAmount = 0;

const makeRequest = (ids) => {
    axios.get(`${apiURL}${ids}`).then(response => {
        console.log(response);
    });
}

function start() {

    watchHistory.forEach(async vid => {
        if (vid.titleUrl) {
            if (idAmount == 50) {
                await makeRequest(videoIds.slice(0, -1));
                idAmount = 0;
                return;
            }
            videoIds = videoIds + `${vid.titleUrl.split('=')[1]},`;
            idAmount++;
        } else {
            console.log('this didn\'t have it:', vid);
        }
    });
}


start();