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
  printNU(avcParser);
}

function printNU(avcParser) {
  var nalUnits = avcParser.getNalUnits();
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
      elem.innerHTML += "PTS:"+ pts + " " + avcParser.nalUnitType(nu.type) + " (" + nu.data.length + " bytes)\n";
    });
  }
}