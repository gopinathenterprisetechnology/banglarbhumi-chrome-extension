chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes("banglarbhumi.gov.in")) {
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractBanglarbhumiLiveContent
    }, (results) => {
      let combinedHtml = "";
      let finalMeta = { district: "", block: "", mouza: "" };

      if (results && results.length > 0) {
        results.forEach(frameResult => {
          if (frameResult.result) {
            // মেটা ডেটা সংগ্রহ
            if (frameResult.result.district) finalMeta.district = frameResult.result.district;
            if (frameResult.result.block) finalMeta.block = frameResult.result.block;
            if (frameResult.result.mouza) finalMeta.mouza = frameResult.result.mouza;
            
            // টেবিল কন্টেন্ট সংগ্রহ
            if (frameResult.result.htmlOutput) {
              combinedHtml += frameResult.result.htmlOutput;
            }
          }
        });
      }

      // মেমোরি স্টোরেজে সেভ করে নতুন ট্যাব খোলা
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
  const textBody = document.body.innerText || "";
  let dName = "", bName = "", mName = "";

  // ১. মেটা ডাটা (জেলা, ব্লক, মৌজা) স্ক্র্যাপ করা
  if (textBody.includes("জেলা") || textBody.includes("District") || textBody.includes("মৌজা")) {
    const dMatch = textBody.match(/(?:District|জেলা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
    const bMatch = textBody.match(/(?:Block|ব্লক)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
    const mMatch = textBody.match(/(?:Mouza|মৌজা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF0-9]+)/i);

    if (dMatch) dName = dMatch[1].split(/[|,\n]/)[0].trim();
    if (bMatch) bName = bMatch[1].split(/[|,\n]/)[0].trim();
    if (mMatch) mName = mMatch[1].split(/[|,\n]/)[0].trim();
  }

  // ২. লাইভ খতিয়ান মেইন ডেটা টেবিল ক্যাপচার লজিক (ডুপ্লিকেট ফিল্টার সহ)
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  let capturedTexts = new Set(); // ডুপ্লিকেট টেবিল আটকানোর জন্য সেট ব্যবহার
  
  tables.forEach(table => {
    const tableText = table.innerText.trim();
    
    // টেবিলটিতে পর্যাপ্ত তথ্য আছে কি না এবং এটি কোনো হিডেন বা ডুপ্লিকেট টেবিল কি না তা যাচাই
    if (tableText.length > 15 && !capturedTexts.has(tableText)) {
      
      // আপনার লাল দাগ দেওয়া অতিরিক্ত ডুপ্লিকেট পার্ট ফিল্টার করার কন্ডিশন
      // যদি একই পেজে মেইন খতিয়ান টেবিল আসার পর নিচের দিকে আবার ওয়ান-টাইম/অতিরিক্ত খতিয়ান টেবিল জেনারেট হয়
      if (htmlOutput.length > 0 && tableText.includes("খতিয়ান নং")) {
         return; // এই ডুপ্লিকেট টেবিলটি স্কিপ করা হবে
      }

      table.removeAttribute('style'); // ফিক্সড হাইট ও স্ক্রোলবার ভেঙে দেওয়া হলো
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
      capturedTexts.add(tableText); // ইউনিক টেবিল হিসেবে ট্র্যাকিংয়ে রাখা হলো
    }
  });

  // অবজেক্টের মাধ্যমে মেটা ডাটা এবং এইচটিএমএল কন্টেন্ট একসাথে রিটার্ন করা হচ্ছে
  return {
    district: dName,
    block: bName,
    mouza: mName,
    htmlOutput: htmlOutput
  };
}
