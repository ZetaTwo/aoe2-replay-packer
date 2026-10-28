import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, Suspense } from 'vue'
import RecentDrafts from './RecentDrafts.vue'
import type { Aoe2CmApi, Aoe2CmPresetDraft } from '@/entities/aoe2cm'
import { aoe2cmApiKey } from '@/stores/keys'

const HOUR = 60 * 60 * 1000

function fakeApi(presetDrafts: Record<string, Aoe2CmPresetDraft[]>): Aoe2CmApi {
  return {
    getDraft: vi.fn(async () => null),
    getPresetDrafts: vi.fn(async (presetId: string) => presetDrafts[presetId] ?? null)
  }
}

function presetDraft(
  draftId: string,
  ageMs: number,
  host = 'Host',
  guest = 'Guest'
): Aoe2CmPresetDraft {
  return { draftId, ts: Date.now() - ageMs, host, guest }
}

// RecentDrafts has an async setup so it has to be rendered inside Suspense
async function mountDrafts(api: Aoe2CmApi, props: Record<string, unknown> = {}) {
  const wrapper = mount(
    {
      render: () =>
        h(Suspense, null, {
          default: () =>
            h(RecentDrafts, {
              mapPresets: ['maps'],
              civPresets: ['civs'],
              mapDraft: '',
              civDraft: '',
              ...props
            })
        })
    },
    { global: { provide: { [aoe2cmApiKey as symbol]: api } } }
  )
  await flushPromises()
  return wrapper.findComponent(RecentDrafts)
}

function rows(wrapper: Awaited<ReturnType<typeof mountDrafts>>) {
  return wrapper.findAll('li').map((li) => li.findAll('span').map((span) => span.text()))
}

describe('RecentDrafts', () => {
  it('lists the recent drafts of all presets, newest first', async () => {
    const api = fakeApi({
      maps: [presetDraft('m1', 3 * HOUR, 'Alice', 'Bob')],
      civs: [presetDraft('c1', 1 * HOUR, 'Carol', 'Dave')]
    })
    const wrapper = await mountDrafts(api)

    expect(api.getPresetDrafts).toHaveBeenCalledWith('maps')
    expect(api.getPresetDrafts).toHaveBeenCalledWith('civs')
    expect(rows(wrapper)).toEqual([
      ['Civs:', 'Carol', 'vs', 'Dave', 'Carol vs Dave (c1)'],
      ['Maps:', 'Alice', 'vs', 'Bob', 'Alice vs Bob (m1)']
    ])
  })

  it('leaves out drafts older than a day', async () => {
    const wrapper = await mountDrafts(
      fakeApi({ maps: [presetDraft('new', 23 * HOUR), presetDraft('old', 25 * HOUR)] })
    )
    expect(rows(wrapper)).toEqual([['Maps:', 'Host', 'vs', 'Guest', 'Host vs Guest (new)']])
  })

  it('shows a message when there are no recent drafts', async () => {
    const wrapper = await mountDrafts(fakeApi({}))
    expect(wrapper.find('li').exists()).toBe(false)
    expect(wrapper.text()).toContain('No recent drafts found for the selected presets')
  })

  it('selects a map draft', async () => {
    const wrapper = await mountDrafts(fakeApi({ maps: [presetDraft('m1', HOUR)] }))
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:mapDraft')).toEqual([['m1']])
    expect(wrapper.emitted('update:civDraft')).toBeUndefined()
  })

  it('selects a civ draft', async () => {
    const wrapper = await mountDrafts(fakeApi({ civs: [presetDraft('c1', HOUR)] }))
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:civDraft')).toEqual([['c1']])
    expect(wrapper.emitted('update:mapDraft')).toBeUndefined()
  })

  it('deselects the draft that is already selected', async () => {
    const wrapper = await mountDrafts(fakeApi({ maps: [presetDraft('m1', HOUR)] }), {
      mapDraft: 'm1'
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:mapDraft')).toEqual([['']])
  })
})
