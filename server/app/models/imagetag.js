/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * imagetag Schema
 */
var ImageTagSchema = new Schema({
    name: String,
    id : String,
    datetime : String,
    color:[],
    pallete:[],
    coord:{},
    attrList : [],
    isSkip : Boolean,
    skipReason : String,
    skipComment : String
});

var ImageMetaSchema = new Schema({
	name : String,
	metaList : []
});

var ImageLockSchema = new Schema({
	name : String,
	time : Number
});

mongoose.model('imagetag', ImageTagSchema);
mongoose.model('imagemeta', ImageMetaSchema);
mongoose.model('imagelock', ImageLockSchema);
