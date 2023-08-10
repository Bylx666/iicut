// Canvasjs
// by Subkey
// for video controllability mixing
// Availablely separated
class Canvas {
  constructor() {
    // dom params
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    // rendering params
    this._timerId = 0;
    this._playTime = 0; // timestamp when start, for calc of frame timing
    this.fps = 0; // exporting fps
    this.current = 0; // current seconds
    this.duration = 1; // duration in seconds
    this.playing = false; // status playing
    this.layers = []; // CanvasOM list
    // Ev
    this.onend = null;
    // init recording into webm
    this.recorder = new MediaRecorder(this.canvas.captureStream(), {mimeType: 'video/webm'});
  }

  get videos() {
    return this.layers.filter((l)=> l.type==="video");
  }

  // rendering controlling
  render() {
    // reset after end
    if(this.current>=this.duration) {
      this.current = 0;
      this.pause();
      for(const {video} of this.videos) if(!video.paused) video.pause();
      if(typeof this.onend==="function") this.onend.call(this);
      return;
    }
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.current = (Date.now() - this._playTime)/1000;
    // iterate through CanvasOMs to render
    for(const lay of this.layers)
      if(this.current>=lay.start) {
        // just render frames in time
        if(this.current<=lay.start + lay.duration) {
          lay.applySuper();
          // play the not played videos
          if(lay.type==="video"&&lay.video.paused) lay.video.play();
          lay.render(this.context);
        // halt videos after time
        }else if(lay.type==="video"&&!lay.video.paused) lay.video.pause();
      }
    this._timerId = requestAnimationFrame(this.render.bind(this));
  }
  play(fCallback, fRecord) {
    if(this.playing) return;
    // load the first frame in advance
    var seeked = this.videos.length;
    var onseek = ()=> {
      if(--seeked!==0) return;
      // actual playing function
      this._playTime = Date.now() - this.current*1000;
      this.render();
      typeof fCallback==="function"&&fCallback.call(this);
      this.playing = true;
      if(fRecord) {
        this.recorder.start();
        this.recorder.ondataavailable = (e)=> fRecord.call(this, e.data);
      }
    };
    for(const {video, start, offset} of this.videos) {
      video.currentTime = this.current - start + offset;
      video.onseeked = onseek;
    }
  }
  pause() {
    this.playing = false;
    cancelAnimationFrame(this._timerId);
    for(const {video} of this.videos) if(!video.paused) video.pause();
    if(this.recorder.state==="recording") this.recorder.stop();
  }

  // rendering creation
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
    this.duration = 0; // 秒数
    this.keyframe = {}; // 关键帧列表
    this._style = {
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
  set style(v) {
    this._style = Object.assign(this._style, v);
  }
  get style() {
    return this._style;
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
    const {opacity, mixing, shadowX, shadowY, shadowB, shadowC} = this.style;
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = mixing;
    ctx.shadowOffsetX = shadowX;
    ctx.shadowOffsetY = shadowY;
    ctx.shadowBlur = shadowB;
    ctx.shadowColor = shadowC;
  }
}

// 需要fetch的资源类，通过caches<memory的顺序查找资源
class CanvasSrcOM extends CanvasOM {
  constructor() {super();
    this.id = null;
    this.blob = null;
    this.src = null;
  }
  async load(sId) {
    this.id = sId;
    return iiResources.get(sId).then((b)=> {
      if(b) return this.src = URL.createObjectURL(this.blob = new Blob([b]));
      return null;
    });
  }
}

// img类，继承CanvasOM
class CanvasImgOM extends CanvasSrcOM {
  constructor(sId) {super();
    this.type = "img";
    this.img = new Image();
    this.style = {
      smooth: false,
      width: 0,
      height: 0
    };
    // 加载图片
    this.load(sId).then((s)=> this.img.src = s?s:"/asset/lost.png");
    this.img.onload = ()=> {
      if(!this.style.width) this.style.width = this.img.naturalWidth;
      if(!this.style.height) this.style.height = this.img.naturalHeight;
    };
  }
  render(ctx) {
    const {x, y, width, height, smooth} = this.style;
    ctx.imageSmoothingEnabled = smooth;
    ctx.drawImage(this.img, x, y, width, height);
  }
}

// 视频类
class CanvasVideoOM extends CanvasSrcOM {
  constructor(sId) {super();
    this.type = "video";
    this.video = document.createElement("video");
    this.offset = 0; // 视频开始位置
    this.style = {
      width: 0,
      height: 0
    };
    this.load(sId).then((s)=> {
      if(s) this.video.onloadedmetadata = ()=> {
        if(!this.style.width) this.style.width = this.video.videoWidth;
        if(!this.style.height) this.style.height = this.video.videoHeight;
        if(!this.duration) this.duration = this.video.duration - this.offset;
      };
      this.video.muted = true;
      this.video.src = s?s:"/asset/lost.mp4";
    });
  }
  render(ctx) {
    const {x, y, width, height} = this.style;
    ctx.drawImage(this.src?this.video:CanvasVideoOM.lost, x, y, width, height);
  }
}
CanvasVideoOM.lost = new Image();
CanvasVideoOM.lost.src = "/asset/lost.png";

// 优化内存用的video
class CanvasVideoFragmentOM {

}

// txt类，继承CanvasOM
class CanvasTextOM extends CanvasOM {
  constructor(sText) {super();
    this.type = "text";
    this.style = {
      size: 10,
      family: "sans-serif",
      align: "left",
      color: "#345"
    };
    this.text = sText;
  }
  render(ctx) {
    const {size, family, align, color, x, y} = this.style;
    ctx.font = `${size}px ${family}`;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(this.text, x, y);
  }
}

// path类，继承CanvasOM
class CanvasPathOM extends CanvasOM {
  constructor() {super();
    this.type = "path";
    this.width = 1;
  }
}