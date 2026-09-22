<script setup lang="ts">
import { computed } from 'vue'

const civs: Record<string, string> = {
  armenians: 'armenians',
  aztecs: 'aztecs',
  bengalis: 'bengalis',
  berbers: 'berber',
  bohemians: 'bohemians',
  britons: 'britons',
  bulgarians: 'bulgarians',
  burgundians: 'burgundians',
  burmese: 'burmese',
  byzantines: 'byzantines',
  celts: 'celts',
  chinese: 'chinese',
  cumans: 'cumans',
  danes: 'danes',
  dravidians: 'dravidians',
  ethiopians: 'ethiopians',
  franks: 'franks',
  georgians: 'georgians',
  goths: 'goths',
  gurjaras: 'gurjaras',
  huns: 'huns',
  incas: 'inca',
  hindustanis: 'indians',
  italians: 'italians',
  japanese: 'japanese',
  jurchens: 'jurchens',
  khitans: 'khitans',
  khmer: 'khmer',
  koreans: 'koreans',
  lithuanians: 'lithuanians',
  magyars: 'magyars',
  malay: 'malay',
  malians: 'malians',
  mapuche: 'mapuche',
  mayans: 'mayans',
  mongols: 'mongols',
  muisca: 'muisca',
  persians: 'persians',
  poles: 'poles',
  portuguese: 'portuguese',
  romans: 'romans',
  saracens: 'saracens',
  saxons: 'saxons',
  shu: 'shu',
  sicilians: 'sicilians',
  slavs: 'slavs',
  spanish: 'spanish',
  tatars: 'tatars',
  teutons: 'teutons',
  tupi: 'tupi',
  turks: 'turks',
  varangians: 'varangians',
  vietnamese: 'vietnamese',
  vikings: 'vikings',
  wei: 'wei',
  wu: 'wu'
}

const civIcons = import.meta.glob('../../assets/civs/*.png', {
  query: { w: 40, h: 40, format: 'webp' },
  import: 'default',
  eager: true
}) as Record<string, string>

const props = defineProps<{
  civ: string
}>()

const icon = computed(() => {
  const iconName = civs[props.civ]
  return civIcons[`../../assets/civs/menu_techtree_${iconName}.png`]
})

const civTitle = computed(() => {
  return props.civ.charAt(0).toUpperCase() + props.civ.substring(1).toLowerCase()
})
</script>

<template>
  <img :class="$style.icon" :src="icon" :alt="civTitle" :title="civTitle" />
</template>

<style module>
.icon {
  display: inline;
}
</style>
