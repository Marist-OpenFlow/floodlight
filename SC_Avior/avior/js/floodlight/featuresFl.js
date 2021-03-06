define([
	"model/features"
], function(Features){
	/* Floodlight specific URL for switch features */
	Features.prototype.url = "/wm/core/switch/all/features/json"; 
	
	Features.prototype.parse = function(resp) {
		function compare(a,b) {
  			if (a.portNumber < b.portNumber)
     			return -1;
  			if (a.portNumber > b.portNumber)
   		 		return 1;
  			return 0;
		}

		//objs.sort(compare);

		var newResp = new Object;
		for (var key in resp){
			//console.log(JSON.stringify(resp[key].xid));	
			object = new Object;
			object.length = resp[key].length;
			object.tables = resp[key].tables;
			object.type = resp[key].type;
			object.version = resp[key].version;
			object.xid = resp[key].xid;
			object.ports = resp[key].ports;
			
			object.ports.sort(compare);
			
			
			//this.set(key, object);
			newResp[key] = object;
			//console.log(JSON.stringify(newResp));
		}
		return newResp;
	};
	return Features;
});