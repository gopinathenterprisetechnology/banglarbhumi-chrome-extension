document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url.includes("banglarbhumi.gov.in")) {
        // অল-ফ্রেম প্যারামিটার দিয়ে স্ক্রিপ্ট রান করানো হচ্ছে, যা সমস্ত আইফ্রেম ব্রেক করবে
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
                        <p><b>কোনো লাইভ ডেটা পাওয়া যায়নি!</b></p>
                        <p style="color:#555; font-size:12px;">দয়া করে বাংলারভূমি পোর্টালে খতিয়ান বা প্লট সার্চ করে টেবিলটি স্ক্রিনে নিয়ে আসার পর এক্সটেনশনটি খুলুন।</p>
                    </div>`;
            }
        });
    } else {
        document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center; padding: 20px;'>দয়া করে প্রথমে ব্রাউজারে Banglarbhumi ওয়েবসাইটটি ওপেন করুন।</p>";
    }
});

// আইফ্রেম ভেদ করে লাইভ ডেটা তোলার ডিপ ফাংশন
function extractDeepData() {
    // বাংলারভূমির সমস্ত খতিয়ান ও প্লটের টেবিল খোঁজা হচ্ছে
    const tables = document.querySelectorAll('table');
    let htmlOutput = "";
    
    tables.forEach(table => {
        // যে টেবিলে ডেটা আছে শুধুমাত্র সেটাই নেবে
        if (table.innerText.trim().length > 15) {
            htmlOutput += `<div style="margin-bottom:20px; width:100%;">${table.outerHTML}</div>`;
        }
    });

    if (htmlOutput) return htmlOutput;

    // যদি টেবিল ট্যাগ ছাড়া অন্য কোনো কন্টেইনারে রেজাল্ট থাকে
    const containers = ['.table-responsive', '#printArea', '.report-container', '[id*="report"]'];
    for (let selector of containers) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim().length > 20) {
            return el.innerHTML;
        }
    }
    return null;
}

// ✂️ স্মার্ট ডিলিট অপশন যুক্ত করা
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

// ঘরগুলোকে সোজা এবং সুন্দর করে রেন্ডার করার লেআউট ইঞ্জিন
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

// বড় ইমেজ আপলোড হ্যান্ডলার
document.getElementById('img-input').addEventListener('change', function(e) {
    const file = e.target.files;
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

// 🖨️ সরাসরি প্রিন্ট করার মেকানিজম
document.getElementById('print-btn').addEventListener('click', function() {
    window.print();
});

// PDF ডাউনলোডের ব্যাকআপ অপশন
document.getElementById('download-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('print-area');
    const delButtons = document.querySelectorAll('.delete-btn-cell');
    
    delButtons.forEach(btn => btn.style.visibility = 'hidden');

    html2canvas(element, { scale: 2, useCORS: true, allowTaint: true }).then(canvas => {
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
        pdf.save('Banglarbhumi_Auto_Report.pdf');
    });
});
