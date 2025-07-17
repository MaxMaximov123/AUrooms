<template>
  <AudioPlayer ref="audioPlayer" :option="audioPlayerOptions" @loadedmetadata="onMetadataLoaded"
          @timeupdate="updateMusicCurrentTimePing" @progress-click="onProgressClick" @play="onPlay" @pause="onPause"
          @progress-start="console.log('progress-start')" @progress-end="console.log('progress-end')"
          @nextTrack="onNextTrack" />
</template>
<script>

import AudioPlayer from '../components/AudioPlayer.vue';


export default {
  components: {
    AudioPlayer,
  }
}
</script>