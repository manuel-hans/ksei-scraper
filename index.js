import { PdfReader } from "pdfreader";

import * as cheerio from 'cheerio';
import axios from "axios";
import { DateTime } from "luxon";

async function parse(buffer){
    return new Promise((resolve, reject) => {
        const output = []
        new PdfReader().parseBuffer(buffer, (err, item) => {
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

async function getCumDate(buffer){
    const texts = await parse(buffer)
    const cumDateIndex = texts.indexOf("Tanggal Cum Dividen di Pasar Reguler & Pasar Negosiasi") + 1
    return texts[cumDateIndex]
}

async function fetchDividendCumDates(from, to){
    let response = await axios.get("https://www.ksei.co.id/publications/corporate-action-schedules/cash-dividend?Month=05&Year=2023")
    // console.log(response.data)
    const $ = cheerio.load(response.data)
    const date1 = DateTime.fromFormat(from, "dd MMMM yyyy", { locale: "id" })
    const date2 = DateTime.fromFormat(to, "dd MMMM yyyy", { locale: "id" })

    const output = {}
    $(".table tbody tr").each(async function(){
        const pdfLocation = "https://www.ksei.co.id"+ $(this).find("td:nth-child(1) a").prop("href");
        const title = $(this).find("td:nth-child(2)").text();
        const emiten = title.match(/\(([^)]+)\)/)[1]
        const datePublished = $(this).find("td:nth-child(3)").text();
        const parsedDate = DateTime.fromFormat(datePublished, "dd MMMM yyyy", { locale: "id" })

        if(!title.startsWith("Jadwal Pelaksanaan") || parsedDate < date1 || parsedDate > date2){
            return
        }
        const pdfResponse = await axios.get(pdfLocation, {responseType: "arraybuffer"})
        // console.log(pdfLocation);
        const buffer = Buffer.from(pdfResponse.data, 'binary')
        const cumDate = await getCumDate(buffer)
        if(!cumDate){
            return
        }

        output[emiten] = cumDate
    })

    return output
}

(async function(){
    const cumDates = fetchDividendCumDates(process.argv[2], process.argv[3])
})()