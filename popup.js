document.addEventListener('DOMContentLoaded', () => {
    const liveContent = document.getElementById('live-content');

    // ১. স্টোরেজ থেকে অটো-সিঙ্ক হওয়া ডেটা রীড করে নিয়ে আসা
    chrome.storage.local.get("capturedData", (data) => {
        if (data && data.capturedData) {
            liveContent.innerHTML = data.capturedData;
            
            // ডিলিট বাটন মেকানিজম চালু করা
            setupSmartDelete();
        } else {
            liveContent.innerHTML = `
                <div style="color:red; text-align:center; padding: 30px;">
                    <p><b>কোনো লাইভ ডেটা অটোমেটিক আনা যায়নি!</b></p>
                    <p style="color:#555; font-size:12px;">নিশ্চিত করুন যে বাংলারভূমি পোর্টালে খতিয়ান বা প্লট সার্চ করা অবস্থায় আপনি এক্সটেনশন আইকনে ক্লিক করেছেন।</p>
                </div>`;
        }
        
        // কাজ শেষ হলে স্টোরেজ খালি করে দেওয়া যাতে পরের সার্চ ফ্রেশ আসে
        chrome.storage.local.remove("capturedData");
    });

    // ২. ইমেজ আপলোড সুইচ লজিক
    document.getElementById('img-input').addEventListener('change', function(e) {
        const file = e.target.files;
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imgElement = document.getElementById('uploaded-img');
                imgElement.src = event.target.result;
                imgElement.style.display = 'block';
            };
            reader.readAsDataURL(file);
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
