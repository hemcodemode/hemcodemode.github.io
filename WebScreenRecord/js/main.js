$(document).ready(function(){

	$("#startRecord").click(startRecord);
	$("#startRecordSection").click(function(){
		$("#recordSection").show();
		$("#main").hide();
		$("#startRecord").click();
	})
	$("#download").click(function(){
		RecorderObj.download();
	})


});
var isRecording = false;
var ActiveStream = null;
var RecorderObj = null;
var ismobile = false;
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
   ismobile = true;
}
function startRecord(){
	$("#videoPreview").show();
	$('#recordedVideo').remove();
	if(isRecording){
		$("#startRecord").text('Start');
		$("#download").removeClass('d-none');
		isRecording = false;
		RecorderObj.stopRecording();
		return false;
	}
	if(ismobile){
	    return StartScreenShareMobile();
	}
	$("#download").addClass('d-none');
	if('mediaDevices' in window.navigator && 'getDisplayMedia' in window.navigator.mediaDevices){
      	navigator.mediaDevices.getDisplayMedia({video: true}).then(function(stream){
      		isRecording = true;
      		if($("#startRecord").text()=='Start'){
				$("#startRecord").text('Stop')
			}else{
				$("#startRecord").text('Start')
			}
	        stream.onended = function() {
	            for(var i=0;i< stream.getTracks().length;i++){
	                stream.getTracks()[i].stop()
	            }
	            ActiveStream = null;
	            $("#startRecord").text('Start');
				$("#download").removeClass('d-none');
				isRecording = false;
				RecorderObj.play();

	        };
	        ActiveStream = stream;
	        $("#videoPreview").get(0).srcObject = stream;
	        stream.getVideoTracks()[0].onended = stream.onended;
	        RecorderObj = Recorder(stream);
	        RecorderObj.startRecording();
	        function isMediaStreamActive() {
	            if ('active' in stream) {
	                if (!stream.active) {
	                    return false;
	                }
	            } else if ('ended' in stream) { // old hack
	                if (stream.ended) {
	                    return false;
	                }
	            }
	            return true;
	        }

	        // this method checks if media stream is stopped
	        // or any track is ended.
	        (function looper() {
	            if (isMediaStreamActive() === false) {
	                stream.onended();
	                return;
	            }

	            setTimeout(looper, 1000); // check every second
	        })();
      })
      .catch(function(e){
        if(e.name == "NotAllowedError"){
            alert('user denied permission');
            return; 
        }
      });
  }
}

function StartScreenShareMobile(){
  const constraints = {
      audio: false, // mandatory.
      video: {
       mandatory: {
          chromeMediaSource:'screen',
            maxWidth: 1024,
            maxHeight: 768,
            minWidth:800,
            minHeight:400,
            minFrameRate: 1,
            maxFrameRate: 2,
        },
        optional: []
      }
  };

  const successCallback = function(stream){
      function StopScreenShare(){
          stream.getAudioTracks().forEach(function(track) {
                      track.stop();
          });

          stream.getVideoTracks().forEach(function(track) {
              track.stop();
          });
      }
      isRecording = true;
  		if($("#startRecord").text()=='Start'){
			$("#startRecord").text('Stop')
		}else{
			$("#startRecord").text('Start')
		}
        stream.onended = function() {
            for(var i=0;i< stream.getTracks().length;i++){
                stream.getTracks()[i].stop()
            }
            ActiveStream = null;
            $("#startRecord").text('Start');
			$("#download").removeClass('d-none');
			isRecording = false;
			RecorderObj.play();

        };
        ActiveStream = stream;
        $("#videoPreview").get(0).srcObject = stream;
        stream.getVideoTracks()[0].onended = stream.onended;
        RecorderObj = Recorder(stream);
        RecorderObj.startRecording();
  };

  const errorCallback = function(error){
    window.prompt('Please give access to screen capture and enable this experimental flag by opening given link in new tab','chrome://flags/#enable-usermedia-screen-capturing flags')
  };
  navigator.getUserMedia(constraints, successCallback, errorCallback);
}

function Recorder(stream){
	this.mediaRecorder;
	window.recordedBlobs = [];
	//this.recordedVideo =  $("#videoPreview").get(0);
	this.handleDataAvailable = function(event) {
		if (event.data && event.data.size > 0) {
			window.recordedBlobs.push(event.data);
		}
	}
	this.startRecording=function() {
	  window.recordedBlobs = [];
	  var options = {mimeType: 'video/webm;codecs=vp9'};
	  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
	    console.log(options.mimeType + ' is not Supported');
	    options = {mimeType: 'video/webm;codecs=vp8'};
	    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
	      console.log(options.mimeType + ' is not Supported');
	      options = {mimeType: 'video/webm'};
	      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
	        console.log(options.mimeType + ' is not Supported');
	        options = {mimeType: ''};
	      }
	    }
	  }
	  try {
	    this.mediaRecorder = new MediaRecorder(stream, options);
	  } catch (e) {
	    console.error('Exception while creating MediaRecorder: ' + e);
	    alert('Exception while creating MediaRecorder: '
	      + e + '. mimeType: ' + options.mimeType);
	    return;
	  }
	  console.log('Created MediaRecorder', this.mediaRecorder, 'with options', options);
	  //recordButton.textContent = 'Stop Recording';
	  //playButton.disabled = true;
	  //downloadButton.disabled = true;
	  this.mediaRecorder.onstop = this.handleStop;
	  this.mediaRecorder.ondataavailable = this.handleDataAvailable;
	  this.mediaRecorder.start(1000); // collect 10ms of data
	  console.log('MediaRecorder started',this.mediaRecorder);
	}

	this.stopRecording = function() {
	  this.mediaRecorder.stop();
	  console.log('Recorded Blobs: ', window.recordedBlobs);
	  for(var i=0;i< ActiveStream.getTracks().length;i++){
            ActiveStream.getTracks()[i].stop()
      }
	}

	this.play = function() {
		if(this.recordedVideo){
			var superBuffer = new Blob(window.recordedBlobs, {type: 'video/webm'});
	  		this.recordedVideo.src = window.URL.createObjectURL(superBuffer);
	  		this.recordedVideo.controls = true;
	  		this.recordedVideo.setAttribute('autoplay','');
		}else{
			var superBuffer = new Blob(window.recordedBlobs, {type: 'video/webm'});
			var recordedVideo = document.createElement('video');
			recordedVideo.id = 'recordedVideo';
	  		recordedVideo.src = window.URL.createObjectURL(superBuffer);
	  		recordedVideo.controls = true;
	  		recordedVideo.height = '300';
	  		recordedVideo.width = '100%';
	  		recordedVideo.classList.add('border');
	  		recordedVideo.setAttribute('autoplay','');
	  		$("#videoPreview").parent().append(recordedVideo);
	  		$("#videoPreview").hide();
		}
	}

	this.download =function() {
	  var blob = new Blob(window.recordedBlobs, {type: 'video/webm'});
	  var url = window.URL.createObjectURL(blob);
	  var a = document.createElement('a');
	  a.style.display = 'none';
	  a.href = url;
	  a.download = 'test.webm';
	  document.body.appendChild(a);
	  a.click();
	  // setTimeout(function() {
	  //   document.body.removeChild(a);
	  //   window.URL.revokeObjectURL(url);
	  // }, 100);
	}
	return this;
}