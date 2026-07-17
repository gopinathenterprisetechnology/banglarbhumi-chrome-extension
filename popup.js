// এক্সটেনশন খোলার সাথে সাথে ওপেন থাকা ট্যাবের ডেটা স্ক্র্যাপ করবে
document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // শুধু বাংলারভূমি ওয়েবসাইটেই এই স্ক্রিপ্ট কাজ করবে
    if (tab && tab.url.includes("banglarbhumi.gov.in")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapeBanglarbhumiData
        }, (results) => {
            if (results && results[0] && results[0].result) {
                document.getElementById('live-content').innerHTML = results[0].result;
            } else {
                document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center;'>কোনো ডেটা পাওয়া যায়নি! দয়া করে খতিয়ান বা দাগ সার্চ করার পর এক্সটেনশনটি চেক করুন।</p>";
            }
        });
    } else {
        document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center;'>দয়া করে প্রথমে ব্রাউজারে Banglarbhumi ওয়েবসাইটটি ওপেন করুন।</p>";
    }
});

// বাংলারভূমির ভেতরের নির্দিষ্ট ডেটা বক্স খুঁজে নেওয়ার ফাংশন
function scrapeBanglarbhumiData() {
    // বাংলারভূমির খতিয়ান/দাগের মেইন রেজাল্ট কন্টেইনার বা টেবিল আইডি/ক্লাস ডিটেক্ট করা
    // সাধারণত রেজাল্ট টেবিল বা প্রিন্ট এরিয়াটি এই এলিমেন্টগুলোর মধ্যে থাকে
    const targetElement = document.querySelector('.table-responsive') || 
                          document.querySelector('#printArea') || 
                          document.querySelector('.report-container');
    
    if (targetElement) {
        return targetElement.innerHTML; // লাইভ ডেটার HTML কোড রিটার্ন করবে
    }
    
    // যদি নির্দিষ্ট কন্টেইনার না মেলে, তবে পুরো মেইন বডি কন্টেন্ট নেওয়ার চেষ্টা করবে
    const mainBody = document.querySelector('main') || document.querySelector('#main-content');
    return mainBody ? mainBody.innerHTML : null;
}

// ইমেজ আপলোড হ্যান্ডলার (JPG)
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

// PDF জেনারেট ও ডাউনলোড হ্যান্ডলার
document.getElementById('download-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('print-area');

    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
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
        pdf.save('Banglarbhumi_Live_Search_Paper.pdf');
    });
});
