chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    // একদম ফ্রেশ এবং লাইট-ওয়েট স্ক্রিপ্ট রান, যা পেজকে কখনো ক্র্যাশ করতে দেবে না
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractDeepDataFromPage
    }, (results) => {
      let combinedData = "";
      let finalMeta = { district: "", block: "", mouza: "" };

      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) {
            // মেটাডাটা অবজেক্ট চেক
            if (frameResult.result.isMetaObj) {
              if (frameResult.result.district) finalMeta.district = frameResult.result.district;
              if (frameResult.result.block) finalMeta.block = frameResult.result.block;
              if (frameResult.result.mouza) finalMeta.mouza = frameResult.result.mouza;
            } else if (typeof frameResult.result === 'string') {
              combinedData += frameResult.result;
            }
          }
        });
      }

      // লোকাল স্টোরেজে ডেটা সেভ করে নতুন ট্যাব খোলা হচ্ছে
      chrome.storage.local.set({ 
        "capturedData": combinedData,
        "mouzaMeta": finalMeta
      }, () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      });
    });

  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

// লাইভ পেজ থেকে ডেটা খোঁজার অত্যন্ত নিরাপদ ও দ্রুত ফাংশন
function extractDeepDataFromPage() {
  let dText = "", bText = "", mText = "";
  
  // ১. সরাসরি সিলেক্ট ড্রপডাউন ডিটেকশন
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    const id = select.id.toLowerCase();
    const name = select.name.toLowerCase();
    const selectedOption = select.options[select.selectedIndex];
    const text = selectedOption ? selectedOption.text.trim() : "";

    if (text && !text.toLowerCase().includes("select") && !text.toLowerCase().includes("choose")) {
      if (id.includes('dist') || name.includes('dist') || id.includes('জেলা')) dText = text;
      if (id.includes('block') || name.includes('block') || id.includes('ব্লক')) bText = text;
      if (id.includes('mouza') || name.includes('mouza') || id.includes('موجা') || id.includes('মৌজা')) mText = text;
    }
  });

  const cleanTxt = (t) => t ? t.replace(/\[.*?\]/g, '').trim() : "";

  // ২. লাইভ কন্টেন্ট টেবিল এক্সট্র্যাকশন
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  
  tables.forEach(table => {
    if (table.innerText.trim().length > 15) {
      table.removeAttribute('style');
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
    }
  });

  // যদি এই ফ্রেমে টেবিল ডেটা না থাকে কিন্তু মেটা ডেটা থাকে, তবে শুধুমাত্র মেটা অবজেক্ট পাঠাবে
  if ((dText || bText || mText) && htmlOutput.length === 0) {
    return {
      isMetaObj: true,
      district: cleanTxt(dText),
      block: cleanTxt(bText),
      mouza: cleanTxt(mText)
    };
  }

  // যদি টেবিল ডেটা থাকে, তবে মেইন কন্টেন্ট স্ট্রিং আকারে পাঠাবে
  return htmlOutput || null;
}
