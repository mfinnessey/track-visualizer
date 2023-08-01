var utility = require('../utility.js');
var express = require('express');
var querystring = require('querystring');
var router = express.Router();

router.get('/', function(req, res) {

    // OAuth2 state information
    var state = utility.generateRandomString(16);
    res.cookie(utility.stateKey, state);

    // request authorization from spotify
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
