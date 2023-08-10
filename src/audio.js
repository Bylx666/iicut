// audio.js
// by Subkey
// 作为音频控制层渲染视频，封装了AudioContext的基础功能
class Ac {
  constructor() {
    this._ = new AudioContext();
    this.audios = [];
    this.audioDest = this._.destination;
    // 播放参数(秒)
    this.current = 0;
    this.duration = 0;
    this._playtime = 0;
    this._endTimer = 0;
    this.paused = true;
    // 音频加载参数
    this.loading = 0;
    this.onload = null; // 每批audio加载好都会触发一次
    // 渲染文件参数
    this.recorderDest = this._.createMediaStreamDestination();
    this.recorder = new MediaRecorder(this.recorderDest.stream, {mimeType: "audio/webm"});
  }
  // 异步加载
  loadBuffer(sId) {
    if(Ac.buffers[sId]) return Promise.resolve(Ac.buffers[sId]);
    return iiResources.get(sId)
      .then((b)=> b?this._.decodeAudioData(b):null)
      .then((b)=> Ac.buffers[sId] = b);
  }
  // 播放控制
  play(fRecord) {
    if(!this.paused) return;
    this.paused = false;
    // 超出总时长就停下或循环
    if(this.current>this.duration) this.current = 0;
    this._endTimer = setTimeout(() => {
      this.pause();
      this.current = 0;
    }, 1000*(this.duration - this.current));
    // 遍历播放
    this._playtime = Date.now();
    for(const aud of this.audios)
      if(this.current<=aud.start + aud.duration) {
        const timeout = aud.start - this.current;
        aud.play(timeout<0?0:timeout, timeout<0?aud.offset-timeout:aud.offset);
      }
    if(fRecord) {
      this.recorder.start();
      this.recorder.ondataavailable = (e)=> fRecord.call(this, e.data);
    }
  }
  pause() {
    if(this.paused) return;
    this.paused = true;
    for(const aud of this.audios)
      aud.pause();
    this.current += (Date.now() - this._playtime) / 1000;
    clearTimeout(this._endTimer);
    if(this.recorder.state==="recording") this.recorder.stop();
  }
  // 创建音频
  audio(sId) {
    var aud = new AcAudio(this, sId);
    ++this.loading;
    aud.onload = ()=> {
      if(--this.loading===0&&typeof this.onload==="function") this.onload.call(this);
    };
    this.audios.push(aud);
    return aud;
  }
  // 插入处理模块
  node(audioNode) {
    audioNode.connect(this.audioDest);
    this.audioDest = audioNode;
    return audioNode;
  }
}
Ac.buffers = {};


// 音频的audio node
class AcAudio {
  constructor(ac, sId) {
    this.ac = ac;
    this.id = sId;
    this.node = null;
    this.buffer = null;
    // 时间参数/秒
    this.start = 0; // 开始时的秒数
    this.duration = 0; // 播放时长
    this.maxDuration = 0; // 音源时长
    this.offset = 0; // 音频开始时间
    this.paused = true;
    // 加载回调
    this.onload = null;
    this.ac.loadBuffer(sId).then((buf)=> {
      this.buffer = buf;
      this.maxDuration = buf.duration;
      if(!this.duration) this.duration = buf.duration;
      if(typeof this.onload==="function") this.onload.call(this);
    });
  }
  play(nTimeout, nOffset) {
    if(!this.paused) this.pause();
    this.node = this.ac._.createBufferSource();
    this.node.buffer = this.buffer;
    this.node.connect(this.ac.audioDest);
    this.node.connect(this.ac.recorderDest);
    this.node.start((nTimeout?nTimeout:0), nOffset?nOffset:this.offset, this.duration);
    this.paused = false;
  }
  pause() {
    if(this.node) {
      this.node.stop();
      this.node.disconnect();
    }
    this.node = null;
    this.paused = true;
  }
}