document.addEventListener('DOMContentLoaded', () => {
    const liveContent = document.getElementById('live-content');

    // প্লেসহোল্ডার টেক্সট সরানোর মেকানিজম
    liveContent.addEventListener('focus', () => {
        if (liveContent.innerText.includes("কপি করা টেবিল এখানে পেস্ট করুন")) {
            liveContent.innerHTML = "";
        }
    });

    // পেস্ট হওয়ার সাথে সাথে টেবিলের প্রতিটি লাইনে স্মার্ট ডিলিট বাতন ইনজেক্ট করা হবে
    liveContent.addEventListener('input', () => {
        setupSmartDelete();
        autoAdjustLayout();
    });

    // ফাঁকা জায়গা বা অপ্রয়োজনীয় ব্রেক ট্যাগ কমানোর বোতাম লজিক
    document.getElementById('clean-btn').addEventListener('click', () => {
        const brs = liveContent.querySelectorAll('br');
        brs.forEach(br => br.remove()); // অতিরিক্ত লাইন গ্যাপ মুছে দেবে
        
        const emptyParagraphs = liveContent.querySelectorAll('p, div');
        emptyParagraphs.forEach(el => {
            if (el.innerText.trim() === "") el.remove();
        });
        autoAdjustLayout();
    });
});

// ✂️ ডিলিট বাটন বসানো যা বাকি ঘরগুলো প্রফেশনালভাবে রি-অ্যারেঞ্জ করবে
function setupSmartDelete() {
    const liveContent = document.getElementById('live-content');
    const rows = liveContent.querySelectorAll('tr, p, h4, div');
    
    rows.forEach(item => {
        if (item.tagName === 'TR' && item.querySelector('th')) return;
        if (item.classList.contains('delete-btn-cell') || item.querySelector('.delete-btn-cell')) return;
        
        item.style.position = 'relative';
        
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.className = 'delete-btn-cell';
        delBtn.setAttribute('contenteditable', 'false');
        
        delBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.remove();
            autoAdjustLayout();
        });
        
        item.appendChild(delBtn);
    });
}

// টেবিল উইডথ ১০০% করে বাকি ঘরগুলোকে সুন্দরভাবে সাজানো (Auto Layout Grid)
function autoAdjustLayout() {
    const tables = document.querySelectorAll('#live-content table');
    tables.forEach(table => {
        const remainingRows = table.querySelectorAll('tr');
        if (remainingRows.length === 0) {
            table.remove();
            return;
        }
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
        
        // ভেতরের প্রতিটি সেলের স্টাইল ফিক্সড করা
        table.querySelectorAll('td, th').forEach(cell => {
            cell.style.padding = '8px';
            cell.style.fontSize = '13px';
        });
    });
}

// ইমেজ আপলোড লজিক
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

// 🖨️ সরাসরি প্রিন্ট করার লজিক
document.getElementById('print-btn').addEventListener('click', function() {
    window.print();
});

// PDF ডাউনলোড লজিক
document.getElementById('download-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('print-area');

    const delButtons = document.querySelectorAll('.delete-btn-cell');
    delButtons.forEach(btn => btn.style.visibility = 'hidden');

    window.html2canvas(element, { scale: 2, useCORS: true, allowTaint: true }).then(canvas => {
        delButtons.forEach(btn => btn.style.visibility = 'visible');

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
        pdf.save('Banglarbhumi_Perfect_Paper.pdf');
    });
});
