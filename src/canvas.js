// Canvasjs by Subkey
// 为了方便控制各元素且利用canvas的可渲染性，简单写个canvas类
// 此js可作为库脱离此项目独立使用
class Canvas {
  constructor() {
    // dom参数
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    // 渲染参数
    this._timerId = 0;
    this._playTime = 0; // 开始播放的timestamp 用来计算current
    this.fps = 24; // 渲染使用的帧数
    this.current = 0; // 当前秒数
    this.duration = 1; // 总秒数
    this.playing = false; // 播放状态
    this.loop = true;
    this.layers = []; // 所有CanvasOM
    // 事件
    this.onend = null;
  }

  // 渲染控制
  render() {
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.current = (Date.now() - this._playTime)/1000;
    if(this.current>this.duration) { // 播完重置
      this.current = 0;
      this._playTime = Date.now();
      if(!this.loop) this.pause();
      for(const lay of this.layers) if(lay.type==="video") lay.video.pause();
      if(typeof this.onend==="function") this.onend.call(this);
    }
    for(const lay of this.layers)
      if(this.current>lay.start) {
        if(this.current<lay.start + lay.duration) { // 渲染在播放时间内的片段
          lay.applySuper();
          lay.render(this.context, lay.style); // 传参只是方便变量使用
        }else if(lay.type==="video"&&!lay.video.paused) lay.video.pause(); // 过了时长的视频直接停下
      }
    this._timerId = requestAnimationFrame(this.render.bind(this));
  }
  play() {
    if(this.playing) return;
    this.playing = true;
    this._playTime = Date.now() - this.current*1000;
    this.render();
  }
  pause() {
    this.playing = false;
    this._playTime = Date.now();
    cancelAnimationFrame(this._timerId);
    for(const lay of this.layers) if(lay.type==="video") lay.video.pause();
  }

  // 创建渲染内容
  append(lay) {
    lay.canvas = this;
    this.layers.push(lay);
    return lay;
  }
  text(sContent) {
    return this.append(new CanvasTextOM(sContent));
  }
  img(sSrc) {
    return this.append(new CanvasImgOM(sSrc));
  }
  video(sSrc) {
    return this.append(new CanvasVideoOM(sSrc));
  }

}

// canvas[元素的]父类，txt和img继承这个类
class CanvasOM {
  constructor() {
    this.canvas = null; // 绑定了的Canvas对象
    this.start = 0; // 秒起点
    this.duration = 1; // 秒数
    this.keyframe = {}; // 关键帧列表
    this.style = {
      x: 0,
      y: 0,
      opacity: 1,
      mixing: "source-over",
      shadowX: 0,
      shadowY: 0,
      shadowB: 0,
      shadowC: "#0000"
    };
  }
  applySuper() { // 给画布设置父类属性
    // 根据关键帧设置当前帧的数值
    for(const prop of Object.keys(this.keyframe)) {
      if(typeof this.style[prop]!=="number") continue;
      const keyframes = this.keyframe[prop]; // 正在设置的数值的关键帧列表
      let index = 0; // 正在设置的数值的关键帧列表的index
      const current = this.canvas.current; // 整个动画的帧位置
      let start = this.start; // 复制此CanvasOM的帧位置数字
      if(current<=start) {
        this.style[prop] = keyframes[0][1];
        break;
      }
      for(const keyframe of keyframes) {
        if(current<=start +keyframe[0]&&index!==0) {
          this.style[prop] = keyframes[index -1][1]
           +(current -start) /keyframe[0] *(keyframe[1] -keyframes[index -1][1]);
          break;
        }
        ++index;
        start += keyframe[0];
      }
    }
    // 把现在的数值应用到context2d
    var ctx = this.canvas.context;
    var style = this.style;
    ctx.globalAlpha = style.opacity;
    ctx.globalCompositeOperation = style.mixing;
    ctx.shadowOffsetX = style.shadowX;
    ctx.shadowOffsetY = style.shadowY;
    ctx.shadowBlur = style.shadowB;
    ctx.shadowColor = style.shadowC;
  }
}

// 需要fetch的资源类，通过caches<memory的顺序查找资源
class CanvasSrcOM extends CanvasOM {
  constructor() {super();
    this.id = null;
    this.blob = null;
    this.src = null;
  }
  static async save(sId, blob) {
    var srcs = await caches.open("canvasrcs");
    return await srcs.put(sId, new Response(blob));
  }
  async load(sId) {
    this.id = sId;
    var memo = CanvasSrcOM.memory;
    if(!memo[sId]) {
      var srcs = await caches.open("canvasrcs");
      var cached = await srcs.match(sId);
      if(cached) return this.src = URL.createObjectURL(this.blob = await cached.blob());
      return null;
    }
    else return this.src = URL.createObjectURL(this.blob = memo[sId]);
  }
}
CanvasSrcOM.memory = {};

// img类，继承CanvasOM
class CanvasImgOM extends CanvasSrcOM {
  constructor(sId) {super();
    this.type = "img";
    this.img = new Image();
    this.style = Object.assign(this.style, {
      smooth: false,
      width: 0,
      height: 0
    });
    // 加载图片
    this.load(sId).then((s)=> this.img.src = s?s:"/asset/lost.png");
    this.img.onload = ()=> {
      if(!this.style.width) this.style.width = this.img.naturalWidth;
      if(!this.style.height) this.style.height = this.img.naturalHeight;
    };
  }
  render(ctx, style) {
    ctx.imageSmoothingEnabled = style.smooth;
    ctx.drawImage(this.img, style.x, style.y, style.width, style.height);
  }
}

// 视频类
class CanvasVideoOM extends CanvasSrcOM {
  constructor(sId) {super();
    this.type = "video";
    this.video = document.createElement("video");
    this.offset = 0; // 视频开始位置
    this.style = Object.assign(this.style, {
      width: 0,
      height: 0
    });
    this.load(sId).then((s)=> this.video.src = s?s:"/asset/lost.mp4");
    this.video.onloadedmetadata = ()=> {
      if(!this.style.width) this.style.width = this.video.videoWidth;
      if(!this.style.height) this.style.height = this.video.videoHeight;
      if(this.duration===1) this.duration = this.video.duration - this.offset;
    };
  }
  render(ctx, style) {
    if(this.video.paused) {
      this.video.currentTime = this.canvas.current - this.start + this.offset;
      this.video.play();
    }
    ctx.drawImage(this.video, style.x, style.y, style.width, style.height);
  }
}

// 优化内存用的video
class CanvasVideoFragmentOM {

}

// txt类，继承CanvasOM
class CanvasTextOM extends CanvasOM {
  constructor(sText) {super();
    this.type = "text";
    this.style = Object.assign(this.style, {
      size: 10,
      family: "sans-serif",
      align: "left",
      color: "#345"
    });
    this.text = sText;
  }
  render(ctx, style) {
    ctx.font = `${style.size}px ${style.family}`;
    ctx.textAlign = style.align;
    ctx.fillStyle = style.color;
    ctx.fillText(this.text, style.x, style.y);
  }
}

// path类，继承CanvasOM
class CanvasPathOM extends CanvasOM {
  constructor() {super();
    this.type = "path";
    this.width = 1;
  }
}