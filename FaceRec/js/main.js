var threshold = 0.30;
let minFaceSize = 200
let minConfidence = 0.9
let forwardTimes = []
var isDetecting = true;
let maxDistance = 0.5
var numTrain  = 0;
function DoCheck(val){
  var data=JSON.stringify({Inputs:{input1:{ColumnNames:["Col1","Col2","Col3","Col4","Col5","Col6","Col7","Col8","Col9","Col10","Col11","Col12","Col13","Col14","Col15","Col16","Col17","Col18","Col19","Col20","Col21","Col22","Col23","Col24","Col25","Col26","Col27","Col28","Col29","Col30","Col31","Col32","Col33","Col34","Col35","Col36","Col37","Col38","Col39","Col40","Col41","Col42","Col43","Col44","Col45","Col46","Col47","Col48","Col49","Col50","Col51","Col52","Col53","Col54","Col55","Col56","Col57","Col58","Col59","Col60","Col61","Col62","Col63","Col64","Col65","Col66","Col67","Col68","Col69","Col70","Col71","Col72","Col73","Col74","Col75","Col76","Col77","Col78","Col79","Col80","Col81","Col82","Col83","Col84","Col85","Col86","Col87","Col88","Col89","Col90","Col91","Col92","Col93","Col94","Col95","Col96","Col97","Col98","Col99","Col100","Col101","Col102","Col103","Col104","Col105","Col106","Col107","Col108","Col109","Col110","Col111","Col112","Col113","Col114","Col115","Col116","Col117","Col118","Col119","Col120","Col121","Col122","Col123","Col124","Col125","Col126","Col127","Col128","Col129"],Values:[val]}},GlobalParameters:{}});
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      console.log(this.responseText);
      var data = JSON.parse(this.responseText);
      data = {data:data.Results.output1.value.Values};
      var username = [];
      for (var i = 0; i < data.data.length; i++) {
          username.push(Math.max(...data.data[i].slice(129).slice(0, -1)) >= threshold ? data.data[i][data.data[i].length - 1] : "unknown");
      }
      $("#detectedUserName").html('<span>' + username.toString() + '</span>');
      isDetecting = true;
    }
  });
  xhr.open("POST", "https://ussouthcentral.services.azureml.net/workspaces/c9f81b99a5dd40b9b180ec6486109276/services/f5119e78fe884ef3b439b3fd2129e982/execute?api-version=2.0");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", "Bearer grRfIc1bDsuNsMWQyH4Z8KEjsMK0bg/PdmXIfXkpjTDmOntFEFllxJ7TO3z9ZQo/YJ8JYrSxXAl/RguPMBBW7w==");
  xhr.setRequestHeader("Cache-Control", "no-cache");
  xhr.send(data);
}


async function InitFaceModel(){
  await faceapi.loadFaceRecognitionModel('mlmodels/')
  // var img = $('#currentface').get(0);
  // var descriptor = await faceapi.computeFaceDescriptor(img)
  // var face_encodings =  Array.prototype.slice.call(descriptor);
  // face_encodings.push("id0");
  // DoCheck(face_encodings);
}

async function onPlay(videoEl) {
      if(videoEl.paused || videoEl.ended || !modelLoaded || !state)
        return false
        
        const { width, height } = faceapi.getMediaDimensions(videoEl)
        const canvas = $('#overlay').get(0)
          if(canvas.width !=width){
            canvas.width = width;
            canvas.height = height;
          }
          
       


        const mtcnnParams = {
          minFaceSize
        }

        //const { results, stats } = await faceapi.nets.mtcnn.forwardWithStats(videoEl, mtcnnParams)
       //updateTimeStats(stats.total)
        var results = true;
        var isFaceFound = true;
        const context = canvas.getContext('2d');

      if(state=='recog'){
        if (results) {
          // results.forEach(({ faceDetection, faceLandmarks }) => {
          //   if (faceDetection.score < minConfidence) {
          //     return
          //   }
          //   faceapi.drawDetection('overlay', faceDetection.forSize(width, height))
          //   //faceapi.drawLandmarks('overlay', faceLandmarks.forSize(width, height), { lineWidth: 4, color: 'red' })
          //   isFaceFound = true;
          // });
          if(isFaceFound && isDetecting){
              //isDetecting = false;
              const fullFaceDescriptions = (await faceapi.allFacesMtcnn(videoEl, mtcnnParams)).map(fd => fd.forSize(width, height));
              // var descriptor = await faceapi.computeFaceDescriptor(videoEl);
              // var face_encodings =  Array.prototype.slice.call(descriptor);
              // try{
              //   const bestMatch = getBestMatch(trainDescriptorsByClass, face_encodings)
              //   console.log(bestMatch)
              //   if(bestMatch.distance>0.4){
              //     $("#detectedUserName").html('<span>' + bestMatch.className + '</span>');
              //   }
              // }catch(ex){
              //   console.log(ex)
              //   $("#detectedUserName").empty();
              // }
              try{
                  if(fullFaceDescriptions.length==0){
                    context.clearRect(0, 0, canvas.width, canvas.height);
                  }
                  fullFaceDescriptions.forEach(({ detection, landmarks, descriptor }) => {
                  if(detection.score > minConfidence){
                     
                      context.clearRect(0, 0, canvas.width, canvas.height);
                      const { x, y, height: boxHeight ,width: boxWidth } = detection.getBox()
                      var isspoof = IsSpoof(x, y, boxWidth, boxHeight)
                      var boxColor = isspoof?'green':'red';
                      faceapi.drawDetection('overlay', [detection], { boxColor : boxColor, lineWidth:4, withScore: false })
                      //faceapi.drawLandmarks('overlay', landmarks.forSize(width, height), { lineWidth: 4, color: 'red' })
                      const bestMatch = getBestMatch(trainDescriptorsByClass, descriptor)
                      console.log(bestMatch)
                      const text = `${bestMatch.distance < maxDistance ? bestMatch.className : 'unkown'} (${1-bestMatch.distance})`

                      // var context = canvas.getContext('2d');  
                      // context.strokeStyle = '#fff';
                      // context.fillStyle = "#fff";
                      // context.font = 'bold 14px Arial';
                      // context.lineWidth = 4; 
                      // context.fillText(text, x+(boxWidth/2),y + boxHeight+5);
                      faceapi.drawText(
                       context,
                        x,
                        y + boxHeight,
                        text,
                        Object.assign(faceapi.getDefaultDrawOptions(), {textColor: 'white', fontSize: 34 })
                      );
                  }

                });
              }catch(ex){
                  console.log(ex);
              }

              // var face_encodings =  Array.prototype.slice.call(descriptor);
              // face_encodings.push("id0");
              // DoCheck(face_encodings);
          }else{
            $("#detectedUserName").empty();
          }

        }else{
          $("#detectedUserName").empty();
        }
          setTimeout(() => onPlay(videoEl));
        }
      
      if(state=='train'){
        const fullFaceDescriptions = (await faceapi.allFacesMtcnn(videoEl, mtcnnParams)).map(fd => fd.forSize(width, height));
        var descriptors = null;
        if(fullFaceDescriptions.length==0){
          onPlay(videoEl);
          return;
        }else{
          fullFaceDescriptions.forEach(({ detection, landmarks, descriptor }) => {
            if(detection.score > minConfidence){
               descriptors = descriptor;
              context.clearRect(0, 0, canvas.width, canvas.height);
               faceapi.drawDetection('overlay', [detection], { withScore: false });
               const { x, y, height: boxHeight ,width: boxWidth } = detection.getBox()
               faceapi.drawText(
                 context,
                  x,
                  y,
                  String(numTrain),
                  Object.assign(faceapi.getDefaultDrawOptions(), { textColor: 'white', fontSize: 34 })
                );
               return;
            }
          });
         if(!descriptors){
            onPlay(videoEl);
            return;
         }else{
            var face_encodings =  Array.prototype.slice.call(descriptors);
            if(!localStorage.getItem('ModelData')){
              localStorage.setItem("ModelData",JSON.stringify([{"name":$.trim($('#inputname').val()),"encodings":[face_encodings]}]));
              LoadDescriptors();
            }else{
               var oldModels = JSON.parse(localStorage.getItem("ModelData"));
               oldModels.push({"name":$.trim($('#inputname').val()),"encodings":[face_encodings]})
               localStorage.setItem("ModelData",JSON.stringify(oldModels))
               LoadDescriptors();
            }
            numTrain++;
            if(numTrain>=5){
                  console.log('training done');
                  alert('training done')
                  state = 'recog';
                  onPlay(videoEl);
                  return;
            }else{
                  onPlay(videoEl);
                  return;
            }

         }
        }
        
      }
}

function IsSpoof(x, y, w, h) {
    const vid = $('#inputVideo').get(0)
    var canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(vid, 0, 0, vid.videoWidth, vid.videoHeight);
    var imageData = ctx.getImageData(x, y, w, h);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        // red
        data[i] = (255 - brightness) > 159 ? 255 : 0;
        // green
        data[i + 1] = (255 - brightness) > 159 ? 255 : 0;
        // blue
        data[i + 2] = (255 - brightness) > 159 ? 255 : 0;
    }
    var isspoof = average(imageData.data);
  //   if(document.getElementById("canvasinvert")){
  //       var canvas = document.getElementById("canvasinvert");

  //     }else{
  //         var canvas = document.createElement("canvas");
  //         canvas.id= "canvasinvert";
  //         document.body.appendChild(canvas);
  //     }
  // canvas.width = w
  // canvas.height = h;
  // var ctx = canvas.getContext("2d");
  // ctx.clearRect(0, 0, w, h);
  // ctx.putImageData(imageData, 0, 0);
    return isspoof;
}
var avg_colorThreshold = 160;
function average(elmt) {
    var sum = 0;
    for (var i = 0; i < elmt.length; i++) {
        sum += parseInt(elmt[i], 10);
    }
    var avg_color = sum / elmt.length;
    var real = false;
    console.log(avg_color)
    if (avg_color > (avg_colorThreshold||160)) {
        isFake = "Real " + String(parseInt((avg_color / 255) * 100, 10)) + "%";
        real = true;
    }
    else
        isFake = "Fake " + String(100 - parseInt((avg_color / 255) * 100), 10) + "%";
    //document.getElementById('isfake').innerHTML = isFake;
    return real
}
async function run() {
  //await faceapi.loadMtcnnModel('/')
  await faceapi.loadMtcnnModel('mlmodels/')
  await faceapi.loadFaceRecognitionModel('mlmodels/')
  modelLoaded = true
  const videoEl = $('#inputVideo').get(0)
  const canvas = $('#overlay').get(0)
  canvas.width = 480;
  canvas.height = 640;
       
 
}
var FrontCam = 0;
function LoadMedia(id){
   const videoEl = $('#inputVideo').get(0);
   app.checkPermissions();
   if (window.stream) {
      window.stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }
      navigator.getUserMedia(
        { video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 } ,
          deviceId: {exact: Camdevices[FrontCam].value} 
        } 
        },
        stream =>  window.stream = videoEl.srcObject = stream,
        err => console.error(err)
      )
   

}
var Camdevices = [];
var Audiodevices = [];
function gotDevices(deviceInfos) {
  console.log(deviceInfos);
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
  .then(gotDevices).then(function(e){
    console.log(e);
  }).catch(function(e){
    console.log(e);
    alert("No webcam detected.");
  });
}
function LoadDescriptors(){
  if(!localStorage.getItem('ModelData')){
      alert('no trained model available');
      return;
  }
  var oldModels = JSON.parse(localStorage.getItem("ModelData"));
  for(var i=0;i<oldModels.length;i++){
    trainDescriptorsByClass.push({

         descriptors : oldModels[i].encodings,
        className : oldModels[i].name
        }
      );


  }
}
var state = '';
var descriptors = [];
var className = []
var trainDescriptorsByClass = [];
$(document).ready(function() {
LoadDescriptors();
$("#train").click(function(e){
  LoadMedia();
  $("#inputnamecontainer").show()
});
$("#submitfortrain").click(function(){
  if(!$.trim($('#inputname').val())){
    alert('please enter name');
  }
  $("#videocontainer").show();
  state = 'train';
})
$("#detect").click(function(e){
  LoadMedia();
  state = 'recog';
  $("#videocontainer").show()
});
run();
InitCams();
$("#camselect").click(function(){
  $("#camselect").toggleClass("","")
   FrontCam = FrontCam==0?Math.min(Camdevices.length,1):0;
   LoadMedia();
})
});