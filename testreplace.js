// custom code 

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
//renderProfile
//setCookie('userMemberCoockieObj','{"userMemberState":"SR"}',365);
setCookie('userMemberCoockieObj','{"userMemberState":"SR","loginMethod":"EMAIL"}',365)
function ScriptReplacer(){
	if(document.querySelectorAll('#ScriptReplacer').length==0){
		var xhttp = new XMLHttpRequest();
	 	xhttp.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200) {     
		      	var testtext2 = this.responseText;
				testtext2 = testtext2.replace(/\(.\.userId\)/gi,function(m){return m.replace(")","")+"||true)"});
				testtext2 = testtext2.replace(/.\["x-hid"\]/gi,function(m){return "p.hid='sfeffff',"+m+"='sfeffff',p.hid="});
				testtext2 = testtext2.replace(/checkAggreGatedContentRightsResponse=function\((.)\){/gi,function(m,m1){console.log(m,m1);return m+m1+".httpStatus = 200;"+m1+".isError = false;"});
				testtext2 = testtext2.replace(/checkConcurrencyResponse=function\((.)\){/gi,function(m,m1){console.log(m,m1);return m+m1+".httpStatus = 200;"+m1+".isError = false;"});

				var el = document.createElement('script');
				el.id = 'ScriptReplacer';
				el.innerText = testtext2;
				(document.head||document.documentElement).appendChild(el);
		    }
		};
		xhttp.open("GET", document.querySelectorAll('script[src*="common-chunk-main"]')[0].src, false);
		xhttp.send(); 
	}
}
ScriptReplacer();

(function(history){
    var pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }
        // ... whatever else you want to do
        // maybe call onhashchange e.handler
        return pushState.apply(history, arguments);
    };
})(window.history);
function CheckForSubscribePage(){
	if(location.href.indexOf('hotstar.com/subscribe')!=-1){
		console.log('subscription page');
		if(getUrlVars()['returnURL']){
			location.assign(decodeURIComponent(getUrlVars()['returnURL'])+(decodeURIComponent(getUrlVars()['returnURL']).endsWith("/")?"watch":"/watch"))
		}
	}
}
function CheckForEpisodeLink(){
	var d = document.querySelectorAll("a[href^='/subscribe'].cover-link, a[href^='/subscribe'].action-container");
	for(var i=0;i<d.length;i++){
		try{
			var newEl = document.createElement('a');
			newEl.innerHTML = d[i].innerHTML;
			newEl.classList =  d[i].classList;
			var episodelink;
			if(document.querySelectorAll(".episode-card  a").length>0){
				episodelink = document.querySelectorAll(".episode-card  a")[0];
			}else{
				episodelink = document.querySelectorAll(".tray-container .card-wrapper")[0];
			}
			newEl.href = episodelink.href;
			d[i].parentNode.replaceChild(newEl, d[i]);
		}catch(ex){

		}
		
	}	
}
window.onpopstate = history.onpushstate = function(e) { 
	console.log('history change',e); 
	window.setTimeout(CheckForSubscribePage,1000);
	window.setTimeout(CheckForEpisodeLink,5000);
}
window.setTimeout(CheckForEpisodeLink,5000);

//https://www.hotstar.com/assets/vendor.62f2f7a3b14a0682a055.js
/*
	fetch("https://api.hotstar.com/o/v1/episode/detail?tao=0&tas=20&contentId=1224110444", {"credentials":"omit","headers":{"hotstarauth":"st=1560802528~exp=1560808528~acl=/*~hmac=d4851a2537f3aee205f62ee18113d40dea0a83d7b07189e4ea40ceafa887a0d2","x-client-code":"LR","x-country-code":"IN","x-platform-code":"PCTV","x-region-code":"undefined"},"referrer":"https://www.hotstar.com/tv/gotham/s-1673/they-did-what/1224110444?bookmarkTime=1302","referrerPolicy":"no-referrer-when-downgrade","body":null,"method":"GET","mode":"cors"}).then(m=>m.json()).then(m=>console.log(m));

*/