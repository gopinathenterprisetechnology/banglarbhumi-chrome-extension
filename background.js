// ব্যাকগ্রাউন্ড সার্ভিস যা ট্যাব মেসেজিং কন্ট্রোল করে
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});

