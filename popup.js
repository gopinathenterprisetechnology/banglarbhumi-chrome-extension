document.addEventListener('DOMContentLoaded', async () => {
    // ১. ইমেজ আপলোড শো না হওয়ার সমস্যার সমাধান
    const imgInput = document.getElementById('img-input');
    const uploadedImg = document.getElementById('uploaded-img');

    imgInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadedImg.src = event.target.result;
                uploadedImg.style.display = 'block'; // ইমেজটি সাথে সাথে বড় করে দৃশ্যমান হবে
            };
            reader.readAsDataURL(file);
        }
    });

    // ২. সরাসরি প্রিন্ট এবং পিডিএফ ডাউনলোড বাটন ফিক্স
    // (উইন্ডো প্রিন্ট কমান্ড সরাসরি ব্রাউজারকে পিডিএফ সেভ বা প্রিন্ট করার আসল প্যানেল খুলে দেয়)
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('download-btn').addEventListener('click', () => {
        window.print(); // আধুনিক ব্রাউজারে প্রিন্ট কমান্ডের মাধ্যমেই 'Save as PDF' করা সবচেয়ে নিরাপদ ও ফ্রেশ আসে
    });

    // ৩. অটোমেটিক ডেটা সিঙ্ক মেকানিজম
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url.includes("banglarbhumi.gov.in")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: extractDeepData
        }, (results) => {
            let combinedData = "";
            
            if (results && results.length > 0) {
                results.forEach(frameResult => {
                    if (frameResult.result) {
                        combinedData += frameResult.result;
                    }
                });
            }

            const contentArea = document.getElementById('live-content');
            if (combinedData.trim().length > 0) {
                contentArea.innerHTML = combinedData;
                setupSmartDelete();
                autoAdjustLayout();
            } else {
                contentArea.innerHTML = `
                    <div style="color:red; text-align:center; padding: 20px;">
                        <p><b>কোনো লাইভ ডেটা ক্যাপচার করা যায়নি!</b></p>
                        <p style="color:#555; font-size:12px;">দয়া করে বাংলারভূমি পোর্টালে খতিয়ান বা প্লট সার্চ করে টেবিলটি স্ক্রিনে নিয়ে আসার পর এক্সটেনশনটি খুলুন।</p>
                    </div>`;
            }
        });
    } else {
        document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center; padding: 20px;'>দয়া করে প্রথমে ব্রাউজারে Banglarbhumi ওয়েবসাইটটি ওপেন করুন।</p>";
    }
});

// আইফ্রেম ডাটা রিকভারি ফাংশন
function extractDeepData() {
    const tables = document.querySelectorAll('table');
    let htmlOutput = "";
    
    tables.forEach(table => {
        if (table.innerText.trim().length > 15) {
            htmlOutput += `<div style="margin-bottom:20px; width:100%;">${table.outerHTML}</div>`;
        }
    });

    if (htmlOutput) return htmlOutput;

    const containers = ['.table-responsive', '#printArea', '.report-container', '[id*="report"]'];
    for (let selector of containers) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim().length > 20) {
            return el.innerHTML;
        }
    }
    return null;
}

// স্মার্ট ডিলিট অপশন
function setupSmartDelete() {
    const liveContent = document.getElementById('live-content');
    const rows = liveContent.querySelectorAll('tr, p, div, h4');
    
    rows.forEach(item => {
        if (item.tagName === 'TR' && item.querySelector('th')) return;
        if (item.classList.contains('delete-btn-cell') || item.querySelector('.delete-btn-cell')) return;
        
        item.style.position = 'relative';
        
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.className = 'delete-btn-cell';
        delBtn.setAttribute('contenteditable', 'false');
        
        delBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.remove();
            autoAdjustLayout();
        });
        
        item.appendChild(delBtn);
    });
}

// অটো লেআউট অ্যাডজাস্ট
function autoAdjustLayout() {
    const tables = document.querySelectorAll('#live-content table');
    tables.forEach(table => {
        const remainingRows = table.querySelectorAll('tr');
        if (remainingRows.length <= 1 && !table.querySelector('td')) {
            table.remove();
            return;
        }
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
    });
}
