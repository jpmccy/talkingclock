/**
 * Created with JetBrains PhpStorm.
 * User: hufman
 * Date: 11/3/12
 * Time: 2:53 PM
 */

var Clock = {
    "sounds":{},
    "voice":null,
    "loadedCount":0,
    "soundsCount":0,
    "alreadyPlayed":false,
    "synced":false,
    "serverDifference":0,       // number of milliseconds to add to the local time to be real

    /** Start the clock going */
    "init": function() {
        Clock.voice = PatFleet;
        Clock.loadSounds();
        Clock.sync();
        Clock.tick();
        Clock.scheduleNextPhrase();
    },
    /** Sync from the server */
    "sync": function() {
        var differences = [];
        var count = 7;

        // read old cookie
        try {
            var cookies = document.cookie.split(';');
            for (var ci = 0; ci < cookies.length; ci++) {
                var cookie = cookies[ci].split('=');
                if (cookie[0].trim() == 'clock_offset')
                    Clock.serverDifference = parseFloat(cookie[1]);
            }
        } catch (e) {
            // ignore parse errors
        }

        var run = function() {
            // set up the ajax call
            var request = null;
            if (window.XMLHttpRequest) {
                request = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                request = new ActiveXObject("Microsoft.XMLHTTP");
            }
            if (request == null) {
                Clock.synced = true;
            }

            // Calculate the server difference
            var startTime = new Date();
            request.onreadystatechange = function() {
                if (request.readyState === 4 && request.status === 200) {
                    var endTime = new Date();           // the current time
                    var reference = (endTime.getTime() - startTime.getTime())/2 + startTime.getTime();    // our local timestamp when the server's time was generated
                    var response = request.responseText;
                    var server = new Date(response);           // the server time
                    if (server.toString() == 'Invalid Date') {
                        response = response.replace(/\..*\+/,"+");
                        server = new Date(response);
                        if (server.toString() == 'Invalid Date') {
                            Clock.loadingProgress('Syncing',1, 1);
                            Clock.synced = true;
                            return;
                        }
                    }
                    var difference = server.getTime() - reference;
                    differences.push(difference);
                    // Either schedule the next run
                    if (differences.length < count) {
                        if (! Clock.synced)
                            Clock.loadingProgress('Syncing',differences.length, count);
                        run();
                    // Or average the differences
                    } else {
                        var sum = 0;
                        var counted = 0;
                        for (var i=2; i<differences.length; i++) {      // Skip the first two as outliers
                            sum += differences[i];
                            counted += 1;
                        }
                        Clock.serverDifference = sum / counted;
                        if (! Clock.synced)
                            Clock.loadingProgress('Syncing',1, 1);
                        Clock.synced = true;

                        // save the offset for future page loads
                        var days = 7;
                        document.cookie = 'clock_offset='+Clock.serverDifference+"; expires="+new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toGMTString() + '; path=/';
                    }
                }
            };
            request.open('GET', 'current_time', true);
            request.send();
        };
        try {
            run();
        } catch (e) {
            // Problem while running AJAX call
        }

        // Schedule for 10 minutes
        setTimeout(Clock.sync, 10*60*1000);
    },
    /** Get the current correct time */
    "getTime": function() {
        var date = new Date();
        date = new Date(date.getTime() + Clock.serverDifference);
        return date;
    },
    /** Update the text clock and schedule the next tick */
    "tick":function() {
        var date = Clock.getTime();
        var ms = date.getTime();
        var difference = 1000 - ms % 1000;
        setTimeout(Clock.tick, difference);

        var longweekdays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];
        var shortweekdays = [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat"
        ];
        var longmonths = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        var shortmonths = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

        var zeropad = function(digits, value) {
            return (new Array(digits + 1 - value.toString().length).join('0')) + value;
        };
        document.getElementById('shortweekday').innerHTML = shortweekdays[date.getDay()];
        document.getElementById('longweekday').innerHTML = longweekdays[date.getDay()];
        document.getElementById('numericweekday').innerHTML = date.getDay()+1;
        document.getElementById('shortmonth').innerHTML = shortmonths[date.getMonth()];
        document.getElementById('longmonth').innerHTML = longmonths[date.getMonth()];
        document.getElementById('numericmonth').innerHTML = date.getMonth()+1;
        document.getElementById('zeronumericmonth').innerHTML = zeropad(2,date.getMonth()+1);
        document.getElementById('numericday').innerHTML = date.getDate();
        document.getElementById('zeronumericday').innerHTML = zeropad(2,date.getDate());
        document.getElementById('year').innerHTML = date.getFullYear();
        document.getElementById('hour12').innerHTML = date.getHours() % 12 == 0 ? 12 : date.getHours() % 12;
        document.getElementById('zerohour12').innerHTML = zeropad(2,date.getHours() % 12 == 0 ? 12 : date.getHours() % 12);
        document.getElementById('hour24').innerHTML = date.getHours();
        document.getElementById('zerohour24').innerHTML = zeropad(2,date.getHours());
        document.getElementById('minute').innerHTML = date.getMinutes();
        document.getElementById('zerominute').innerHTML = zeropad(2,date.getMinutes());
        document.getElementById('second').innerHTML = date.getSeconds();
        document.getElementById('zerosecond').innerHTML = zeropad(2,date.getSeconds());
        document.getElementById('ampm').innerHTML = date.getHours() > 11 ? 'PM': 'AM';
        document.getElementById('timezonenumeric').innerHTML = date.getTimezoneOffset() / 60;

    },
    /** Change the progress indicator */
    "loadingProgress":function(action, current, max) {
        var percent = current / max;
        var output = action+' '+Math.floor(percent * 100) + '%';

        var display = document.getElementById('progress');
        display.innerHTML = output;

        if (current == max) {
            setTimeout(function() {
                display.innerHTML = '';
            }, 333);
        }
    },

    /** Preload the sounds */
    "loadSounds":function () {
        var loadSound = function(filename) {
            var sound = new Audio();
            var extensions = ['ogg', 'mp3', 'wav'];
            var mimes = {"ogg":"audio/ogg", "mp3":"audio/mpeg", "wav":"audio/wav"};
            for (var i=0; i<extensions.length; i++) {
                var extension = extensions[i];
                var mime = mimes[extension];
                var src = document.createElement('source');
                src.src = filename + '.' + extension;
                src.type = mime;
                sound.appendChild(src);
            }
            sound.preload = 'auto';
            sound.setAttribute('preload', 'auto');
            sound.load();
            sound.addEventListener('canplay', function() {
                if (Clock.loadedCount < Clock.soundsCount) {
                    Clock.loadedCount += 1;
                    Clock.loadingProgress('Loaded',Clock.loadedCount, Clock.soundsCount);
                }
            });
            return sound;
        };

        var sounds = this.voice.getSounds();
        Clock.soundsCount = sounds.length + 1;
        for (var i = 0; i < sounds.length; i++) {
            var name = sounds[i];
            this.sounds[name] = loadSound(this.voice.directory + name);
        }
        this.sounds['tone'] = loadSound('sounds/tone');
        Clock.loadingProgress('Loaded',0, Clock.soundsCount);
    },
    /** Play a certain sound */
    "playSound":function (sound) {
        this.sounds[sound].play();
    },
    /** Schedule a sequence to play */
    "scheduleSequence":function (startDate, sequence) {
        var curDate = Clock.getTime();
        var offset = startDate.getTime() - curDate.getTime();
        for (var i = 0; i < sequence.length; i++) {
            var curSound = sequence[i]+"";
            var scheduledFunction = function(sound) {
                return function() {
                    Clock.playSound(sound);
                };
            }(curSound);
            if (offset>0)
                setTimeout(scheduledFunction, offset);
            offset += this.voice.getSoundLength(curSound);
        }
        Clock.alreadyPlayed = true;
    },
    /** Generate and schedule the next phrase */
    "scheduleNextPhrase":function () {
        var curDate = Clock.getTime();
        var nextDate = curDate;
        do {
            nextDate = this.voice.getNextPromptTime(nextDate);
            var phrase = this.voice.getTimePhrase(nextDate);
            var phraselength = this.voice.getPhraseLength(phrase);

            curDate = Clock.getTime();
            var fullDelay = nextDate.getTime() - curDate.getTime();
        } while (Clock.alreadyPlayed && fullDelay - phraselength - 1000 < 0);

        if (this.loadedCount == this.soundsCount) {     // if all the sounds are loaded
            this.scheduleSequence(new Date(nextDate.getTime() - phraselength - 1000), phrase);
            curDate = Clock.getTime();
            fullDelay = nextDate.getTime() - curDate.getTime();
            setTimeout(function () {
                Clock.playSound("tone")
            }, fullDelay);
            setTimeout(function() {
                Clock.scheduleNextPhrase()
            }, fullDelay);
        } else {
            setTimeout(function() {
                Clock.scheduleNextPhrase()
            }, 50);
        }
    }
};

var PatFleet = {
    "directory": "sounds/patfleet/",
    // The durations in milliseconds for each snippet
    "durations": {
        "0":758,
        "1":596,
        "2":516,
        "3":489,
        "4":533,
        "5":720,
        "6":774,
        "7":729,
        "8":587,
        "9":814,
        "10":720,
        "11":720,
        "12":693,
        "13":880,
        "14":827,
        "15":859,
        "16":1058,
        "17":1000,
        "18":839,
        "19":925,
        "20":587,
        "20_":667,
        "30":480,
        "30_":507,
        "40":631,
        "40_":596,
        "50":676,
        "50_":605,
        "60":809,
        "60_":756,
        "and":598,
        "am":749,
        "pm":678,
        "oh":481,
        "oclock":798,
        "seconds":888,
        "at-tone-time-exactly":2680
    },
    /** Get the list of sounds */
    "getSounds": function() {
        return Object.keys(this.durations);
    },
    /** Get the next time that we could say */
    "getNextPromptTime": function(date) {
        var myDate = new Date(date.getTime() + 1000);
        myDate.setMilliseconds(0);
        var seconds = myDate.getSeconds();
        var newseconds = 0;
        var roundups = [10, 20, 30, 40, 50, 60];        // what seconds we'll actually speak
        for (var i = roundups.length - 1; i >= 0; i--) {
            if (seconds<roundups[i])
                newseconds = roundups[i];
        }
        var mytimestamp = myDate.getTime() + (newseconds - seconds)*1000;
        return new Date(mytimestamp);
    },
    /** Generate a phrase to say a specific number */
    "getNumberPhrase": function(number) {
        var phrase = [];
        var tens = Math.floor((number % 100) / 10);
        var ones = number % 10;
        if (tens == 0)
            phrase = [String(ones)];
        if (tens == 1)
            phrase = [String(number)];
        if (tens > 1 && ones == 0)
            phrase = [String(tens*10)];
        if (tens > 1 && ones > 0)
            phrase = [String(tens*10), String(ones)];
        return phrase;
    },
    /** Generate the phrase to say this specific time */
    "getTimePhrase": function(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

        var phrase = [];
        if (minutes == 0 && seconds == 0) {
            phrase = [hours > 0 ? String(hours % 12) : String(12), 'oclock', hours > 11 ? 'pm': 'am'];
        }
        else {
            var hoursphrase = [hours > 0 ? String(hours % 12) : String(12)];

            var minutesphrase = [];
            if (minutes<10)
                minutesphrase = ['oh'];
            minutesphrase = minutesphrase.concat(this.getNumberPhrase(minutes), [hours > 11 ? 'pm': 'am']);
            if (minutes >= 20 && seconds>0)
                minutesphrase[minutesphrase.length-3] += '_';

            var secondsphrase = [];
            if (seconds != 0)
                secondsphrase = ["and"].concat(this.getNumberPhrase(seconds), ['seconds']);
            if (seconds>=20 && seconds % 10 > 0)
                secondsphrase[secondsphrase.length-3] += '_';
            phrase = [].concat(hoursphrase, minutesphrase, secondsphrase);
        }
        return ['at-tone-time-exactly'].concat(phrase);

    },
    /** Return the length (in milliseconds) for this sound */
    "getSoundLength": function(sound) {
        if (this.durations[sound])
            return this.durations[sound];
        return -1;
    },
    /** Return the length (in milliseconds) for this phrase */
    "getPhraseLength": function(phrase) {
        var time = 0;
        for (var i=0; i<phrase.length; i++) {
            time += this.durations[phrase[i]];
        }
        return time;
    }
};

// Based on http://dustindiaz.com/smallest-domready-ever
function onDomReady(f){document['addEventListener'] ? document.addEventListener('DOMContentLoaded',f) : /in/.test(document.readyState)?setTimeout(function(){onDomReady(f)},9):f()}

// Hide Javascript warning if Javascript works
onDomReady(function() {
    document.getElementById('clock').style.visibility = "visible";
    document.getElementById('needjs').style.visibility = "hidden";
});

// Start up the main clock
if (window.addEventListener) {
    window.addEventListener('load', Clock.init, false);
} else if (window.attachEvent) {
    window.attachEvent('onload', Clock.init);
}