document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url.includes("banglarbhumi.gov.in")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapeBanglarbhumiData
        }, (results) => {
            if (results && results && results.result) {
                const contentArea = document.getElementById('live-content');
                contentArea.innerHTML = results.result;
                
                // ১. লাইভ কন্টেন্ট আসার সাথে সাথে সেটিকে লেখার যোগ্য (Editable) করে তোলা
                contentArea.setAttribute('contenteditable', 'true');
                
                // ২. স্মার্ট ডিলিট অপশন চালু করা
                setupSmartDelete();
            } else {
                document.getElementById('live-content').innerHTML = `
                    <div style="color:red; text-align:center; padding: 20px;" contenteditable="false">
                        <p><b>কোনো ডেটা সরাসরি ক্যাপচার করা যায়নি!</b></p>
                        <p style="color:#555; font-size:12px;">নিশ্চিত করুন যে আপনি বাংলারভূমি পেজে ক্যাপচা দিয়ে 'Submit' করেছেন এবং স্ক্রিনে টেবিলটি দেখা যাচ্ছে।</p>
                    </div>`;
            }
        });
    } else {
        document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center; padding: 20px;' contenteditable='false'>দয়া করে প্রথমে ব্রাউজারে Banglarbhumi ওয়েবসাইটটি ওপেন করুন।</p>";
    }
});

// বাংলারভূমির ডাটা স্ক্র্যাপ করার গ্লোবাল ফাংশন
function scrapeBanglarbhumiData() {
    let tables = document.querySelectorAll('table');
    
    if (tables.length === 0) {
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                const iframeTables = iframeDoc.querySelectorAll('table');
                if (iframeTables.length > 0) {
                    tables = iframeTables;
                    break;
                }
            } catch (e) {}
        }
    }

    if (tables.length > 0) {
        let combinedHtml = "";
        tables.forEach((table) => {
            if (table.innerText.trim().length > 10) {
                combinedHtml += `<div style="margin-bottom:20px; width:100%;">${table.outerHTML}</div>`;
            }
        });
        if (combinedHtml) return combinedHtml;
    }

    const fallbackElements = [
        document.querySelector('.table-responsive'),
        document.querySelector('#printArea'),
        document.querySelector('.report-container')
    ];

    for (let el of fallbackElements) {
        if (el && el.innerText.trim().length > 20) {
            return el.innerHTML;
        }
    }
    return null;
}

// ✂️ স্মার্ট ডিলিট বাটন মেকানিজম (যা টেবিল লেআউট ঠিক রাখে)
function setupSmartDelete() {
    const liveContent = document.getElementById('live-content');
    
    // টেবিলের প্রতিটি লাইনে (tr) এবং স্বাধীন প্যারাগ্রাফে ডিলিট বাটন যুক্ত করার লজিক
    const rows = liveContent.querySelectorAll('tr, p, .live-data, h4');
    
    rows.forEach(item => {
        // যদি এটি টেবিলের হেডার (th) না হয়
        if (item.tagName === 'TR' && item.querySelector('th')) return;
        
        item.style.position = 'relative';
        
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.className = 'delete-btn-cell';
        delBtn.setAttribute('contenteditable', 'false'); // বাটন যেন এডিটেবল না হয়
        
        // বাটনে ক্লিক করলে নিখুঁতভাবে রিমুভ হবে এবং লেআউট অটো অ্যাডজাস্ট হবে
        delBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.remove();
            
            // টেবিলের সেল রি-অ্যালাইনমেন্ট অটো ট্রিগার
            autoAdjustLayout();
        });
        
        item.appendChild(delBtn);
    });
}

// অটোমেটিক টেবিলের ঘর সাজানোর ফাংশন (Auto-Layout System)
function autoAdjustLayout() {
    const tables = document.querySelectorAll('#live-content table');
    tables.forEach(table => {
        // যদি কোনো টেবিল সম্পূর্ণ ফাঁকা হয়ে যায়, তবে পুরো টেবিলটিই রিমুভ করে দেবে
        const remainingRows = table.querySelectorAll('tr');
        if (remainingRows.length <= 1 && !table.querySelector('td')) {
            table.remove();
            return;
        }
        
        // ব্রাউজারকে বাধ্য করবে টেবিলের উইডথ ১০০% রেখে সেলগুলোকে সমানভাবে সাজাতে
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
    });
}

// ইমেজ আপলোড করার লজিক
document.getElementById('img-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgElement = document.getElementById('uploaded-img');
            imgElement.src = event.target.result;
            imgElement.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

// 🖨️ সরাসরি প্রিন্ট করার লজিক
document.getElementById('print-btn').addEventListener('click', function() {
    window.print();
});

// PDF ডাউনলোড করার লজিক
document.getElementById('download-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('print-area');

    // প্রিন্ট করার আগে ডিলিট বাটনগুলো সাময়িক হাইড করা
    const delButtons = document.querySelectorAll('.delete-btn-cell');
    delButtons.forEach(btn => btn.style.visibility = 'hidden');

    html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true 
    }).then(canvas => {
        // হাইড করা বাটন আবার ফিরিয়ে আনা
        delButtons.forEach(btn => btn.style.visibility = 'visible');

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; 
        const pageHeight = 295; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        pdf.save('Banglarbhumi_Perfect_Report.pdf');
    });
});
