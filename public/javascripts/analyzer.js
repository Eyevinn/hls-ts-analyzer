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
        var programs = parser.getPrograms();
        printInfo(programs, avcParser);
      });
    }
  };
  xhr.open("GET", url);
  xhr.send();
}

function printInfo(programs, avcParser) {
  var infoElem = document.getElementById("info");
  infoElem.style.visibility = "visible";
  var infoPrograms = document.getElementById("infoPrograms");
  infoPrograms.innerHTML = '<thead class="thead"><tr><th>PID</th><th>TYPE</th><th>PACKETS</th></tr></thead>';

  programs.forEach(function(p) {
    var row = document.createElement("tr");
    var pid = document.createElement("td");
    pid.innerHTML = p.id;
    row.appendChild(pid);
    var type = document.createElement("td");
    type.innerHTML = p.type;
    row.appendChild(type);
    var packets = document.createElement("td");
    packets.innerHTML = p.packets;
    row.appendChild(packets);
    infoPrograms.appendChild(row);    
  });
  var nalUnits = avcParser.getNalUnits().filter(function(nu) {
    return (avcParser.nalUnitCategory(nu.type) === "VCL");
  });
  plotNUs(avcParser, nalUnits);
  printNUs(avcParser, avcParser.getNalUnits());
}

function widthFromType(type, uw) {
  if (type === 5) {
    return uw * 2;
  }
  return uw;
}

function colorFromType(type) {
  if (type === 5) {
    return "rgb(244, 100, 100)";
  }
  return "rgb(190, 190, 190)";
}

function plotNUs(avcParser, nalUnits) {
  var elem = document.getElementById("plotNalUnits");

  if (nalUnits.length > 0) {
    var units = document.createElement("div");
    units.id = "units";
    elem.appendChild(units);
    
    var x = 100
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var uw = (w - 400) / nalUnits.length;

    nalUnits.forEach(function(nu) {
      var li = document.createElement("li");
      li.style.height = "90px";
      li.style.left = x + "px";
      li.style.width = widthFromType(nu.type, uw) + "px";
      li.style.backgroundColor = colorFromType(nu.type);
      x += widthFromType(nu.type, uw) + 1;
      units.appendChild(li);
    });

    var pts = document.createElement("div");
    pts.id = "pts";
    elem.appendChild(pts);

    x = 100
    var firstPts = nalUnits[0].pes.pts;
    var lastPts = 0;

    nalUnits.forEach(function(nu) {
      if (nu.type === 5) {
        var li = document.createElement("li");
        li.style.left = x + "px";
        li.style.top = "390px";
        li.innerHTML = ((nu.pes.pts - firstPts) / 90000) * 1000 + " ms";
        pts.appendChild(li);
      }
      if (nu.pes && nu.pes.pts && nu.pes.pts > lastPts) {
        lastPts = nu.pes.pts;
      }
      x += widthFromType(nu.type, uw) + 1;
    });
    var li = document.createElement("li");
    li.style.left = x + "px";
    li.style.top = "390px";
    li.innerHTML = ((lastPts - firstPts) / 90000) * 1000 + " ms";
    pts.appendChild(li);
  }
}

function printNUs(avcParser, nalUnits) {
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
      elem.innerHTML += "PTS:"+ (pts / 90000) + " " + avcParser.nalUnitType(nu.type) + " (" + nu.data.length + " bytes)\n";
    });
  }
}