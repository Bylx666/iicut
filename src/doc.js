/*
  doc.js
  by Subkey
  写js时如果不涉及复杂算法，只是dom操作的话，
  原生其实比你想象的更强大哦
  核心思想是用多少写多少，
  30秒造自己的轮子，远比排查js框架问题和语法快和强
*/

// document 语法糖
class $ {
  constructor(e) {
    this._ = e;
  }
  child(eElem) {
    if(eElem instanceof $) eElem = eElem._;
    eElem.append(this._);
    return this;
  }
  append(eElem) {
    if(eElem instanceof $) eElem = eElem._;
    this._.append(eElem);
    return this;
  }
  text(sTxt) {
    this._.textContent = sTxt;
    return this;
  }
  html(sHtml) {
    this._.innerHTML = sHtml;
    return this;
  }
  on(sEvt, fCallback) {
    this._.addEventListener(sEvt, fCallback);
    return this;
  }
  off(sEvt, fCallback) {
    this._.removeEventListener(sEvt, fCallback);
    return this;
  }
  class(sCls,bDel) {
    this._.classList[bDel?"remove":"add"](sCls);
    return this;
  }
  css(sK, sV) {
    this._.style[sK] = sV;
    return this;
  }
  static c(sTag) {
    return new $(document.createElement(sTag));
  }
}


// 页面管理器
class Page {
  constructor(sId, eContainer) {
    this.container = eContainer;
    this.id = sId;
    this.pages = {};
  }
  async load(sId) {
    fetch(`/src/page/`)
  }
  loadAll(sArrayId) {
    return Promise.all(sArrayId.map((v)=> this.load(v)));
  }
  to() {

  }
}


// 右键菜单类
class ContextMenu {
  constructor(eElem, sEvt) {
    if(eElem instanceof $) eElem = eElem._;
    // 生成dom
    this.$menu = $.c("contextmenu")
      .on("click", ()=> this.$menu._.remove())
      .on("contextmenu", (e)=> e.preventDefault());
    this.$div = $.c("div")
      .child(this.$menu);
    // 给参数dom绑定右键
    eElem.addEventListener(sEvt?sEvt:"contextmenu", (e)=> {
      e.preventDefault();
      this.$div.css("left", e.clientX+"px").css("top", e.clientY+"px");
      this.$menu.child(document.body);
    });
  }
  add(eDiv) {
    this.$div.append(eDiv);
    return this;
  }
  remove(eElem) {
    eElem.remove();
    return this;
  }
}
