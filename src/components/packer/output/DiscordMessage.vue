<script setup lang="ts">
import { ref } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'

const props = defineProps<{ discordMessage: string }>()

const copyDone = ref(false)
async function copyDiscordMessage() {
  try {
    await navigator.clipboard.writeText(props.discordMessage)
    copyDone.value = true
    setTimeout(() => {
      copyDone.value = false
    }, 2000)
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <BaseCard spacing="top">
    <h2 :class="$style.title">Discord Message</h2>
    <div :class="$style.row">
      <div :class="$style.content">
        <p :class="$style.intro">
          Complete your submission by upload the file in the correct discord channel and use the
          following message as a template. Remember to <strong>replace the score</strong> and to
          <strong>tag your opponent</strong>:
        </p>
        <div :class="$style.bubble">
          <div>
            <pre :class="$style.pre">{{ discordMessage }}</pre>
          </div>
          <div :class="$style.copyWrap">
            <button :class="$style.copyBtn" @click="copyDiscordMessage">
              <span v-if="!copyDone" :class="$style.inlineIcon">
                <svg
                  :class="$style.copyIcon"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 18 20"
                >
                  <path
                    d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z"
                  />
                </svg>
                <span :class="$style.copyText">Copy message</span>
              </span>
              <span v-else :class="$style.inlineIcon">
                <svg
                  :class="[$style.copyIcon, $style.success]"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 16 12"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M1 5.917 5.724 10.5 15 1.5"
                  />
                </svg>
                <span :class="[$style.copyText, $style.success]">Copied</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style module>
.title {
  text-align: center;
  font-size: var(--font-size-2xl);
}
.row {
  display: flex;
  justify-content: center;
}
.content {
  width: 100%;
  max-width: 32rem;
  text-align: left;
}
.intro {
  margin-bottom: var(--space-4);
}
.bubble {
  position: relative;
  padding: var(--space-4);
  padding-top: var(--space-12);
  background-color: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
}
.pre {
  white-space: pre-wrap;
  word-break: break-word;
}
.copyWrap {
  position: absolute;
  top: var(--space-2);
  inset-inline-end: var(--space-2);
}
.copyBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-section);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  cursor: pointer;
}
.copyBtn:hover {
  background-color: var(--color-bg-hover);
}
.copyBtn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.inlineIcon {
  display: inline-flex;
  align-items: center;
}
.copyIcon {
  width: 0.75rem;
  height: 0.75rem;
  margin-inline-end: var(--space-2);
}
.copyText {
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.success {
  color: var(--color-accent-text);
}
</style>
