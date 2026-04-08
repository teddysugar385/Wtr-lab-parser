import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

import * as qs from "qs";

// Advanced Scraper Class
export class SmartScraper {
  private baseUrl = 'https://www.wuxiaspot.com';
  
  // Bypass Engine for protected content
  private bypassEngine = {
    getHeaders: () => ({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    })
  };

  private async fetchWithRetry(url: string, options: any = {}, retries = 3): Promise<{ data: string, finalUrl: string }> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios({
          url,
          ...options,
          headers: {
            ...this.bypassEngine.getHeaders(),
            ...options.headers
          },
          timeout: 30000
        });
        return { data: response.data, finalUrl: response.request?.res?.responseUrl || url };
      } catch (error: any) {
        if (i === retries - 1) throw error;
        await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
      }
    }
    throw new Error('Failed after retries');
  }

  async searchNovels(params: any) {
    const { query, page = 1, minChapters, status, orderBy, order, genres, searchid } = params;
    let novels: any[] = [];
    let html = '';
    let url = '';
    
    let currentPage = Number(page);
    let pagesFetched = 0;
    const maxPagesToFetch = 3; // Prevent infinite loops
    const targetNovelCount = 15; // Try to get at least this many novels

    try {
      while (novels.length < targetNovelCount && pagesFetched < maxPagesToFetch) {
        let currentHtml = '';
        if (query) {
          if (params.searchid && (currentPage > 1 || pagesFetched > 0)) {
            url = `${this.baseUrl}/e/search/result/index.php?page=${currentPage - 1}&searchid=${params.searchid}`;
            const res = await this.fetchWithRetry(url);
            currentHtml = res.data;
          } else {
            url = `${this.baseUrl}/e/search/index.php`;
            const data = qs.stringify({
              show: 'title,newstext,smalltext,writer',
              tempid: '1',
              tbname: 'news',
              keyboard: query
            });
            
            const res = await this.fetchWithRetry(url, {
              method: 'POST',
              data,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });
            currentHtml = res.data;
            
            const searchidMatch = res.finalUrl.match(/searchid=(\d+)/);
            if (searchidMatch) {
              params.searchid = searchidMatch[1];
            }
          }
          if (pagesFetched === 0) html = currentHtml; // Save for mock check
        } else {
          // If no query, use WuxiaSpot's native list filtering
          let genreParam = 'all';
          if (genres && genres.length > 0) {
            const genreList = genres.split(',');
            if (genreList[0]) {
              genreParam = genreList[0].toLowerCase().replace(/\s+/g, '-');
            }
          }

          let statusParam = 'all';
          if (status && status !== 'All') {
            statusParam = status; // 'Completed' or 'Ongoing'
          }

          let sortParam = 'newstime';
          if (orderBy === 'View' || orderBy === 'Reader') {
            sortParam = 'onclick';
          } else if (orderBy === 'Addition Date') {
            sortParam = 'newstime';
          }

          url = `${this.baseUrl}/list/${genreParam}/${statusParam}-${sortParam}-${currentPage - 1}.html`;
          const res = await this.fetchWithRetry(url);
          currentHtml = res.data;
          if (pagesFetched === 0) html = currentHtml;
        }

        const $ = cheerio.load(currentHtml);
        let pageNovels: any[] = [];

        $('.novel-item').each((i, el) => {
          const a = $(el).find('a');
          const link = a.attr('href');
          const title = a.attr('title') || a.find('.novel-title').text().trim();
          const image = a.find('img').attr('data-src') || a.find('img').attr('src');
          
          const statsText = a.find('.novel-stats').text().replace(/\s+/g, ' ').trim();
          
          let chapters = '';
          let novelStatus = '';
          
          const chaptersMatch = statsText.match(/(\d+)\s*Chapters/i);
          if (chaptersMatch) chapters = `${chaptersMatch[1]} Chapters`;
          
          const statusMatch = statsText.match(/Status:\s*(\w+)/i);
          if (statusMatch) novelStatus = statusMatch[1];
          
          if (link && title) {
            pageNovels.push({
              id: link.replace('/novel/', '').replace('.html', ''),
              title,
              rawTitle: title,
              link: `${this.baseUrl}${link}`,
              image: image ? `${this.baseUrl}${image}` : '',
              status: novelStatus || 'Unknown',
              chapters: chapters || 'Unknown',
              views: 'Unknown',
              characters: ''
            });
          }
        });

        // Apply in-memory filters to this page's novels
        if (minChapters && minChapters !== 'Any') {
          const min = parseInt(minChapters, 10);
          pageNovels = pageNovels.filter(n => {
            const chMatch = n.chapters.match(/(\d+)/);
            if (chMatch) {
              return parseInt(chMatch[1], 10) >= min;
            }
            return false;
          });
        }

        if (status && status !== 'All') {
          pageNovels = pageNovels.filter(n => n.status.toLowerCase() === status.toLowerCase());
        }

        novels = [...novels, ...pageNovels];
        
        // If we found no novels on this page (before filtering), we've reached the end
        if ($('.novel-item').length === 0) {
          break;
        }

        currentPage++;
        pagesFetched++;
      }
    } catch (error: any) {
      console.warn("Scraping failed. Using fallback data.", error.message);
    }

    // Fallback data if request fails
    if (novels.length === 0) {
      console.log("No novels found. Returning mock data.");
      novels = this.getMockNovels(query);
    }

    // Apply sorting
    if (orderBy) {
      if (orderBy === 'Addition Date' || orderBy === 'View' || orderBy === 'Reader') {
        // Native sort is always descending. Reverse if ascending is requested.
        if (order === 'Ascending') {
          novels.reverse();
        }
      } else {
        novels.sort((a, b) => {
          let valA: any = 0;
          let valB: any = 0;

          if (orderBy === 'Chapter') {
            const matchA = a.chapters.match(/(\d+)/);
            const matchB = b.chapters.match(/(\d+)/);
            valA = matchA ? parseInt(matchA[1], 10) : 0;
            valB = matchB ? parseInt(matchB[1], 10) : 0;
          } else if (orderBy === 'Name') {
            valA = a.title.toLowerCase();
            valB = b.title.toLowerCase();
          }

          if (valA < valB) return order === 'Ascending' ? -1 : 1;
          if (valA > valB) return order === 'Ascending' ? 1 : -1;
          return 0;
        });
      }
    }

    // Return the next page number to fetch if the user clicks "Load More"
    return { novels, page: currentPage, url, isMock: novels.length > 0 && html === '', searchid: params.searchid };
  }

  private getMockNovels(query?: string) {
    const mockData = [
      {
        id: '1',
        title: 'QUICK TRANSMIGRATION: THE CHARISMATIC PASSERBY ALWAYS COLLAPSES THE PLOT',
        rawTitle: '快穿之万人迷路人甲总是崩剧情',
        image: 'https://picsum.photos/seed/novel1/200/300',
        status: 'Completed',
        views: '4.2K views',
        chapters: '391 Chapters',
        characters: '781K Characters',
        description: '<p>This is a mock description for the novel. The protagonist transmigrates into various worlds as a passerby, but somehow always ends up becoming the center of attention and collapsing the original plot. What will happen next?</p>'
      },
      {
        id: '2',
        title: 'THE VILLAINOUS MASTERMIND IS ACTUALLY A FOOL',
        rawTitle: '反派大佬其实是个傻子',
        image: 'https://picsum.photos/seed/novel2/200/300',
        status: 'Ongoing',
        views: '12.5K views',
        chapters: '124 Chapters',
        characters: '320K Characters',
        description: '<p>Everyone thought the villainous mastermind was a terrifying genius, but it turns out he is actually a fool! A hilarious comedy of misunderstandings ensues.</p>'
      },
      {
        id: '3',
        title: 'REINCARNATED AS THE SWORD SAINT\'S DAUGHTER',
        rawTitle: '转生为剑圣的女儿',
        image: 'https://picsum.photos/seed/novel3/200/300',
        status: 'Ongoing',
        views: '8.9K views',
        chapters: '89 Chapters',
        characters: '150K Characters',
        description: '<p>Reincarnated into a fantasy world as the daughter of the strongest Sword Saint. She must learn to wield the sword and carve her own path in this new life.</p>'
      },
      {
        id: '4',
        title: 'I JUST WANT TO FARM IN ANOTHER WORLD',
        rawTitle: '我只想在异世界种田',
        image: 'https://picsum.photos/seed/novel4/200/300',
        status: 'Completed',
        views: '45K views',
        chapters: '512 Chapters',
        characters: '1.2M Characters',
        description: '<p>Transported to a magical world, our hero ignores the demon king and the heroes, choosing instead to focus on his true passion: farming. Watch his farm grow into an empire!</p>'
      },
      {
        id: '5',
        title: 'THE DEMON KING\'S DAILY LIFE',
        rawTitle: '魔王的日常',
        image: 'https://picsum.photos/seed/novel5/200/300',
        status: 'Hiatus',
        views: '2.1K views',
        chapters: '45 Chapters',
        characters: '80K Characters',
        description: '<p>A slice-of-life story about the retired Demon King trying to live a peaceful life in the human realm, but his past subordinates keep causing trouble.</p>'
      }
    ];

    if (query) {
      return mockData.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.rawTitle.includes(query));
    }
    return mockData;
  }

  async getNovelDetails(id: string) {
    let url = `${this.baseUrl}/novel/${id}.html`;
    let res = await this.fetchWithRetry(url);
    let html = res.data;
    let $ = cheerio.load(html);
    
    const title = $('.novel-title').text().trim() || $('h1').text().trim();
    const author = $('.author').text().replace('Author:', '').replace('Author：', '').trim();
    
    // Try multiple selectors for the synopsis/description
    const description = $('.novel-intro').html()?.trim() || 
                        $('.novel-summary').html()?.trim() || 
                        $('.summary').html()?.trim() || 
                        $('.description').html()?.trim() || 
                        $('.desc').html()?.trim() || 
                        $('#intro').html()?.trim() || 
                        $('.content').html()?.trim() || 
                        $('.novel-detail-intro').html()?.trim() ||
                        '';
                        
    const imagePath = $('.cover img').attr('data-src') || $('.cover img').attr('src');
    const image = imagePath ? `${this.baseUrl}${imagePath}` : '';
    
    const genresSet = new Set<string>();
    $('.categories a, .tags a').each((i, el) => {
      genresSet.add($(el).text().trim());
    });
    const genres = Array.from(genresSet);
    
    const chapters: any[] = [];
    const chapterIds = new Set<string>();

    let pageCount = 0;
    let hasNextPage = true;

    while (hasNextPage && pageCount < 50) {
      $('.chapter-list a, .chapters a, #chapter-list a, .list-charts a, .chp-item a').each((i, el) => {
        const link = $(el).attr('href');
        const text = $(el).text().trim();
        if (link) {
          const chapterId = link.replace('/novel/', '').replace('.html', '');
          if (!chapterIds.has(chapterId)) {
            chapterIds.add(chapterId);
            chapters.push({
              id: chapterId,
              title: text,
              link: `${this.baseUrl}${link}`
            });
          }
        }
      });

      // Try to find next page link for chapters
      const nextLink = $('.pagination a:contains("Next"), .pagination a:contains("»"), .next-page, a.next, .pagination a:contains(">")').not(':contains(">>")').attr('href');
      if (nextLink && nextLink !== 'javascript:;' && nextLink !== '#' && !nextLink.includes(url)) {
        const nextUrl = nextLink.startsWith('http') ? nextLink : `${this.baseUrl}${nextLink.startsWith('/') ? '' : '/'}${nextLink}`;
        if (nextUrl === url) {
          hasNextPage = false;
        } else {
          url = nextUrl;
          try {
            const res = await this.fetchWithRetry(url);
            html = res.data;
            $ = cheerio.load(html);
            pageCount++;
          } catch (e) {
            hasNextPage = false;
          }
        }
      } else {
        hasNextPage = false;
      }
    }

    // If chapters are still empty, try to find them in select options
    if (chapters.length === 0) {
      $('select option').each((i, el) => {
        const link = $(el).attr('value');
        const text = $(el).text().trim();
        if (link && link.includes('/novel/')) {
           const chapterId = link.replace('/novel/', '').replace('.html', '');
           if (!chapterIds.has(chapterId)) {
             chapterIds.add(chapterId);
             chapters.push({
               id: chapterId,
               title: text,
               link: `${this.baseUrl}${link}`
             });
           }
        }
      });
    }

    return {
      id, title, author, description, image, genres, chapters
    };
  }

  async getChapterContent(novelId: string, chapterId: string) {
    const url = `${this.baseUrl}/novel/${chapterId}.html`;
    const res = await this.fetchWithRetry(url);
    const html = res.data;
    const $ = cheerio.load(html);
    
    const title = $('.chapter-title').text().trim() || $('h1').text().trim();
    
    // Extract content, removing ads or unwanted elements
    $('.chapter-content script, .chapter-content div[align="center"]').remove();
    const contentHtml = $('.chapter-content').html() || '';
    const contentText = $('.chapter-content').text().trim();

    // Navigation
    const prevLink = $('.btn-prev').attr('href') || $('a:contains("Prev")').attr('href');
    const nextLink = $('.btn-next').attr('href') || $('a:contains("Next")').attr('href');

    const extractChapterId = (link: string | undefined) => {
      if (!link || link === 'javascript:;') return null;
      const match = link.match(/\/novel\/(.+)\.html/);
      return match ? match[1] : null;
    };

    return {
      id: chapterId,
      novelId,
      title,
      contentHtml,
      contentText,
      prevId: extractChapterId(prevLink),
      nextId: extractChapterId(nextLink)
    };
  }
}

const scraper = new SmartScraper();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/novels/search", async (req, res) => {
    try {
      const result = await scraper.searchNovels(req.query);
      res.json(result);
    } catch (error: any) {
      console.error("Scraping error:", error.message);
      res.status(500).json({ error: "Failed to fetch novels", details: error.message });
    }
  });

  app.get("/api/novels/:id", async (req, res) => {
    try {
      const result = await scraper.getNovelDetails(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch novel details", details: error.message });
    }
  });

  app.get("/api/novels/:id/chapters/:chapterId", async (req, res) => {
    try {
      const result = await scraper.getChapterContent(req.params.id, req.params.chapterId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch chapter content", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
