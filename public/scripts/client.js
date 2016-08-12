window.onload = function() {
  function readData(data) {
    return data.substring(0, data.indexOf('}') + 1)
  }

  function log(text) {
    document.body.appendChild(document.createTextNode(text));
    document.body.appendChild(document.createElement("br"));
  }

  function processStringMessage(e) {
    try {
      var data = JSON.parse(e.data);

      var table = document.createElement("table");
      table.width = "100%";

      var cols = ['counter', 'time', 'size', 'processTime'];

      headers = {}
      cols.forEach((col) => {
        headers[col] = col;
      });
      data.results.unshift(headers);

      var rows = data.results.forEach((result) => {
        var row = document.createElement("tr");
        cols.forEach((col) => {
          var td = document.createElement("td");
          td.appendChild(document.createTextNode(result[col]));
          row.appendChild(td);
        });
        table.appendChild(row);
      });
      document.body.appendChild(table);
      log(data.average + " MB/s");
    } catch(err) {
      console.error(err);
      log(e.data);
    }
  }

  function processObjectMessage(e) {
    const startTime = new Date();
    var reader = new FileReader();
    reader.addEventListener("loadend", function() {
       var json = readData(reader.result);
       var data = JSON.parse(json);
       const finalTime = new Date();
       data.processTime = finalTime - startTime
       log("received: #" + data.counter + " - " + data.size + " MB, processed in " + data.processTime + "ms");
       ws.send(JSON.stringify(data));
    });
    reader.readAsBinaryString(e.data);
  }

  var ws = new WebSocket("ws://" + location.hostname + ":8000/websocket/");
  window.ws=ws;
  log("connecting to " + ws.url);

  ws.onopen = function() {
    log("connected");
  };

  ws.onclose = function(e) {
    log("disconnected");
  };

  ws.onmessage = function(e) {
    switch(typeof e.data) {
      case 'object': return processObjectMessage(e);
      case 'string': return processStringMessage(e);
      default: console.log(e);
    }
  };
};
