// custom code 

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function ScriptReplacer(){
	if(document.querySelectorAll('#ScriptReplacer').length==0){
		var xhttp = new XMLHttpRequest();
	 	xhttp.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200) {     
		      	var testtext2 = this.responseText;
				testtext2 = testtext2.replace(/\(e\.userId\)/gi,function(m){return m.replace(")","")+"||true)"});
				testtext2 = testtext2.replace(/n\["x-hid"\]/gi,function(m){return "p.hid='sfeffff',"+m+"='sfeffff',var ss="});
				var el = document.createElement('script');
				el.id = 'ScriptReplacer';
				el.innerText = testtext2;
				(document.head||document.documentElement).appendChild(el);
		    }
		};
		xhttp.open("GET", document.querySelectorAll('script[src*="vendor"]')[0].src, false);
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