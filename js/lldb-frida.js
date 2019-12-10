var last_thread_id = 0;
var _next_color = 0;

var _palette = [
  // "40",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37"
  // "47",
  // "42",
  // "44",
  // "45",
  // "42",
  // "43",
  // "45;30",
  // "46"
];

var active = true;

function idaAddress(pcAddress, lrAddress, inModule) {
  // console.log(ptr(lrAddress).toString(16), ptr(pcAddress).toString(16));
  var baseAdd = Module.findBaseAddress(inModule);
  if (baseAdd > pcAddress) {
    baseAdd = ptr(Module.findBaseAddress("WeChat")).sub(0x100000000);
    inModule = "WeChat";
  }

  var pc = (ptr(pcAddress).add(0x100000000) - ptr(baseAdd)).toString(16);

  var lr = (ptr(lrAddress).add(0x100000000) - ptr(baseAdd)).toString(16);

  return inModule + " " + lr + "  " + pc;
}

function hookAddress(idaAddr, inModule) {
  var offset = "0x0";
  if (inModule === undefined || inModule === "WeChat") {
    inModule = "WeChat";
    offset = "0x100000000";
  }
  var baseAddr = Module.findBaseAddress(inModule);
  var method = memAddress(baseAddr, offset, idaAddr);
  return method;
}

function memAddress(memBase, idaBase, idaAddr) {
  var offset = ptr(idaAddr).sub(ptr(idaBase));
  var result = ptr(memBase).add(ptr(offset));
  return result;
}

function _print(context, message) {
  // console.log("context.depth " + context.depth);
  var indent = "  | ".repeat(context.depth);

  if (context.threadId !== last_thread_id) {
    last_thread_id = context.threadId;
    _next_color = _next_color + 1;
    // console.log("\n");
  }

  var idaAdd = idaAddress(context.context.pc, context.context.lr, "WeChat");
  var color = _palette[_next_color % _palette.length];
  console.log(
    "\x1b[" +
    color +
    "m" +
    indent +
    message +
    "\x1b[0m" +
    "  ( " +
    idaAdd +
    " )"
  );
}

function bin2Hex(data, len) {
  var data = Memory.readByteArray(data, len);
  //   // console.log(data);

  var b = new Uint8Array(data);
  var str = "";

  for (var i = 0; i < b.length; i++) {
    str += ("0" + b[i].toString(16)).slice(-2) + "";
  }
  return str;
}

var freadMethod = Module.findExportByName(null, "fread");
// console.log(freadMethod);

var fseekMethod = Module.findExportByName(null, "fseek");
// console.log(fseekMethod);

// var mp4fileMethod = new NativeFunction(
//     hookAddress("0x2C6B64", "mars"),
//     "int64",
//     ["pointer"]
// );
//
// Interceptor.attach(mp4fileMethod, {
//     onEnter: function(args) {
//         console.log("------------------enter mp4fileMethod----------------");
//         active = true;
//     },
//     onLeave: function(retval) {
//         console.log("------------------exit mp4fileMethod-----------------");
//         active = false;
//     }
// });
//
// var MD5_processMethod = Module.findExportByName("mars", "MD5_process");
// if (MD5_processMethod) {
//     Interceptor.attach(MD5_processMethod, {
//         onEnter: function(args) {
//             if (active) {
//                 var title =
//                     " _MD5_process: " +
//                     args[2].toInt32() +
//                     "  " +
//                     bin2Hex(args[1], args[2].toInt32());
//                 if (args[2].toInt32() > 0) {
//                     _print(this, title);
//                 }
//             }
//         }
//     });
// }
//
// var MD5_finishMethod = Module.findExportByName("mars", "MD5_finish");
// if (MD5_finishMethod) {
//     Interceptor.attach(MD5_finishMethod, {
//         onEnter: function(args) {
//             this.buf = args[1];
//         },
//         onLeave: function(retval) {
//             if (active) {
//                 var title = " MD5_finish : " + bin2Hex(this.buf, 16);
//                 _print(this, title);
//             }
//         }
//     });
// }

function hookFileMethod() {
  Interceptor.attach(freadMethod, {
    onEnter: function (args) {
      this.result = args[0];
      this.size = args[1].toInt32();
      this.nTimes = args[2].toInt32();
    },
    onLeave: function (retval) {
      if (active) {
        var titleBegin =
          "fread " +
          this.size * this.nTimes +
          " = " +
          bin2Hex(this.result, this.size * retval.toInt32());

        console.log(titleBegin);
        console.log("");
      }
    }
  });

  Interceptor.attach(fseekMethod, {
    onEnter: function (args) {
      if (active) {
        var titleBegin =
          "fseek " + args[1].toInt32() + " , " + args[2].toInt32();

        console.log(titleBegin);
      }
    }
  });
}

// hookFileMethod();

function hookXLogger(b) {
  if (b) {
    var method = Module.findExportByName(
      "mars",
      "_Z16xlogger_appenderPK13XLoggerInfo_tPKc"
    );
    Interceptor.attach(method, {
      onEnter: function (args) {
        try {
          _print(this, "xlogger: " + Memory.readCString(args[1]));
        } catch (e) {
          _print(this, e);
        }
      }
    });
  }
}

function hookCdnDecrypt(b) {
  if (b) {
    var method = Module.findExportByName(
      "mars",
      "_ZN8cdnutils26decrypt_sns_encrypted_dataEPKcmPcy"
    );

    Interceptor.attach(method, {
      onEnter: function (args) {
        this.buf = args[0];
        this.bufLen = args[1].toInt32();
        this.result = args[2];

        var title =
          "decrypt_sns_encrypted_data dataLen : " +
          args[1].toInt32() +
          " key: " +
          args[3] +
          " data: " +
          bin2Hex(this.buf, this.bufLen);
        _print(this, title);
      },

      onLeave: function (retval) {
        var title =
          "decrypt_sns_encrypted_data return : " +
          bin2Hex(this.result, this.bufLen);
        _print(this, title);
      }
    });
  }
}

function hookIsaac64_init(b) {
  if (b) {
    var method = Module.findExportByName(
      "mars",
      "_ZN7isaac6412isaac64_initEPym"
    );

    Interceptor.attach(method, {
      onEnter: function (args) {
        this.buf = args[0];
        this.bufLen = 4128;
        this.key = args[1];

        var title =
          "isaac64_init key: " +
          Memory.readU64(this.key);
        _print(this, title);
      },

      onLeave: function (retval) {
        var title =
          "isaac64_init return : " + bin2Hex(this.buf, this.bufLen);
        _print(this, title);
      }
    });
  }
}
function hookRandinit(b) {
  if (b) {
    var method = Module.findExportByName(
      "mars",
      "_ZN7isaac648randinitEi"
    );

    Interceptor.attach(method, {
      onEnter: function (args) {
        this.buf = args[0];
        this.bufLen = 4128;


        var title =
          "isaac64::randinit buf: " +

          bin2Hex(this.buf, this.bufLen);
        _print(this, title);
      }
    });
  }
}

function hookIsaac64_rand(b) {
  if (b) {
    var method = Module.findExportByName(
      "mars",
      "_ZN7isaac6412isaac64_randEv"
    );

    Interceptor.attach(method, {
      onEnter: function (args) {
        this.buf = args[0];
      },
      onLeave: function (retval) {
        var index = Memory.readInt(ptr(this.buf).add(256 * 8));
        var title =
          "isaac64_rand : index= " + index + " value= " + retval;
        _print(this, title);
      }
    });
  }
}

function hookIsaac64_reset(b) {
  if (b) {
    var method = Module.findExportByName(
      "mars",
      "_ZN7isaac6413isaac64_resetEv"
    );

    Interceptor.attach(method, {
      onEnter: function (args) {
        this.buf = args[0];
      },
      onLeave: function (retval) {
        var title = "isaac64_reset " + bin2Hex(this.buf, 4096);
        _print(this, title);
      }
    });
  }
}

hookXLogger(true);
hookCdnDecrypt(true);
hookIsaac64_init(true);
hookIsaac64_rand(true);
hookIsaac64_reset(true);
hookRandinit(true);
