# 动态背景打磨 · 2026-09-05

## 用户点评后的第二轮

本节是当前版本，下文保留第一轮记录。

- 山峦保留流雾，尖锐山头改为连贯的山坡曲线，移除石面亮片；大雁以已在画面内的相位开始飞行，并缩短整段飞行周期。
- 迷雾改用蓝、青、珍珠白三个流动色团，不再混入棕色、紫色；缩略图复用真实场景。
- 涟漪恢复正面圆环，不再做侧面的椭圆透视；保留多重扩散与滴落光点。
- 原 Rainbow 入口改为 **After rain（雨后折光）**：用流动的淡青折光带和暖白天光替代七色拱门。持久化 ID 仍为 `rainbow`，保留既有外观选择的兼容性。
- 首颗流星延迟为 0.35 秒，再渐显；修正原负延迟直接落入隐形等待段的情况。星空其他视觉不再重画。
- 海面删除平行长线，改成分散的短水光与阳光反射；颜色更偏清透蓝青，保留上一轮已认可的帆船、倒影与尾波。
- 波浪、日光、纸张、竹林、飘雪本轮未重做。所有主题仍默认动态，没有增加外部资源或依赖。
- 第二轮测试共 38 项，通过；新增验证保存的主题 ID 兼容、大雁初始相位与流星延迟。Lint、两套生产构建、打包和回归检查通过。

整体取向：保留场景性格，减少不自然的混色、重复图案和突兀几何造型，而不是把所有主题改成同一种风格。视觉判断需要在实际阅读内容下成立；此次没有进行长时帧率和功耗基准测试。

## 范围

按用户确认，动态是产品的核心体验。本轮打磨 Mountains、Snow、Rainbow、Bamboo、Ripples，微调 Stars，并重画 Ocean 的帆船。没有修改本轮开始时的 Waves、Solar、Mist、Paper 场景代码；工作区中 Waves 已有的修改属于更早一轮。

## 设计变化

- 山峦：四层不等高山脊、山体明暗、两层流雾和持续飞鸟，缩略图共用山形。
- 飘雪：三层景深、76 个错相位雪粒、侧向风、流动天光和积雪地形；首次打开即有雪，不等待粒子从屏幕外入场。
- 彩虹：完整的柔和光谱弧线，按视口比例构图，光照与云雾持续变化；去掉原来的竖条纹。实景检查后进一步收细、减淡光弧，避免压在正文上。
- 竹林：修正左右定位，重画渐细竹竿、枝叶与竹节，保留整体风摆、分支摆动、风雨及近远景。
- 涟漪：有透视的多重水环、明暗反射、滴落光点和移动水光。五组场景位置主要围绕阅读区，避免持续从文字正后方生成。
- 星空：不规则星点代替规则点阵，保留明暗闪烁、氛围光与三组错相位流星；消除定时器列表持续增长。深色外观面板和 HN 元数据也随主题适配。
- 海面：保留原海面动态，只重画双帆、船体、帆索、倒影和尾波；保持漂移并增加轻微摇摆。

## 动画与代码边界

全部场景默认动态，没有新增默认关闭/削弱动画的设置。修正了上一轮直接卸载背景的问题：系统明确要求减少动画时保留静态场景，而不是把山、竹子、纸纹一起删掉。新增 CSS 场景在页面不可见时暂停，返回后继续，不重新随机生成内容。

七套场景仍是独立组件。只共用一份场景样式和小型确定性粒子生成函数，没有增加动画引擎、第三方依赖、网络图片或远程字体。雪花、星点布局固定种子以避免重绘跳变；涟漪和流星 DOM 有固定上限。波浪等原有动画实现未在本轮重写。

## 验证

- 36 项测试通过，包括新增粒子分布/相位、可复现性、SVG ID 隔离、装饰内容语义和固定节点数量测试。
- Lint、TypeScript、网页版构建、Chrome 插件构建、打包、回归检查通过。
- 真实首页逐一检查了七套场景，读取浏览器计算样式确认相关 CSS 动画正在运行。
- 检查了 1280×720 桌面及 390×844 窄屏构图；这不是全部设备与缩放比例的测试矩阵。
- 未进行长时功耗/帧率基准测试，也没有改动系统的无障碍设置。
- 未提交、推送或发布。插件产物：`frontend/dist/wikinote-extension.zip`。
# Mobile waves follow-up

- Wave height now expands on narrow screens instead of being capped at a compressed 180px strip.
- Amplitude is proportional to canvas height, with independent direction, phase, breathing and vertical drift per layer.
- Animation uses elapsed time rather than frame count, so motion speed is stable across refresh rates; hidden tabs and explicit reduced-motion preferences stop the canvas loop.
- The Appearance thumbnail is dedicated wave artwork with no dot/check overlay, and the palette is quieter and less grey.

## Appearance preview follow-up

- Auto is now an abstract mix of sky, paper light and sage instead of a utility shuffle icon.
- Waves uses three restrained contours with more breathing room; Ripples uses four open water arcs with no drop dots or intersecting target pattern.
- Selection uses a thin desaturated sage outline and soft shadow instead of a heavy navy frame.
