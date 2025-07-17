import axios from 'axios';
import * as cheerio from 'cheerio';

async function getTracksFromMuzlen(query) {
    try {
        const { data } = await axios.get(`https://muzlen.me/?q=${encodeURIComponent(query)}`);
        const $ = cheerio.load(data);
        const songs = [];

        $('.mp3').each((i, elem) => {
            let id = i;
            let coverUri = $(elem).find('.mp3__img').attr('data-src');
            let title = $(elem).find('.mp3__text span').text().trim().split('-')[1];
            let artists = [$(elem).find('.mp3__text span').text().trim().split('-')[0] || 'Неизвестно'];
            let src = $(elem).find('.mp3__button--play').attr('mp3source');

            songs.push({
              id,
              coverUri,
              title,
              artists,
              type: 'muzpan',
              src,
              objType: 'track'
            });
            
        });

        return songs;
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
    }
}

export { getTracksFromMuzlen };