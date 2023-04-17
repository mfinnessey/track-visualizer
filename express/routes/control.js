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

    // if not logged in, force the user to log in as otherwise API calls will necessarily fail
    if(!req.cookies) res.redirect('login');

    var access_token = req.cookies["access_token"];

    // vaildate inputs and abort message creation if invalid
    var effect = req.query.effect; // should never be invalid as dropdown
    var r0 = req.query.r0;
    var g0 = req.query.g0;
    var b0 = req.query.b0;
    var r1 = req.query.r1;
    var g1 = req.query.g1;
    var b1 = req.query.b1;

    // a primary color must always be specified
    if(r0 == null || g0 == null || b0 == null) res.redirect('control');

    // some effects require a secondary color to be specified
    if(r1 == null || g1 == null || b1 == null){
        if(effect == "two_color_cycle") res.redirect('control');
    }

    // get currently playing song information to sync lights to tempo
    var reqInfo = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {'Authorization': 'Bearer ' + access_token},
    };

    request.get(reqInfo, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var current_id = JSON.parse(body).item.id;
            // get audio analysis of currently playing song for tempo
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
                // in either failing case, access token has become invalid
                // therefore, we should get a new access token using the refresh token
                else{
                    res.redirect('refresh_token');
                }
            });

        } else {
            res.redirect('refresh_token');
        }
    });

    res.render('control');
});

module.exports = router;
