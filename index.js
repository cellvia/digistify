var request = require('request');

var exportObj = {
	getGists: function (user, options, cb){
		if(typeof options === "function"){
			cb = options;
			options = {};
		};
		exportObj.options = options;
		var gists = [];
		var counter = 0;
		var limit = options.limit || 0;
		var offset = options.offset || 0;
		var identifier = options.identifier || "";

		var opts = {json: true};
		if(!process.browser) opts.headers = { 'User-Agent': options.userAgent || 'node.js' };

		function finalize(){
			if(offset || limit) gists = gists.slice(offset, limit);
			gists = gists.map(function(gist){
				return { id: +gist.id,
						 title: gist.description.replace(identifier, ""),
						 created: gist.created_at,
						 modified: gist.updated_at }
			});
			cb(null, gists);
		}

		function recurs(){	
			opts.url = get_gists_url(user, {per_page: 100, page: ++counter});
			request( opts, function(err, resp, newgists){
				if(err) return cb(err);
				if(resp.statusCode != 200) return cb(new Error("invalid url: "+ url));
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
				if(limit && gists.length == limit) return finalize();

				recurs();

			});
		}
		recurs();
	},

	getContent: function(id, options, cb){
		if(typeof options === "function"){
			cb = options;
			options = false;
		};
		options = options || exportObj.options;
		var contents = [];
		var opts = {url: get_gist_url(id), json: true};
		if(!process.browser) opts.headers = { 'User-Agent': options.userAgent || 'node.js' };
		request( opts, function(err, resp, gist){
			if(err) return cb(err);
			if(resp.statusCode != 200) return cb(new Error("invalid url? "+ url));
			for(var file in gist.files){
				if(options.language && gist.files[file].language.toLowerCase() !== options.language.toLowerCase()) continue
				contents.push(gist.files[file].content);
			}
			if(contents.length === 1){
				cb(null, contents[0]);
			}else{
				cb(null, contents);
			}
		});
	}
}

function get_gists_url(user, options){ return "https://api.github.com/users/"+user+"/gists?per_page="+options.per_page+"&page="+options.page; };
function get_gist_url(id){ return "https://api.github.com/gists/"+id; };

module.exports = exportObj.getGists;
module.exports.getGists = exportObj.getGists;
module.exports.getContent = exportObj.getContent;
