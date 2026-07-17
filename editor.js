(function() {
    if (document.getElementById('bb-pro-editor-overlay')) return;

    // ১. বাংলারভূমির লাইভ ডেটা বা টেবিল খুঁজে বের করা
    let tables = document.querySelectorAll('table');
    let capturedHtml = "";
    
    tables.forEach(table => {
        if (table.innerText.trim().length > 15) {
            // টেবিলের নিজস্ব ইনলাইন স্টাইল বা স্ক্রোলবার থাকলে তা এখানেই রিসেট করে দেওয়া হচ্ছে
            table.removeAttribute('style');
            capturedHtml += `<div class="bb-table-wrapper">${table.outerHTML}</div>`;
        }
    });

    if (!capturedHtml) {
        const containers = ['.table-responsive', '#printArea', '.report-container', '[id*="report"]', '.jconfirm-box'];
        for (let selector of containers) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim().length > 20) {
                // কন্টেইনারের ভেতরের সব টেবিলের স্টাইল রিসেট
                const innerTables = el.querySelectorAll('table');
                innerTables.forEach(t => t.removeAttribute('style'));
                capturedHtml = el.innerHTML;
                break;
            }
        }
    }

    if (!capturedHtml) {
        alert("কোনো লাইভ ডেটা পাওয়া যায়নি! দয়া করে বাংলারভূমি পোর্টালে খতিয়ান বা প্লট সার্চ করে টেবিলটি স্ক্রিনে নিয়ে আসার পর এক্সটেনশনটি খুলুন।");
        return;
    }

    // ২. ওভারলে কন্টেইনার তৈরি
    const overlay = document.createElement('div');
    overlay.id = 'bb-pro-editor-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f1f3f6; z-index:9999999; overflow-y:auto; padding:20px; box-sizing:border-box; font-family:Arial, sans-serif; color:#333;';

    overlay.innerHTML = `
        <div id="bb-control-panel" style="background:#ffffff; padding:15px; border:1px solid #b3d7ff; margin-bottom:15px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.05); max-width:850px; margin-left:auto; margin-right:auto;">
            <div style="font-size:13px; font-weight:bold;">
                <label style="color:#0056b3; display:block; margin-bottom:5px;">পেজের মাথায় বড় ইমেজ যোগ করুন (JPG):</label>
                <input type="file" id="bb-img-input" accept="image/jpeg, image/jpg">
            </div>
            <div style="display:flex; gap:10px;">
                <button id="bb-close-btn" style="background:#dc3545; color:white; padding:10px 18px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;">বন্ধ করুন</button>
                <button id="bb-print-btn" style="background:#007bff; color:white; padding:10px 18px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;">সরাসরি প্রিন্ট / PDF</button>
            </div>
        </div>

        <div id="bb-print-area" style="background:white; padding:40px; border:1px solid #ccc; box-shadow:0 4px 15px rgba(0,0,0,0.1); max-width:850px; margin-left:auto; margin-right:auto; min-height:500px; position:relative;">
            <div style="width:100%; text-align:center; margin-bottom:20px;">
                <img id="bb-uploaded-img" src="" alt="Uploaded Banner" style="width:100%; height:auto; max-height:250px; display:none; border-bottom:2px solid #333; padding-bottom:10px;">
            </div>
            <div id="bb-live-content" style="width:100%;" contenteditable="true">
                ${capturedHtml}
            </div>
        </div>

        <style>
            /* 🚨 স্ক্রোলবার এবং ফিক্সড হাইট লক ভাঙার মেইন সিএসএস ক্র্যাক */
            #bb-live-content, .bb-table-wrapper, #bb-live-content div, #bb-live-content section {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                overflow-y: visible !important;
                overflow-x: visible !important;
            }

            #bb-live-content table { 
                width: 100% !important; 
                border-collapse: collapse !important; 
                margin-top: 15px !important; 
                table-layout: fixed !important; 
                word-wrap: break-word !important;
                height: auto !important;
            }
            
            #bb-live-content th, #bb-live-content td { 
                border: 1px solid #888 !important; 
                padding: 10px !important; 
                text-align: left !important; 
                color: #000 !important; 
                font-size: 13px !important; 
                position: relative; 
            }
            
            #bb-live-content th { background-color: #f4f4f4 !important; font-weight: bold !important; }
            
            /* এডিটিং হোভার এফেক্ট */
            #bb-live-content tr:hover, #bb-live-content p:hover { background-color: #fff1f0 !important; }
            .bb-delete-btn { display: none; position: absolute; top: 4px; right: 4px; background: #dc3545; color: white; border: none; border-radius: 3px; font-size: 11px; padding: 3px 6px; cursor: pointer; z-index: 100; }
            #bb-live-content tr:hover .bb-delete-btn, #bb-live-content p:hover .bb-delete-btn { display: block; }

            /* 🖨️ প্রিন্ট লেআউট - পেজ ব্রেকিং সচল করা */
            @media print {
                #bb-control-panel, .bb-delete-btn { display: none !important; }
                body * { visibility: hidden; }
                #bb-pro-editor-overlay, #bb-print-area, #bb-print-area * { visibility: visible; }
                #bb-pro-editor-overlay { position: absolute; left: 0; top: 0; width: 100%; padding: 0; background: white; overflow: visible !important; }
                #bb-print-area { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                #bb-live-content tr:hover { background-color: transparent !important; }
                
                /* টেবিল রো যাতে মাঝখান থেকে ভেঙে না যায়, সুন্দরভাবে পরের পেজে ট্রান্সফার হয় */
                #bb-live-content tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                #bb-live-content table { page-break-after: auto !important; }
            }
        </style>
    `;

    document.body.appendChild(overlay);

    // ৩. ইমেজ আপলোড হ্যান্ডলার
    document.getElementById('bb-img-input').addEventListener('change', function(e) {
        const file = e.target.files;
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

    // ৪. ডিলিট বাটন মেকানিজম
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

    // ৫. প্রিন্ট বোতাম
    document.getElementById('bb-print-btn').addEventListener('click', () => {
        window.print();
    });

    // ৬. ক্লোজ বোতাম
    document.getElementById('bb-close-btn').addEventListener('click', () => {
        overlay.remove();
    });

})();
