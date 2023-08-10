# 艾剪

## 介绍

艾剪`iicut`是一个

1. 开放API
2. 可在线演示视频，可传输工程文件
3. 性能不错
4. 开源免费
5. 纯前端，文件安全
6. 加载完成后可离线使用

的**在线剪辑网站**。

设计参考pr，上手方便。

## 使用

### 浏览器

推荐使用`Chrome`和一切`Chromium`内核的浏览器如`Edge`，本网站兼容至chrome 70，相当于5年前的主流浏览器。

其次可以用`Firefox`，如果火狐遇到卡顿的话

1. 进入`about:config`，将`gfx.canvas.accelerated`设置为`true`
2. 在设置-常规-性能-使用推荐的性能设置**取消勾选**-自动启用硬件加速**不用勾选**

## 项目开发

### 目录结构
```plain
binshow
|=asset
| |-
```

### dom框架

dom使用原生js，大概思路为在`/src/page/`中的**目录名**为一个可切换页面的**实例**的id，其目录下的js和css文件代表了动态创建子页面的脚本和样式

看到子目录是因为可以分离命名空间，其页面实例id会直接包含`/`，比如侧边栏的实例id就叫`ii/sidebar`。`ii`就是官方的命名空间，意为`iicut`。

如果不习惯脱离html来使用dom的话是没法进行新页面开发的。

对于js动态创建页面并非难事，只要你对原生dom有一丁点的基础就可以轻松上手我对dom定义的语法糖。

习惯使用vue的人可能会寻找`scoped`选项限制css，但在这里无需担心，你的css会被自动限制到你的子页面中，不会污染全局样式。

### 变量类型

习惯强语言ts如何适应纯js开发？我在暴露了的类和函数的形参前面写了一些标识类型的字符。以下为一般情况下的类型对照表

|字符|类型|
|---|---|
|`s`|`String`|
|`sArray`|`String[]`|
|`f`|`Function`|
|`b`|`Boolean`|
|`e`|`HTMLElement`|
|`$`|`class $`|

如果没有前缀一般就是并不太适合对外暴露的API，往往由内部调用，但它们也有其对应类型的名字，如形参`blob`对应其类`Blob`，`ctx`对应其类`CanvasRenderingContext2D`。

此外，对于二进制处理，存在后缀标识类型，分别是`buf`->`ArrayBuffer`,`u8Buf`->`Uint8Array`

## 关于

by 沙琪玛

爱❤来自瓷器(but practice your English reading my code notes:)