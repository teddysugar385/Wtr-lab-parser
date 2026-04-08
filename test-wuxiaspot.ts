import axios from 'axios';
import * as cheerio from 'cheerio';
import * as qs from 'qs';

async function testSearch() {
  try {
    const url = 'https://www.wuxiaspot.com/e/search/index.php';
    const data = qs.stringify({
      show: 'title,newstext,smalltext,writer',
      tempid: '1',
      tbname: 'news',
      keyboard: 'Naruto'
    });
    
    // Do POST request to get searchid
    const response1 = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    let searchid = '';
    const $1 = cheerio.load(response1.data);
    $1('a[href*="searchid="]').each((i, el) => {
      const match = $1(el).attr('href')?.match(/searchid=(\d+)/);
      if (match) searchid = match[1];
    });
    
    console.log('Search ID:', searchid);
    
    // Now fetch page 2 using this searchid
    const page2Url = `https://www.wuxiaspot.com/e/search/result/index.php?page=1&searchid=${searchid}`;
    const res2 = await axios.get(page2Url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    const $2 = cheerio.load(res2.data);
    console.log('Page 2 novels found:', $2('.novel-item').length);
    
  } catch (e: any) {
    console.error(e.message);
  }
}

testSearch();
