//Quadtree module(like Library)

// Gelen verileri ağaca işleyip root'a ekler.
// Handles incoming data and adds it to root.
function insertAll(pointsArray, callback) { // Point Base inserting
  var root;
  var count = 0;

  new Promise(function(resolve, reject) {
    try {
      pointsArray.forEach(function (item, index, array) {
        if(index === 0){// point base // root === undefined
          root = item;
        } else {
          findWhere(item, root);
        }
      })
    } catch (e) {
      console.log(e);
    }
  })//.then(console.log(count))
  .then(callback(root));//console.log(JSON.stringify(root, null, 2))

  // Ağacın içinde hangi dala ekleyeceğini bulur.
  // Find, point added to which branch.
  function findWhere(point, node){
    if(point.lat <= node.lat && point.lng >= node.lng){
    	if(node.topleft === undefined){
      	node.topleft = point;
        count++;
      } else {
     		findWhere(point, node.topleft);
      }
    } else if(point.lat >= node.lat && point.lng >= node.lng){
      if(node.topright === undefined){
      	node.topright = point;
        count++;
      } else {
        findWhere(point, node.topright);
      }
    } else if(point.lat >= node.lat && point.lng <= node.lng){
      if(node.bottomright === undefined){
      	node.bottomright = point;
                count++;
      } else {
        findWhere(point, node.bottomright);
      }
    } else if(point.lat <= node.lat && point.lng <= node.lng){
      if(node.bottomleft === undefined){
      	node.bottomleft = point;
                count++;
      } else {
        findWhere(point, node.bottomleft);
      }
    } else {
      console.log('Error!');
    }
  }
}

// Dörtlü ağaca girilen kamera bilgilerine göre arama yapar. Alan sorgusu.
// Searh from clients camera datas. Range Query.
function rangeSearch(cam, root, callback) { // cam.center|lat,lng-> merkez, length --> uzunluk
	var inRange = []
  var counter = 0;

  new Promise(function(resolve, reject) {
		findNode(cam, root);
  })
  .then(callback(inRange));

  // Dörtlü ağaçta aranacak verilerin uygun olup olmadığını kontrol eder uygunları döndürür.
  // Find, Which point near camera.
  function findNode(cam, node){
    try {
      minPoint = {
      	lat: cam.center.lat - cam.length,
        lng: cam.center.lng - cam.length
      }
      maxPoint = {
      	lat: cam.center.lat + Number(cam.length),
        lng: cam.center.lng + Number(cam.length)
      }

      //console.log('minPoint: ' + JSON.stringify(minPoint, null, 2) +  ' maxPoint: ' + JSON.stringify(maxPoint, null, 2));
      //console.log(JSON.stringify(node, null, 2));
      if(node !== undefined){
        counter++;
        if(node.lat > minPoint.lat && node.lat < maxPoint.lat && node.lng > minPoint.lng && node.lng < maxPoint.lng){
  				inRange.push({lat: node.lat, lng: node.lng});
        }
      }
      if (node.topleft !== undefined) {
        findNode(cam, node.topleft);
      }
      if (node.topright !== undefined) {
        findNode(cam, node.topright);
      }
      if (node.bottomright !== undefined) {
        findNode(cam, node.bottomright);
      }
      if (node.bottomleft !== undefined) {
        findNode(cam, node.bottomleft);
      }
      //console.log(counter);
    } catch (e) {
      console.log(e);
    }
  }
}

// Girilen kamera bilgilerine göre arama yapar. Alan sorgusu..
// Searh from camera datas.
function RangeSearch(cam, root, callback) {
  var inRange = []

  minPoint = {
    lat: cam.center.lat - cam.length,
    lng: cam.center.lng - cam.length
  }
  maxPoint = {
    lat: cam.center.lat + Number(cam.length),
    lng: cam.center.lng + Number(cam.length)
  }

  root.forEach(function (item, index, array) {
    if(item.lat > minPoint.lat && item.lat < maxPoint.lat && item.lng > minPoint.lng && item.lng < maxPoint.lng){
       inRange.push({lat: item.lat, lng: item.lng});
      }
  });
  callback(inRange)

}


var quad = {
  insertAll,
  rangeSearch,
  RangeSearch
}

module.exports = quad;
