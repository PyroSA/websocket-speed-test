const ws = require('ws');
const _ = require('lodash')

function hrtimeSec(timeTuple) {
  return timeTuple[0] + timeTuple[1]/1e9;
}

function sendData(socket, sizeInMB, callback, counter = 0) {
  const data = Buffer.alloc(sizeInMB * 1024 * 1024);

  for (let j = 0; j < data.length; j++) {
    data[j] = 32 + Math.random() * 95;
  }

  const payload = {
    counter: counter,
    time: process.hrtime(),
    size: sizeInMB
  };
  const json = JSON.stringify(payload);
  Buffer.from(json).copy(data);

  socket.send(data, function(err) {
    if (err) {
      console.error(err);
    }
  });
}

const speedTest = (socket) => {
  const startTime = process.hrtime();
  const results = []

  let counter = 0;

  function done(socket) {
    var data = {};
    console.log('done');
    _.forEach(results, (result) => {
      console.log(`${_.padStart(result.counter, 2)} - ${result.time.toFixed(3)} - ${result.size} - ${(result.size / result.time).toFixed(2)}`);
    })
    data.average = `${_.sumBy(results, 'size') / _.sumBy(results, 'time')}`;
    console.log(`Average: ${data.average}`);

    data.results = results;
    socket.send(JSON.stringify(data), function(err) {
      if (err) {
        console.error(err);
      }
      socket.close()
    });
  }

  function next(sizeInMB = 1) {
    counter += 1;
    if (counter > 10) done(socket);
    else {
      sendData(socket, sizeInMB, next, counter);
    }
  }

  const onMessage = (data) => {
    try {
      const response = JSON.parse(data);
      const timeDeltaHr = process.hrtime(response.time);
      response.time = hrtimeSec(timeDeltaHr);
      console.log(`received ${response.counter} - ${response.time.toFixed(3)} = ${response.size / response.time}`);
      results.push(response);
      setTimeout(() => {
        next(Math.round(response.size / response.time));
      }, 100);
    }
    catch(e) {
      console.log('response:', data);
    }
  };

  socket.on('message', onMessage);

  setTimeout(next, 100);
}

module.exports = function(options) {
  const wsServer = new ws.Server(options);

  wsServer.on('connection', speedTest);

  return wsServer;
}
