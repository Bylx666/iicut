// mux.js
// by Subkey
// mux audio and video webm

// webm parsing
class EBMLParser {
  constructor(buf, parent) {
    this.buffer = buf;
    this.view = new DataView(buf);
    this.readed = 0;
    this.parent = parent;
    // load child elems
    this.json = [];
    var index = 0;
    try {
      while(index<buf.byteLength) this.json.push(this.readElem());
    }catch{}
  }
  // get vint length
  lenVint(uIndex) {
    var marker = this.view.getUint8(uIndex);
    var bytes = 0;
    while(marker>>(++bytes));
    return 8 - bytes + 1;
  }
  // read EBML element
  readElem() {
    var parent = this.parent;
    var index = this.readed;
    var start = this.readed;
    // id
    var uId = this.lenVint(index);
    var id = Array.from(new Uint8Array(this.buffer.slice(index, index+uId)))
      .map((v)=> v.toString(16)).join("");
    index += uId;
    // size
    var uSize = this.lenVint(index);
    var sizeBuf = new Uint8Array(this.buffer.slice(index, index+uSize));
    sizeBuf[0] ^= 2**(8-sizeBuf.byteLength); // delete vint marker
    var size = Number.fromU8(sizeBuf);
    index += uSize;
    // here's data
    var data = this.buffer.slice(index, index + size);
    index += size;
    this.readed = index;
    return new EBMLElement(id,data,uId+uSize+data.byteLength,parent,start);
  }
}
// Element creator
class EBMLElement {
  constructor(id,data,size,parent,start) {
    this.id = id;
    this.data = data;
    this.size = {
      data: data.byteLength,
      hdr: size-data.byteLength,
      all: size
    };
    this.parent = parent;
    this.start = start?start:0;
    // children lazy load
    Object.defineProperty(this, "json", {get() {
      delete this.json;
      return this.json = new EBMLParser(this.data, this).json;
    },configurable:true});
  }
  get u8() {
    return new Uint8Array(this.data);
  }
  find(id) {
    return this.json.find((o)=> o.id===id);
  }
  change(buf) {
    if(buf instanceof ArrayBuffer) buf = new Uint8Array(buf);
    this.data = buf.buffer;
    // buffer with ebml header
    var fullBuf = this.genElem();
    // calc the size difference
    var sizeOffset = fullBuf.byteLength - this.size.all;
    // change parent's buffer
    if(this.parent) {
      const data = this.parent.data;
      // change parent data
      this.parent.change(Uint8Array.concat([
        new Uint8Array(data.slice(0,this.start)),
        fullBuf,
        new Uint8Array(data.slice(this.start+this.size.all))
      ]));
      // reset `start` values after this element
      var thisIndex = this.parent.json.indexOf(this)+1;
      for(;thisIndex<this.parent.json.length;++thisIndex)
        this.parent.json[thisIndex].start += sizeOffset;
    }
    // set size when used previous buffer size
    this.size.data = buf.byteLength;
    this.size.all = fullBuf.byteLength;
    this.size.hdr = this.size.all - this.size.data;
  }
  // re generate elem
  genElem() {
    var sId = this.id;
    var aId = [];
    for(let i=0; i<sId.length; i+=2)
      aId.push(parseInt(sId[i]+sId[i+1],16));
    var aSize = EBMLElement.genVint(Uint8Array.fromNum(this.data.byteLength));
    return Uint8Array.concat([new Uint8Array(aId), aSize, new Uint8Array(this.data)]);
  }
  // generate vint
  static genVint(u8Buf) {
    if(u8Buf.byteLength===0) return new Uint8Array([0x80]);
    var byte = 128/(Math.pow(2,u8Buf.byteLength-1));
    if((byte>u8Buf[0])) {
      u8Buf[0]|=byte;
      return u8Buf;
    }else return Uint8Array.concat([new Uint8Array([byte>>1]),u8Buf]);
  }
  // mux video and audio into one webm
  // see [MKV Element Spec](https://www.matroska.org/technical/elements.html)
  static mux(videoBuf, audioBuf) {
    // get Segment Object
    var v = new EBMLParser(videoBuf).json[1];
    var a = new EBMLParser(audioBuf).json[1];
    // change muxing app
    v.find("1549a966").find("4d80").change(UTF8.enc("Subkey-iicut"));
    // get tracks
    var vTrack = v.find("1654ae6b").find("ae");
    var aTrack = a.find("1654ae6b").find("ae");
    // justify audio track num and concat it into video track list
    var vTrackNum = vTrack.find("d7").u8[0];
    var aTrackNum = vTrackNum + 1;
    aTrack.find("d7").change(new Uint8Array([aTrackNum]));
    vTrack.parent.change(Uint8Array.concat([vTrack.genElem(),aTrack.genElem()]));
    // get and justify audio clusters
    var aCluster = a.find("1f43b675");
    var vCluster = v.find("1f43b675");
    var aBlockList = [];
    var aBlockRecurse = function(cluster) { for(const elem of cluster) {
      // timeStamp Base value
      var tsBase = 0;
      switch (elem.id) {
        // timestamp
        case "e7": tsBase = Number.fromU8(elem.u8);
        // block
        case "a3": {
          const u8 = elem.u8;
          u8[0] = 0x80|aTrackNum;
          const ts = Uint8Array.fromNum(tsBase+Number.fromU8(u8.slice(1,3)));
          if(ts.byteLength===1) {
            u8[1] = 0;
            u8[2] = ts[0];
          }else {
            u8[1] = ts[0];
            u8[2] = ts[1];
          }
          aBlockList.push(elem.genElem());
        }
        // next cluster
        case "1f43b675": aBlockRecurse(elem.json);
      }
    }};
    aBlockRecurse(aCluster.json);
    // concat vclusters and acluster
    vCluster.change(Uint8Array.concat([vCluster.u8,Uint8Array.concat(aBlockList)]));
    console.log(Uint8Array.concat([vCluster.u8,Uint8Array.concat(aBlockList)]),vCluster.data);
    return Uint8Array.concat([EBMLElement.DOCTYPE, v.genElem()]);
  }
}
// webm doctype
EBMLElement.DOCTYPE = new Uint8Array([26,69,223,163,159,66,134,129,1,66,247,129,1,66,242,129,4,66,243,129,8,66,130,132,119,101,98,109,66,135,129,2,66,133,129,2]);