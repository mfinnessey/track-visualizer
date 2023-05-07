var utility = require('../utility.js');
var express = require('express');
var request = require('request');
var querystring = require('querystring');
var router = express.Router();

var fs = require('fs');
const pipe_name = '../track-visualizer';
const maxMessageLength = 100;

const pipe = fs.createWriteStream(pipe_name);

function forceValidColor(val){
    // force colors values to be in range 0 to 255
    if(Number.isInteger(val) && val >= 0 && val <= 255) return val;
    return 0;
}

router.get('/', function(req, res) {

    var effect = req.query.effect || "bpm_pulse";
    var r0 = forceValidColor(req.query.r0);
    var g0 = forceValidColor(req.query.g0);
    var b0 = forceValidColor(req.query.b0);
    var r1 = forceValidColor(req.query.r1);
    var g1 = forceValidColor(req.query.g1);
    var b1 = forceValidColor(req.query.b1);
    var bpm = req.query.bpm;
    var spotifySync = req.query.spotify_sync;

    // disallow non-numeric or non-postiive bpm
    if(isNaN(bpm) || bpm <= 0) bpm = 60;

    // spotify sync requested, so get bpm information from spotify
    if(req.query.spotify_sync){
        // if not logged in, force the user to log in as otherwise API calls will necessarily fail
        if(!req.cookies) res.redirect('login');

        var access_token = req.cookies["access_token"];

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
                        bpm = Math.round(JSON.parse(body).audio_features[0].tempo).toString();
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
    }
    // create and write message to pipe
    var colorString = r0 + ',' + g0 + ',' + b0;
    // add secondary color if applicable
    if(effect == "two_color_cycle"){
        colorString += ';' + r1 + ',' + g1 + ',' +  b1;
    }
    var msg = effect + '|' + colorString + '|' + bpm;
    // pad to prevent erroneous combination of two messages on client end
    msg.padEnd(maxMessageLength);
    pipe.write(msg);

    res.render('control');
});

module.exports = router;
