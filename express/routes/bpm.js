var utility = require('../utility.js');
var express = require('express');
var request = require('request');
var querystring = require('querystring');
var router = express.Router();

var fs = require('fs');
const pipe_name = '../track-visualizer';

const pipe = fs.createWriteStream(pipe_name);
//const fd = fs.openSync(pipe_name, 'r+');
//let readstream = fs.createReadStream(null, {fd});

// readstream.on('data', data =>{
//     console.log("hi");
//     console.log(data.toString());
// });

router.get('/', function(req, res) {

    var access_token = req.cookies["access_token"];

    // get currently playing song
    var reqInfo = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {'Authorization': 'Bearer ' + access_token},
    };

    request.get(reqInfo, function(error, response, body) {
        // successful request
        if (!error && response.statusCode === 200) {
            var current_id = JSON.parse(body).item.id;
            console.log(current_id);
            // get audio analysis of currently playing song
            reqInfo = {
                url: 'https://api.spotify.com/v1/audio-features?ids=' + current_id,
                headers: {'Authorization': 'Bearer ' + access_token}
            };
            request.get(reqInfo, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    var bpm = JSON.parse(body).audio_features[0].tempo;
                    console.log(bpm);
                    pipe.write(bpm.toString());
                    console.log('attempted to write to pipe');

                }
                else{
                    console.log(response.statusCode);
                    console.log(body);
                    res.redirect('/#' +
                                 querystring.stringify({
                                     error: 'invalid_token'
                                 }));
                }
            });

        } else {
            console.log(response.statusCode);
            console.log(body);
            res.redirect('/#' +
                         querystring.stringify({
                             error: 'invalid_token'
                         }));
        }
    });

});

module.exports = router;
