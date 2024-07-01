const firefox = typeof browser !== "undefined";

function setSetting(key, value, callback) {
  const setting = {};
  setting[key] = value;

  if (firefox) {
    browser.storage.sync.set(setting).then(callback);
  } else {
    chrome.storage.sync.set(setting, callback);
  }
}

function getSetting(key, callback) {
  if (firefox) {
    browser.storage.sync.get([key]).then(callback);
  } else {
    chrome.storage.sync.get([key], callback);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save-button");

  getSetting('apiKey', result => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
      console.log("Read API key");
    } else {
      console.log("No API key");
    }
  })

  saveButton.addEventListener("click", () => {
    setSetting('apiKey', apiKeyInput.value, () => {
      console.log("Saved API key");
    })
  })
});
