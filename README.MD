# 跨语言链接增强工具（ILH++ / Internal Link Helper++）
本小工具为中文维基百科的[跨语言链接](https://zh.wikipedia.org/wiki/Template:Internal_link_helper)增强工具。功能简介：
1. 弹出提示，支持显示外文条目文字预览；
2. 外观契合 MediaWiki 视觉风格，和 [Popups 扩展](https://www.mediawiki.org/wiki/Extension:Popups)保持一致；
3. 专门适配移动版界面；
4. 支持更灵活的自定义选项；
5. 代码层面上，不再依赖过时库。

## FAQ
### 为什么预览不显示图片？
因为太复杂，不想做。

### 参数设置里只有一个选项了，其他选项在哪里？
由于小工具无法向参数设置中添加自定义设置，所以设置界面为自行实现，通过点击预览弹框中的设置按钮打开。

## 部署方法
本小工具兼容的最低 MediaWiki 版本为 1.45.0-wmf.6。仓库中含有两个包，`ilhpp` 包含了小工具除设置窗口外的所有代码；`ilhpp-settings` 包含了设置窗口的代码，并在需要时动态加载以优化性能。

小工具的定义位于各自包下的 `.gadgetdefinition` 文件内，先将其添加至 MediaWiki。然后使用 `build` 脚本构建两个包，生成的代码位于根目录的 `dist` 目录内，然后将其复制到 MediaWiki 命名空间下的同名位置（MediaWiki:Gadget-xxx.(css|js)）。

## 授权协议
本小工具依照 GPL-2.0-or-later 协议授权。
