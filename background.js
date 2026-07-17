chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["editor.js"]
    });
  }
});
