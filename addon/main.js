const firefox = typeof browser !== "undefined";

function getSetting(key, callback) {
  if (firefox) {
    browser.storage.sync.get([key]).then(callback);
  } else {
    chrome.storage.sync.get([key], callback);
  }
}

// MAKE UI
const searchBox = document.querySelector("ytd-searchbox#search");

const fetchButton = document.createElement("button");
fetchButton.textContent = "Fetch";
fetchButton.id = "lang-fetch-btn";
fetchButton.addEventListener("click", fetchLanguages);
searchBox.appendChild(fetchButton);

const dropdown = document.createElement("select");
dropdown.id = "lang-select";
dropdown.addEventListener("change", filterVideos);
const allOption = document.createElement("option");
allOption.value = "ALL";
allOption.text = "All";
dropdown.append(allOption);
searchBox.appendChild(dropdown);

// MAIN
let allVideos = [];
let allLanguages = [];
let fetching = false;
let apiKey;

async function fetchLanguages() {
  if (fetching) return;
  fetching = true;

  getSetting("apiKey", async (result) => {
    apiKey = result.apiKey;
    await main();
  });

  fetching = false;
}

async function main () {
    const { videos, videoIds } = getVideoIds();
    const videoLanguages = await getDefaultLanguages(videoIds);
    addFlags(videos, videoLanguages);
    updateDropdown(videos, videoLanguages);
}

function updateDropdown(videos, videoLanguages) {
  allVideos.push(...videos);
  const newLanguages = new Set(
    videoLanguages.filter((lang) => lang && !allLanguages.includes(lang))
  );
  allLanguages.push(...newLanguages);

  newLanguages.forEach((lang) => {
    const langOption = document.createElement("option");
    langOption.value = lang;
    langOption.text = lang;
    dropdown.appendChild(langOption);
  });
}

function filterVideos() {
  allVideos.forEach((video) => {
    if (dropdown.value === "ALL") {
      video.style.display = "block";
    } else if (video.getAttribute("lang") == dropdown.value) {
      video.style.display = "block";
    } else {
      video.style.display = "none";
    }
  });
}

// FIND VIDEO IDS
function getVideoIds() {
  function extractVideoId(url) {
    const regex = /\/watch\?v=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  const videos = document.querySelectorAll(
    "ytd-video-renderer:not(.lang-flagged), ytd-rich-item-renderer:not(.lang-flagged)"
  );
  let videoIds = [];

  videos.forEach((thumbnail) => {
    const thumbnailLink = thumbnail.querySelector("ytd-thumbnail a");
    if (thumbnailLink) {
      const href = thumbnailLink.getAttribute("href");
      const videoId = extractVideoId(href);
      videoIds.push(videoId);
    }
  });

  return { videos, videoIds };
}

// FIND LANGUAGES
async function getDefaultLanguages(videoIds) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds.join(
        ","
      )}&key=${apiKey}`
    );
    const data = await response.json();
    return data.items.map((item) =>
      item.snippet.defaultAudioLanguage?.substring(0, 2)
    );
  } catch (error) {
    console.error("Error fetching video details:", error);
    throw error;
  }
}

// ADD FLAGS
function addFlags(videos, videoLanguages) {
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const videoLanguage = videoLanguages[i];

    if (videoLanguage) {
      const videoTitle = video.querySelector("yt-formatted-string");

      const flag = document.createElement("img");
      flag.alt = videoLanguage;
      flag.src = `https://unpkg.com/language-icons@0.3.0/icons/${videoLanguage}.svg`;
      flag.className = "lang-flag";
      videoTitle.insertBefore(flag, videoTitle.firstChild);

      video.setAttribute("lang", videoLanguage);
    }

    video.classList.add("lang-flagged");
  }
}
