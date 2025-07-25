<template>
  <div class="audio__player">
    <div class="audio__player-play-and-title">
      <div class="audio__player-play-cont" style="display: flex; align-items: center;">
        <!-- <q-btn class="q-mr-md" round icon="skip_previous" @click="nextTrack" /> -->

        <div class="audio__player-play" @click="togglePlayer">
          <img
            :src="option_.coverImage ? option_.coverImage : CoverImageDefault"
            :class="`${
              isPlaying && option_.coverRotate ? 'audio__player-spin-anim' : ''
            }`"
          />
          <div class="audio__player-play-icon">
            <img :src="isPlaying ? IconPause : IconPlay" />
          </div>
        </div>

        <q-btn class="q-ml-md" round icon="skip_next" @click="nextTrack" />
      </div>
      <slot name="title">
        <div v-if="option_.title" class="audio__player-title">
          {{ option_.title }}
        </div>
      </slot>
    </div>
    <div class="audio__player-progress-container">
      <div
        ref="audioProgressWrap"
        class="audio__player-progress-wrap"
        @click.stop="handleClickProgressWrap"
      >
        <div
          ref="audioProgress"
          class="audio__player-progress"
          :style="{
            backgroundColor: option_.progressBarColor,
          }"
        />
        <div
          ref="audioProgressPoint"
          class="audio__player-progress-point"
          :style="{
            backgroundColor: option_.indicatorColor,
            boxShadow: `0 0 10px 0 ${option_.indicatorColor}`,
          }"
          @panstart="handleProgressPanStart"
          @panend="handleProgressPanEnd"
          @panmove="handleProgressPanMove"
        />
      </div>
      <div class="audio__player-time">
        <span>{{ `${formatSecond(currentTime)} / ${totalTimeStr}` }}</span>
      </div>
    </div>
    <audio
      ref="audioPlayer"
      :src="option_.src"
      @ended="onAudioEnded"
      @play="onAudioPlay"
      @pause="onAudioPause"
      @loadedmetadata="onLoadMetaData"
      @timeupdate="onTimeUpdate"
    ></audio>
  </div>
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
import IconPlay from '../assets/images/play.png'
import IconPause from '../assets/images/pause.png'
import CoverImageDefault from '../assets/images/cover.png'

const mergeOption = (option) => {
  return {
    src: option.src || AudioPlayerOptionDefault.src,
    title: option.title || AudioPlayerOptionDefault.title,
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
        })
        .catch((error) => {
          emit('play-error', error)
        })
    }


    const pause = () => {
      audioPlayer.value.pause()
      state.isPlaying = false
    }

    const togglePlayer = () => {
      if (state.isPlaying) {
        // pause()
        emit('pause');
      } else {
        // play()
        emit('play')
      }
    }

    const nextTrack = () => {
      emit('nextTrack');
    }

    const setTotalTime = (seconds) => {
      state.totalTime = seconds
      state.totalTimeStr = formatSecond(state.totalTime)
    }

    const onAudioEnded = () => {
      // state.isPlaying = true
      // clearTimer()
      // emit('ended')
      // emit('nextTrack', false)
    }

    const onAudioPause = () => {
      state.isPlaying = false
      // clearTimer()
      // emit('pause')
    }

    const onAudioPlay = () => {
      state.isPlaying = true
      // emit('play')
    }

    const onLoadMetaData = (e) => {
      setTotalTime(e.target.duration)
      emit('loadedmetadata', e)
    }

    const onTimeUpdate = (event) => {
      // if (state.isPlaying === true && state.totalTime - state.currentTime <= 3) {
      //   emit('nextTrack');
      //   console.log(4, state)
      // }
      emit('timeupdate', event)
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
      IconPlay,
      IconPause,
      CoverImageDefault,
    }
  },
})
</script>
<style scoped>
.audio__player {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.audio__player-play {
  position: relative;
}
.audio__player-play:active,
.audio__player-play img:active {
  opacity: 0.75;
}
.audio__player-play img {
  width: 6.8rem;
  height: 6.8rem;
  border-radius: 9999px;
}
.audio__player-play-icon {
  position: absolute;
  top: 1.8rem;
  left: 1.8rem;
  background: #f0f0f0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem;
  opacity: 0.8;
}
.audio__player-play-icon img {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
}

.audio__player-progress-container {
  display: flex;
  flex-direction: column;
  width: 80%;
}

.audio__player-progress-wrap {
  position: relative;
  background: #ddd;
  height: 4px;
  border-radius: 3px;
  margin-top: 20px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-drag: none;
}

.audio__player-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  border-radius: 3px;
}

.audio__player-progress-point {
  position: absolute;
  left: -8px;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-top: -8px;
}

.audio__player-progress-point:after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  background: #fff;
  border-radius: 50%;
}
.audio__player-time {
  margin-top: 0.2rem;
  margin-left: auto;
}
.audio__player-time span {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.audio__player-title {
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: bold;
  color: #3c3c3c;
}
@keyframes audio__player-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.audio__player-spin-anim {
  animation: audio__player-spin 5s linear infinite;
}
</style>