document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url.includes("banglarbhumi.gov.in")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapeBanglarbhumiData
        }, (results) => {
            if (results && results[0] && results[0].result) {
                document.getElementById('live-content').innerHTML = results[0].result;
            } else {
                document.getElementById('live-content').innerHTML = `
                    <div style="color:red; text-align:center; padding: 20px;">
                        <p><b>কোনো ডেটা সরাসরি ক্যাপচার করা যায়নি!</b></p>
                        <p style="color:#555; font-size:12px;">নিশ্চিত করুন যে আপনি বাংলারভূমি পেজে ক্যাপচা (Captcha) দিয়ে 'Submit' করেছেন এবং স্ক্রিনে টেবিলটি দেখা যাচ্ছে।</p>
                    </div>`;
            }
        });
    } else {
        document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center; padding: 20px;'>দয়া করে প্রথমে ব্রাউজারে Banglarbhumi ওয়েবসাইটটি ওপেন করুন।</p>";
    }
});

// বাংলারভূমির ভেতরের যেকোনো টেবিল ডেটা বা রিপোর্ট খুঁজে নেওয়ার শক্তিশালী ফাংশন
function scrapeBanglarbhumiData() {
    // ১. প্রথমে পেজের মেইন রেজাল্ট টেবিলগুলো খোঁজার চেষ্টা করবে
    let tables = document.querySelectorAll('table');
    
    // যদি পেজে কোনো আইফ্রেম (iframe) থাকে, তার ভেতরের টেবিলও চেক করবে
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
            } catch (e) {
                // Cross-origin iframe restriction handle
            }
        }
    }

    if (tables.length > 0) {
        let combinedHtml = "";
        // পেজে পাওয়া সবকটি টেবিলকে একসাথে জুড়ে নেবে যাতে কোনো তথ্য মিস না হয়
        tables.forEach((table) => {
            // অপ্রয়োজনীয় বা খালি টেবিল বাদ দেওয়ার ফিল্টার
            if (table.innerText.trim().length > 10) {
                combinedHtml += `<div style="margin-bottom:20px;">${table.outerHTML}</div>`;
            }
        });
        if (combinedHtml) return combinedHtml;
    }

    // ২. যদি সরাসরি টেবিল না মেলে, তবে প্রিন্ট এরিয়া বা মেইন কন্টেন্ট বক্স খুঁজবে
    const fallbackElements = [
        document.querySelector('.table-responsive'),
        document.querySelector('#printArea'),
        document.querySelector('.report-container'),
        document.querySelector('#main-content')
    ];

    for (let el of fallbackElements) {
        if (el && el.innerText.trim().length > 20) {
            return el.innerHTML;
        }
    }

    return null;
}

// ম্যানুয়ালি ছবি আপলোড করার লজিক
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

// PDF জেনারেট ও ডাউনলোড লজিক
document.getElementById('download-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('print-area');

    html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true 
    }).then(canvas => {
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
        pdf.save('Banglarbhumi_Plot_Report.pdf');
    });
});
