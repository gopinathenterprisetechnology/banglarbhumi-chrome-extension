// ইমেজ আপলোড হ্যান্ডলার
document.getElementById('img-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgElement = document.getElementById('uploaded-img');
            imgElement.src = event.target.result;
            imgElement.style.display = 'block'; // ইমেজটি দেখাবে
        }
        reader.readAsDataURL(file);
    }
});

// PDF ডাউনলোড হ্যান্ডলার
document.getElementById('download-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('print-area');

    // html2canvas ব্যবহার করে পেজটিকে সুন্দরভাবে PDF এ রূপান্তর করা
    html2canvas(element, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 size width
        const pageHeight = 295; // A4 size height
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
        pdf.save('Banglarbhumi_Search_Paper.pdf');
    });
});
