import axios from 'axios';

async function test() {
  try {
    const targetUrl = 'https://www.royalroad.com/fictions/best-rated?page=1';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const res = await axios.get(proxyUrl);
    console.log("SUCCESS length:", res.data.contents.length);
  } catch (e: any) {
    console.log("ERROR", e.message);
  }
}

test();
