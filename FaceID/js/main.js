navigator.getUserMedia = navigator.getUserMedia ||navigator.webkitGetUserMedia ||(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ?function(c, os, oe) {navigator.mediaDevices.getUserMedia(c).then(os,oe);} : null ||avigator.msGetUserMedia;
window.URL = window.URL ||window.webkitURL ||window.msURL ||window.mozURL;

var vid,vidReady = false;
var autodetect = false;
var threshold = 0.80;
var detecting = false
function InitCamera(){
    if (navigator.getUserMedia) {
         var videoSelector = {video : {width: 400, height: 300}};
         navigator.getUserMedia(videoSelector, umSuccess, function() {
             alert("Error fetching video from webcam");
         });
     } else {
         alert("No webcam detected.");
     }
}

var FrontCam = 0;
function StartCam(){
  if (window.stream) {
      window.stream.getTracks().forEach(function(track) {
        track.stop();
      });
  }
  if (navigator.getUserMedia) {
         var videoSelector = {video : {
          width: 400, 
          height: 300,
          deviceId: {exact: Camdevices[FrontCam].value}
        }};
         navigator.getUserMedia(videoSelector, umSuccess, function() {
             alert("Error fetching video from webcam");
         });
     } else {
         alert("No webcam detected.");
     }
}
var Camdevices = [];
var Audiodevices = [];
function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = {};
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label ||
        'microphone ' + (Audiodevices.length + 1);
      Audiodevices.push(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'cam' +
        (Camdevices.length + 1);
      Camdevices.push(option);
    } else {
      console.log('Found one other kind of source/device: ', deviceInfo);
    }
  }
}    

function InitCams(){
  navigator.mediaDevices.enumerateDevices()
  .then(gotDevices).then(StartCam).catch(function(e){
    console.log(e);
    alert("No webcam detected.");
  });
}

function umSuccess(stream) {
    if (vid.mozCaptureStream) {
        vid.mozSrcObject = stream;
    } else {
        vid.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }
    window.stream = stream;
    vid.play();
    vidReady = true;
    //detecting = true;
    //Capture();
    TrackFaceInit();
}

$(document).ready(function(){
    vid = $('#main_video').get(0);
    vidReady = false;
    //InitCamera();
    InitCams();
    $("#lock").click(function(){
        $("#faceid").show();
        $("#main").hide();
        detecting = false;
    });
    $("#camselect").click(function(){
        $("#camselect").toggleClass("","")
       FrontCam = FrontCam==0?1:0;
       StartCam();
    })

})



function TrackFaceInit() {
    var video = document.getElementById('main_video');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');     
    var tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);
    tracking.track('#main_video', tracker);
    tracker.on('track', function(event) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        event.data.forEach(function(rect) {   
            context.strokeStyle = '#f00';
            //context.strokeRect(canvas.width-rect.width-rect.x, rect.y, rect.width, rect.height);
            // console.log(rect.x, rect.y);
            context.font = '14px Helvetica';
            context.fillStyle = "#fff";
            context.lineWidth = 4;   
            if(!detecting){
                
                //context.fillText(ii<username.length?username[ii]:"", canvas.width-rect.width-rect.x + (rect.width/2)-20 , rect.y+rect.height+15);
                detecting = true;
                Capture(-rect.x, -rect.y, rect.width, rect.height);
            }         
            });
    });
};

function Capture(x,y,w,h){
    var canvas = document.createElement('canvas');
    canvas.width = vid.width;
    canvas.height = vid.height;
    var cc = canvas.getContext('2d');
    cc.drawImage(vid, 0, 0);
    var dataURL = canvas.toDataURL('image/jpeg', 0.3)
    GetFace(dataURL.split(',')[1]);
}




function GetFace(rawimg,callback){
  if(!autodetect){
      Loader('show');
  }
  var data = JSON.stringify({
    "rawimg": rawimg,
    "uid": "1"
  });
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            Loader('hide');
            console.log(this.responseText);
            var data = JSON.parse(JSON.parse(this.responseText))
            document.getElementById('personName').innerHTML = "Welcome back ";
            username = []
            if(data.data.length==0){
               document.getElementById('personName').innerHTML = "Please try again.";
               detecting = false;
            }else{
              for(var i=0;i<data.data.length;i++){
                if(i>0){
                  document.getElementById('personName').innerHTML += ', ';
                }
                if(Math.max(...data.data[i].slice(129).slice(0,-1))<threshold){
                    $("#faceid").show();
                    $("#main").hide();
                    detecting = false;
                }else{
                    $("#faceid").hide();
                    $("#main").show();
                    document.getElementById('personName').innerHTML += Math.max(...data.data[i].slice(129).slice(0,-1))>=threshold?data.data[i][data.data[i].length-1]:"not detected";
                    username.push(Math.max(...data.data[i].slice(129).slice(0,-1))>=threshold?data.data[i][data.data[i].length-1]:"unknown");
                    console.log(Math.max(...data.data[i].slice(129).slice(0,-1)));
                }

              }
            }
            
            //detecting = false;
            if(callback){
              callback();
            }
        }
    });
    xhr.open("POST", "https://dev.zinghr.com/Recruitment/Route/ModelAPI/GetFaceMatch");
    xhr.setRequestHeader("content-type", "application/json");
    // xhr.setRequestHeader("cache-control", "no-cache");
    xhr.send(data);
}


function Loader(state,val) {
        if (state.toLowerCase() == 'show') {
            document.getElementById('LoadingArea').style.display = "block";
            document.getElementById('loaderSpin').style.display = "block";
            document.getElementById('loaderText').innerHTML="";
            document.getElementById('loaderText').style.display = "block";
        } else if (state.toLowerCase() == 'hide') {
            document.getElementById('LoadingArea').style.display = "none";
            document.getElementById('loaderSpin').style.display = "none";
            document.getElementById('loaderText').innerHTML="";
            document.getElementById('loaderText').style.display = "none";
        } else if (state.toLowerCase() == 'update') {
           document.getElementById('loaderText').innerHTML=val;
        } else if (state.toLowerCase() == 'progress') {
           try{
                document.getElementById('loaderText').innerHTML=parseInt(document.getElementById('loaderText').innerHTML)+parseInt(val||1);
           }catch(ex){
                console.log(ex)
           }
        } else if (state.toLowerCase() == 'finish') {
           document.getElementById('loaderText').innerHTML=val||100;
        }
        
        try{
            //document.getElementById('loaderText').innerHTML=parseInt(document.getElementById('loaderText').innerHTML)+parseInt(val||1);
            if(parseInt(document.getElementById('loaderText').innerHTML)>=0 && parseInt(document.getElementById('loaderText').innerHTML)<=9){
                     document.getElementById('loaderText').style.margin="-47px 0 0px -35px";
            }else if(parseInt(document.getElementById('loaderText').innerHTML)>=10 && parseInt(document.getElementById('loaderText').innerHTML)<=99){
                    document.getElementById('loaderText').style.margin="-47px 0 0px -45px";
            }else if(parseInt(document.getElementById('loaderText').innerHTML)>99){
                    document.getElementById('loaderText').style.margin="-47px 0 0px -53px";
            }
           }catch(ex){
                console.log(ex)
           }

    }