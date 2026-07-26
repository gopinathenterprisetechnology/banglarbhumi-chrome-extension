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
            // জেলা, ব্লক ও মৌজার মেটা ডেটা সংগ্রহ
            if (frameResult.result.district) finalMeta.district = frameResult.result.district;
            if (frameResult.result.block) finalMeta.block = frameResult.result.block;
            if (frameResult.result.mouza) finalMeta.mouza = frameResult.result.mouza;
            
            // মেইন লাইভ টেবিল কন্টেন্ট সংগ্রহ
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

  // ১. মেটা ডাটা (জেলা, ব্লক, মৌজা) স্ক্র্যাপ করার ক্র্যাশ-প্রুফ লজিক
  try {
    if (textBody.includes("জেলা") || textBody.includes("District") || textBody.includes("মৌজা")) {
      const dMatch = textBody.match(/(?:District|জেলা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
      const bMatch = textBody.match(/(?:Block|ব্লক)[\s:।|-]+([A-Za-z\s\u0980-\u09FF]+)/i);
      const mMatch = textBody.match(/(?:Mouza|মৌজা)[\s:।|-]+([A-Za-z\s\u0980-\u09FF0-9]+)/i);

      if (dMatch && dMatch[1]) dName = dMatch[1].split('\n')[0].trim();
      if (bMatch && bMatch[1]) bName = bMatch[1].split('\n')[0].trim();
      if (mMatch && mMatch[1]) mName = mMatch[1].split('\n')[0].trim();
    }
  } catch (err) {
    console.error("Meta extraction error:", err);
  }

  // ২. লাইভ খতিয়ান মেইন ডেটা টেবিল ক্যাপচার লজিক
  const tables = document.querySelectorAll('table');
  let htmlOutput = "";
  let capturedTexts = new Set();
  
  tables.forEach(table => {
    const tableText = table.innerText.trim();
    
    // শুধু কাজের ইউনিক টেবিলগুলো ফিল্টার করার কন্ডিশন
    if (tableText.length > 25 && !capturedTexts.has(tableText)) {
      
      // ডুপ্লিকেট এবং আংশিক নোটিশ টেবিল ফিল্টার করার নিখুঁত চেকিং
      if (tableText.includes("অত্রস্বত্বের দাগের বিবরণ ও পরিমাণ") && !tableText.includes("দাগ নং")) {
        // শুধু নোটিশের ফাঁকা পার্টটি আলাদাভাবে আসলে তা স্কিপ হবে
        return; 
      }

      // মূল খতিয়ান ইনফো যদি অলরেডি চলে আসে, তবে নিচের অতিরিক্ত ডুপ্লিকেট টেবিল স্কিপ হবে
      if (htmlOutput.includes("খতিয়ান নং") && tableText.includes("খতিয়ান নং")) {
        return;
      }

      table.removeAttribute('style'); 
      htmlOutput += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
      capturedTexts.add(tableText);
    }
  });

  return {
    district: dName,
    block: bName,
    mouza: mName,
    htmlOutput: htmlOutput
  };
}
