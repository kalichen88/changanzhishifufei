import { describe, it, expect } from 'vitest'
import {
  parseTextLines,
  extractCategoryName,
  parseSheetFile,
} from '../server/services/import.service'

describe('文本粘贴导入（8.6 还原原版 add_piliang）', () => {
  it('sort=0：标题|视频地址|图片地址（原版默认）', () => {
    const rows = parseTextLines('【美景】云海|https://v.example.com/a.mp4|https://img.example.com/a.jpg', 0)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      title: '【美景】云海',
      url: 'https://v.example.com/a.mp4',
      img: 'https://img.example.com/a.jpg',
    })
  })

  it('sort=3：视频地址|图片地址|标题', () => {
    const rows = parseTextLines('https://v.example.com/a.mp4|https://img.example.com/a.jpg|【运营】起号', 3)
    expect(rows[0]).toEqual({
      title: '【运营】起号',
      url: 'https://v.example.com/a.mp4',
      img: 'https://img.example.com/a.jpg',
    })
  })

  it('sort=6：图片地址|标题|视频地址', () => {
    const rows = parseTextLines('https://img.example.com/a.jpg|【舞蹈】MV|https://v.example.com/a.mp4', 6)
    expect(rows[0]).toEqual({
      title: '【舞蹈】MV',
      url: 'https://v.example.com/a.mp4',
      img: 'https://img.example.com/a.jpg',
    })
  })

  it('多行解析 + 空行/字段不足过滤', () => {
    const rows = parseTextLines(
      'T1|https://v.example.com/1.mp4|https://img.example.com/1.jpg\n\nhttps://v.example.com/2.mp4\nT3|https://v.example.com/3.mp4|https://img.example.com/3.jpg',
      0,
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].title).toBe('T1')
    expect(rows[1].title).toBe('T3')
  })

  it('非法 sort 回退到 sort=0', () => {
    const rows = parseTextLines('T1|https://v.example.com/1.mp4|https://img.example.com/1.jpg', 99)
    expect(rows[0]).toEqual({
      title: 'T1',
      url: 'https://v.example.com/1.mp4',
      img: 'https://img.example.com/1.jpg',
    })
  })
})

describe('自动分类【】提取（8.6 原版正则）', () => {
  it('提取【】内文字', () => {
    expect(extractCategoryName('【美景】云海日出')).toBe('美景')
  })
  it('无【】返回 null', () => {
    expect(extractCategoryName('云海日出')).toBeNull()
  })
  it('只取第一组【】', () => {
    expect(extractCategoryName('【运营】【加更】起号')).toBe('运营')
  })
})

describe('xlsx/csv 文件解析（8.6）', () => {
  it('解析中文表头与英文表头', () => {
    const wb = { SheetNames: ['S'], Sheets: {} }
    void wb
    // 直接构造一个 xlsx buffer 测中文表头
    const XLSX = require('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([
      ['标题', '封面URL', '视频URL', '排序', '状态'],
      ['【美景】云海', 'https://img.example.com/a.jpg', 'https://v.example.com/a.mp4', 0, 1],
    ])
    const wb2 = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb2, ws, 'S')
    const buf = XLSX.write(wb2, { type: 'buffer', bookType: 'xlsx' })
    const rows = parseSheetFile(buf)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      title: '【美景】云海',
      img: 'https://img.example.com/a.jpg',
      url: 'https://v.example.com/a.mp4',
      sort: 0,
      status: 1,
    })
  })

  it('英文表头兼容', () => {
    const XLSX = require('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([
      ['title', 'img', 'url'],
      ['英文标题', 'https://img.example.com/b.jpg', 'https://v.example.com/b.mp4'],
    ])
    const wb2 = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb2, ws, 'S')
    const buf = XLSX.write(wb2, { type: 'buffer', bookType: 'xlsx' })
    const rows = parseSheetFile(buf)
    expect(rows[0]).toMatchObject({
      title: '英文标题',
      img: 'https://img.example.com/b.jpg',
      url: 'https://v.example.com/b.mp4',
    })
  })

  it('空 sheet 返回空数组', () => {
    const XLSX = require('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([])
    const wb2 = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb2, ws, 'S')
    const buf = XLSX.write(wb2, { type: 'buffer', bookType: 'xlsx' })
    const rows = parseSheetFile(buf)
    expect(rows).toEqual([])
  })
})
