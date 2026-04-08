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
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log('Novels found:', $('.novel-item').length);
    
    // Check pagination
    console.log('Pagination links:');
    $('.pagination a, .page a, .epages a').each((i, el) => {
      console.log($(el).text(), $(el).attr('href'));
    });
    
  } catch (e: any) {
    console.error(e.message);
  }
}

testSearch();
