/**
 * Music Player Script
 * Handles song fetching, playback controls, and UI synchronization.
 */

let currentSong = new Audio();
let currFolder;
let songs;

// Format seconds into MM:SS display format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Reset all song list items to the "Play" state
const resetListIcons = () => {
    Array.from(document.querySelector(".songList").querySelectorAll("li")).forEach(li => {
        const img = li.querySelector(".listplay");
        img.src = "img/play.svg";
        const span = li.querySelector(".playnow span");
        if (span) span.innerHTML = "Play Now";
    });
}

// Update the list UI to show "Pause" for the currently playing track
const updateListIconToPause = () => {
    let currentPlayingName = decodeURI(currentSong.src.split("/").slice(-1)[0]);
    Array.from(document.querySelector(".songList").querySelectorAll("li")).forEach(li => {
        const span = li.querySelector(".playnow span");
        const img = li.querySelector(".listplay");
        const songName = li.querySelector(".info").firstElementChild.innerHTML.trim();
        
        // Toggle icon and text based on play/pause state
        if (songName === currentPlayingName && !currentSong.paused) {
            img.src = "img/pause.svg";
            span.innerHTML = "Pause Now";
        } else {
            img.src = "img/play.svg";
            span.innerHTML = "Play Now";
        }
    });
}

// Fetch MP3 files from a folder and populate the song list
async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    
    // Extract song names from anchor tags
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Generate HTML for the song list
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li><img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div> ${song.replaceAll("%20", " ")}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert listplay" src="img/play.svg" alt="">
            </div></li>`;
    }

    // Add click listeners to each song item for play/pause toggling
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            let songName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            let currentPlayingName = decodeURI(currentSong.src.split("/").slice(-1)[0]);

            if (songName === currentPlayingName) {
                // If song is already loaded, toggle play/pause
                if (currentSong.paused) {
                    currentSong.play();
                    play.src = "img/pause.svg";
                } else {
                    currentSong.pause();
                    play.src = "img/play.svg";
                }
                updateListIconToPause();
            } else {
                // If a new song is clicked, play it
                playMusic(songName);
            }
        })
    });
    return songs;
}

// Play a specific track and update song info in the UI
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    updateListIconToPause(); 
}

/**
 * Main application entry point
 */
async function main() {
    // Initial load of songs from default playlist
    await getSongs("songs/playlist1");
    playMusic(songs[0], true);

    // Toggle play/pause via the master play button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
        updateListIconToPause();
    });

    // Update time display and seekbar circle as song plays
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Auto-play the next song when the current one ends
    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]); // Loop back to start
        }
    });

    // Seek song position by clicking on the seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Mobile navigation: Open/Close sidebar
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous track button functionality
    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        } else {
            playMusic(songs[songs.length - 1]); // Loop to end
        }
    });

    // Next track button functionality
    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]); // Loop to start
        }
    });

    // Adjust volume via slider
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Load folder contents when a playlist card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });

    // Mute/Unmute volume when clicking the icon
    document.querySelector(".volume>img").addEventListener("click", e => { 
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}

main();