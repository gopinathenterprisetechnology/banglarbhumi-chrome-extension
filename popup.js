document.addEventListener('DOMContentLoaded', () => {
    const liveContent = document.getElementById('live-content');
    const imgInput = document.getElementById('img-input');
    const uploadedImg = document.getElementById('uploaded-img');

    // ১. স্টোরেজ থেকে অটো-সিঙ্ক হওয়া মেইন টেবিল ডেটা লোড করা
    chrome.storage.local.get("capturedData", (data) => {
        if (data && data.capturedData && data.capturedData.trim().length > 0) {
            liveContent.innerHTML = data.capturedData;
            
            // ডুপ্লিকেট ডেটা স্বয়ংক্রিয়ভাবে পরিষ্কার করার লজিক (নতুন যুক্ত করা হয়েছে)
            cleanDuplicateContent();
            
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

    // ২. জেলা, ব্লক, মৌজার লাইভ ডেটা প্লেসমেন্ট
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

    // নতুন ফাংশন: স্ক্রিনে দুইবার আসা ডুপ্লিকেট এলিমেন্ট ডিলিট করা
    function cleanDuplicateContent() {
        // কন্টেন্টের মধ্যে যতগুলো আলাদা আলাদা টেবিল এসেছে তা খোঁজা
        const tables = liveContent.querySelectorAll('table');
        
        // যদি ১টির বেশি টেবিল চলে আসে (যেমন ছবিতে নিচের দিকে ২য় খতিয়ান টেবিলটি ছিল)
        if (tables.length > 1) {
            for (let i = 1; i < tables.length; i++) {
                tables[i].remove(); // প্রথম টেবিলটি রেখে বাকি সব টেবিল স্বয়ংক্রিয় ডিলিট
            }
        }

        // লাইভ ডেটার ভেতরের 'Live Data As On' বা অতিরিক্ত কোনো নোটিশ ডুপ্লিকেট হলে তা সরানো
        const divs = liveContent.querySelectorAll('div');
        let liveDataCount = 0;
        divs.forEach(div => {
            if (div.textContent.includes('Live Data As On')) {
                liveDataCount++;
                if (liveDataCount > 1) {
                    div.remove(); // প্রথমবার বাদে বাকি সব ডুপ্লিকেট ডিভ রিমুভ
                }
            }
        });
        
        // এছাড়াও স্পেসিফিক কোনো ক্লাসের ডুপ্লিকেট কন্টেন্ট থাকলে তা প্রথম এলিমেন্টের পর রিমুভ হবে
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
