var BillSplit = {};
$(document).ready(function(){
	$("input#myfile").on('change',function(e){
		handleFileInputChange();
	});
	$("#imageSrc").click(function(e){
		$("input#myfile").click();
	});
	$("#imgContainer").on('click','img',function(e){
		HandleBillClick(e);
	})
	$(".members").click(function(e){
		if($(this).attr("data-value")=="equally"){
			$(".members").removeClass('added');
		}
		$(this).toggleClass('added');
	});

	$("#submitEachValue").click(function(e){

		$("#billMembers .added").each(function(e,i){
			if($(this).attr("data-value")=="equally"){
				$("[id^=userTotal]").each(function(x,y){
					var amount = parseFloat($(this).html()); 
					amount = parseFloat(amount+(parseFloat($("#currentValue").val()/$("[id^=userTotal]").length)));
					$(this).html(amount);
				});
			}else{
				var amount = parseFloat($("#userTotal"+$(this).attr("data-value")).html()); 
				amount = parseFloat(amount+(parseFloat($("#currentValue").val()/$("#billMembers .added").length)));
				$("#userTotal"+$(this).attr("data-value")).html(amount);
			}
		});
		var totalAmount = 0;
		$("[id^=userTotal]").each(function(x,y){
			var amount = parseFloat($(this).html());
			totalAmount+= amount;			
		});
		$("#usersTotal").html(totalAmount);
		$(".members").removeClass('added');
		$("#BillDropdown").hide();
	});
});
function handleFileInputChange() {
	var fileInput = $("input#myfile").get(0);
	var file = fileInput.files[0];
	if (!file) {
		console.log('No file chosen');
	} else {
		fileInput.value = "";
		readFile(file);
	}
}

function readFile(file) {    
	var reader= new FileReader();   
	reader.addEventListener("load", function(e) {
		$("#imgContainer").css("display","inline-block");
		$("#imageSrc").hide();
		$("#imgContainer").html("<img class='uploadedImg' src='"+e.target.result+"' />");
		$("#status").html('uploading...');
		 $(".uploadedImg").get(0).onload = function(){
		 	$("#imgCover").css("height",$(".uploadedImg").get(0).height);
			$("#imgCover").css("display","inline-block");
			$("#imgCover").animate({ height: "0px" },10000);
			window.setTimeout(function(){
				$("#imgCover").hide();
			},10000);

		 }
		
		GetAnnonateText(e.target.result);
	}); 
	reader.readAsDataURL(file);
 }  

function GetAnnonateText(base64String){
	var data = JSON.stringify({
	  "requests": [
	    {
	      "image": {
	        "content": base64String.split(',')[1]
	      },
	      "features": [
	        {
	          "type": "DOCUMENT_TEXT_DETECTION"
	        }
	      ]
	    }
	  ]
	});
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("readystatechange", function () {
	  if (this.readyState === 4) {
	  	$("#status").html('done');
	    var textoutput = JSON.parse(this.responseText);
	    console.log(textoutput);
	    BillSplit.billDetails = textoutput;
	    var originalWidth = $(".uploadedImg").get(0).naturalWidth;
		var originalHeight = $(".uploadedImg").get(0).naturalHeight;
		var newWidth = $(".uploadedImg").get(0).width;
		var newHeight = $(".uploadedImg").get(0).height;
	    BillSplit.picDetails = {
	    	sW:originalWidth,
			sH:originalHeight,
			dW:newWidth,
			dH:newHeight
	    };

	  }
	});
	xhr.open("POST", "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBPJVjce26RZ-OO7oI-fqB-8M5M9r4TBig");
	xhr.setRequestHeader("content-type", "application/json");
	xhr.send(data);
}


function ProcessImage(){
	
}
function HandleBillClick(evt){
	$(".members").removeClass('added');
	var mousePos = getMousePos($(".uploadedImg").get(0), evt);
    var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
    console.log(message);
    var translatedCoord = TransLateCoordinates(mousePos.x,mousePos.y,BillSplit.picDetails.sW,BillSplit.picDetails.sH,BillSplit.picDetails.dW,BillSplit.picDetails.dH);    
    console.log("Original postion",translatedCoord);
    var allBillTexts = BillSplit.billDetails.responses[0].textAnnotations.slice(1);
    var digitIndex = 0;
    var result = allBillTexts.filter(function(elem,index){
    	var v =  elem.boundingPoly.vertices;
    	var polygon = [
    		[v[0].x,v[0].y],
    		[v[1].x,v[1].y],
    		[v[2].x,v[2].y],
    		[v[3].x,v[3].y],
    	];
    	var isMatch = false;
    	isMatch = inside([translatedCoord.x,translatedCoord.y],polygon);
    	if(isMatch){
    		digitIndex = index;
    	}
	    return isMatch;
	});
	if(result.length>0){
		var finalDigit = result[0].description;
		if(digitIndex+1<allBillTexts.length-1){
			if(allBillTexts[digitIndex+1].description=="."){
				finalDigit +="."+ allBillTexts[digitIndex+2].description;
			}
		}
		console.log("Probable element",result,result[0].description);
		console.log("Final Digit",finalDigit);
		if(parseFloat(finalDigit)){
			$("#BillDropdown").css({"left":mousePos.x+20+"px","top":mousePos.y+20+"px"});
			$("#currentValue").val(parseFloat(finalDigit));
			$("#BillDropdown").css("display","inline-block");
		}else{
			$("#BillDropdown").hide();
		}
	}else{
		$("#BillDropdown").hide();
	}
}

function TransLateCoordinates(x,y,sW,sH,dW,dH){
	return {
		x:(sW/dW)*x,
		y:(sH/dH)*y
	}
}
function inside(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var x = point[0], y = point[1];
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

function getMousePos(el, evt) {
	var rect = el.getBoundingClientRect();
	return {
	  x: evt.clientX - rect.left,
	  y: evt.clientY - rect.top
	};
}