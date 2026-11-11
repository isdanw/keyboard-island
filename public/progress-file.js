'use strict'
const ProgressFile = (() => {
  const LIMIT = 512 * 1024
  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  const isCount = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
  const isBool = (v) => typeof v === 'boolean'
  const fail = (error) => ({ ok: false, error })
  function parse(text) {
    try {
      if (typeof text !== 'string') return fail('没有读到备份内容，请重新选择文件。')
      if (text.length > LIMIT) return fail('备份文件超过 512KB，不能导入。')
      let data
      try {
        data = JSON.parse(text.replace(/^\uFEFF/, ''))
      } catch {
        return fail('这不是一份有效的进度备份（JSON 格式有误）。')
      }
      if (!isObject(data)) return fail('备份内容格式不对：最外层必须是一个对象。')
      for (const key of ['shells', 'total', 'rounds', 'seconds'])
        if (Object.hasOwn(data, key) && !isCount(data[key]))
          return fail(`备份里的 ${key} 应该是不小于 0 的数字。`)
      for (const key of ['keys', 'completed'])
        if (Object.hasOwn(data, key) && !isObject(data[key]))
          return fail(`备份里的 ${key} 格式不对，应该是一个对象。`)
      if (Object.hasOwn(data, 'owned') && !Array.isArray(data.owned))
        return fail('备份里的 owned 格式不对，应该是一个列表。')
      for (const key of ['sound', 'music', 'voice', 'reduced', 'handGuide'])
        if (Object.hasOwn(data, key) && !isBool(data[key]))
          return fail(`备份里的 ${key} 格式不对，应该是开关值。`)
      if (
        Object.hasOwn(data, 'volume') &&
        !(
          typeof data.volume === 'number' &&
          Number.isFinite(data.volume) &&
          data.volume >= 0 &&
          data.volume <= 1
        )
      )
        return fail('备份里的 volume 应该是 0 到 1 之间的数字。')
      if (
        Object.hasOwn(data, 'checkpoint') &&
        data.checkpoint !== null &&
        !isObject(data.checkpoint)
      )
        return fail('备份里的 checkpoint 格式不对。')
      if (Object.hasOwn(data, 'sticker') && typeof data.sticker !== 'string')
        return fail('备份里的 sticker 格式不对，应该是文字。')
      const completed = isObject(data.completed) ? Object.keys(data.completed).length : 0,
        shells = isCount(data.shells) ? data.shells : 0,
        seconds = isCount(data.seconds) ? data.seconds : 0
      return {
        ok: true,
        data,
        summary: { completed, shells, minutes: Math.round(seconds / 60) },
      }
    } catch {
      return fail('备份文件无法读取，请换一份再试。')
    }
  }
  function fileName(date) {
    const d =
      date && typeof date.getFullYear === 'function' && !Number.isNaN(date.getTime())
        ? date
        : new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `keyboard-island-progress-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`
  }
  return { parse, fileName }
})()
globalThis.ProgressFile = ProgressFile
