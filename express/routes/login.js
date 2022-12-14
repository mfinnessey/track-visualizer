var utility = require('../utility.js');
var express = require('express');
var querystring = require('querystring');
var router = express.Router();



router.get('/', function(req, res) {

    var state = utility.generateRandomString(16);
    res.cookie(utility.stateKey, state);

    // your application requests authorization
    var scope = 'user-read-playback-state';
    res.redirect('https://accounts.spotify.com/authorize?' +
                 querystring.stringify({
                     response_type: 'code',
                     client_id: utility.client_id,
                     scope: scope,
                     redirect_uri: utility.redirect_uri,
                     state: state
                 }));
});

module.exports = router;
