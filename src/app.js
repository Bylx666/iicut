// app.js 相当于主线程int main()
// (()=> {

  var $header = $.c("header").child(document.body);
  var $headerIi = $.c("div").html("<ico>&#xe888;</ico>").child($header);
  new ContextMenu($headerIi, "click").add($.c("div").text("233"));
  var $headerFile = $.c("div").text("艾剪").child($header);
  new ContextMenu($headerFile, "click").add($.c("div").text("test")).add($.c("div").text("test")).add($.c("div").text("test")).add($.c("div").text("test"));


  var canv = new Canvas();
  canv.duration = 15;
  canv.canvas.width = 800;
  canv.canvas.height = 600;
  document.body.append(canv.canvas);
  
  var ac;
  var video = null;
  var audio = null;
  var muxCallback = ()=> video&&audio&&open(URL.createObjectURL(new Blob([EBMLElement.mux(video,audio)],{type:"video/webm"})));
  var rdr1 = new FileReader();
  rdr1.onload = ()=> {audio=rdr1.result;muxCallback()};
  var rdr2 = new FileReader();
  rdr2.onload = ()=> {video=rdr2.result;muxCallback()};
  canv.canvas.onmousedown = ()=> {
    ac = new Ac();
    ac.duration = 15;
    var aud = ac.audio("t.mp4");
    aud.offset = 10;
    function f() {video=audio=null;
      canv.play(()=> ac.play((b)=> rdr1.readAsArrayBuffer(b)),(b)=>rdr2.readAsArrayBuffer(b));
      canv.canvas.onmousedown = ()=> {
        canv.pause();
        ac.pause();
        canv.canvas.onmousedown = f;
      };
    }
    ac.onload = ()=> f();
  };

  var v1 = canv.video("t.mp4");
  v1.duration = 15;
  v1.offset = 10;
  v1.style = {
    width: 800,
    height: 600
  };

  var t1 = canv.text("233");
  t1.duration = 20;
  t1.style.shadowC = "#888";
  t1.style.x = 50;
  t1.style.y = 50;

  var i1 = canv.img("t.png");
  i1.style.height = 500;
  i1.style.width = 400
  i1.duration = 5;
  i1.keyframe["x"] = [[0,0],[1.5,100],[1.5,0]];

  // ["a","v","t"].forEach(v=>fetch(v+".webm").then(v=>v.arrayBuffer()).then(v=>console.log(new EBMLParser(v).json[1],v.byteLength)))
// })();