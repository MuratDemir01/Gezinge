const app = require('express')();// Low level communication helper like protocol
const http = require('http').Server(app);// Our Web Server
const io = require('socket.io')(http);// For Realtime communication between Server-Client
const quad = require('./quadtree.js');


//Render our page with route
app.get('/', function (req, res) {
  res.sendfile('design/index.html');
})
app.get('/style.css', function (req, res) {
  res.sendfile('design/style.css');
})

// Tüm socketlerin yapıldığını belirten giriş.
// Connection event with socket create.
io.on('connection', function (socket) {

	// Bağlantı uyarısı
	// Connected Communication
  socket.emit('S:connection', {'text':'Connected!'});
  socket.on('C:connection',function (data) {
    console.log(data.text);
  })


  var processedData = [];
  var reductedData = [];
  var quadData = [];

	// Ham veri istemciden alınır o dosya indirgenir sonra da istemciye gönderilir.
  // Raw data getting from client. Then reduct and send to client. Also create Pointbase Quadtree.
  socket.on('C:sendDataset', function(data) {
    console.log(data.text + " has come!");
    //console.log(data.rawText);
    processedData = [];
    lines = data.rawText.split('\n');

    new Promise(function(resolve, reject) {
      lines.forEach(function (item, index, array) { // item = row = satır
        comma = item.split(',');
        if(comma.length == 7){
          processedData.push({lat:Number(comma[0]), lng: Number(comma[1])});
          /*console.log("------------------------------------");
          console.log(JSON.stringify(processedData));*/
        } else {
          console.log(comma.toString());
        }
        /*if (index === array.length - 1) { // then do this function --> life saver  Thats fine!
          console.log(index + " read!");
          SetProcessedData();
        }*/
      });
    })
    .then(SetProcessedData())
    .then(ReductionRequest())
    .then(CreateQuadtree(reductedData));

		// Ham veriyi istemciye gönderir
    // Send readable(processed) raw data to client.
    function SetProcessedData() {
      console.log(JSON.stringify(processedData, null, 2));
      console.log("its finished in SetProcessedData!");

      socket.emit('S:sendDataset', {'processedData': processedData, 'text': 'Processed Data', isReducted: false})
      console.log('processedData sended to Client!');
      console.log('processedData Size: ' + processedData.length);
      // new Promise(function(resolve, reject) {
      //
      // }).then(console.log("Hey Promise!"));// then do this function --> life saver again
      //but... When program grow, it is creating call stack error. So use async function.
    }

		// Ham veri indirgenir indirgenme verileri gönderilir.
    // The raw data is reduced then send.
    function ReductionRequest() {//lat = x, lng = y
      //console.log("ReductionRequest!");


      var startTime = new Date().getTime();
      var endTime = 0;

      var pointsData = {added: 0, removed: 0};
      var oldAngle = 0;
      var tolerance = 20;
      var reductionRatio = 0;
      var reductionTime = 0;
      console.time('LetsReduction');
      new Promise(function(resolve, reject) {


        processedData.forEach(function (item, index, array) {

          var p1 = item;

          if(index !== array.length - 1){

            var p2 = array[index + 1];

            var angleDeg = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * 180 / Math.PI;
            angleDeg += 180;

            //console.log('Deg: ' + angleDeg + '\tindex: ' + index /* + '\tlast:' + (array.length - 1) */ + ' Old Angle: ' + oldAngle);

            if(angleDeg - oldAngle > ( -tolerance) && angleDeg - oldAngle < (tolerance)){
              pointsData.removed++;
              //console.log((angleDeg - oldAngle) + ' < || > ' + (-tolerance));
            } else {
              reductedData.push(p1);
              pointsData.added++;
            }
          } else {
            reductedData.push(item);
            pointsData.added++;
            reductionRatio = (1-(pointsData.added/(pointsData.added + pointsData.removed))) * 100
          //  reductionRatio = ((pointsData.removed/(pointsData.added + pointsData.removed))) * 100
          console.timeEnd("LetsReduction", reductionTime)
          endTime = new Date().getTime();
          }
          oldAngle = angleDeg;
        });
      }).then(
        socket.emit('S:sendDataset',{'processedData': reductedData, 'text': 'Add Point Number: '
        + pointsData.added  + ' Removed Point Number: ' + pointsData.removed
        + ' ratio:' + reductionRatio + ' time: ' + (endTime - startTime) + ' ms '
        , isReducted: true})
      );
    }

		// Dörtlü ağacı oluşturur.
    // Create Pointbase Quadtree
    function CreateQuadtree(pointsArray) {
      console.log('Insert All!');
      quad.insertAll(pointsArray, function (qdata) {
        quadData = qdata;
        console.log('Insert Done!');
        //console.log(JSON.stringify(quadData, null, 2));
      });
    }

  })


	// Verilerle ağaç sorgusunu yapıp sorgudan çıkan verileri istemciye gönderir.
  // It makes the tree query then send Client
  socket.on('C:queryRequest', function (data) {

    console.log(JSON.stringify(quadData, null, 2));

    if (data.mapName === 'reductedMap') {
      console.log('ReductedMap Map QueryRequest');
      quad.rangeSearch(data.cam, quadData, function (rangeData) {
        console.log('rangeData: ' + JSON.stringify(rangeData, null, 2));
        socket.emit('S:queryResponse', {'processedData' : rangeData, 'text': 'Range Query Response!'});
      });
    } else {
      console.log('Raw Map QueryRequest');
      quad.RangeSearch(data.cam, processedData, function (rangeData) {
        console.log('rangeData: ' + JSON.stringify(rangeData, null, 2));
        socket.emit('S:queryResponse', {'processedData' : rangeData, 'text': 'Range Query Response!'});
      });
    }

  })

})

// Port açar ve dinlemeye başlar.
// Create our port and started to listen.
http.listen(process.env.PORT || 8520, function () {
  console.log('listening on localhost:8520');
})
