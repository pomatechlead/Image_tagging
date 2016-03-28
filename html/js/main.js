var colorThief = new ColorThief();
var mainImg;
var mainImgInstance = new Image();
var imageAttr = {}; 
var imgId = 0;
var selectedAttr = null;
var jcrop_api = null;
var orgImageWidth = 0;
var orgImageHeight = 0;
var currentUrl = null;
var metaList = [];
var serverData = null;

//document.domain = "localhost";

var serverURL = "http://ec2-54-209-205-214.compute-1.amazonaws.com:3000";
//var serverURL = "http://localhost:3000";

var optionTrigger = function(){
	var lastObj = $(document).find("input#option").get(-1);
	if(lastObj == this) {
		addOption("");
	}
};

function addOption(val) {
	var newObj = $("<input type=\"text\" id=\"option\" placeholder=\"Option\">");
	var removeObj = $("<a class=\"btn btn-mini\"><i class=\"icon-remove\"></i>Remove</a>");
	$("#optionList").append($("<div>").append(newObj).append(removeObj));
	$(newObj).val(val);
	$(newObj).keydown(optionTrigger);
	$(removeObj).click(function() {
		$(this).parent("div").eq(0).remove();
	});
}

function getImageColor(img) {
	var color = colorThief.getColor(img);
	var pallete = colorThief.getPalette(img);
	
	var newAttr = $("<div class=\"attrRow\" id=\"default_attr\" style=\"padding-bottom:10px;\">");
	var content = "";
	
	content = "<div class=\"span5\" style='padding-top:5px;'>DOMINANT COLOR</div>" + 
	  "<div class=\"span7\" id='dominant_color' style=\"float:right;background:rgb(" + color[0] + "," + color[1] + "," + color[2] + ")\">&nbsp</div>" + 
	  "<div style='clear:both;height:5px;'></div>" + 
	  "<div class=\"span5\" style='padding-top:5px;padding-left:0px;margin-left:0px;'>PALLETE</div>" + 
	  "<div class=\"span7\" style=\"float:right;\">" + 
	  "<table width='100%'><tr height='30px'>";
	  for(i = 0 ; i < pallete.length ; i++) {
		  content += "<td id='pallete_" + i + "' style='background:rgb(" + pallete[i][0] + "," + pallete[i][1] + "," + pallete[i][2] + ")'></td>"
	  }
	content +=  "</tr></table>" + 
	  "</div>" +
	  "<div style=\"clear:both\"></div>";

	$(newAttr).append(content);
	$("#attrContents").append(newAttr);
	imageAttr.color = color;
	imageAttr.pallete = pallete;
}

function setImage(url) {
	imageAttr = {
			id:'',
			name:serverData.name,
			datetime:'',
			color:null,
			coord:null,
			attrList:[]
			};
	
	
	mainImgInstance.crossOrigin = "Anonymous";
	mainImgInstance.src = url;
	//$(mainImg).attr('src', url);
}
function loadNextImage() {
	if(jcrop_api != null)
		jcrop_api.destroy();
	imgId++;
	$("#attrContents").html("");
	clearCoords();
	serverData = null;
	$.ajax({
		dataType: "jsonp",
		type: 'GET',
		url: serverURL + '/getImage',
		data: null,
		jsonp: "callback",
		success: function(data) {
			serverData = data;
			console.log(data);
			if(data.url != null && data.url != '') {
				setImage(data.url);
			}
		}
	});
}

function resetData() {
	if(serverData.metaList !=null) {
		metaList = serverData.metaList;
	}
	//make initial data using meta
	for(i = 0 ; i < metaList.length ; i++) {
		var meta = metaList[i];
		var content = "";
		var type = meta.type;
		
		if(type == "selection") {
			var multiple = "";
			if(meta.multiSelection) {
				multiple = " multiple=\"multiple\"";
			}
			
			content = "<a class=\"btn span5\" href=\"#\" id=\"btnAttrEdit\" title=\"" + meta.hint + "\">" + meta.name + " <i class=\"icon-edit\"></i></a>" + 
			  "<select class=\"span7\" style=\"float:right\"" + multiple + " id=\"attrValue\">";
			
			for(j = 0 ; j < meta.options.length ; j++) {
				content += "<option value=\"" + meta.options[j] + "\">" + meta.options[j] + "</option>";
			};
			content += "</select>" +
			  "<div style=\"clear:both\"></div>"
		} else if(type == "string") {
			content = "<a class=\"btn span7\" href=\"#\" id=\"btnAttrEdit\" title=\"" + meta.hint + "\">" + meta.name + " <i class=\"icon-edit\"></i></a>" + 
			  "<div class=\"controls\" style=\"margin:0 20px 0 0px;\">" +
			  "<textarea rows=3 style=\"width:100%;margin-top:10px;\" id=\"attrValue\"></textarea>" + 
			  "</div>"
		} else if(type == "boolean") {
			content = "<a class=\"btn span5\" href=\"#\" id=\"btnAttrEdit\" title=\"" + meta.hint + "\">" + meta.name + " <i class=\"icon-edit\"></i></a>" + 
					  "<select class=\"span7\" style=\"float:right\" id=\"attrValue\">" + 
					  "	<option value=\"true\">TRUE</option>" + 
					  "	<option value=\"false\">FALSE</option>" +
					  "</select>" +
					  "<div style=\"clear:both\"></div>"
		} else if(type == "date") {
			var defaultDay = "";
			if(meta.defaultToday) {
				var d = new Date();

				var currDate = d.getDate();
				var currMonth = d.getMonth() + 1;
				var currYear = d.getFullYear();

				defaultDay = currMonth + "/" + currDate + "/" + currYear;
			} 
			
			content = "<a class=\"btn span5\" href=\"#\" id=\"btnAttrEdit\" title=\"" + meta.hint + "\">" + meta.name + " <i class=\"icon-edit\"></i></a>" + 
			  "<input class=\"span7\" type=\"text\" value=\"" + defaultDay + "\" id=\"datepicker\" style=\"float:right\" id=\"attrValue\">" + 
			  "<div style=\"clear:both\"></div>";
			if(defaultDay != "") {
				content += "<input type='hidden' id='defaultday' value='checked'>";
			} else {
				content += "<input type='hidden' id='defaultday' value=''>";
			}
		}
		
		content +=  ("<input type=\"hidden\" id=\"attrName\" value=\"" + meta.name + "\">");
		content += ("<input type=\"hidden\" id=\"attrHint\" value=\"" + meta.hint + "\">");
		
		var newAttr = $("<div class=\"attrRow\" id=\"attr\" type=\"" + type + "\">");
		$(newAttr).append(content);
		
		$("#attrContents").append(newAttr);
		
		if(type == "date") {
			var datepickerObj = $(newAttr).find('input#datepicker').get(0);
			$(datepickerObj).datepicker({dateFormat: "mm/dd/yy", autoclose: true});
		}
			
		$("a#btnAttrEdit").click(function() {
			editAttr(this);
		});
	}
}

function submitImageAttr() {
	//construct attr data
	if($("#x1").val() != '') {
		//add crop information
		var coord = {};
		var x = $("#x1").val();
		var y = $("#y1").val();
		var w = $("#w").val();
		var h = $("#h").val();
		
		coord.x = Math.round(Number(x) * Number(orgImageWidth) / Number($(mainImg).width()));
		coord.y = Math.round(Number(y) * Number(orgImageHeight) / Number($(mainImg).height()));
		coord.width = Math.round(Number(w) * Number(orgImageWidth) / Number($(mainImg).width()));
		coord.height = Math.round(Number(h) * Number(orgImageHeight) / Number($(mainImg).height()));
		
		imageAttr.coord = coord;
	}
	
	//add attr list
	var attrList = [];
	
	$(document).find("div#attr").each(function(idx) {
		//if(idx != 0) 
		{
			var attr = {};
			var type = $(this).attr("type");
			attr.type = type;
			attr.name = $(this).find("#attrName").eq(0).val();
			attr.hint = $(this).find("#attrHint").eq(0).val();
			
			var valueObj = $(this).find("#attrValue")[0];
			attr.value = $(valueObj).val();
			
			if(type == 'date') {
				attr.value = $(this).find("input#datepicker").eq(0).val();
			}
			
			attrList.push(attr);
		}
	});
	
	imageAttr.attrList = attrList;
	
	$.ajax({
	    type: "POST",
	    url: serverURL + "/saveImageTagging",
	    data: imageAttr,
	    crossDomain: true,
	    success: function(data){
	    	if(data == "success") {
		    	loadNextImage();
	    	} else {
	    		alert("Service Error, please try again or check server status");
	    	}
	    },
	    failure: function(errMsg) {
	        alert(errMsg);
	    }
	});
}

function submitImageMeta() {
	metaList = [];
	
	$(document).find("div#attr").each(function(idx) {
		var meta = {};
		var type = $(this).attr("type");
		meta.type = type;
		meta.name = $(this).find("#attrName").eq(0).val();
		meta.hint = $(this).find("#attrHint").eq(0).val();

		var valueObj = $(this).find("#attrValue")[0];

		if(type == 'selection') {
			meta.multiSelection = $(valueObj).attr("multiple")=='multiple'?true:false;
			meta.options = [];
			for(i = 0 ; i < valueObj.options.length ; i++) {
				var option = valueObj.options.item(i).value;
				meta.options.push(option);
			}
		} else if(type == 'date') {
			meta.defaultToday = $(this).find("#defaultday").eq(0).val() == 'checked'?true:false;
		}
		metaList.push(meta);
	});
	
	console.log(metaList);
	
	$.ajax({
	    type: "POST",
	    url: serverURL + "/saveImageMeta",
	    data: {metaList:metaList},
	    crossDomain: true,
	    success: function(data){
	    	if(data == "success") {
		    	console.log("success to update meta");
	    	} else {
	    		alert("Service Error, please try again or check server status");
	    	}
	    },
	    failure: function(errMsg) {
	        alert(errMsg);
	    }
	});
}

//add mode
function addAttr() {
	selectedAttr= null;
	
	$("#optionList").html("");
	$("#multiSelection").attr("checked", false);
	$("#whenTypeIsSelection").hide();
	$("#whenTypeIsDate").hide();
	$("#typeSelect").val("");
	$("#inputAttrName").val("");
	$("#hintText").val("");
	$("#defaultToToday").attr("checked", false);
	$("#hintTextDiv").hide();
	$("#removeAttr").hide();
	$("#whenTypeIsSelection #option").val("");
	
	$('#attrSettingPopup').modal('show');
}

//edit mode
function editAttr(obj) {
	selectedAttr= $(obj).parent("div#attr").eq(0);
	
	//value setting
	$("#inputAttrName").val($(selectedAttr).find("#attrName").eq(0).val());
	$("#hintText").val($(selectedAttr).find("#attrHint").eq(0).val());
	$("#hintTextDiv").show();
	$("#removeAttr").show();
	
	var type = $(selectedAttr).attr("type");
	$("#typeSelect").val(type);
	
	$("#optionList").html("");
	$("#whenTypeIsSelection").hide();
	$("#multiSelection").prop("checked", false);
	$("#whenTypeIsDate").hide();
	$("#defaultToToday").prop("checked", false);
	$("#whenTypeIsSelection #option").val("");
	
	if(type == 'selection') {
		$("#whenTypeIsSelection").show();
		var valueObj = $(selectedAttr).find("#attrValue")[0];
		for(i = 0 ; i < valueObj.options.length ; i++) {
			var option = valueObj.options.item(i).value;
			
			if(i == 0) {
				$("#whenTypeIsSelection #option").val(option);
			} else
				addOption(option);
		}
		
		if(valueObj.options.length > 0)
			addOption(""); //add empty row
		
		if($(valueObj).attr("multiple") == 'multiple') {
			$("input#multiSelection").prop("checked", true);
		}
		
	} else if(type == 'date') {
		$("#whenTypeIsDate").show();
		if($(selectedAttr).find("#defaultday").eq(0).val() == 'checked')
			$("input#defaultToToday").prop("checked", true);
	}
		
	$('#attrSettingPopup').modal('show');
}

function saveAttr() {
	if($("#inputAttrName").val().trim() == "") {
		//alert("Please type attribute name");
		$("#inputAttrName").focus();
		return;
	}
	
	var type = $("#typeSelect").val();
	if(type == "" || type == null) {
		//alert("Please select attribute type");
		$("#typeSelect").focus();
		return;
	}
	
	var content = "";
	if(type == "selection") {
		var multiple = "";			
		if($("#multiSelection").prop("checked")) {
			multiple = " multiple=\"multiple\"";
		}
		
		content = "<a class=\"btn span5\" href=\"#\" id=\"btnAttrEdit\" title=\"" + $("#hintText").val() + "\">" + $("#inputAttrName").val() + " <i class=\"icon-edit\"></i></a>" + 
		  "<select class=\"span7\" style=\"float:right\"" + multiple + " id=\"attrValue\">";
		
		$(document).find("input#option").each(function(){
			if($(this).val().trim() != "") {
				content += "<option value=\"" + $(this).val().trim() + "\">" + $(this).val().trim() + "</option>";
			}
		});
		content += "</select>" +
		  "<div style=\"clear:both\"></div>"
	} else if(type == "string") {
		content = "<a class=\"btn span7\" href=\"#\" id=\"btnAttrEdit\" title=\"" + $("#hintText").val() + "\">" + $("#inputAttrName").val() + " <i class=\"icon-edit\"></i></a>" + 
		  "<div class=\"controls\" style=\"margin:0 20px 0 0px;\">" +
		  "<textarea rows=3 style=\"width:100%;margin-top:10px;\" id=\"attrValue\"></textarea>" + 
		  "</div>"
	} else if(type == "boolean") {
		content = "<a class=\"btn span5\" href=\"#\" id=\"btnAttrEdit\" title=\"" + $("#hintText").val() + "\">" + $("#inputAttrName").val() + " <i class=\"icon-edit\"></i></a>" + 
				  "<select class=\"span7\" style=\"float:right\" id=\"attrValue\">" + 
				  "	<option value=\"true\">TRUE</option>" + 
				  "	<option value=\"false\">FALSE</option>" +
				  "</select>" +
				  "<div style=\"clear:both\"></div>"
	} else if(type == "date") {
		var defaultDay = "";
		if($("#defaultToToday").prop("checked")) {
			var d = new Date();

			var currDate = d.getDate();
			var currMonth = d.getMonth() + 1;
			var currYear = d.getFullYear();

			defaultDay = currMonth + "/" + currDate + "/" + currYear;
		} 
		
		content = "<a class=\"btn span5\" href=\"#\" id=\"btnAttrEdit\" title=\"" + $("#hintText").val() + "\">" + $("#inputAttrName").val() + " <i class=\"icon-edit\"></i></a>" + 
		  "<input class=\"span7\" type=\"text\" value=\"" + defaultDay + "\" id=\"datepicker\" style=\"float:right\" id=\"attrValue\">" + 
		  "<div style=\"clear:both\"></div>";
		if(defaultDay != "") {
			content += "<input type='hidden' id='defaultday' value='checked'>";
		} else {
			content += "<input type='hidden' id='defaultday' value=''>";
		}
	}
	
	content +=  ("<input type=\"hidden\" id=\"attrName\" value=\"" + $("#inputAttrName").val() + "\">");
	content += ("<input type=\"hidden\" id=\"attrHint\" value=\"" + $("#hintText").val() + "\">");
	
	if(selectedAttr == null) {
		var newAttr = $("<div class=\"attrRow\" id=\"attr\" type=\"" + type + "\">");
		$(newAttr).append(content);
		
		$("#attrContents").append(newAttr);
		$('#attrSettingPopup').modal('hide');
		
		if(type == "date") {
			var datepickerObj = $(newAttr).find('input#datepicker').get(0);
			$(datepickerObj).datepicker({dateFormat: "mm/dd/yy", autoclose: true});
		}
		
	} else {
		$(selectedAttr).html(content);		
		$('#attrSettingPopup').modal('hide');
		
		if(type == "date") {
			var datepickerObj = $(selectedAttr).find('input#datepicker').get(0);
			$(datepickerObj).datepicker({dateFormat: "mm/dd/yy", autoclose: true});
		}
	}
	
	$("a#btnAttrEdit").click(function() {
		editAttr(this);
	});
	
	submitImageMeta();
}

function removeAttr() {
	if(selectedAttr == null)
		return;
	
	$(selectedAttr).remove();
	$('#attrSettingPopup').modal('hide');
	
	submitImageMeta();
}

function skip() {
	$('#skipPopup.modal').css({
		  'width': function () { 
		    return '400px';  
		  },
		  'margin-left': function () { 
		    return -($(this).width() / 2); 
		  }
		});
	
	$("#skipReason").val("");
	$("#skipComments").val("");
	
	$("#skipPopup").modal('show');
}

function skipApprove() {
	if($("#skipReason").val() == "" || $("#skipReason").val() == null) {
		$("#skipReason").focus();
		return;
	}
	
	$("#skipPopup").modal('hide');
	
	imageAttr.isSkip = true;
	imageAttr.skipReason = $("#skipReason").val();
	imageAttr.skipComment = $("#skipComments").val();
	
	var jsonData = JSON.stringify(imageAttr);
	console.log(jsonData);
	
	$.ajax({
	    type: "POST",
	    url: serverURL + "/saveImageTagging",
	    data: imageAttr,
	    crossDomain: true,
	    success: function(data){
	    	if(data == "success") {
		    	loadNextImage();
	    	} else {
	    		alert("Service Error, please try again or check server status");
	    	}
	    },
	    failure: function(errMsg) {
	        alert(errMsg);
	    }
	});
}

$(function() {
	mainImg = document.getElementById("mainImg");
	mainImgInstance.onload = function () {
		var current = new Date();
		imageAttr.id = current.getTime();
		imageAttr.datetime = current;
		$(mainImg).attr('src', this.src);
		getImageColor(mainImgInstance);
		resetData();
		
		//console.log(this.width);
		//console.log(this.height);
		orgImageWidth = this.width;
		orgImageHeight = this.height;
		
		$('#mainImg').Jcrop({
			onChange:   showCoords,
			onSelect:   showCoords,
			onRelease:  clearCoords,
			aspectRatio: $(mainImg).width() / $(mainImg).height()
		},function(){
			jcrop_api = this;
		});
	}
	
	loadNextImage();
	
	$("#btnSave").click(submitImageAttr);
	$("#btnSkip").click(skip);
		
	$("#btnAddAttr").click(addAttr);
	
	$("#typeSelect").change(function() {
		if(this.value == 'selection') {
			$("#whenTypeIsSelection").show();
			$("#whenTypeIsDate").hide();
		} else if(this.value == 'date') {
			$("#whenTypeIsSelection").hide();
			$("#whenTypeIsDate").show();
		} else {
			$("#whenTypeIsSelection").hide();
			$("#whenTypeIsDate").hide();
		}
		
		$("#hintTextDiv").show();
	})
	
	$("input#option").keydown(optionTrigger);	
	$('#datepicker').datepicker();	
	$("#saveAttr").click(saveAttr);
	$("#removeAttr").click(removeAttr);
	$("#skipApprove").click(skipApprove);
	
	$("#updateColor").click(updateColor);
});

function showCoords(c) {
  $('#x1').val(c.x);
  $('#y1').val(c.y);
  $('#w').val(c.w);
  $('#h').val(c.h);
};

function clearCoords() {
  $('#x1').val('');
  $('#y1').val('');
  $('#w').val('');
  $('#h').val('');
};

function updateColor() {
	var coord = {};
	if($('#x1').val() == '') {
		coord.x = 0;
		coord.y = 0;
		coord.width = orgImageWidth;
		coord.height = orgImageHeight;
	} else {
		var x = $("#x1").val();
		var y = $("#y1").val();
		var w = $("#w").val();
		var h = $("#h").val();
		
		coord.x = Math.round(Number(x) * Number(orgImageWidth) / Number($(mainImg).width()));
		coord.y = Math.round(Number(y) * Number(orgImageHeight) / Number($(mainImg).height()));
		coord.width = Math.round(Number(w) * Number(orgImageWidth) / Number($(mainImg).width()));
		coord.height = Math.round(Number(h) * Number(orgImageHeight) / Number($(mainImg).height()));
	}
	
	var canvas = document.createElement("canvas");
	canvas.width = coord.width;
	canvas.height = coord.height;
	canvas.getContext("2d").drawImage(mainImgInstance, coord.x, coord.y, coord.width, coord.height, 0, 0, coord.width, coord.height);
	
	var image = new Image();
	image.src = canvas.toDataURL("image/jpg");
	
	try {
		var color = colorThief.getColor(image);
		$("#dominant_color").css("background", "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")");
		
		var pallete = colorThief.getPalette(image);
		for(i = 0 ; i < pallete.length ; i++) {
			$("#pallete_" + i).css("background", "rgb(" + pallete[i][0] + "," + pallete[i][1] + "," + pallete[i][2] + ")");
		}
		
		imageAttr.color = color;
		imageAttr.pallete = pallete;
	} catch(e) {
		console.log(e);
	}

	$(canvas).remove();
}

setInterval(function() {
	if(serverData != null) {
		if(serverData.name != null) {
			$.ajax({
				dataType: "jsonp",
				type: 'GET',
				url: serverURL + '/syncImage?name=' + serverData.name,
				jsonp: "callback",
				success: function(data) {
				}
			});
		}
	}
}, 1000);