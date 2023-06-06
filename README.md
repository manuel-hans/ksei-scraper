# ksei-scraper
 
This script is used to scrape cum dividend dates of Indonesian stocks and send the data to Telegram.

## Installation
Run: 

```bash
npm install
```

## Usage
1. Duplicate `.env.example` file into `.env`
2. Use command below to run the script. Modify `<from_date>` and `<to_date>` with the correct date. The date format should follow Indonesian format in ksei website.
```bash
node index "<from_date>" "<to_date>"
```
Example: 
```bash
node index "31 Mei 2023" "31 Mei 2023"
```

## License

[MIT](https://choosealicense.com/licenses/mit/)