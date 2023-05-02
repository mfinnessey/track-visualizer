var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;


router.get('/', function(req, res) {
    exec('../restart.sh');
});

module.exports = router;
