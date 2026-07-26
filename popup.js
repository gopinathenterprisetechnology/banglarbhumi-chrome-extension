document.addEventListener('DOMContentLoaded', () => {
    const liveContent = document.getElementById('live-content');
    const imgInput = document.getElementById('img-input');
    const uploadedImg = document.getElementById('uploaded-img');

    chrome.storage.local.get("capturedData", (data) => {
        if (data && data.capturedData && data.capturedData.trim().length > 0) {
            liveContent.innerHTML = data.capturedData;
            
            setTimeout(() => {
                cleanDuplicateContent();
                setupSmartDelete();
            }, 50);
            
        } else {
            liveContent.innerHTML = '<div style="color:red; text-align:center; padding: 50px;"><p style="font-size:16px; font-weight:bold;">No live data captured!</p></div>';
        }
        chrome.storage.local.remove("capturedData");
    });

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
        }
        chrome.storage.local.remove("mouzaMeta");
    });

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

    function cleanDuplicateContent() {
        if (!liveContent) return;

        const tables = liveContent.querySelectorAll('table');
        if (tables.length > 1) {
            for (let i = 1; i < tables.length; i++) {
                tables[i].remove();
            }
        }

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
        
        const wrappers = liveContent.querySelectorAll('.bb-table-wrapper');
        if (wrappers.length > 1) {
            for (let j = 1; j < wrappers.length; j++) {
                wrappers[j].remove();
            }
        }
    }

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

    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });
});
