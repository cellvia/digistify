var request = require('request');

var exportObj = {
	defaults: {},
	setDefault: function(prop, val){
		if(typeof prop === "object")
			merge(exportObj.defaults, prop);
		else
			exportObj.defaults[prop] = val;		
	},
	getGists: function (user, options, cb){
		if(!isNaN(user)) return exportObj.getFiles.apply(exportObj, arguments);
		if(typeof options === "function"){
			cb = options;
			options = {};
		};
		options = merge(options, exportObj.defaults);
		var gists = [];
		var counter = 0;
		var limit = options.limit || 0;
		var offset = options.offset || 0;
		var identifier = options.identifier || "";
		var transform;

		switch(options.transform){
			case "article":
				transform = function(gist){
					return { id: +gist.id,
							 title: gist.description.replace(identifier, ""),
							 created: gist.created_at,
							 modified: gist.updated_at }
				}
			break;
			default:
				transform = typeof options.transform === "function" ? options.transform : false;
			break;
		}

		var opts = {json: true, headers: {} };
		if(options.etag){
			opts.headers['If-None-Match'] = options.etag;
			delete options.etag; 
		}
		if(typeof options.headers === "object") merge(opts.headers, options.headers);
		if(typeof exportObj.defaults.headers === "object") merge(opts.headers, exportObj.defaults.headers);
		if(!process.browser && !opts.headers['User-Agent']) opts.headers['User-Agent'] = options.userAgent || 'node.js';

		var etag;

		function recurs(){
			opts.url = get_gists_url(user, {per_page: 100, page: ++counter});
			request( opts, function(err, resp, newgists){
				if(resp.statusCode == 304) return cb(null, "unmodified");
				if(err) return cb(err);
				if(resp.statusCode != 200) return cb(new Error("invalid url: "+ opts.url));
				if(!etag) etag = resp.headers ? resp.headers['ETag'] : resp.getResponseHeader('ETag');
				if(typeof newgists !== "object" || typeof newgists.length === "undefined" || newgists.message) return cb(new Error("error: "+ newgists));
				if(!newgists.length) return finalize();

				newgists = newgists.filter(function(gist){
					var test = gist.public 
						&& gist.description 
						&& gist.files
						&& (!options.identifier || ~gist.description.indexOf(options.identifier))
						&& (!options.search || ~gist.description.toLowerCase().indexOf(options.search.toLowerCase()))
						&& (!options.filter || !~gist.description.toLowerCase().indexOf(options.filter.toLowerCase()));

					if (!test) return false;

					if(options.language){
						for( var file in gist.files ){
							if( test = gist.files[file].language.toLowerCase() === options.language.toLowerCase() )
								return test
						}				
					}
					return test
				});

				gists = gists.concat(newgists);
				if(newgists.length < 100 || limit && limit <= gists.length) return finalize();

				recurs();

			});
		}
		recurs();

		function finalize(){
			if(offset || limit) gists = gists.slice(offset, limit);
			if( transform ) gists = gists.map(transform);
			cb(null, { data: gists, etag: etag });
		}
	},

	getFiles: function(id, options, cb){
		if(typeof options === "function"){
			cb = options;
			options = {};
		};
		merge(options, exportObj.defaults);
		var contents = [];
		var transform;

		switch(options.fileTransform){
			case "article":
				transform = function(file){
					return file.content
				}
			break;
			default:
				transform = typeof options.fileTransform === "function" ? options.fileTransform : false;
			break;
		}

		var opts = {json: true, headers: {}, url: get_gist_url(id) };
		if(options.etag){
			opts.headers['If-None-Match'] = options.etag;
			delete options.etag; 
		}
		if(typeof options.headers === "object") merge(opts.headers, options.headers);
		if(typeof exportObj.defaults.headers === "object") merge(opts.headers, exportObj.defaults.headers);
		if(!process.browser && !opts.headers['User-Agent']) opts.headers['User-Agent'] = options.userAgent || 'node.js';

		request( opts, function(err, resp, gist){
			if(resp.statusCode == 304) return cb(null, "unmodified");
			if(err) return cb(err);
			if(resp.statusCode != 200) return cb(new Error("invalid url? "+ opts.url));
			var etag = resp.headers ? resp.headers['ETag'] : resp.getResponseHeader('ETag');
			for(var file in gist.files){
				if(options.language && gist.files[file].language.toLowerCase() !== options.language.toLowerCase()) continue
				contents.push(gist.files[file]);
			}
			if(transform) contents = contents.map(transform);
			cb(null, { data: contents, etag: etag });
		});
	}
}

function get_gists_url(user, options){ return "https://api.github.com/users/"+user+"/gists?per_page="+options.per_page+"&page="+options.page; };
function get_gist_url(id){ return "https://api.github.com/gists/"+id; };
function merge(a, b){ a = a || {}; for (var x in b){ if(typeof a[x] !== "undefined") continue; a[x] = b[x]; } return a; };

module.exports = exportObj.getGists;
module.exports.setDefault = exportObj.setDefault;
