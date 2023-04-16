var utility = require('../utility.js');
var express = require('express');
var request = require('request');
var querystring = require('querystring');
var router = express.Router();

var fs = require('fs');
const pipe_name = '../track-visualizer';
const maxMessageLength = 100;

const pipe = fs.createWriteStream(pipe_name);

router.get('/', function(req, res) {

    var access_token = req.cookies["access_token"];

    var effect = req.query.effect;
    var r0 = req.query.r0;
    var g0 = req.query.g0;
    var b0 = req.query.b0;
    var r1 = req.query.r1;
    var g1 = req.query.g1;
    var b1 = req.query.b1;

    // get currently playing song information if other information was provided
    if(r0 == null) {
        res.render('control');
        return;
    }
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
                    var colorString = r0 + ',' + g0 + ',' + b0;
                    // add secondary color if applicable
                    if(effect == "two_color_cycle"){
                        colorString += ';' + r1 + ',' + g1 + ',' +  b1;
                    }
                    var msg = effect + '|' + colorString + '|' + bpm;
                    // pad to prevent erroneous combination of two messages on client end
                    msg.padEnd(maxMessageLength);
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

    res.render('control');
});

module.exports = router;
