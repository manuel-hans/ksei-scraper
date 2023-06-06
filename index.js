import { PdfReader } from "pdfreader";

async function parse(file){
    return new Promise((resolve, reject) => {
        const output = []
        new PdfReader().parseFileItems(file, (err, item) => {
            if (err){
                console.error("error:", err)
                reject(false);
            }
            else if (!item){
                resolve(output)
            }
            else if (item.text){
                output.push(item.text)
            }
        });      
    })
}

async function getCumDate(file){
    const texts = await parse(file)
    const cumDateIndex = texts.indexOf("Tanggal Cum Dividen di Pasar Reguler & Pasar Negosiasi") + 1
    return texts[cumDateIndex]
}

console.log(getCumDate("temp/CEKA_DIV_20230609_ID.pdf"))