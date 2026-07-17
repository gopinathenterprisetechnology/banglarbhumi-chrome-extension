(function() {
    // যদি অলরেডি এডিটর ওপেন থাকে, তবে আর নতুন করে খুলবে না
    if (document.getElementById('bb-pro-editor-overlay')) return;

    // ১. বাংলারভূমির লাইভ ডেটা বা টেবিল খুঁজে বের করা
    let tables = document.querySelectorAll('table');
    let capturedHtml = "";
    
    tables.forEach(table => {
        if (table.innerText.trim().length > 15) {
            capturedHtml += `<div style="margin-bottom:20px; width:100%;">${table.outerHTML}</div>`;
        }
    });

    if (!capturedHtml) {
        const containers = ['.table-responsive', '#printArea', '.report-container', '[id*="report"]'];
        for (let selector of containers) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim().length > 20) {
                capturedHtml = el.innerHTML;
                break;
            }
        }
    }

    if (!capturedHtml) {
        alert("কোনো লাইভ ডেটা পাওয়া যায়নি! দয়া করে খতিয়ান বা প্লট সার্চ করে টেবিলটি স্ক্রিনে নিয়ে আসার পর এক্সটেনশনটি খুলুন।");
        return;
    }

    // ২. বাংলারভূমি পেজের ওপর সরাসরি ফুল-স্ক্রিন এডিটর উইন্ডো (Overlay) তৈরি করা
    const overlay = document.createElement('div');
    overlay.id = 'bb-pro-editor-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f1f3f6; z-index:9999999; overflow-y:auto; padding:20px; box-sizing:border-box; font-family:Arial, sans-serif; color:#333;';

    overlay.innerHTML = `
        <div id="bb-control-panel" style="background:#ffffff; padding:15px; border:1px solid #b3d7ff; margin-bottom:15px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.05); max-width:800px; margin-left:auto; margin-right:auto;">
            <div style="font-size:13px; font-weight:bold;">
                <label style="color:#0056b3; display:block; margin-bottom:5px;">পেজের মাথায় বড় ইমেজ যোগ করুন (JPG):</label>
                <input type="file" id="bb-img-input" accept="image/jpeg, image/jpg">
            </div>
            <div style="display:flex; gap:10px;">
                <button id="bb-close-btn" style="background:#dc3545; color:white; padding:10px 18px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;">বন্ধ করুন</button>
                <button id="bb-print-btn" style="background:#007bff; color:white; padding:10px 18px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;">সরাসরি প্রিন্ট / PDF</button>
            </div>
        </div>

        <div id="bb-print-area" style="background:white; padding:30px; border:1px solid #ccc; box-shadow:0 4px 15px rgba(0,0,0,0.1); max-width:800px; margin-left:auto; margin-right:auto; min-height:400px; position:relative;">
            <div style="width:100%; text-align:center; margin-bottom:20px;">
                <img id="bb-uploaded-img" src="" alt="Uploaded Banner" style="width:100%; height:auto; max-height:250px; display:none; border-bottom:2px solid #333; padding-bottom:10px;">
            </div>
            <div id="bb-live-content" style="width:100%;" contenteditable="true">
                ${capturedHtml}
            </div>
        </div>

        <style>
            #bb-live-content table { width:100% !important; border-collapse:collapse !important; margin-top:15px !important; table-layout:fixed !important; word-wrap:break-word !important; }
            #bb-live-content th, #bb-live-content td { border:1px solid #888 !important; padding:10px !important; text-align:left !important; color:#000 !important; font-size:13px !important; position:relative; }
            #bb-live-content th { background-color:#f4f4f4 !important; font-weight:bold !important; }
            
            #bb-live-content tr:hover, #bb-live-content p:hover { background-color:#fff1f0 !important; }
            .bb-delete-btn { display:none; position:absolute; top:4px; right:4px; background:#dc3545; color:white; border:none; border-radius:3px; font-size:11px; padding:3px 6px; cursor:pointer; z-index:100; }
            #bb-live-content tr:hover .bb-delete-btn, #bb-live-content p:hover .bb-delete-btn { display:block; }

            @media print {
                #bb-control-panel, .bb-delete-btn { display:none !important; }
                body * { visibility: hidden; }
                #bb-pro-editor-overlay, #bb-print-area, #bb-print-area * { visibility: visible; }
                #bb-pro-editor-overlay { position:absolute; left:0; top:0; width:100%; padding:0; background:white; }
                #bb-print-area { border:none !important; box-shadow:none !important; padding:0 !important; margin:0 !important; max-width:100% !important; }
                #bb-live-content tr:hover { background-color:transparent !important; }
            }
        </style>
    `;

    document.body.appendChild(overlay);

    // ৪. বাটন এবং সুইচের কার্যকরী লজিক সেট করা
    
    // ইমেজ আপলোড সুইচ ফিক্স
    document.getElementById('bb-img-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imgElement = document.getElementById('bb-uploaded-img');
                imgElement.src = event.target.result;
                imgElement.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // স্মার্ট ডিলিট অপশন চালু করা (ঘরগুলো সোজা রাখার জন্য)
    const liveContent = document.getElementById('bb-live-content');
    const rows = liveContent.querySelectorAll('tr, p, div, h4');
    rows.forEach(item => {
        if (item.tagName === 'TR' && item.querySelector('th')) return;
        item.style.position = 'relative';
        
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.className = 'bb-delete-btn';
        delBtn.setAttribute('contenteditable', 'false');
        
        delBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.remove();
        });
        item.appendChild(delBtn);
    });

    // সরাসরি প্রিন্ট এবং পিডিএফ বাটন (ব্রাউজার উইন্ডো সরাসরি ট্রিগার করবে)
    document.getElementById('bb-print-btn').addEventListener('click', () => {
        window.print();
    });

    // এডিটর উইন্ডো বন্ধ করার বাটন
    document.getElementById('bb-close-btn').addEventListener('click', () => {
        overlay.remove();
    });

})();
