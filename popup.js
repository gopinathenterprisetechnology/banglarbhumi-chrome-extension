document.addEventListener('DOMContentLoaded', async () => {
    // লাইভ ট্যাব থেকে ডেটা ডিটেক্ট করা
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url.includes("banglarbhumi.gov.in")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapeBanglarbhumiData
        }, (results) => {
            if (results && results && results.result) {
                document.getElementById('live-content').innerHTML = results.result;
            } else {
                document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center; padding: 20px;'>কোনো ডেটা পাওয়া যায়নি! দয়া করে খতিয়ান বা দাগ সার্চ করার পর এক্সটেনশনটি চেক করুন।</p>";
            }
        });
    } else {
        document.getElementById('live-content').innerHTML = "<p style='color:red; text-align:center; padding: 20px;'>দয়া করে প্রথমে ব্রাউজারে Banglarbhumi ওয়েবসাইটটি ওপেন করুন।</p>";
    }
});

// বাংলারভূমির ভেতরের ডাটা বা টেবিল রিড করার ফাংশন
function scrapeBanglarbhumiData() {
    const targetElement = document.querySelector('.table-responsive') || 
                          document.querySelector('#printArea') || 
                          document.querySelector('.report-container');
    
    if (targetElement) {
        return targetElement.innerHTML;
    }
    
    const mainBody = document.querySelector('main') || document.querySelector('#main-content');
    return mainBody ? mainBody.innerHTML : null;
}

// ম্যানুয়ালি ছবি আপলোড করার লজিক (যা পেজের মাথায় বড় করে সেট হবে)
document.getElementById('img-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgElement = document.getElementById('uploaded-img');
            imgElement.src = event.target.result;
            imgElement.style.display = 'block'; // ছবি আপলোড হলেই এটি দৃশ্যমান হবে
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
        pdf.save('Banglarbhumi_Report_With_Banner.pdf');
    });
});
