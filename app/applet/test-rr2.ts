import axios from 'axios';
import * as cheerio from 'cheerio';

class SmartScraper {
  private baseUrl = 'https://www.royalroad.com';
  
  private bypassEngine = {
    getHeaders: () => ({
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    })
  };

  private async fetchWithRetry(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          headers: this.bypassEngine.getHeaders(),
          timeout: 10000
        });
        return response.data;
      } catch (error: any) {
        console.log(`Fetch failed: ${error.message}`);
        if (i === retries - 1) throw error;
        await new Promise(res => setTimeout(res, 1000 * (i + 1))); 
      }
    }
    throw new Error('Failed after retries');
  }

  async searchNovels(params: any) {
    const { query, page = 1 } = params;
    let url = `${this.baseUrl}/fictions/search?page=${page}`;
    if (query) {
      url += `&title=${encodeURIComponent(query)}`;
    } else {
      url = `${this.baseUrl}/fictions/best-rated?page=${page}`;
    }

    let novels: any[] = [];
    let html = '';
    
    try {
      html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);

      const items = $(".fiction-list-item");
      items.each((i, el) => {
        const title = $(el).find(".fiction-title a").text().trim();
        const link = $(el).find(".fiction-title a").attr("href");
        const image = $(el).find("img").attr("src");
        const statsText = $(el).find(".stats").text().trim().replace(/\s+/g, ' ');
        
        const chaptersMatch = statsText.match(/(\d+)\s*Chapters?/i);
        const viewsMatch = statsText.match(/([\d,]+)\s*Views?/i);
        const followersMatch = statsText.match(/([\d,]+)\s*Followers?/i);
        
        if (title && link) {
          const idMatch = link.match(/\/fiction\/(\d+)/);
          const id = idMatch ? idMatch[1] : link.split('/')[2];
          
          novels.push({
            id: id,
            title,
            rawTitle: '', 
            link: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
            image: image?.startsWith('http') ? image : `${this.baseUrl}${image}`,
            status: 'Ongoing', 
            chapters: chaptersMatch ? `${chaptersMatch[1]} Chapters` : '?',
            views: viewsMatch ? `${viewsMatch[1]} views` : '?',
            characters: followersMatch ? `${followersMatch[1]} Followers` : '?'
          });
        }
      });
    } catch (error: any) {
      console.warn("Scraping failed. Using fallback data.", error.message);
    }

    return { novels, page: Number(page), url, isMock: novels.length === 0 };
  }
}

async function run() {
  const scraper = new SmartScraper();
  const res = await scraper.searchNovels({ query: '' });
  console.log("Found novels:", res.novels.length);
  if (res.novels.length > 0) {
    console.log(res.novels[0]);
  }
}

run();
