document.addEventListener('DOMContentLoaded', () => {
    const liveContent = document.getElementById('live-content');
    const imgInput = document.getElementById('img-input');
    const uploadedImg = document.getElementById('uploaded-img');

    // ১. স্টোরেজ থেকে অটো-সিঙ্ক হওয়া মেইন টেবিল ডেটা লোড করা
    chrome.storage.local.get("capturedData", (data) => {
        if (data && data.capturedData && data.capturedData.trim().length > 0) {
            liveContent.innerHTML = data.capturedData;
            setupSmartDelete();
        } else {
            liveContent.innerHTML = `
                <div style="color:red; text-align:center; padding: 50px;">
                    <p style="font-size:16px; font-weight:bold;">কোনো লাইভ ডেটা অটোমেটিক আনা যায়নি!</p>
                    <p style="color:#555; font-size:13px; margin-top:10px;">দয়া করে বাংলারভূমি পোর্টালে খতিয়ান বা প্লট সার্চ করে টেবিলটি স্ক্রিনে নিয়ে আসার পর এক্সটেনশন আইকনে ক্লিক করুন।</p>
                </div>`;
        }
        chrome.storage.local.remove("capturedData");
    });

    // ২. মেটা ডেটা ব্যাকআপ রিসিভার (যদি ব্যাকগ্রাউন্ড কোনো টেক্সট পায় তবেই চেঞ্জ হবে, নয়তো আগেরটাই থাকবে)
    chrome.storage.local.get("mouzaMeta", (metaData) => {
        if (metaData && metaData.mouzaMeta) {
            const meta = metaData.mouzaMeta;
            
            const isValid = (val) => val && val.trim().length > 0 && 
                                    !val.toLowerCase().includes('select') && 
                                    !val.toLowerCase().includes('identif') && 
                                    !val.toLowerCase().includes('load');
            
            if (isValid(meta.district)) document.getElementById('lbl-district').innerText = meta.district;
            if (isValid(meta.block)) document.getElementById('lbl-block').innerText = meta.block;
            if (isValid(meta.mouza)) document.getElementById('lbl-mouza').innerText = meta.mouza;
        }
        chrome.storage.local.remove("mouzaMeta");
    });

    // ৩. ইমেজ আপলোড সুইচ লজিক
    imgInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadedImg.src = event.target.result;
                uploadedImg.style.setProperty('display', 'block', 'important');
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // ৪. স্মার্ট ডিলিট অপশন তৈরি
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

    // ৫. সরাসরি প্রিন্ট উইন্ডো ট্রিগার
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });
});
