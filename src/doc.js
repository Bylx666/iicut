/*
  doc.js
  by Subkey
  写js时如果不涉及复杂算法，只是dom操作的话，
  原生其实比你想象的更强大哦
  核心思想是用多少写多少，
  30秒造自己的轮子，远比排查js框架问题和语法快和强
*/
(()=>{

  function S(e) {this._ = e;}
  S.prototype = {
    child(eElem) {eElem.append(this._);return this;},
    text(sTxt) {this._.textContent = sTxt;return this;}
  };

  S.c = (s)=> new S(document.createElement(s));
  window.$ = S;

})();
