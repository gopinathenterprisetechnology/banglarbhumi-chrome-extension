chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    // বাংলারভূমি পেজ থেকে ডেটা তোলার স্ক্রিপ্ট রান করানো হচ্ছে
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractDeepDataFromPage
    }, (results) => {
      let combinedData = "";
      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) combinedData += frameResult.result;
        });
      }

      if (combinedData.trim().length > 0) {
        // ডেটা পাওয়া গেলে তা ক্রোমের লোকাল স্টোরেজে সাময়িক সেভ করা হচ্ছে
        chrome.storage.local.set({ "capturedData": combinedData }, () => {
          // ডেটা সেভ শেষ হলে সরাসরি নতুন ট্যাবে এডিটর পেজ খোলা হচ্ছে
          chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
        });
      } else {
        // যদি কোনো কারণে ডেটা না মেলে, সরাসরি নতুন ট্যাব খুলে ব্ল্যাঙ্ক এডিটর দেওয়া হবে
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      }
    });

  } else {
    // যদি বাংলারভূমি সাইট ওপেন না থাকে, তাও এডিটর ট্যাব খোলা যাবে
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

// লাইভ ডেটা এবং টেবিল স্ট্রাকচার তোলার কোর লজিক
function extractDeepDataFromPage() {
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  
  tables.forEach(table => {
    if (table.innerText.trim().length > 15) {
      table.removeAttribute('style'); // ফিক্সড স্ক্রোলবার স্টাইল থাকলে ডিলিট করবে
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
    }
  });

  if (htmlOutput) return htmlOutput;

  const containers = ['.table-responsive', '#printArea', '.report-container', '[id*="report"]'];
  for (let selector of containers) {
    const el = document.querySelector(selector);
    if (el && el.innerText.trim().length > 20) {
      const innerTables = el.querySelectorAll('table');
      innerTables.forEach(t => t.removeAttribute('style'));
      return el.innerHTML;
    }
  }
  return null;
}
