chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    // বাংলারভূমি পেজ থেকে ডেটা তোলার স্ক্রিপ্ট রান করানো হচ্ছে
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractDeepDataFromPage
    }, (results) => {
      let combinedData = "";
      let foundMeta = null;

      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) {
            // যদি স্ক্রিপ্ট থেকে ডিস্ট্রিক্ট/ব্লকের মেটা অবজেক্ট পাওয়া যায় তা আলাদা করবে
            if (frameResult.result.isMetaObj) {
              foundMeta = frameResult.result;
            } else if (typeof frameResult.result === 'string') {
              combinedData += frameResult.result;
            }
          }
        });
      }

      // ডেটা ও মেটা অবজেক্ট উভয়ই ক্রোমের লোকাল স্টোরেজে সেভ করা হচ্ছে
      chrome.storage.local.set({ 
        "capturedData": combinedData,
        "mouzaMeta": foundMeta ? foundMeta : null
      }, () => {
        // ডেটা সেভ শেষ হলে সরাসরি নতুন ট্যাবে এডিটর পেজ খোলা হচ্ছে
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      });
    });

  } else {
    // যদি বাংলারভূমি সাইট ওপেন না থাকে, তাও এডিটর ট্যাব খোলা যাবে
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

// লাইভ ডেটা, টেবিল স্ট্রাকচার এবং মেটা ড্রপডাউন তোলার কোর লজিক (আপডেটেড)
function extractDeepDataFromPage() {
  // 🆕 ডিস্ট্রিক্ট, ব্লক ও মৌজার ড্রপডাউন এবং টেক্সট থেকে লাইভ নাম সিঙ্ক করার লজিক যুক্ত করা হলো
  const distSel = document.querySelector('select[id*="district"]') || document.querySelector('select[name*="dist"]') || document.querySelector('#ddlDistrict');
  const blockSel = document.querySelector('select[id*="block"]') || document.querySelector('select[name*="block"]') || document.querySelector('#ddlBlock');
  const mouzaSel = document.querySelector('select[id*="mouza"]') || document.querySelector('select[name*="mouza"]') || document.querySelector('#ddlMouza');

  const cleanTxt = (t) => t ? t.replace(/\[.*?\]/g, '').trim() : "";

  if (distSel && blockSel) {
    const dText = distSel.options[distSel.selectedIndex] ? distSel.options[distSel.selectedIndex].text : "";
    const bText = blockSel.options[blockSel.selectedIndex] ? blockSel.options[blockSel.selectedIndex].text : "";
    const mText = mouzaSel && mouzaSel.options[mouzaSel.selectedIndex] ? mouzaSel.options[mouzaSel.selectedIndex].text : "";
    
    if (dText || bText) {
      return {
        isMetaObj: true,
        district: cleanTxt(dText),
        block: cleanTxt(bText),
        mouza: cleanTxt(mText)
      };
    }
  }

  // যদি সরাসরি ড্রপডাউন থেকে না মেলে, পেজের ভেতরের এলিমেন্ট টেক্সট থেকে খোঁজার ব্যাকআপ লজিক
  const allElements = document.querySelectorAll('td, div, p, span');
  let dName = "", bName = "", mName = "";
  
  for (let el of allElements) {
    const text = el.innerText;
    if (text.includes("District") || text.includes("জেলা")) {
      const matchD = text.match(/(?:District|জেলা)[\s:।|-]+([A-Za-z\s]+)/i);
      if(matchD) dName = matchD[1].trim();
    }
    if (text.includes("Block") || text.includes("ব্লক")) {
      const matchB = text.match(/(?:Block|ব্লক)[\s:।|-]+([A-Za-z\s]+)/i);
      if(matchB) bName = matchB[1].trim();
    }
    if (text.includes("Mouza") || text.includes("মৌজা")) {
      const matchM = text.match(/(?:Mouza|মৌজা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
      if(matchM) mName = matchM[1].trim();
    }
  }

  if (dName || bName || mName) {
    return { isMetaObj: true, district: dName, block: bName, mouza: mName };
  }

  // টেবিল ডাটা রিড করার আদি লজিক
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
