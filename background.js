chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    // পেজ ক্র্যাশ বা লুপ এড়াতে একদম লাইট-ওয়েট স্ক্রিপ্টিং রান
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractTablesAndTextData
    }, (results) => {
      let combinedData = "";
      let finalMeta = { district: "", block: "", mouza: "" };

      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) {
            // যদি কোনো ফ্রেমে টেক্সট মেটা বা টেবিল উভয়ই থাকে তা প্রসেস করবে
            if (frameResult.result.meta) {
              if (frameResult.result.meta.district) finalMeta.district = frameResult.result.meta.district;
              if (frameResult.result.meta.block) finalMeta.block = frameResult.result.meta.block;
              if (frameResult.result.meta.mouza) finalMeta.mouza = frameResult.result.meta.mouza;
            }
            if (frameResult.result.html) {
              combinedData += frameResult.result.html;
            }
          }
        });
      }

      // সংগৃহীত ডাটা মেমোরি স্টোরেজে সেভ করে নতুন ট্যাব খোলা হচ্ছে
      chrome.storage.local.set({ 
        "capturedData": combinedData,
        "mouzaMeta": finalMeta.district || finalMeta.block || finalMeta.mouza ? finalMeta : null
      }, () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      });
    });

  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

// এই ফাংশনটি ড্রপডাউন বাদ দিয়ে পেজের দৃশ্যমান বাংলা/ইংরেজি লেখা থেকে তথ্য চুরি করবে
function extractTablesAndTextData() {
  let dText = "", bText = "", mText = "";
  
  // ১. পেজের সমস্ত টেক্সট কন্টেন্ট রিড করা
  const pageWholeText = document.body.innerText || "";
  
  // বাংলা ফরম্যাট ম্যাচিং লজিক (জেলাঃ এক্স | ব্লকঃ ওয়াই | মৌজাঃ জেড)
  if (pageWholeText.includes("জেলা") || pageWholeText.includes("District")) {
    
    // রেগুলার এক্সপ্রেশন দিয়ে নিখুঁত বাংলা ও ইংরেজি নাম আলাদা করা
    const distMatch = pageWholeText.match(/(?:District|জেলা)[\s:।|-]+([^\s|\||,\n]+)/i);
    const blockMatch = pageWholeText.match(/(?:Block|ব্লক)[\s:।|-]+([^\s|\||,\n]+)/i);
    const mouzaMatch = pageWholeText.match(/(?:Mouza|মৌজা)[\s:।|-]+([^\s|\||,\n]+)/i);

    if (distMatch) dText = distMatch[1];
    if (blockMatch) bText = blockMatch[1];
    if (mouzaMatch) mText = mouzaMatch[1];
  }

  // ২. লাইভ কন্টেন্ট খতিয়ান/প্লট টেবিল এক্সট্র্যাকশন
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  
  tables.forEach(table => {
    if (table.innerText.trim().length > 15) {
      table.removeAttribute('style');
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
    }
  });

  // মেটা অবজেক্ট এবং এইচটিএমএল আউটপুট একসাথে পাঠানো হচ্ছে
  return {
    meta: {
      district: dText.trim(),
      block: bText.trim(),
      mouza: mText.trim()
    },
    html: htmlOutput
  };
}
