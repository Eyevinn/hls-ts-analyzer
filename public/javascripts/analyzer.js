function analyze() {
  var url = document.getElementById("segmentUrl").value;
  var parser = new window.HlsTs({ debug: true });

  var xhr = new XMLHttpRequest();
  xhr.responseType = "arraybuffer";
  xhr.onloadend = function() {
    if (xhr.status === 200) {
      var buffer = xhr.response;
      var data = new Uint8Array(buffer);
      parser.parse(data).then(function() {
        var avcParser = parser.createAvcParser(parser.getDataStreamByProgramType("avc"));
        var nalUnits = avcParser.getNalUnits();
        printNU(avcParser, nalUnits);
        //plotAvc(nalUnits);
      });
    }
  };
  xhr.open("GET", url);
  xhr.send();
}

function printNU(parser, nalUnits) {
  var elem = document.getElementById("nalUnits");
  elem.innerHTML = "";

  if (nalUnits.length > 0) {
    var firstPts = nalUnits[0].pes.pts;
    nalUnits.sort(function (a, b) {
      if (!a.pes) return 1;
      if (!b.pes) return -1;
      return (a.pes.pts - b.pes.pts);
    }).forEach(function(nu) {
      var pts = "";
      if (nu.pes) {
        pts = nu.pes.pts - firstPts;
      }
      elem.innerHTML += "PTS:"+ pts + " " + parser.nalUnitType(nu.type) + " (" + nu.data.length + " bytes)\n";
    });
  }
}

var XOFFSET = 60;
var WIDTH = 1400;

function plotAvc(nalUnits) {
  var elem = document.getElementById("avc");
  var w = WIDTH / nalUnits.length;
  for (var i = 0; i < nalUnits.length; i++) {
    var item = document.createElement("li");
    var type = nalUnits[i].type;
    var size = 200;
    item.innerHTML = type;
    item.style.height = size + "px";
    item.style.top = (500 - size) + "px";
    item.style.left = XOFFSET + (i * 10 + 1) + "px";
    item.style.visibility = "visible";
    elem.appendChild(item);
  }
}