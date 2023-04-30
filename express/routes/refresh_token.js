var utility = require('../utility.js');
var express = require('express');
var router = express.Router();


router.get('/', function(req, res) {

    // request new access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + Buffer.from(utility.client_id + ':' + utility.client_secret).toString('base64') },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        // log new access token and return to control page
        if (!error && response.statusCode === 200) {
            res.cookie("access_token", body.access_token);
            res.redirect('control');
        }
        // unsuccessful attempt to use refresh token likely requires reauthenication
        // very possibly unrecoverable though
        else{
            res.redirect('login');
        }
    });
});

module.exports = router;
