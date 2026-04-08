import axios from 'axios';
import * as qs from 'qs';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://www.wuxiaspot.com/e/search/index.php';
  const data = qs.stringify({
    show: 'title,newstext,smalltext,writer',
    tempid: '1',
    tbname: 'news',
    keyboard: 'Naruto'
  });
  
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Final URL:', response.request.res.responseUrl);
    
    const $ = cheerio.load(response.data);
    const nextLink = $('.pagination a:contains("Next")').attr('href') || $('.pagination a:contains("»")').attr('href') || $('a:contains("Next")').attr('href');
    console.log('Next Link:', nextLink);
    
    const pages: string[] = [];
    $('.pagination a').each((i, el) => {
      pages.push($(el).attr('href') || '');
    });
    console.log('Pagination links:', pages);
    
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
