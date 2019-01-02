$(document).ready(function(){
	$("input#myfile").on('change',function(e){
		handleFileInputChange();
	});
	$("#imageSrc").click(function(e){
		$("input#myfile").click();
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
		$("#imgContainer").append("<canvas id='canvas'></canvas>");
		$("#status").html('uploading...');
		 $(".uploadedImg").get(0).onload = function(){
		 	$("#imgCover").css("height",$(".uploadedImg").get(0).height);
			$("#imgCover").css("display","inline-block");
			var c = document.getElementById("canvas");
			c.width = $(".uploadedImg").get(0).width;
			c.height = $(".uploadedImg").get(0).height;
			var ctx=c.getContext("2d");
			ctx.drawImage($(".uploadedImg").get(0),0,0,$(".uploadedImg").get(0).width,$(".uploadedImg").get(0).height);
			$("#imgCover").animate({ height: "0px" },10000);
			window.setTimeout(function(){
				$("#imgCover").hide();
			},10000);

		 }
		ProcessImage(file);
	}); 
	reader.readAsDataURL(file);
 }  

function ProcessImage(filedata){
	$('#status').text('processing');
	var form = new FormData();
	form.append("content", filedata,"content");
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": "http://localhost:8080/bw2colorupload",
	  "method": "POST",
	  "processData": false,
	  "contentType": false,
	  "data": form
	}
	$.ajax(settings).done(function (response) {
		$('#status').text('done');
	  	console.log(response);
	  	if(response!=""){
	  		var src= response.replace("data://",'https://algorithmia.com/v1/data/')
	  		$("#imgResult").html("<img src='"+src+"'></img>");
	  	}
	});
}
