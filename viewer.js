const fs = require('fs');
const flatfile = require('flat-file-db');
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');

var workingDirectory = path.resolve(__dirname);

var app = express();

app.engine('.handlebars', exphbs({defaultLayout: 'main', extname: '.handlebars'}));
app.set('view engine', '.handlebars');

var configFileName = './config.json';
var configObject = require(configFileName);

var flatFileName = workingDirectory + '/./data/posts.db';

if (! fs.existsSync(flatFileName)) {
  var db = flatfile(flatFileName);
} else {
  var db = flatfile.sync(flatFileName);
}

var dbDoggos = db.keys();
var sortedDoggos = { };

for (var pageIndex = 0; pageIndex < configObject.pages.length; pageIndex++) {
  var page = configObject.pages[pageIndex];
  sortedDoggos[page.id] = {};
  sortedDoggos[page.id].id = page.id;
  sortedDoggos[page.id].name = page.name;
  sortedDoggos[page.id].taggedDoggos = {};
  sortedDoggos[page.id].allDoggos = [];

  for (var searchTermIndex = 0; searchTermIndex < page.searchTerms.length; searchTermIndex++) {
    var searchTerm = page.searchTerms[searchTermIndex];
    sortedDoggos[page.id].taggedDoggos[searchTerm] = [];
  }
}

for (var doggoIndex = 0; doggoIndex < dbDoggos.length; doggoIndex++) {
  var doggo = JSON.parse( db.get( dbDoggos[doggoIndex] ) );

  doggo.matchReasons = doggo.matchReasons.split("!@#$%");
  doggo.matchReasonComments = doggo.matchReasonComments.split("!@#$%");

  var matchReasons = doggo.matchReasons;

  sortedDoggos[doggo.pageId].allDoggos.push(doggo);

  for (var matchReasonIndex = 0; matchReasonIndex < matchReasons.length; matchReasonIndex++) {
    var matchReason = matchReasons[matchReasonIndex].toLowerCase().replace(/ /g, '');

    for (var key in sortedDoggos[doggo.pageId].taggedDoggos) {
      if (matchReason == key) {
        sortedDoggos[doggo.pageId].taggedDoggos[matchReason].push(doggo);
      }
    }
  }
}

var getAllDoggos = function() {
  var _allDoggos = [];

  for (var pageId in sortedDoggos) {
    var pageDoggos = sortedDoggos[pageId].allDoggos;
    var pageName = sortedDoggos[pageId].name;

    _allDoggos.push({'name': pageName, 'doggos': pageDoggos});
  }

  return _allDoggos;
};

var getTaggedDoggos = function(tag) {
  var _taggedDoggos = [];

  for (var pageId in sortedDoggos) {
    var pageName = sortedDoggos[pageId].name;

    _taggedDoggos.push({'name': pageName, 'tag': tag, 'doggos': sortedDoggos[pageId].taggedDoggos[tag] || []});
  }

  return _taggedDoggos;
};

app.get('/doggos', function (req, res) {
  var doggosByPage = getAllDoggos();

  res.render('all', {
    'title': 'All the P R E M I U M doggos and #idc',
    'doggosByPage': doggosByPage
  });
});

app.get('/doggos/tag/:tag', function (req, res) {
  var tag = req.params.tag;
  var doggosByPage = getTaggedDoggos(tag);

  res.render('tag', {
    'title': 'All the P R E M I U M doggos and #idc',
    'doggosByPage': doggosByPage
  });
});
 
app.listen(3000);
