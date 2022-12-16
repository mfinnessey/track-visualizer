var utility = require('../utility.js');
var express = require('express');
var request = require('request');
var querystring = require('querystring');
var router = express.Router();

var fs = require('fs');
const pipe_name = '../track-visualizer';

const pipe = fs.createWriteStream(pipe_name);

router.get('/', function(req, res) {

    res.render('control');

    var access_token = req.cookies["access_token"];

    var effect = req.query.effect;
    var R = req.query.r;
    var G = req.query.g;
    var B = req.query.b;

    // get currently playing song information if other information was provided
    if(R == null) return;
    var reqInfo = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {'Authorization': 'Bearer ' + access_token},
    };

    request.get(reqInfo, function(error, response, body) {
        // successful request
        if (!error && response.statusCode === 200) {
            var current_id = JSON.parse(body).item.id;
            // get audio analysis of currently playing song
            reqInfo = {
                url: 'https://api.spotify.com/v1/audio-features?ids=' + current_id,
                headers: {'Authorization': 'Bearer ' + access_token}
            };
            request.get(reqInfo, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    var bpm = Math.round(JSON.parse(body).audio_features[0].tempo).toString();
                    var msg = effect + '|' + R + ',' + G + ',' + B + '|' + bpm;
                    pipe.write(msg);

                }
                else{
                    res.redirect('/#' +
                                 querystring.stringify({
                                     error: 'invalid_token'
                                 }));
                }
            });

        } else {
            res.redirect('/#' +
                         querystring.stringify({
                             error: 'invalid_token'
                         }));
        }
    });
});

module.exports = router;
