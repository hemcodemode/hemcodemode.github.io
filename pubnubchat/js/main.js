var botui = new BotUI('my-botui-app');

function SendMsg(){
	if($('#msginput').val().trim()=="")
		return false;
	var msg = $('#msginput').val().trim();
	$('#msginput').val("");
	var input = $('#msginput');
	var msgUUID = MsgUUID();
	pendingMsgs.push(msgUUID);
	pubnub.publish({
      channel : room,
      message : {
      	name:username,
      	msg:msg,
      	type:'text',
      	msgUUID:msgUUID
      },
      x : (input.value='')
    },function(status, response) {
      console.log(status, response);
    });
}
var pendingMsgs = [];

function MsgUUID(){
	var RandomKey = username+"_"+(Math.random() + ' ').substring(2, 10) + (Math.random() + ' ').substring(2, 10)+"_"+(new Date).getTime();
	return btoa(RandomKey);
}

function safe_text(text) {
        return (''+text).replace( /[<>]/g, '' );
}
function InitPubNub(room){
      pubnub = new PubNub({ publishKey : 'pub-c-727b948f-ebc8-474a-a470-091e781b3300', subscribeKey : 'sub-c-35051a54-6200-11e9-87e8-f2af15a79e05' });
      //function $(id) { return document.getElementById(id); }
      //var box = $('box'), input = $('input'), 
      channel = room;
      pubnub.addListener({
      status: function(statusEvent) {
          if (statusEvent.category === "PNConnectedCategory") {
              console.log("statusEvent",statusEvent)
          }
      },
      presence: function(presenceEvent) {
          console.log("presenceEvent",presenceEvent)
      },
      message: function(obj) {
          console.log(obj);
          //box.innerHTML = "<b>"+obj.message.name+"</b>: "+ (''+obj.message.msg).replace( /[<>]/g, '' ) + '<br>' + box.innerHTML
          if(pendingMsgs.indexOf(obj.message.msgUUID)!=-1){
          	botui.message.add({
			  human: true,
			  content: safe_text(obj.message.msg)
			});
			pendingMsgs.splice(pendingMsgs.indexOf(obj.message.msgUUID),1);
          }else{
          	botui.message.add({
			  content: safe_text(obj.message.msg)
			});
          }
          
      }});
      pubnub.subscribe({channels:[channel]});
     
};

var username = "";
var room = "";
$(document).ready(function(){
	room  = window.location.hash.split("#");
	if(room.length==1){
		var input  = prompt('enter room name');
		if(input){
			input = input.trim();
			window.location.hash = input.trim();
			room = input;
		}else{
			return false;
		}
	}else{
		room = room[1];
	}

	if(getCookieNew("username")==undefined){
		var input  = prompt('enter user name');
		if(input){
			username = input.trim();
			setCookie("username",username);
		}else{
			return false;
		}
	}

	InitPubNub(room);
	$('#msginput').keypress(function (e) {
	  if (e.which == 13) {
	   	SendMsg();
	    return false;
	  }
	});
	$('#sendbtn').click(function (e) {
	   	SendMsg();
	});
});


function getCookieNew(Name) {
            var search = Name + "=";
            var splitArray = document.cookie.split("BNES_" + search);
            var offset;
            var tempCookies;

            if (splitArray.length > 0 && splitArray[0].indexOf(search) != -1) {
                offset = splitArray[0].indexOf(search);
                tempCookies = splitArray[0];
            }
            else if (splitArray.length > 1 && splitArray[1].indexOf(search) != -1) {
                offset = splitArray[1].indexOf(search);
                tempCookies = splitArray[1];
            }
            else {
                offset = document.cookie.indexOf(search)
                tempCookies = document.cookie;
            }

            if (tempCookies.length > 0) { // if there are any cookies
                if (offset != -1) { // if cookie exists
                    offset += search.length
                    var end = tempCookies.indexOf(";", offset)
                    if (end == -1) end = tempCookies.length
                    return unescape(tempCookies.substring(offset, end))
                }
            }
      }

function setCookie(name, value, date, path, theDomain, secure) {
    Site_theCookie = name + "=" + value +
   ((date) ? "; expires=" + date.toGMTString() : "") +
   ((path) ? "; path=" + path : "") +
   ((theDomain) ? "; domain=" + theDomain : "") +
   ((secure) ? "; secure" : "");
    document.cookie = Site_theCookie;
}