var static = require('node-static'),
	fileServer = new static.Server('./www'),
	port = 3000;


require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response, function(e, res) {
			if(e && e.status === 404) {
				fileServer.serveFile('/404.html', 404, {}, request, response);
			}
		});
    }).resume();
	console.log('Listening on port ' + port);
}).listen(port);
