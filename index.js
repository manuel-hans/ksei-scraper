import { PdfReader } from "pdfreader";

import * as cheerio from 'cheerio';
import axios from "axios";
import { DateTime } from "luxon";
import 'dotenv/config'
import TelegramBot from "node-telegram-bot-api";
import _ from "lodash";

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
    let response = await axios.get("https://www.ksei.co.id/publications/corporate-action-schedules/cash-dividend")

    const $ = cheerio.load(response.data)
    const date1 = DateTime.fromISO(from)
    const date2 = DateTime.fromISO(to)

    const output = {}
    const tr = $(".table tbody tr")
    for (let i = 0; i < tr.length; i++) {
        const row = tr[i];

        const pdfLocation = "https://www.ksei.co.id"+ $(row).find("td:nth-child(1) a").prop("href")
        const title = $(row).find("td:nth-child(2)").text()
        const ticker = _.last(title.split('(')).split(")")[0]
        const datePublished = $(row).find("td:nth-child(3)").text()
        const parsedDate = DateTime.fromFormat(datePublished, "dd MMMM yyyy", { locale: "id" })

        if(!title.startsWith("Jadwal Pelaksanaan") || parsedDate < date1 || parsedDate > date2){
            continue
        }
        const pdfResponse = await axios.get(pdfLocation, {responseType: "arraybuffer"})
        // console.log(pdfLocation);
        const buffer = Buffer.from(pdfResponse.data, 'binary')
        const cumDate = await getCumDate(buffer)
        if(!cumDate){
            continue
        }

        output[ticker] = cumDate

    }
    
    return output
}

(async function(){
    const to = DateTime.now()
    const from = to.minus({days: process.argv[2]})
    
    const cumDates = await fetchDividendCumDates(from, to)
    const message = "Dividend: \n" + Object.keys(cumDates).map(ticker => `${ticker} ${cumDates[ticker]}`).join("\n")
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.CHAT_ID
    const bot = new TelegramBot(token)
    bot.sendMessage(chatId, message)
})()