var utility = require('../utility.js');
var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var router = express.Router();



router.get('/', function(req, res) {

    // request refresh and access tokens after checking the state parameter
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[utility.stateKey] : null;

    // state mismatch implies OAuth2 authentication error
    if (state === null || state !== storedState) {
        res.redirect('/#' +
                     querystring.stringify({
                         error: 'state_mismatch'
                     }));
    } else {
        // new authentication will have a new state
        res.clearCookie(utility.stateKey);

        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: utility.redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(utility.client_id + ':' + utility.client_secret).toString('base64')
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            // successful request
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                res.cookie("access_token", access_token);
                res.cookie("refresh_token", refresh_token);

                res.redirect('control');

            } else {
                res.redirect('/#' +
                             querystring.stringify({
                                 error: 'invalid_token'
                             }));
            }
        });
    }
});
module.exports = router;
