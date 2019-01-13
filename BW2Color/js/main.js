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
			var dataURL = c.toDataURL('image/jpeg', 0.5);
        	var rawimg = dataURL.split(',')[1];
        	ProcessImage2(rawimg);
			$("#imgCover").animate({ height: "0px" },10000);
			window.setTimeout(function(){
				$("#imgCover").hide();
			},10000);

		 }
		// ProcessImage(file);
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
	  "url": "https://hemantmeena.net/bw2colorupload",
	  "method": "POST",
	  "processData": false,
	  "contentType": false,
	  "data": form,
	  "timeout": 300000
	}
	$.ajax(settings).done(function (response) {
		$('#status').text('getting image...');
	  	//console.log(response);
	  	if(response!=""){
	  		// 		var input = response.output;
			// Algorithmia.client("simpnbh+HmxRiE+xS83sj3NrFlV1")
			//     .algo("util/Data2Base64/0.1.0")
			//     .pipe(input)
			//     .then(function(output) {
			//     	$('#status').text('');
			//         console.log(output);
			//         $("#imgResult").html("<img style='width:100%' src='data:image/png;base64,"+output.result+"'></img>");
			//     });
			 $("#imgResult").html("<img style='width:100%' src='data:image/png;base64,"+response.replace(/\n+/gi,'') +"'></img>");
			 $('#status').text('');
	  	}
	});
}

function ProcessImage2(rawimg){
	$('#status').text('processing');
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": "https://hemiam.pythonanywhere.com/bw2color",
	  "method": "POST",
	  "processData": false,
	  "headers": {
        	"Content-Type": "application/json",
        },
       "processData": false,
       "data": JSON.stringify({
            rawimg: rawimg
       }),
	  "timeout": 300000
	}
	$.ajax(settings).done(function (response) {
		$('#status').text('getting image...');
	  	//console.log(response);
	  	if(response.status){	  		
			 $("#imgResult").html("<img style='width:100%' src='data:image/png;base64,"+response.data +"'></img>");
			 $('#status').text('');
	  	}
	});
}
