var SpeechClass = {
    config:{
        continuous : true,
        interimResults : true,
        lang: "en-US"
    },
    init: function (config) {
        var _this = this;
        _this.final_text= "";
        _this.interim_text= "";
        _this.textExtracted= "";
        _this.final_transcript="";
        _this.recognition="";
        var transcriptText = "";
        var recognition = new webkitSpeechRecognition();
        if (config = null) {
            _this.config = config;
        }
        recognition.continuous = _this.config.continuous;
        recognition.interimResults = _this.config.interimResults;
        recognition.lang = _this.config.lang;
        recognition.onstart = function () {
            _this.recognizing = true;
            _this.ignore_onend = true;
        };
        recognition.onerror = function (event) {
            console.log("some error ouccured");
            console.log(event)
            recognition.stop();
            try {
                recognition.start();
            } catch (ex) {
                console.log(ex)
            }
            if (event.error == 'no-speech') {
                _this.ignore_onend = true;
            }
            else if (event.error == 'audio-capture') {
                _this.ignore_onend = true;
            }
            else if (event.error == 'not-allowed') {
                _this.ignore_onend = true;
            }
            else {
                _this.ignore_onend = false;
            }
        };
        recognition.onend = function () {
            _this.recognizing = false;
            console.log("ended")
            recognition.stop();
            if (!_this.ignore_onend) {
                try {
                    recognition.start();
                } catch (ex) {
                    console.log(ex)
                }
            }
            
        };
        recognition.onresult = function (event) {
            var interim_transcript = ' ';
            if (typeof (event.results) == 'undefined') {
                recognition.onend = null;
                recognition.stop();
                return;
            }
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    _this.final_transcript += " "+ event.results[i][0].transcript;
                } else {
                    interim_transcript +=  " "+ event.results[i][0].transcript;
                }
            }
            _this.final_text = _this.final_transcript;
            _this.interim_text = interim_transcript;
            _this.textExtracted = _this.final_transcript +" "+ interim_transcript;
            _this.transcript.set(_this.textExtracted);
            transcriptText = _this.textExtracted
        }
        _this.recognition = recognition;
        _this.getTranscript = (function () {
            return transcriptText;
        })();
        return _this;
    },
    transcript:(function(){
        var transcripttext = " ";
        return {
            set: function (a) {
                transcripttext = a;
            },
            get: function () {
                return transcripttext;
            }
        }
    })(),
    recognizing: false,
    ignore_onend: false,
    inbetween_text : "",
    final_text: "",
    interim_text: "",
    textExtracted: "",
    final_transcript: "",
    recognition: "",
    stop: function () {
         var _this = this;
        _this.recognizing = false;
        _this.ignore_onend = false;
        _this.recognition.stop();
    },
    start: function () {
         var _this = this;
        _this.recognizing = true;
        _this.recognition.start();
    }
}


