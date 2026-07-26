document.addEventListener('DOMContentLoaded', () => {
    const liveContent = document.getElementById('live-content');
    const imgInput = document.getElementById('img-input');
    const uploadedImg = document.getElementById('uploaded-img');

    // ১. স্টোরেজ থেকে অটো-সিঙ্ক হওয়া মেইন টেবিল ডেটা লোড করা
    chrome.storage.local.get("capturedData", (data) => {
        if (data && data.capturedData && data.capturedData.trim().length > 0) {
            // ডাটা সম্পূর্ণ লোড করা
            liveContent.innerHTML = data.capturedData;
            
            // ডেটা পেজে বসার পর ক্লিন-আপ এবং ডিলিট বাটন রান করা
            setTimeout(() => {
                cleanDuplicateContent();
                setupSmartDelete();
            }, 100);
            
            // ডাটা স্ক্রিনে সফলভাবে দেখানোর পর স্টোরেজ খালি করা (সুরক্ষিত পজিশন)
            chrome.storage.local.remove("capturedData");
        } else {
            liveContent.innerHTML = `
                <div style="color:red; text-align:center; padding: 50px;">
                    <p style="font-size:16px; font-weight:bold;">কোনো লাইভ ডেটা অটোমেটিক আনা যায়নি!</p>
                    <p style="color:#555; font-size:13px; margin-top:10px;">দয়া করে বাংলারভূমি পোর্টালে খতিয়ান বা প্লট সার্চ করে টেবিলটি স্ক্রিনে নিয়ে আসার পর এক্সটেনশন আইকনে ক্লিক করুন।</p>
                </div>`;
        }
    });

    // ২. জেলা, ব্লক, মৌজার লাইভ ডেটা প্লেসমেন্ট
    chrome.storage.local.get("mouzaMeta", (metaData) => {
        if (metaData && metaData.mouzaMeta) {
            const meta = metaData.mouzaMeta;
            
            const isValid = (val) => val && val.trim().length > 0 && 
                                    !val.toLowerCase().includes('select') && 
                                    !val.toLowerCase().includes('identif') && 
                                    !val.toLowerCase().includes('load');
            
            const elDistrict = document.getElementById('lbl-district');
            const elBlock = document.getElementById('lbl-block');
            const elMouza = document.getElementById('lbl-mouza');

            if (elDistrict && isValid(meta.district)) elDistrict.innerText = meta.district;
            if (elBlock && isValid(meta.block)) elBlock.innerText = meta.block;
            if (elMouza && isValid(meta.mouza)) elMouza.innerText = meta.mouza;

            chrome.storage.local.remove("mouzaMeta");
        }
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

    // নতুন ফাংশন: অতিরিক্ত ডুপ্লিকেট কন্টেন্ট নিখুঁতভাবে পরিষ্কার করা
    function cleanDuplicateContent() {
        if (!liveContent) return;

        // কন্টেন্টের মধ্যে যতগুলো আলাদা আলাদা টেবিল এসেছে তা খোঁজা
        const tables = liveContent.querySelectorAll('table');
        if (tables.length > 1) {
            // প্রথম টেবিলটি রেখে বাকি নিচের সব ডুপ্লিকেট টেবিল ডিলিট
            for (let i = 1; i < tables.length; i++) {
                tables[i].remove();
            }
        }

        // লাইভ ডেটার ভেতরের 'Live Data As On' ডুপ্লিকেট নোটিশ সরানো
        const divs = liveContent.querySelectorAll('div');
        let liveDataCount = 0;
        divs.forEach(div => {
            if (div.textContent.includes('Live Data As On')) {
                liveDataCount++;
                if (liveDataCount > 1) {
                    div.remove();
                }
            }
        });
        
        // ডুপ্লিকেট টেবিল র্যাপার কন্টেইনার সরানো
        const wrappers = liveContent.querySelectorAll('.bb-table-wrapper');
        if (wrappers.length > 1) {
            for (let j = 1; j < wrappers.length; j++) {
                wrappers[j].remove();
            }
        }
    }

    // ৪. স্মার্ট ডিলিট অপশন তৈরি
    function setupSmartDelete() {
        const rows = liveContent.querySelectorAll('tr, p, div, h4');
        rows.forEach(item => {
            if (item.tagName === 'TR' && item.querySelector('th')) return;
            if (item.querySelector('.delete-btn-cell')) return;
            
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
