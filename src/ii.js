// ii.js
// by Subkey
// utils

// file resources
var iiResources = {
  cache: null,
  memory: {},
  queue: [], // with queue prevent meaningless `caches.open`
  get(sId) {
    // load into queue
    if(!iiResources.cache) return new Promise((resolve)=> {
      iiResources.queue.push(()=> resolve(iiResources.get(sId)));
    });
    // read memory before cache
    if(iiResources.memory[sId]) return Promise.resolve(iiResources.memory[sId]);
    return iiResources.cache.match(sId).then((v)=> v?v.arrayBuffer():null).then((v)=> {
      if(!v) return null;
      iiResources.memory[sId] = v;
      return v;
    });
  },
  set(sId, blob) {
    if(!iiResources.cache) return new Promise((resolve)=> {
      iiResources.queue.push(()=> resolve(iiResources.get(sId, blob)));
    });
    return this.cache.put(sId, new Response(blob));
  },
  load(sId, sUrl) {
    return fetch(sUrl).then((v)=> v.arrayBuffer()).then((v)=> iiResources.set(sId, v));
  },
  rm(sId) {
    return this.cache.remove(sId);
  }
};
caches.open("ii-resources").then((cache)=> {
  iiResources.cache = cache;
  for(const t of iiResources.queue) t.call(iiResources);
});


// convertions betw Str and U8
var UTF8 = {
  dec: TextDecoder.prototype.decode.bind(new TextDecoder()),
  enc: TextEncoder.prototype.encode.bind(new TextEncoder())
};


// u8 extention
Uint8Array.concat = function(u8Bufs) {
  var len = u8Bufs.reduce((a,b)=> a+=b.byteLength, 0);
  var out = new Uint8Array(len);
  u8Bufs.reduce((i,buf)=> {
    out.set(buf, i);
    return i+buf.byteLength;
  }, 0);
  return out;
}
Uint8Array.fromNum = function (num) {
  var len = 0;
  while(num>(256**(++len)));
  var buf = new Uint8Array(len);
  for(let i=0; i<len; ++i) {
    const rad = 256 ** (len - i - 1);
    const byte = 0 | (num / rad);
    num -= (byte * rad);
    buf[i] = byte;
  }
  return buf;
}

Number.fromU8 = function (u8Buf) {
  var len = u8Buf.byteLength - 1;
  return u8Buf.reduce((a,b,i)=> a+(b*(256**(len-i))), 0);
}





