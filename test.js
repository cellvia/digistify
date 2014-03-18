var digistify = require("./");
var test = require('tape');

digistify.setDefault({transform: "article", contentTransform: "article"});

test("get all gists - set default transform to article", function(t){
	t.plan(1);
	digistify("schacon", function(err, gists){
		t.equal(+gists[gists.length-1].id, 1);
	});
});

test("get all gists - filter", function(t){
	t.plan(1);
	digistify("schacon", {filter: "the meaning of gist"}, function(err, gists){
		t.notEqual(+gists[gists.length-1].id, 1);
	});
});

test("get all gists - search", function(t){
	t.plan(1);
	digistify("schacon", {search: "the meaning of gist"}, function(err, gists){
		t.equal(gists.length, 1);
	});
});

test("get all gists - no transform", function(t){
	t.plan(1);
	digistify("schacon", {transform: false}, function(err, gists){
		t.equal(gists[gists.length-1].user.login, "schacon");
	});
});

test("get all gists - identifier", function(t){
	t.plan(1);
	digistify("schacon", {identifier: "the meaning of "}, function(err, gists){
		t.equal(gists.length === 1 && gists[0].title === "gist", true);
	});
});

test("get single gist - set default transform to article", function(t){
	t.plan(1);
	digistify("1", function(err, content){
		t.equal(content, "This is gist. \nThere are many like it, but this one is mine. \nIt is my life. \nI must master it as I must master my life. \nWithout me gist is useless. \nWithout gist, I am useless.");
	});
});

test("get single gist - no transform", function(t){
	t.plan(1);
	digistify("1", {contentTransform: false}, function(err, file){
		t.equal(file.content, "This is gist. \nThere are many like it, but this one is mine. \nIt is my life. \nI must master it as I must master my life. \nWithout me gist is useless. \nWithout gist, I am useless.");
	});
});
