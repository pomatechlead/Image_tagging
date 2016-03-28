/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    imagetag = mongoose.model('imagetag'),
    imagelock = mongoose.model('imagelock'),
    imagemeta = mongoose.model('imagemeta');

var fs = require('fs')
, path = require('path');

var imageDir = 'E:/workspace/webImageTagging/ImageTagging/server/image';
var imageTaggedDir = 'E:/workspace/webImageTagging/ImageTagging/server/image_tagged';
var imageUrlPrefix = 'http://localhost:3000/image/'; 
//var imageDir = '/var/www/mean/mean/image';
//var imageTaggedDir = '/var/www/mean/mean/image_tagged';
//var imageUrlPrefix = 'http://ec2-54-209-205-214.compute-1.amazonaws.com:3000/image/'; 

exports.syncImage = function(req, res) {
	var name = req.param('name');
	var data = {name:name, time:new Date().getTime()};
	imagelock.update({name:name}, data, {upsert:true,safe:false},  function(err){
		res.jsonp("success");
	});
};

exports.getImage = function(req, res) {
	var files = fs.readdirSync(imageDir);
	var result  = {
			name:null,
			url:null,
			metaList:null
			};
	var lockList = [];
	
	if(files != null && files.length > 0) {
		//remove lock files
		var currentTime = new Date().getTime() - 2000;
		imagelock.remove({time:{$lt:currentTime}}, function(e) {
			imagelock.find({}, function(e, retlist) {
				if(e) {
					res.jsonp(result);
					return;
				}
				
				if(retlist != null || retlist.length != 0)
					lockList = retlist;
				
				var isRet = false;
				for(i = 0 ; i < files.length ; i++) {
					var isLock = false;
					for(j = 0 ; j < lockList.length ; j++) {
						if(files[i] == lockList[j].name) {
							isLock = true;
							break;
						}
					}
					
					if(isLock) continue;
					
					result.name = files[i];
					result.url = imageUrlPrefix + files[i];
					break;
				}
				
				if(result.name == null) { //Cannot find available file
					res.jsonp(result);
					return;
				}
				
				//locking current file
				currentLock = new imagelock();
				currentLock.name = result.name;
				currentLock.time = new Date().getTime();
				
				currentLock.save(function(e) {
					if(e) {
						res.jsonp({
							name:null,
							url:null,
							imageTag:null
							});
						
						return;
					}
					
					imagemeta.findOne({name:"global_meta"}, function(e, ret2) {
						if(e) {
							res.jsonp(result);
							return;
						}
						
						if(ret2 != null)
							result.metaList = ret2.metaList;
						
						res.jsonp(result);
						
						return;
					});
				});
					
				/*imagetag.findOne({name:result.name}, function(e, ret) {
					if(e) {
						res.jsonp(result);
						return;
					}
					
					if(ret != null) {
						console.log("found record");
						console.log(ret);
						result.imageTag = ret;
					}
					
					imagemeta.findOne({name:"global_meta"}, function(e, ret2) {
						if(e) {
							res.jsonp(result);
							return;
						}
						
						if(ret2 != null)
							result.metaList = ret2.metaList;
						
						res.jsonp(result);
						return;
					});
				});*/
			});
		});
	} else {
		res.jsonp(result);
	}
};

exports.saveImageTagging = function(req, res) {
	var data = req.body;
	
	var postProcessAfterSaveImageTag = function(data) {
		//move image
    	res.header('Access-Control-Allow-Origin', '*');
    	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    	
    	var source = fs.createReadStream(imageDir + "/" + data.name);
    	var dest = fs.createWriteStream(imageTaggedDir + "/" + data.name);
    	
    	source.pipe(dest);
    	source.on('end', function() {
    		fs.unlinkSync(imageDir + "/" + data.name);
        	res.send("success");
    	});
    	source.on('error', function(err) {
        	res.send("fail");
    	});
	} 
	
	imagetag.update({name:data.name}, data, {upsert:true,safe:false},  function(err){
		if (err) {
			console.log(err);
			res.send("fail");
		} else {
			postProcessAfterSaveImageTag(data);
		}
	});
};

exports.saveImageMeta = function(req, res) {
	var data = req.body;
	console.log(data.metaList);
	
	var postProcessAfterSaveImageMeta = function(err) {
		//move image
    	res.header('Access-Control-Allow-Origin', '*');
    	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    	
    	if(err) {
        	res.send("fail");
    	} else {
        	res.send("success");
    	}
	} 
	
	imagemeta.update({name:"global_meta"}, {name:"global_meta", metaList:data.metaList}, {upsert:true,safe:false},  function(err2){
		postProcessAfterSaveImageMeta(err2);
	});
};