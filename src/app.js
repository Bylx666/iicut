// app.js 页面生成和交互
(()=> {

  var canv = new Canvas();
  canv.duration = 15;
  canv.canvas.width = 800;
  canv.canvas.height = 600;
  document.body.append(canv.canvas);



  var v1 = canv.video("t.mp4");
  // v1.duration = 15;
  v1.offset = 10;
  v1.style.width = 800;
  v1.style.height = 600;

  var t1 = canv.text("233");
  t1.duration = 20;
  t1.style.shadowC = "#888";
  t1.style.x = 50;
  t1.style.y = 50;

  var i1 = canv.img("t");
  i1.style.height = 500;
  i1.style.width = 400
  i1.duration = 3;
  i1.keyframe["x"] = [[0,0],[1.5,100],[1.5,0]];

  canv.canvas.onmousedown = function f() {
    canv.play();
    canv.canvas.onmousedown = ()=> {
      canv.pause();
      canv.canvas.onmousedown = f;
    };
  }
  
})();