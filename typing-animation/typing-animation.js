const title = document.getElementById("title");
const text = document.getElementById("text");

function slowType(text, elem, delay = 100, callback = null) {
    title.innerHTML += text[0];

    if (text.length > 1) {
        setTimeout(() => {
            slowType(text.substring(1), elem, delay, callback);
        }, delay)
    } else if (callback != null) {
        callback();
    }
}

window.addEventListener("load", () => {
    slowType("Hey, what are you doing here?", title);
})

// Disable right click and keyboard

document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = e => e.preventDefault();
document.onkeypress = e => e.preventDefault();

// YouTube

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'dQw4w9WgXcQ',
        playerVars: {
            controls: 0,
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    setTimeout(startPlaying, 6000);
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        // Player started playing
    }
}

function startPlaying() {
    player.playVideo();
    document.getElementById("player").style.display = "inherit";
}