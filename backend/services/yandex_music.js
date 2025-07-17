// import { getTrackUrl } from 'yandex-music-client/trackUrl';
import { YandexMusicClient } from 'yandex-music-client/YandexMusicClient.js';
import { YMApi } from "ym-api";
import { WrappedYMApi } from "ym-api";
import { getTrackUrl } from 'yandex-music-client/trackUrl.js';
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const wrappedApi = new WrappedYMApi();

const yandexMusicApiToken = 'y0_AgAAAAA0pF-hAAG8XgAAAADiigFjniAKZawzSdqwTItp0HWv-21nsVw';


const api = new YMApi();
await api.init({ access_token: yandexMusicApiToken, uid: 883187617});
await wrappedApi.init({ access_token: yandexMusicApiToken, uid: 883187617});

const client = new YandexMusicClient({
  BASE: "https://api.music.yandex.net:443",
  HEADERS: {
      'Authorization': `OAuth ${yandexMusicApiToken}`,
      'Accept-Language': 'ru'
  },
});


async function getTracksFromYandex(name) {
  try {

    let answer = [];

    let result = await api.searchAll(encodeURIComponent(name));
    let newTracks = result.tracks.results;
    newTracks.forEach(track => {
      answer.push({
        id: track.id,
        title: track.title,
        coverUri: 'https://' + track.coverUri.replace('%%', '200x200'),
        artists: track.artists.map(artist => artist.name),
        type: 'yandex',
        objType: 'track'
      });
    });

    // let newPlaylist = result.playlists.results;
    // newPlaylist.forEach(track => {
    //   answer.push({
    //     id: track.kind,
    //     title: track.title,
    //     coverUri: 'https://' + track.ogImage.replace('%%', '200x200'),
    //     artists: [track.owner.name],
    //     type: 'yandex',
    //     objType: 'album'
    //   });
    // });

    // answer.push(...(await getTracksFromMuzpan(name)));

    return answer;

  } catch (e) {
    console.log(`API error: ${e.message}`);
    return [];
  }
}

async function getTrackUrlYandex(trackId) {
  try {
    return await getTrackUrl(client, trackId);
  } catch (e) {
    console.error(`Failed to get track URL for trackId ${trackId}:`, e.message);
    return null;
  }
}

export { getTracksFromYandex, getTrackUrlYandex, wrappedApi };