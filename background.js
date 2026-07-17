chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    // পেজ ক্র্যাশ এড়াতে অত্যন্ত দ্রুত ও লাইট-ওয়েট স্ক্রিপ্টিং রান
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractBanglarbhumiLiveContent
    }, (results) => {
      let combinedHtml = "";
      let finalMeta = { district: "", block: "", mouza: "" };

      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) {
            // যদি পেজের ভেতরের লেখা থেকে ডিস্ট্রিক্ট/ব্লক ম্যাচিং অবজেক্ট পাওয়া যায়
            if (frameResult.result.isMetaObj) {
              if (frameResult.result.district) finalMeta.district = frameResult.result.district;
              if (frameResult.result.block) finalMeta.block = frameResult.result.block;
              if (frameResult.result.mouza) finalMeta.mouza = frameResult.result.mouza;
            } else if (typeof frameResult.result === 'string') {
              combinedHtml += frameResult.result;
            }
          }
        });
      }

      // সংগৃহীত লাইভ ডাটা মেমোরি স্টোরেজে সেভ করে সরাসরি নতুন ট্যাব খোলা হচ্ছে
      chrome.storage.local.set({ 
        "capturedData": combinedHtml,
        "mouzaMeta": finalMeta.district || finalMeta.block || finalMeta.mouza ? finalMeta : null
      }, () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      });
    });

  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

// লাইভ পেজের ভেতরের আসল টেক্সট এবং টেবিল স্ক্র্যাপ করার নিরাপদ ফাংশন
function extractBanglarbhumiLiveContent() {
  // ১. ড্রপডাউন ছাড়াও পেজের হেডার বা বডিতে লেখা জেলা/ব্লকের নাম খোঁজার চেষ্টা
  const textBody = document.body.innerText || "";
  let dName = "", bName = "", mName = "";

  if (textBody.includes("জেলা") || textBody.includes("District") || textBody.includes("মৌজা")) {
    const dMatch = textBody.match(/(?:District|জেলা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
    const bMatch = textBody.match(/(?:Block|ব্লক)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
    const mMatch = textBody.match(/(?:Mouza|মৌজা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF0-9]+)/i);

    if (dMatch) dName = dMatch[1].split(/[|,\n]/)[0].trim();
    if (bMatch) bName = bMatch[1].split(/[|,\n]/)[0].trim();
    if (mMatch) mName = mMatch[1].split(/[|,\n]/)[0].trim();

    return {
      isMetaObj: true,
      district: dName,
      block: bName,
      mouza: mName
    };
  }

  // ২. লাইভ খতিয়ান বা প্লটের মেইন ডেটা টেবিল ক্যাপচার লজিক
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  
  tables.forEach(table => {
    if (table.innerText.trim().length > 15) {
      table.removeAttribute('style'); // ফিক্সড হাইট ও স্ক্রোলবার ভেঙে দেওয়া হলো
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
    }
  });

  return htmlOutput || null;
}
