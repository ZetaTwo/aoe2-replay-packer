import type { InjectionKey } from 'vue'
import type { Aoe2CmApi } from '@/entities/aoe2cm'

export const aoe2cmApiKey: InjectionKey<Aoe2CmApi> = Symbol('aoe2cmApi')
