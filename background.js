chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractDeepDataFromPage
    }, (results) => {
      let combinedData = "";
      let foundMeta = null;

      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) {
            if (frameResult.result.isMetaObj) {
              foundMeta = frameResult.result;
            } else if (typeof frameResult.result === 'string') {
              combinedData += frameResult.result;
            }
          }
        });
      }

      chrome.storage.local.set({ 
        "capturedData": combinedData,
        "mouzaMeta": foundMeta ? foundMeta : null
      }, () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      });
    });

  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

function extractDeepDataFromPage() {
  // ১. ড্রপডাউনের ডেটা তোলার একদম শক্তিশালী গ্লোবাল মেকানিজম
  const selects = document.querySelectorAll('select');
  let dText = "", bText = "", mText = "";

  selects.forEach(select => {
    const id = select.id.toLowerCase();
    const name = select.name.toLowerCase();
    const selectedOption = select.options[select.selectedIndex];
    const text = selectedOption ? selectedOption.text : "";

    if (text && !text.includes("Select") && !text.includes("choose")) {
      if (id.includes('dist') || name.includes('dist')) dText = text;
      if (id.includes('block') || name.includes('block')) bText = text;
      if (id.includes('mouza') || name.includes('mouza')) mText = text;
    }
  });

  const cleanTxt = (t) => t ? t.replace(/\[.*?\]/g, '').trim() : "";

  // ২. যদি ড্রপডাউন থেকে সিলেক্টেড নাম না মেলে, তবে পেজের যেকোনো লেখার ভেতর থেকে খোঁজার ব্যাকআপ লজিক
  if (!dText || !bText) {
    const allElements = document.querySelectorAll('td, div, p, span, th');
    for (let el of allElements) {
      const txt = el.innerText;
      if (txt.includes("District") || txt.includes("জেলা")) {
        const match = txt.match(/(?:District|জেলা)[\s:।|-]+([A-Za-z\s]+)/i);
        if(match && match[1]) dText = match[1].trim();
      }
      if (txt.includes("Block") || txt.includes("ব্লক")) {
        const match = txt.match(/(?:Block|ব্লক)[\s:।|-]+([A-Za-z\s]+)/i);
        if(match && match[1]) bText = match[1].trim();
      }
      if (txt.includes("Mouza") || txt.includes("মৌজা")) {
        const match = txt.match(/(?:Mouza|মৌজা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
        if(match && match[1]) mText = match[1].trim();
      }
    }
  }

  // মেইন টেবিল ডেটা স্ক্র্যাপ করার অরিজিনাল লজিক
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  
  tables.forEach(table => {
    if (table.innerText.trim().length > 15) {
      table.removeAttribute('style');
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
    }
  });

  // মেটা অবজেক্ট রিটার্ন করার প্রসেস
  if (dText || bText || mText) {
    chrome.storage.local.set({
      "mouzaMeta": {
        isMetaObj: true,
        district: cleanTxt(dText),
        block: cleanTxt(bText),
        mouza: cleanTxt(mText)
      }
    });
  }

  return htmlOutput || null;
}
