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

  <div class="app-container" :class="{ 'mobile-layout': isMobile, 'desktop-layout': !isMobile }">
    <!-- Mobile layout -->
    <template v-if="isMobile">
      <!-- Room info (top of screen) -->
      <div class="room-info-mobile" v-if="!loginDialog">
        <div class="room-code">Комната: {{ roomCode }}</div>
        <div class="room-actions">
          <q-btn flat round dense icon="content_copy" @click="copyRoomCode" />
          <q-btn flat round dense icon="share" @click="shareRoom" />
          <q-btn flat round dense icon="logout" @click="leaveRoom" />
          <q-avatar v-if="telegramPhotoUrl" size="32px">
            <img :src="telegramPhotoUrl" />
          </q-avatar>
        </div>
      </div>

      <!-- Search bar (always visible) -->
      <div class="search-bar">
        <q-btn 
          v-show="showSearchResults" 
          flat 
          round 
          dense 
          icon="arrow_back" 
          class="back-button" 
          @click="closeSearchResults"
        />
        <q-input 
          dark 
          standout 
          v-model="searchRequest" 
          :loading="isSearching" 
          placeholder="Поиск музыки"
          class="search-input dark-input"
          @focus="onSearchFocus"
          @keyup.enter="performSearch"
        >
          <template v-slot:append>
            <q-icon name="search" @click="performSearch" />
          </template>
        </q-input>
      </div>

      <!-- Content area -->
      <div 
        class="content-area" 
        :class="{ 'search-mode': showSearchResults }"
      >
        <q-scroll-area class="scroll-area">
          <template v-if="showSearchResults">
            <q-list v-if="searchResults.length" dense bordered padding class="rounded-borders search-results">
              <q-item 
                clickable 
                v-ripple 
                v-for="track in searchResults" 
                :key="track.id" 
                @click="addMusicInQueue(track)"
              >
                <q-avatar size="50px" :rounded="track.objType === 'album'">
                  <img :src="track.coverUri">
                </q-avatar>
                <q-avatar size="25px" class="q-mr-none" style="right: 15px; top: 30px">
                  <img :src="track.type === 'yandex' ? 'https://img.icons8.com/?size=100&id=9OFkKNlsMDfv&format=png&color=000000' : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Circle-icons-music.svg/1024px-Circle-icons-music.svg.png'">
                </q-avatar>
                <q-item-section class="q-ml-md" style="overflow: hidden;">
                  <q-item-label style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                    {{ truncateText(track.title, 30) }}
                  </q-item-label>
                  <q-item-label caption style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                    {{ truncateText(track.artists.join(", "), 30) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="empty-state">
              <q-icon name="search" size="xl" />
              <p>Введите запрос для поиска</p>
            </div>
          </template>
          <template v-else>
            <q-list v-if="queue.length" dense bordered padding class="rounded-borders queue-list">
              <q-item 
                clickable 
                v-ripple 
                v-for="track in queue" 
                :key="track.id" 
                @click="setMusic(track)"
              >
                <q-avatar size="50px" :rounded="track.objType === 'album'">
                  <img :src="track.coverUri">
                </q-avatar>
                <q-avatar size="25px" class="q-mr-none" style="right: 15px; top: 30px">
                  <img :src="track.type === 'yandex' ? 'https://img.icons8.com/?size=100&id=9OFkKNlsMDfv&format=png&color=000000' : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Circle-icons-music.svg/1024px-Circle-icons-music.svg.png'">
                </q-avatar>
                <q-item-section class="q-ml-md" style="overflow: hidden;">
                  <q-item-label style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                    {{ truncateText(track.title, 30) }}
                  </q-item-label>
                  <q-item-label caption style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                    {{ truncateText(track.artists.join(", "), 30) }}
                  </q-item-label>
                </q-item-section>
                <q-spinner-audio v-show="track.isPlaying" color="secondary" size="30" />
              </q-item>
            </q-list>
            <div v-else class="empty-state">
              <q-icon name="queue_music" size="xl" />
              <p>Очередь пуста</p>
            </div>
          </template>
        </q-scroll-area>
      </div>

      <!-- Player (fixed at bottom) -->
      <div class="player-container">
        <AudioPlayer 
          ref="audioPlayer" 
          :option="audioPlayerOptions" 
          @loadedmetadata="onMetadataLoaded"
          @timeupdate="updateMusicCurrentTimePing" 
          @progress-click="onProgressClick" 
          @play="onPlay" 
          @pause="onPause"
          @nextTrack="onNextTrack" 
        />
      </div>
    </template>

    <!-- Desktop layout -->
    <template v-else>
      <div class="desktop-content">
        <!-- Left side - Room info and Queue -->
        <div class="queue-section">
          <!-- Room info block -->
          <div class="room-info-desktop" v-if="!loginDialog">
            <div class="room-code">Комната: {{ roomCode }}</div>
            <div class="room-actions">
              <q-btn flat round dense icon="content_copy" @click="copyRoomCode" />
              <q-btn flat round dense icon="share" @click="shareRoom" />
              <q-btn flat round dense icon="logout" @click="leaveRoom" />
              <q-avatar v-if="telegramPhotoUrl" size="32px">
                <img :src="telegramPhotoUrl" />
              </q-avatar>
            </div>
          </div>

          <q-scroll-area class="scroll-area">
            <q-list v-if="queue.length" dense bordered padding class="rounded-borders queue-list">
              <q-item 
                clickable 
                v-ripple 
                v-for="track in queue" 
                :key="track.id" 
                @click="setMusic(track)"
              >
                <q-avatar size="50px" :rounded="track.objType === 'album'">
                  <img :src="track.coverUri">
                </q-avatar>
                <q-avatar size="25px" class="q-mr-none" style="right: 15px; top: 30px">
                  <img :src="track.type === 'yandex' ? 'https://img.icons8.com/?size=100&id=9OFkKNlsMDfv&format=png&color=000000' : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Circle-icons-music.svg/1024px-Circle-icons-music.svg.png'">
                </q-avatar>
                <q-item-section class="q-ml-md" style="overflow: hidden;">
                  <q-item-label style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">
                    {{ truncateText(track.title, 40) }}
                  </q-item-label>
                  <q-item-label caption style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">
                    {{ truncateText(track.artists.join(", "), 40) }}
                  </q-item-label>
                </q-item-section>
                <q-spinner-audio v-show="track.isPlaying" color="secondary" size="30" />
              </q-item>
            </q-list>
            <div v-else class="empty-state">
              <q-icon name="queue_music" size="xl" />
              <p>Очередь пуста</p>
            </div>
          </q-scroll-area>
        </div>

        <!-- Right side - Search and Player -->
        <div class="right-section">
          <!-- Search bar -->
          <div class="search-bar">
            <q-input 
              dark 
              standout 
              v-model="searchRequest" 
              :loading="isSearching" 
              placeholder="Поиск музыки"
              class="search-input dark-input"
              @keyup.enter="performSearch"
            >
              <template v-slot:append>
                <q-icon name="search" @click="performSearch" />
              </template>
            </q-input>
          </div>

          <!-- Search results (always visible in desktop) -->
          <div class="search-results-section">
            <q-scroll-area class="scroll-area">
              <q-list v-if="searchResults.length" dense bordered padding class="rounded-borders search-results">
                <q-item 
                  clickable 
                  v-ripple 
                  v-for="track in searchResults" 
                  :key="track.id" 
                  @click="addMusicInQueue(track)"
                >
                  <q-avatar size="50px" :rounded="track.objType === 'album'">
                    <img :src="track.coverUri">
                  </q-avatar>
                  <q-avatar size="25px" class="q-mr-none" style="right: 15px; top: 30px">
                    <img :src="track.type === 'yandex' ? 'https://img.icons8.com/?size=100&id=9OFkKNlsMDfv&format=png&color=000000' : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Circle-icons-music.svg/1024px-Circle-icons-music.svg.png'">
                  </q-avatar>
                  <q-item-section class="q-ml-md" style="overflow: hidden;">
                    <q-item-label style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">
                      {{ truncateText(track.title, 40) }}
                    </q-item-label>
                    <q-item-label caption style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">
                      {{ truncateText(track.artists.join(", "), 40) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="empty-state">
                <q-icon name="search" size="xl" />
                <p>Введите запрос для поиска</p>
              </div>
            </q-scroll-area>
          </div>

          <!-- Player (fixed at bottom of right section) -->
          <div class="player-container">
            <AudioPlayer 
              ref="audioPlayer" 
              :option="audioPlayerOptions" 
              @loadedmetadata="onMetadataLoaded"
              @timeupdate="updateMusicCurrentTimePing" 
              @progress-click="onProgressClick" 
              @play="onPlay" 
              @pause="onPause"
              @nextTrack="onNextTrack" 
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import AudioPlayer from '../components/AudioPlayer.vue';

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
      volume: 0.2,
      loginDialog: true,
      isSearching: false,
      isMobile: false,
      roomCode: '',
      showSearchResults: false,
    };
  },
  computed: {
    telegramPhotoUrl() {
      return window?.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null;
    }
  },
  methods: {
    truncateText(text, maxLength) {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

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

    copyRoomCode() {
      navigator.clipboard.writeText(this.roomCode)
        .then(() => {
          this.$q.notify({
            message: 'Код комнаты скопирован',
            color: 'positive'
          });
        })
        .catch(err => {
          console.error('Ошибка копирования:', err);
        });
    },

    shareRoom() {
      if (navigator.share) {
        navigator.share({
          title: 'Присоединяйтесь к моей музыкальной комнате',
          text: `Код комнаты: ${this.roomCode}`,
          url: window.location.href
        }).catch(err => {
          console.error('Ошибка при попытке поделиться:', err);
        });
      } else {
        this.copyRoomCode();
        this.$q.notify({
          message: 'Ссылка скопирована в буфер',
          color: 'positive'
        });
      }
    },

    leaveRoom() {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url);
      this.loginDialog = true;
      this.roomCode = '';
      if (this.ws) {
        this.ws.close();
      }
    },

    onSearchFocus() {
      if (this.isMobile) {
        this.showSearchResults = true;
      }
    },

    closeSearchResults() {
      if (this.isMobile) {
        this.showSearchResults = false;
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
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const host = window.location.host
      this.ws = new WebSocket(`${protocol}://${host}/ws/${this.roomCode}`)

      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');
        this.wsIsConnected = true;
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'pong' }));
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        console.log(`<< ${type}`, data ? data : '');
        switch (type) {
          case 'searchMusic':
            this.searchResults = data;
            this.isSearching = false;
            if (!this.isMobile) {
              this.showSearchResults = true;
            }
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
        clearInterval(this.pingInterval);
      };

      this.ws.onerror = () => {
        clearInterval(this.pingInterval);
      };
    },

    performSearch() {
      if (this.searchRequest.trim()) {
        this.isSearching = true;
        this.ws.send(
          JSON.stringify({ type: 'searchMusic', data: this.searchRequest })
        );
      }
    },

    updateAudioPlayerOptions() {
      if (this.queue.length) {
        console.log('updateAudioPlayerOptions', this.queue);
        this.audioPlayerOptions.src = this.queue[0].src;
        this.audio.currentTime = this.queue[0].currentTime;
        this.audioPlayerOptions.coverImage = this.queue[0].coverUri;
        this.audioPlayerOptions.title = this.queue[0].title;
        this.audioPlayerOptions.author = `${this.queue[0].artists.join(", ")}`
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
      console.log('>>', 'updateMusicIsPlaying', true);
      this.ws.send(JSON.stringify({
        type: 'updateMusicIsPlaying',
        data: { isPlaying: true }
      }));
    },

    onPause() {
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

    checkScreenSize() {
      this.isMobile = window.innerWidth < 768;
      if (this.isMobile) {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      } else {
        this.showSearchResults = true;
      }
    },

    handleOrientationChange() {
      window.location.reload();
    }
  },
  mounted() {
    this.keepConnectionToWS();
    this.checkScreenSize();
    
    window.addEventListener('orientationchange', this.handleOrientationChange);
    window.addEventListener('resize', this.checkScreenSize);

    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');

    if (room) {
      this.roomCode = room;
      this.loginDialog = false;
      this.connectToServer();
    }

    this.$nextTick(() => {
      if (this.$refs.audioPlayer?.audioPlayer) {
        this.audio = this.$refs.audioPlayer.audioPlayer;
      }
    });
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkScreenSize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
  }
};
</script>

<style lang="scss" scoped>
:root {
  --vh: 1vh;
}

.app-container {
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  width: 100vw;
  overflow: hidden;
  background: #121212;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  &.mobile-layout {
    .room-info-mobile {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
      
      .room-code {
        font-size: 14px;
        font-weight: 500;
      }
      
      .room-actions {
        display: flex;
        gap: 8px;
        
        button {
          color: white;
        }
      }
    }

    .search-bar {
      padding: 10px;
      background: #1e1e1e;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

      .search-input {
        flex: 1;
        
        &.dark-input {
          :deep(.q-field__control) {
            background: #2a2a2a !important;
            color: white !important;
          }
          
          :deep(.q-field__native) {
            color: white !important;
          }
        }
      }

      .back-button {
        color: white;
      }
    }

    .content-area {
      flex: 1;
      overflow: hidden;
      transition: all 0.3s ease;

      &.search-mode {
        background: #1e1e1e;
      }

      .scroll-area {
        height: 100%;
        width: 100%;

        .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #666;
          padding: 20px;
          text-align: center;

          p {
            margin-top: 10px;
            font-size: 16px;
          }
        }

        .queue-list, .search-results {
          background: #1e1e1e;
          border-radius: 12px;
          margin: 10px;
          border: 1px solid #333;
        }
      }
    }

    .player-container {
      background: #1e1e1e;
      padding: 10px;
      border-top: 1px solid #333;
      position: sticky;
      bottom: 0;
    }
  }

  &.desktop-layout {
    .desktop-content {
      display: flex;
      height: 100%;
      width: 100%;

      .queue-section {
        width: 40%;
        max-width: 400px;
        border-right: 1px solid #333;
        display: flex;
        flex-direction: column;

        .room-info-desktop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #1e1e1e;
          border-bottom: 1px solid #333;
          
          .room-code {
            font-size: 16px;
            font-weight: 500;
          }
          
          .room-actions {
            display: flex;
            gap: 8px;
            
            button {
              color: white;
            }
          }
        }

        .scroll-area {
          height: 100%;
          padding: 10px;

          .empty-state {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #666;
            padding: 20px;
            text-align: center;

            p {
              margin-top: 10px;
              font-size: 16px;
            }
          }

          .queue-list {
            background: #1e1e1e;
            border-radius: 12px;
            border: 1px solid #333;
          }
        }
      }

      .right-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;

        .search-bar {
          padding: 10px;
          background: #1e1e1e;
          border-bottom: 1px solid #333;

          .search-input {
            width: 100%;
            
            &.dark-input {
              :deep(.q-field__control) {
                background: #2a2a2a !important;
                color: white !important;
              }
              
              :deep(.q-field__native) {
                color: white !important;
              }
            }
          }
        }

        .search-results-section {
          flex: 1;
          overflow: hidden;
          min-height: 0;
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #333;

          .scroll-area {
            flex: 1;
            width: 100%;
            padding: 10px;

            .empty-state {
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              color: #666;
              padding: 20px;
              text-align: center;

              p {
                margin-top: 10px;
                font-size: 16px;
              }
            }

            .search-results {
              background: #1e1e1e;
              border-radius: 12px;
              border: 1px solid #333;
            }
          }
        }

        .player-container {
          background: #1e1e1e;
          padding: 10px;
        }
      }
    }
  }
}

.q-item {
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 4px;

  &:hover {
    background: #333 !important;
  }
}

.q-item__label--caption {
  opacity: 0.7;
}

@media screen and (orientation: landscape) {
  .app-container.mobile-layout {
    .content-area {
      max-height: calc(100vh - 120px) !important;
    }
  }
}
</style>