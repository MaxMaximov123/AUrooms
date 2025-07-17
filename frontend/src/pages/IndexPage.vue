<template>
  <q-dialog v-model="loginDialog" persistent backdrop-filter="blur(4px) saturate(150%)">
    <q-card style="width: 320px" class="text-center">
      <q-card-section class="text-h5">
        Добро пожаловать
      </q-card-section>

      <q-card-section>
        <q-btn rounded color="primary" label="Создать комнату" class="q-mb-sm full-width" @click="createRoom" />
        <q-input dense filled v-model="roomCode" label="Код комнаты" class="q-mb-sm" />
        <q-btn rounded color="secondary" label="Войти в комнату" class="full-width" @click="joinRoom" />
      </q-card-section>
    </q-card>
  </q-dialog>
  <q-splitter v-model="splitterValue" class="splitter" :horizontal="isSplitterHorizontal">
    <template v-slot:before>
      <div class="search-container">
        <q-input dark Standard v-model="searchRequest" :loading="isSearching" input-class="text-left text-h6" class=""
          @keyup.enter="() => {
    this.isSearching = true;
    this.ws.send(
      JSON.stringify({ type: 'searchMusic', data: searchRequest })
    );
  }">
        </q-input>
        <q-scroll-area style="height: 45lvh;">
          <q-list v-if="this.searchResults.length" dense bordered padding class="rounded-borders">
            <q-item clickable v-ripple v-for="track in this.searchResults" :key="track.id" @click="
    this.addMusicInQueue(track)
    ">
              <q-avatar size="50px" :rounded="track.objType === 'album'" class="">
                <img :src="track.coverUri">
              </q-avatar>
              <q-avatar size="25px" class="q-mr-none" style="right: 15px; top: 30px">
                <img
                  :src="track.type === 'yandex' ? 'https://img.icons8.com/?size=100&id=9OFkKNlsMDfv&format=png&color=000000' : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Circle-icons-music.svg/1024px-Circle-icons-music.svg.png'">
              </q-avatar>
              <q-item-section class="q-ml-md">
                <q-item-label>{{ track.title }}</q-item-label>
                <q-item-label caption>{{ track.artists.join(", ") }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
        <q-scroll-area style="height: 45lvh;">
          <q-list v-if="this.queue.length" dense bordered padding class="rounded-borders">
            <q-item clickable v-ripple v-for="track in this.queue" :key="track.id" @click="
    this.setMusic(track)
    ">
              <q-avatar size="50px" class=""
              :rounded="track.objType === 'album'">
                <img :src="track.coverUri">
              </q-avatar>
              <q-avatar size="25px" class="q-mr-none" style="right: 15px; top: 30px">
                <img
                  :src="track.type === 'yandex' ? 'https://img.icons8.com/?size=100&id=9OFkKNlsMDfv&format=png&color=000000' : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Circle-icons-music.svg/1024px-Circle-icons-music.svg.png'">
              </q-avatar>
              <q-item-section class="q-ml-md">
                <q-item-label>{{ track.title }}</q-item-label>
                <q-item-label caption>{{ track.artists.join(", ") }}</q-item-label>
              </q-item-section>
              <q-spinner-audio v-show="track.isPlaying" color="secondary" size="30" />
            </q-item>
          </q-list>
        </q-scroll-area>
      </div>
    </template>

    <template v-slot:after>
      <div class="audio-player-container">
        <AudioPlayer ref="audioPlayer" :option="audioPlayerOptions" @loadedmetadata="onMetadataLoaded"
          @timeupdate="updateMusicCurrentTimePing" @progress-click="onProgressClick" @play="onPlay" @pause="onPause"
          @progress-start="console.log('progress-start')" @progress-end="console.log('progress-end')"
          @nextTrack="onNextTrack" />
      </div>
    </template>
  </q-splitter>
</template>

<script>
import axios from 'axios';
import AudioPlayer from '../components/AudioPlayer.vue';
// import 'vue3-audio-player/dist/style.css';

export default {
  components: {
    AudioPlayer,
  },
  data() {
    return {
      audioPlayerOptions: {
        src: '',
        coverRotate: false,
      },
      queue: [],
      audio: {
        currentTime: null,
      },
      ws: null,
      wsIsConnected: true,
      searchRequest: '',
      searchResults: [],
      splitterValue: 20,
      volume: 0.2,
      loginDialog: true,
      isSearching: false,
      screenWidth: null,
      isSplitterHorizontal: true,
      roomCode: '',
    };
  },
  methods: {
    async createRoom() {
      try {
        const userId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 10000);
        const { data } = await axios.post('/api/rooms', { telegram_id: userId });
        this.roomCode = data.code;

        const url = new URL(window.location.href);
        url.searchParams.set('room', this.roomCode);
        window.history.replaceState({}, '', url);
        this.loginDialog = false;
        this.connectToServer();
      } catch (e) {
        console.error('Ошибка при создании комнаты', e);
      }
    },

    async joinRoom() {
      try {
        const { data } = await axios.get(`/api/rooms/${this.roomCode}`);
        if (data) {
          this.loginDialog = false;
          this.connectToServer();
        }
      } catch (e) {
        console.error('Комната не найдена', e);
      }
    },

    async keepConnectionToWS() {
      while (true) {
        if (!this.wsIsConnected) {
          this.connectToServer();
        }
        await this.waitForTimeout(2000);
      }
    },

    async waitForTimeout(time) {
      await new Promise((resolve) => setTimeout(resolve, time));
    },
    connectToServer() {
      // this.ws = new WebSocket('ws://192.168.1.6:8000');

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const host = window.location.host
      this.ws = new WebSocket(`${protocol}://${host}/ws/${this.roomCode}`)

      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');
        this.wsIsConnected = true;
        // this.ws.send(JSON.stringify({ type: 'joinMusic' }));
        // console.log(`>> joinMusic`);
      };

      this.ws.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        console.log(`<< ${type}`, data ? data : '');
        switch (type) {
          case 'searchMusic':
            this.searchResults = data;
            this.isSearching = false;
            break;

          case 'joinMusic':
            this.queue = data;
            this.updateAudioPlayerOptions();
            break;

          case 'nextTrack':
            this.queue.shift();
            if (this.queue.length) {
              this.queue[0].isPlaying = true;
              this.queue[0].currentTime = 0;
              this.updateAudioPlayerOptions();
              this.$refs.audioPlayer.play();
            } else {
              this.audioPlayerOptions = {};
              this.$refs.audioPlayer.pause();
            }
            break;

          case 'musicCurrentTimeUpdated':
            this.queue[0].currentTime = data;
            this.audio.currentTime = this.queue[0].currentTime;
            break;

          case 'queueUpdated':
            this.queue.push(data);
            if (this.queue.length === 1) {
              this.updateAudioPlayerOptions();
            }
            break;

          case 'musicIsPlayingUpdated':
            if (this.queue.length) {
              this.queue[0].isPlaying = data.isPlaying;
              this.queue[0].currentTime = data.currentTime;
              this.audio.currentTime = this.queue[0].currentTime;
              this.startPlaying();
            }
            break;

          default:
            break;
        } 
      };

      this.ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
        this.wsIsConnected = false;
      };
    },
    updateAudioPlayerOptions() {
      if (this.queue.length) {
        console.log('updateAudioPlayerOptions', this.queue);
        this.audioPlayerOptions.src = this.queue[0].src;
        this.audio.currentTime = this.queue[0].currentTime;
        this.audioPlayerOptions.coverImage = this.queue[0].coverUri;
        this.audioPlayerOptions.title = this.queue[0].title;
        this.audioPlayerOptions.author = `${this.queue[0].artists.join(", ")}`
        // this.startPlaying();
      }
    },
    addMusicInQueue(track) {
      console.log('>>', 'addMusicInQueue', track);
      this.ws.send(JSON.stringify({ type: 'addMusicInQueue', data: track }));
    },
    startPlaying() {
      console.log('startPlaying');
      if (this.queue[0].isPlaying) {
        this.$refs.audioPlayer.play();
      } else {
        this.$refs.audioPlayer.pause();
      }
    },
    onMetadataLoaded() {
      const duration = this.$refs.audioPlayer.audioPlayer.duration;

      console.log('onMetadataLoaded', this.queue[0]);

      this.ws.send(JSON.stringify({
        type: 'setTrackDuration',
        data: duration
      }));

      console.log('>>', 'setTrackDuration', duration);
      this.startPlaying();
    },
    updateMusicCurrentTimePing() {
      const currentTime = this.audio.currentTime;
      this.queue[0].currentTime = currentTime;
      console.log('>>', 'updateMusicCurrentTimePing', currentTime);
      this.ws.send(JSON.stringify({
        type: 'updateMusicCurrentTimePing',
        data: currentTime
      }));
    },
    onProgressClick() {
      const currentTime = this.audio.currentTime;
      this.queue[0].currentTime = currentTime;
      console.log('>>', 'updateMusicCurrentTime', currentTime);
      this.ws.send(JSON.stringify({
        type: 'updateMusicCurrentTime',
        data: currentTime
      }));
    },
    onPlay() {
      // this.queue[0].isPlaying = true;
      console.log('>>', 'updateMusicIsPlaying', true);
      this.ws.send(JSON.stringify({
        type: 'updateMusicIsPlaying',
        data: { isPlaying: true }
      }));
    },
    onPause() {
      // this.queue[0].isPlaying = false;
      console.log('>>', 'updateMusicIsPlaying', false);
      this.ws.send(JSON.stringify({
        type: 'updateMusicIsPlaying',
        data: { isPlaying: false }
      }));
    },

    onNextTrack(e) {
      console.log('>>', 'nextTrack');
      this.ws.send(JSON.stringify({
        type: 'nextTrack'
      }));
    },

    onScreenResize() {
      window.addEventListener("resize", () => { this.updateScreenWidth(); });
    },
    updateScreenWidth() {
      this.screenWidth = window.innerWidth;

      if (this.screenWidth > 700) {
        this.isSplitterHorizontal = false;
      } else {
        this.splitterValue = 68;
        this.isSplitterHorizontal = true;
      }
    },
  },
  mounted() {
    this.audio = this.$refs.audioPlayer.audioPlayer;
    this.audio.volume = this.volume;
    this.keepConnectionToWS();

    this.updateScreenWidth();
    this.onScreenResize();
  },

  created() {
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');

    if (room) {
      this.roomCode = room;
      this.loginDialog = false;
      this.connectToServer();
    }
  }
};
</script>

<style>

.splitter {
  height: 100lvh;
  position: fixed;
  width: 100lvw;
}

.search-container {
  width: 100%;
  height: 10lvh;
}

.audio-player-container {
  width: 100%;
}


@media (min-width: 700px) {
  .splitter {
    height: 100lvh;
    position: fixed;
  }

  .search-container {
    width: 100%;
    height: 100%;
  }

  .audio-player-container {
    width: 100%;
    height: 100%;
  }
}

</style>