# 🌸 儿童计算练习

美乐蒂风格的儿童数学练习桌面应用，支持加减法和乘法口诀训练。

## ✨ 功能特性

- 🎨 **美乐蒂风格主题** — 粉嫩配色，圆润界面
- 👤 **多用户系统** — 创建账号、切换用户、数据持久化
- ⭐ **星星月亮太阳积分** — 答对得星，答错扣星，10星=月亮，10月亮=太阳
- 🔊 **朗读题目** — 题目自动朗读，可按空格键重复
- ⏱️ **30秒倒计时** — 每题限时，环形进度显示
- 📈 **难度自动升级** — 正确率 ≥ 90% 自动升级
- 📝 **错题循环** — 答错的题目反复出现直到答对
- ⏸️ **暂停/停止** — 随时暂停，停止后保存积分
- 🎵 **音效反馈** — 答对/答错音效（支持自定义音频文件）
- 📐 **竖式显示** — 数学题以竖式格式呈现，右对齐

## 📐 难度说明

| 难度 | 说明 |
|------|------|
| 乘法口诀 | 1~9 乘法 |
| 两位数加法 | 两位数 + 两位数 |
| 两位数减法 | 两位数 - 两位数 |
| 三位数加两位数 | 三位数 + 两位数 |
| 三位数减两位数 | 三位数 - 两位数 |
| 三位数加法 | 三位数 + 三位数 |
| 三位数减法 | 三位数 - 三位数 |
| 四位数加三位数 | 四位数 + 三位数 |
| 四位数减三位数 | 四位数 - 三位数 |
| 四位数加法 | 四位数 + 四位数 |
| 四位数减法 | 四位数 - 四位数 |

## 🛠️ 本地开发

```bash
npm install
npm run dev
```

## 📦 构建安装包

### Windows
```bash
# x64 (Intel/AMD)
npm run build:win:x64

# ARM64 (高通/Apple M系列模拟)
npm run build:win:arm64
```

### macOS（需要 macOS 系统或 GitHub Actions）
```bash
npm run build:mac
```

### 构建所有平台（使用 GitHub Actions）
推送代码后，GitHub Actions 会自动构建所有平台：
- `math-kids-*-mac-universal.dmg` — macOS 通用版（Intel + Apple Silicon）
- `math-kids-*-win-x64.exe` — Windows x64
- `math-kids-*-win-arm64.exe` — Windows ARM64

## 📁 项目结构

```
math-kids/
├── electron/          # Electron 主进程
│   ├── main.ts        # 主进程入口
│   └── preload.ts     # 预加载脚本
├── src/
│   ├── main.ts        # 应用主逻辑
│   ├── types.ts       # TypeScript 类型定义
│   ├── mathGen.ts     # 数学题生成器
│   ├── audio.ts       # 音效管理
│   └── style.css      # 美乐蒂风格样式
├── public/
│   ├── audio/         # 音频文件
│   │   ├── correct.mp3    # 答对音效
│   │   └── incorrect.mp3  # 答错音效
│   └── images/
│       └── meiledi.jpg    # 美乐蒂背景图
└── release/           # 构建输出目录
```

## 🎵 添加自定义资源

将音频和图片文件放入以下目录即可自动打包：
- 音效：`public/audio/correct.mp3`、`public/audio/incorrect.mp3`
- 背景：`public/images/meiledi.jpg`

## 系统要求

- Windows 10/11 (x64 或 ARM64)
- macOS 10.15+ (Intel 或 Apple Silicon)
- Linux (x64)
