var express = require('express');
var router = express.Router();
var path = require("path");

var media = path.join(__dirname, "../public/audio/lol");

/* GET home page. */
router.get('/', function(req, res, next) {
	var fs = require("fs");
	fs.readdir(media,function(err,names){
		if(err) {
			console.log("ERROR");
		}else {
			res.render('index', {
				title: 'HTML5-Music',
				music: names
			});
		}
	});
	
});


module.exports = router;