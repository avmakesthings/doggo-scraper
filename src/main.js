const graph = require('fbgraph');
const fs = require('fs');

var searchTermsByPage = {};
var matchingPosts = [];

var appCredentials = require('../../fb-api-keys/doggo-scraper.json');
graph.setAccessToken("" + appCredentials.appId + "|" + appCredentials.appSecret);

var outputStatus = function() {
  console.log('running another posts batch, current cached data is: (' + matchingPosts.length + ') matching posts');
  console.log(JSON.stringify(matchingPosts, null, 2));
};

var getFeed = function(page, searchTerms) {
  searchTermsByPage[page.id] = page.searchTerms;

  getOnePageOfFeed(page, null);
};

var getOnePageOfFeed = function(page, nextUrlString) {
  outputStatus();

  var pageId = page.id;
  if (!nextUrlString) nextUrlString = '';

  graph.get("/" + pageId + "/feed?fields=picture,link,id,message,name,from,created_time,type,object_id,full_picture,permalink_url,shares,caption,description,comments.limit(100).filter(stream),likes.limit(0).summary(true),reactions.limit(0).summary(true)" + nextUrlString, function(err, res) {
    var posts = res.data;

    if (!posts || !posts.length) {
      console.log("\n\n\n***********************\n\nNo posts found for " + page.name);
    } else {
      var paging = res.paging;
      var nextUrl = res.paging.next;;
      var nextUrlChunks = nextUrl.split("&limit=");

      // looks like we have more pages of the feed to fetch;
      if (nextUrlChunks.length == 2) {
        var nextUrlString = "&limit=" + nextUrl.split("&limit=")[1];
        getOnePageOfFeed(page, nextUrlString);
      } else {
        console.log('\n\n\n***********************\n\nNo more posts to fetch for ' + page.name + ' :-(');
      }

      processPostsBatch(page, posts, nextUrlString);
    }
  });
};

var prepareCommentForStringComparison = function(commentText) {
  return commentText.replace(/ /g, '').toLowerCase();
};

var processPostsBatch = function(page, posts, urlPaginationString) {
  for (var postIndex = 0; postIndex < posts.length; postIndex++) {
    var post = posts[postIndex];

    var comments = (!!post.comments && !!post.comments.data) ? post.comments.data : [];

    var isMatchingPost = false;
    var matchReasons = [];

    for (var commentIndex = 0; commentIndex < comments.length; commentIndex++) {
      var comment = comments[commentIndex];
      var commentText = comment.message;

      try {
        var _commentText = prepareCommentForStringComparison(commentText);
      } catch(e) {
        console.log("Error processing comment text for string comparison", e);
        var _commentText = commentText;
      }

      var searchTerms = searchTermsByPage[page.id];

      for (var searchTermIndex = 0; searchTermIndex < searchTerms.length; searchTermIndex++) {
        var searchTerm = searchTerms[searchTermIndex];

        if (_commentText.indexOf(searchTerm) !== -1) {
          isMatchingPost = true;
          matchReasons.push(commentText);
        }
      }
    }

    if (isMatchingPost) {
      post.matchReasons = matchReasons.join("!@#$%");

      // flatten post data for insertion into DB
      post.commentsCount = post.comments.data.length;
      delete post.comments;

      if (typeof post.shares !== 'undefined' && typeof post.shares.count !== 'undefined') {
        post.sharesCount = post.shares.count;
        delete post.shares;
      }

      post.likesCount = post.likes.summary.total_count;
      delete post.likes;
      post.reactionsCount = post.reactions.summary.total_count;
      delete post.reactions;
      post.fromName = post.from.name;
      post.fromId = post.from.id;
      delete post.from;

      matchingPosts.push(post);
    }
  }
}

var runScraper = function(configObject, runQueuesInParallel) {
  var pages = configObject.pages;

  for (var i = 0; i < pages.length; i++) {
    var page = pages[i];

    getFeed(page);
  }
};

module.exports = {
  "run": runScraper
};