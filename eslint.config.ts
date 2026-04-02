import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormattingConfig from '@vue/eslint-config-prettier/skip-formatting'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

export default defineConfigWithVueTs(
    includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
    pluginVue.configs['flat/recommended'],
    vueTsConfigs.recommended,
    skipFormattingConfig,
    { ignores: ['dist/**'] }
)
