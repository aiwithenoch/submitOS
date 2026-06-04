const fs = require('fs');
const JSZip = require('jszip');

async function createDocx() {
    const zip = new JSZip();
    zip.file("docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Pages>3</Pages></Properties>`);
    
    const content = await zip.generateAsync({type:"nodebuffer"});
    fs.writeFileSync("test.docx", content);
    console.log("test.docx created!");
}

createDocx();
