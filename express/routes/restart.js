var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;


router.get('/', function(req, res) {
    exec('/home/led/track-visualizer/restart.sh');
});

module.exports = router;
