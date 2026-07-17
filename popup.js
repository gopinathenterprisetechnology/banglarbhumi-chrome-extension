document.addEventListener('DOMContentLoaded', () => {
    const liveContent = document.getElementById('live-content');
    const imgInput = document.getElementById('img-input');
    const uploadedImg = document.getElementById('uploaded-img');

    // ১. স্টোরেজ থেকে অটো-সিঙ্ক হওয়া ডেটা রীড করে নিয়ে আসা
    chrome.storage.local.get("capturedData", (data) => {
        if (data && data.capturedData) {
            liveContent.innerHTML = data.capturedData;
            
            // ডিলিট বাটন মেকানিজম চালু করা
            setupSmartDelete();
        } else {
            liveContent.innerHTML = `
                <div style="color:red; text-align:center; padding: 50px;">
                    <p style="font-size:16px; font-weight:bold;">কোনো লাইভ ডেটা অটোমেটিক আনা যায়নি!</p>
                    <p style="color:#555; font-size:13px; margin-top:10px;">দয়া করে বাংলারভূমি পোর্টালে খতিয়ান বা প্লট সার্চ করে টেবিলটি স্ক্রিনে নিয়ে আসার পর এক্সটেনশন আইকনে ক্লিক করুন।</p>
                </div>`;
        }
        
        // কাজ শেষ হলে স্টোরেজ খালি করে দেওয়া যাতে পরের সার্চ ফ্রেশ আসে
        chrome.storage.local.remove("capturedData");
    });
     // 🆕 ১.১ স্টোরেজ থেকে অটো-সিঙ্ক হওয়া জেলা, ব্লক, মৌজার লাইভ ডেটা রিসিভ করা (শর্ত অনুযায়ী কোনো ডিফল্ট ডেটা নেই)
    chrome.storage.local.get("mouzaMeta", (metaData) => {
        if (metaData && metaData.mouzaMeta) {
            const meta = metaData.mouzaMeta;
            if (meta.district) document.getElementById('lbl-district').innerText = meta.district;
            if (meta.block) document.getElementById('lbl-block').innerText = meta.block;
            if (meta.mouza) document.getElementById('lbl-mouza').innerText = meta.mouza;
        }
        // কাজ শেষ হলে স্টোরেজ খালি করে দেওয়া
        chrome.storage.local.remove("mouzaMeta");
    });

    // ২. ইমেজ আপলোড সুইচ লজিক (১০০% ফিক্সড)
    imgInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadedImg.src = event.target.result;
                uploadedImg.style.setProperty('display', 'block', 'important'); // ফোর্স ডিসপ্লে অন করা হলো
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // ৩. স্মার্ট ডিলিট অপশন তৈরি
    function setupSmartDelete() {
        const rows = liveContent.querySelectorAll('tr, p, div, h4');
        rows.forEach(item => {
            if (item.tagName === 'TR' && item.querySelector('th')) return;
            item.style.position = 'relative';
            
            const delBtn = document.createElement('button');
            delBtn.innerText = 'Delete';
            delBtn.className = 'delete-btn-cell';
            delBtn.setAttribute('contenteditable', 'false');
            
            delBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.remove();
            });
            item.appendChild(delBtn);
        });
    }

    // ৪. সরাসরি প্রিন্ট এবং পিডিএফ উইন্ডো ট্রিগার
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });
});
