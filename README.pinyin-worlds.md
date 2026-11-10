# 拼音世界 / 认字世界（扩展说明）

在 fork 自 isdanw/keyboard-island 的本地副本上新增两个学习世界：拼音 14 课、识字一 4 课。只追加，不改既有 96 章。

## 打开方式

```bash
cd ~/Projects/keyboard-island-pinyin
node scripts/serve.mjs --port 4173     # 或 npm run dev
# 浏览器打开 http://127.0.0.1:4173/
```

纯静态页面，无需构建；Node ≥ 20。学到新世界：首页 → 世界列表点两次 `›` 到第三组 → 「拼音世界 / 认字世界」。

## 改了什么

| 文件 | 改动 |
| --- | --- |
| `public/pinyin-content.js` | **新增**。拼音 14 课 + 识字一 4 课的全部内容（课名/序列/目标/新键/徽章/汉字提示）。唯一内容源，纠错只改这里 |
| `public/chapters.js` | 末尾追加注册循环：`WORLDS.push(pack.world)` + `add(...)`。既有 96 章与 WORLDS[0..15] 一字未改，章节 ID 0–95 不变 |
| `public/index.html` | 在 `chapters.js` 前引入 `pinyin-content.js` |
| `public/app.js` | 6 处最小改动（见下） |
| `public/expansion.css` | `.kid-word` 汉字提示样式；`.long-route`（>6 章的世界换行并可滚动） |
| `scripts/check.mjs`、`tests/contracts.test.mjs` | 断言章节数 96→114、世界数 16→18；既有 36 章 sha256 锁定校验保留不变 |

### app.js 改动明细

1. 新增 `worldChapters(world)`：按 `ch.world` 取章节。
2. 地图章节列表、首页世界完成星、`mapWorld` 定位、`worldPicture` 改用该函数——原代码写死「每个世界 6 章」，14 章/4 章的世界会漏显示。
3. `isUnlocked`：世界标了 `open: true` 时，该世界第一章始终可进（否则要先打完 96 章才能碰到拼音课）。
4. `gameView`：章节有 `words` 时在标题旁显示「汉字＋带调拼音」。
5. 地图 section 对超过 6 章的世界加 `long-route` 类（配合上面的 CSS）。
6. 世界通关奖励改为按「该世界最后一章」判定（原为 `id % 6 === 5`，拼音 14 章永远拿不到）。

未改：引擎按键判定、序列生成、进度/贝壳/贴纸、存档结构、场景绘制；未新画任何场景（场景键全部复用 glow/sail/bridge/drum/kite/lighthouse/garden/sunflower/water/bee/fruit/rainbow/balloon/train）。

## 存档兼容

仍用 `localStorage["keyboard-island-v1"]`。新章节追加在末尾（ID 96–113），既有 `completed` 键值不变；已用含第 1/2/36 章进度的旧存档验证：刷新后进度、贝壳、断点均保留，无报错。

## 数据来源

- **课序骨架**：`/Users/yiyo/WorkBuddy/2026-08-05-08-49-04/scripts/textbook-pipeline/raw/小学语文-统编版.json`（统编版 一年级上册，edition=新教材）。核对结果：识字一 4 课、汉语拼音 14 课分三单元（第 9 课 y w 独立）与本卡一致；识字二（第六单元 5 对韵歌 等）未纳入。
- **逐字内容**：按 issue 卡面数据录入。识字1 已核实；识字2 为识字表口径；识字4「川」为课名新增字，待复核。
- **键盘适配**：ü 一律用 v 键输入（拼音输入法惯例），第 2/12/13 课的 intro 已注明。

## 待复核项

- 识字4「川」是否属于本课识字表。
- 识字2 七字（一 二 三 四 五 上 下）与教材识字表逐字核对。
- 拼音课里的拼读组合（如 ba bo bi bu）是常见教学组合、非教材原文，可按孩子情况增删。
- 第 13/14 课整体认读举例（yin/yun/yuan/ying）是否与老师教法一致。
