chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    // এখানে injectImmediately এবং allFrames অন করা হলো যাতে সাব-ফ্রেমের লক ভেঙে যায়
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractDeepDataFromPage
    }, (results) => {
      let combinedData = "";
      let finalMeta = { district: "", block: "", mouza: "" };

      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) {
            // যদি কোনো সাব-ফ্রেমে মেটাডেটা পাওয়া যায় তা অ্যাসাইন করবে
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

      // ফাইনাল ডেটা মেমোরি স্টোরেজে সেভ করা হচ্ছে
      chrome.storage.local.set({ 
        "capturedData": combinedData,
        "mouzaMeta": finalMeta.district || finalMeta.block ? finalMeta : null
      }, () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
      });
    });

  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

// এই ফাংশনটি প্রতিটি সিকিউরড ফ্রেমের ভেতরে ঢুকে ড্রপডাউন ভ্যালু ছিনিয়ে আনবে
function extractDeepDataFromPage() {
  let dText = "", bText = "", mText = "";
  
  // ১. ড্রপডাউন সিলেক্ট ট্যাগ ডিটেকশন
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    const id = select.id.toLowerCase();
    const name = select.name.toLowerCase();
    const selectedOption = select.options[select.selectedIndex];
    const text = selectedOption ? selectedOption.text.trim() : "";

    if (text && !text.toLowerCase().includes("select") && !text.toLowerCase().includes("choose")) {
      if (id.includes('dist') || name.includes('dist') || id.includes('জেলা')) dText = text;
      if (id.includes('block') || name.includes('block') || id.includes('ব্লক')) bText = text;
      if (id.includes('mouza') || name.includes('mouza') || id.includes('মৌজা')) mText = text;
    }
  });

  const cleanTxt = (t) => t ? t.replace(/\[.*?\]/g, '').trim() : "";

  // ২. ব্যাকআপ: যদি ড্রপডাউন লুকিয়ে থাকে তবে লাইভ টেবিলের ভেতরের টেক্সট থেকে খোঁজার লজিক
  if (!dText || !bText) {
    const cells = document.querySelectorAll('td, th, span, div, p');
    for (let cell of cells) {
      const txt = cell.innerText;
      if (txt.includes("জেলা") || txt.includes("District")) {
        const m = txt.match(/(?:District|জেলা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
        if(m && m[1]) dText = m[1].trim();
      }
      if (txt.includes("ব্লক") || txt.includes("Block")) {
        const m = txt.match(/(?:Block|ব্লক)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
        if(m && m[1]) bText = m[1].trim();
      }
      if (txt.includes("মৌজা") || txt.includes("Mouza")) {
        const m = txt.match(/(?:Mouza|মৌজা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF0-9]+)/i);
        if(m && m[1]) mText = m[1].trim();
      }
    }
  }

  // যদি এই নির্দিষ্ট ফ্রেমে মেটাডেটা পাওয়া যায়, তবে তা অবজেক্ট আকারে রিটার্ন করবে
  if (dText || bText || mText) {
    return {
      isMetaObj: true,
      district: cleanTxt(dText),
      block: cleanTxt(bText),
      mouza: cleanTxt(mText)
    };
  }

  // মেইন লাইভ খতিয়ান/প্লট টেবিল ক্যাপচার লজিক
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  
  tables.forEach(table => {
    if (table.innerText.trim().length > 15) {
      table.removeAttribute('style');
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
    }
  });

  return htmlOutput || null;
}
