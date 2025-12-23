<template>
  <q-card class="audio-player" flat>
    <q-card-section class="row items-center no-wrap q-pa-none">
      <!-- Album Cover with Play Button -->
      <div class="audio-player__cover relative-position">
        <q-avatar 
          size="60px" 
          :class="{ 'spin-anim': isPlaying && option_.coverRotate }"
          style="border-radius: 9999px; overflow: hidden;"
        >
          <img :src="option_.coverImage ? option_.coverImage : CoverImageDefault" />
        </q-avatar>
        <q-btn 
          round 
          dense 
          size="md"
          class="audio-player__play-btn absolute-center"
          :icon="isPlaying ? 'pause' : 'play_arrow'" 
          @click="togglePlayer"
        />
      </div>

      <!-- Track Info and Progress -->
      <div class="audio-player__info-progress column q-ml-sm" style="flex: 1;">
        <div class="audio-player__info">
          <div class="text-subtitle2 text-weight-medium ellipsis">{{ option_.title || 'Untitled' }}</div>
          <div class="text-caption text-grey-7 ellipsis">{{ option_.author || 'Unknown artist' }}</div>
        </div>

        <!-- Progress Bar -->
        <div class="audio-player__progress-container row items-center">
          <div
            ref="audioProgressWrap"
            class="audio-player__progress-wrap"
            @click.stop="handleClickProgressWrap"
          >
            <div
              ref="audioProgress"
              class="audio-player__progress"
              :style="{
                backgroundColor: option_.progressBarColor,
              }"
            />
            <div
              ref="audioProgressPoint"
              class="audio-player__progress-point"
              :style="{
                backgroundColor: option_.indicatorColor,
                boxShadow: `0 0 10px 0 ${option_.indicatorColor}`,
              }"
              @panstart="handleProgressPanStart"
              @panend="handleProgressPanEnd"
              @panmove="handleProgressPanMove"
            />
          </div>
          <span class="audio-player__time text-caption text-grey-7 q-ml-xs">
            {{ formatSecond(currentTime) }} / {{ totalTimeStr }}
          </span>
        </div>
      </div>

      <!-- Next Track Button -->
      <q-btn 
        flat 
        round 
        dense 
        size="md"
        icon="skip_next" 
        @click="nextTrack" 
        class="q-ml-sm"
      />
    </q-card-section>

    <!-- Hidden Audio Element -->
    <audio
      ref="audioPlayer"
      :src="option_.src"
      @ended="onAudioEnded"
      @play="onAudioPlay"
      @pause="onAudioPause"
      @loadedmetadata="onLoadMetaData"
      @timeupdate="onTimeUpdate"
    ></audio>
  </q-card>
</template>

<script>
import {
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toRefs,
  watch,
} from 'vue'
import Core from '@any-touch/core'
import Pan from '@any-touch/pan'
import { AudioPlayerOptionDefault } from './types'
import { formatSecond } from '../utils/util'
import CoverImageDefault from '../assets/images/cover.png'

const mergeOption = (option) => {
  return {
    src: option.src || AudioPlayerOptionDefault.src,
    title: option.title || AudioPlayerOptionDefault.title,
    author: option.author || AudioPlayerOptionDefault.author,
    autoPlay: option.autoPlay || AudioPlayerOptionDefault.autoPlay,
    coverImage: option.coverImage || AudioPlayerOptionDefault.coverImage,
    coverRotate: option.coverRotate || AudioPlayerOptionDefault.coverRotate,
    progressBarColor: option.progressBarColor || AudioPlayerOptionDefault.progressBarColor,
    indicatorColor: option.indicatorColor || AudioPlayerOptionDefault.indicatorColor,
  }
}

export default defineComponent({
  props: {
    option: {
      type: Object,
      default: () => AudioPlayerOptionDefault,
    },
  },
  emits: [
    'loadedmetadata',
    'playing',
    'play',
    'play-error',
    'timeupdate',
    'pause',
    'ended',
    'progress-start',
    'progress-end',
    'progress-move',
    'progress-click',
  ],
  setup(props, { emit }) {
    const audioPlayer = ref(null)
    const audioProgressWrap = ref(null)
    const audioProgressPoint = ref(null)
    const audioProgress = ref(null)
    const progressInterval = 200
    const option_ = ref(mergeOption(props.option))
    let toucher = null
    let timer = null
    const hasMediaSession = typeof navigator !== 'undefined' && 'mediaSession' in navigator
    const state = reactive({
      isPlaying: false,
      isDragging: false,
      currentTime: 0,
      totalTime: 0,
      totalTimeStr: '00:00',
    })

    const initState = () => {
      state.isPlaying = false
      state.isDragging = false
      state.currentTime = 0
      state.totalTime = 0
      state.totalTimeStr = '00:00'
    }

    const playUpdate = () => {
      if (state.isDragging) {
        return
      }
      const offsetLeft =
        (audioPlayer.value.currentTime / audioPlayer.value.duration) *
        audioProgressWrap.value.offsetWidth
      state.currentTime = audioPlayer.value.currentTime
      audioProgress.value.style.width = `${offsetLeft}px`
      setPointPosition(offsetLeft)
      emit('playing')

      // Sync Media Session position state during playback
      if (hasMediaSession && typeof navigator.mediaSession.setPositionState === 'function') {
        try {
          navigator.mediaSession.setPositionState({
            duration: audioPlayer.value.duration || state.totalTime || 0,
            playbackRate: audioPlayer.value.playbackRate || 1,
            position: audioPlayer.value.currentTime || state.currentTime || 0,
          })
        } catch (_) {}
      }
    }

    const startTimer = () => {
      clearTimer()
      timer = window.setInterval(playUpdate, progressInterval)
      state.isPlaying = true
    }

    const clearTimer = () => {
      if (timer) {
        window.clearInterval(timer)
        timer = null
      }
    }

    const play = () => {
      audioPlayer.value
        .play()
        .then(() => {
          startTimer()
          setTotalTime(audioPlayer.value.duration)
          // Update Media Session playback state
          if (hasMediaSession) {
            try { navigator.mediaSession.playbackState = 'playing' } catch (_) {}
          }
        })
        .catch((error) => {
          emit('play-error', error)
        })
    }

    const pause = () => {
      audioPlayer.value.pause()
      state.isPlaying = false
      // Update Media Session playback state
      if (hasMediaSession) {
        try { navigator.mediaSession.playbackState = 'paused' } catch (_) {}
      }
    }

    const togglePlayer = () => {
      if (state.isPlaying) {
        emit('pause')
      } else {
        emit('play')
      }
    }

    const nextTrack = () => {
      emit('nextTrack')
    }

    const setTotalTime = (seconds) => {
      state.totalTime = seconds
      state.totalTimeStr = formatSecond(state.totalTime)
    }

    const onAudioEnded = () => {
      // Preserved original functionality
    }

    const onAudioPause = () => {
      state.isPlaying = false
      if (hasMediaSession) {
        try { navigator.mediaSession.playbackState = 'paused' } catch (_) {}
      }
    }

    const onAudioPlay = () => {
      state.isPlaying = true
      if (hasMediaSession) {
        try { navigator.mediaSession.playbackState = 'playing' } catch (_) {}
      }
    }

    const onLoadMetaData = (e) => {
      setTotalTime(e.target.duration)
      emit('loadedmetadata', e)
      // Ensure position state reflects freshly loaded metadata
      if (hasMediaSession && typeof navigator.mediaSession.setPositionState === 'function') {
        try {
          navigator.mediaSession.setPositionState({
            duration: e.target.duration || 0,
            playbackRate: audioPlayer.value?.playbackRate || 1,
            position: audioPlayer.value?.currentTime || 0,
          })
        } catch (_) {}
      }
    }

    const onTimeUpdate = (event) => {
      emit('timeupdate', event)
      if (hasMediaSession && typeof navigator.mediaSession.setPositionState === 'function') {
        try {
          navigator.mediaSession.setPositionState({
            duration: audioPlayer.value?.duration || state.totalTime || 0,
            playbackRate: audioPlayer.value?.playbackRate || 1,
            position: audioPlayer.value?.currentTime || state.currentTime || 0,
          })
        } catch (_) {}
      }
    }

    const setPointPosition = (offsetLeft) => {
      audioProgressPoint.value.style.left = `${
        offsetLeft - audioProgressPoint.value.offsetWidth / 2
      }px`
    }

    const handleProgressPanStart = (event) => {
      state.isDragging = true
      emit('progress-start', event)
    }

    const handleProgressPanEnd = (event) => {
      audioPlayer.value.currentTime = state.currentTime
      play()
      state.isDragging = false
      emit('progress-end', event)
    }

    const handleProgressPanMove = (event) => {
      const pageX = event.x
      const bcr = event.target.getBoundingClientRect()
      const targetLeft = parseInt(getComputedStyle(event.target).left)
      let offsetLeft = targetLeft + (pageX - bcr.left)
      offsetLeft = Math.min(offsetLeft, audioProgressWrap.value.offsetWidth)
      offsetLeft = Math.max(offsetLeft, 0)
      setPointPosition(offsetLeft)
      audioProgress.value.style.width = `${offsetLeft}px`
      state.currentTime =
        (offsetLeft / audioProgressWrap.value.offsetWidth) * state.totalTime
      emit('progress-move', event)
    }

    const handleClickProgressWrap = (event) => {
      const { offsetX } = event
      if (event.target === audioProgressPoint.value) {
        return
      }
      state.currentTime =
        (offsetX / audioProgressWrap.value.offsetWidth) * state.totalTime
      audioPlayer.value.currentTime = state.currentTime
      setPointPosition(offsetX)
      audioProgress.value.style.width = `${offsetX}px`
      play()
      emit('progress-click', event)
    }

    watch(
      () => props.option,
      (newValue) => {
        option_.value = mergeOption(newValue)
        initState()
        // Update Media Session metadata when track changes
        if (hasMediaSession) {
          try {
            const artworkSrc = option_.value.coverImage || CoverImageDefault
            navigator.mediaSession.metadata = new window.MediaMetadata({
              title: option_.value.title || 'Untitled',
              artist: option_.value.author || 'Unknown artist',
              album: '',
              artwork: [
                { src: artworkSrc, sizes: '96x96', type: 'image/png' },
                { src: artworkSrc, sizes: '128x128', type: 'image/png' },
                { src: artworkSrc, sizes: '192x192', type: 'image/png' },
                { src: artworkSrc, sizes: '256x256', type: 'image/png' },
                { src: artworkSrc, sizes: '512x512', type: 'image/png' },
              ],
            })
          } catch (_) {}
        }
        if (option_.value.autoPlay) {
          nextTick(() => {
            play()
          })
        }
      },
      { deep: true }
    )

    onMounted(() => {
      toucher = new Core(document.getElementById('app') || undefined, {
        preventDefault: false,
      })
      toucher.use(Pan)

      // Media Session action handlers
      if (hasMediaSession) {
        try {
          navigator.mediaSession.setActionHandler('play', () => {
            emit('play')
          })
          navigator.mediaSession.setActionHandler('pause', () => {
            emit('pause')
          })
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            emit('nextTrack')
          })
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            // Fallback: restart current track if playing far enough
            const ct = audioPlayer.value?.currentTime || 0
            if (ct > 3) {
              audioPlayer.value.currentTime = 0
            } else {
              // If app later supports previous track, emit a custom event
              // emit('prevTrack')
              audioPlayer.value.currentTime = 0
            }
          })
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (!audioPlayer.value) return
            const seekTime = details.seekTime || 0
            if (details.fastSeek && typeof audioPlayer.value.fastSeek === 'function') {
              try { audioPlayer.value.fastSeek(seekTime) } catch (_) { audioPlayer.value.currentTime = seekTime }
            } else {
              audioPlayer.value.currentTime = seekTime
            }
            // Inform app about explicit seek action
            emit('progress-click', { type: 'mediasession-seekto', seekTime })
          })
          navigator.mediaSession.setActionHandler('seekforward', (details) => {
            if (!audioPlayer.value) return
            const step = details.seekOffset || 10
            audioPlayer.value.currentTime = Math.min(
              (audioPlayer.value.currentTime || 0) + step,
              audioPlayer.value.duration || state.totalTime || 0
            )
            emit('progress-click', { type: 'mediasession-seekforward', step })
          })
          navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            if (!audioPlayer.value) return
            const step = details.seekOffset || 10
            audioPlayer.value.currentTime = Math.max(
              (audioPlayer.value.currentTime || 0) - step,
              0
            )
            emit('progress-click', { type: 'mediasession-seekbackward', step })
          })
        } catch (_) {}
      }
    })

    onUnmounted(() => {
      if (toucher) toucher.destroy()
    })

    return {
      audioPlayer,
      option_,
      ...toRefs(state),
      onAudioEnded,
      onAudioPlay,
      onAudioPause,
      onLoadMetaData,
      onTimeUpdate,
      play,
      pause,
      togglePlayer,
      nextTrack,
      formatSecond,
      handleProgressPanStart,
      handleProgressPanEnd,
      handleProgressPanMove,
      handleClickProgressWrap,
      audioProgressWrap,
      audioProgressPoint,
      audioProgress,
      CoverImageDefault,
    }
  },
})
</script>

<style scoped lang="scss">
.audio-player {
  width: 100%;
  // max-width: 400px;
  padding: 4px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &__cover {
    position: relative;
    
    .q-avatar {
      border-radius: 4px;
      overflow: hidden;
    }
  }

  &__play-btn {
    width: 28px;
    height: 28px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    
    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
    
    .q-icon {
      font-size: 16px;
    }
  }

  &__info-progress {
    min-width: 0;
  }

  &__info {
    margin-bottom: 2px;
    
    .text-subtitle2 {
      font-size: 0.8125rem;  /* 13px */
      line-height: 1.2;
    }
    
    .text-caption {
      font-size: 0.6875rem;  /* 11px */
      line-height: 1.1;
    }
  }

  &__progress-container {
    width: 100%;
  }

  &__progress-wrap {
    position: relative;
    flex-grow: 1;
    background: #e0e0e0;
    height: 2px;
    border-radius: 1px;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  &__progress {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    border-radius: 1px;
  }

  &__progress-point {
    position: absolute;
    left: -5px;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: -5px;
    z-index: 1;
  }

  &__progress-point:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    margin: -2px 0 0 -2px;
    background: #fff;
    border-radius: 50%;
  }

  &__time {
    font-size: 0.625rem;  /* 10px */
    min-width: 26px;
    text-align: right;
    margin-left: 4px;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .spin-anim {
    animation: spin 5s linear infinite;
  }
}
</style>