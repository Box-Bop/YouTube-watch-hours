## Running project
`npm i && npm start`<br>
Make a `yt-api-key.js` file which exports your API key:
```
module.exports = {
    key: '<API-KEY>'
}
```

## API endpoints
- POST: `/send-data/:limit?` <br>
Post your watch history data to this endpoint as a JSON file. <br>
The endpoint has an optional `/limit` parameter. It limits processing videos that are longer than X amount of minutes. <br> So if you would do `/send-data/120`, the API won't take into account videos that are over 2 hours long.

- GET: `/get-data` <br>
You should periodically send a GET request to this endpoint in order to retrieve your stats. (after sending your data) <br>
This is necessary, as users can have really large watch histories, which can take multiple minutes to process. <br>
Example response:
```
{
    "success": true,
    "data": {
        "totalWatchTime": {
            "seconds": 10,
            "minutes": 46,
            "hours": 15,
            "days": 7,
            "months": 1
        },
        "otherStats": {
            "videosWatched": 7241,
            "avgVideoLenght": "00:11:16",
            "longerThanLimit": 129,
            "deletedVideos": 25
        }
    }
}
```

Currently this API doesn't support processing multiple requests at a time, nor does it save these statistics anywhere.
