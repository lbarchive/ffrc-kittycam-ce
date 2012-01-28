var FFRC_BLOG_ID = '339501112748012529';
var FFRC_FLICKR_ID = '72892197@N03';
var utv_layout = 'v';

function format_time(t) {
  var time = new Date(t);
  var hh = time.getUTCHours();
  var mm = time.getUTCMinutes();
  if (mm < 10)
    mm = '0' + mm;
  if (hh <= 12)
    return hh + ':' + mm + ' AM';
  else
    return (hh - 12) + ':' + mm + ' PM';
}

function update_time() {
  var now_EST = Date.now() - 3600 * 5 * 1000; // Eastern Standard Time
  var now_EDT = now_EST    + 3600 * 1 * 1000; // Eastern Daylight Time

  $('#time-est').text(format_time(now_EST)).attr('title', new Date(now_EST).toUTCString().replace('GMT', 'EST'));
  $('#time-edt').text(format_time(now_EDT)).attr('title', new Date(now_EDT).toUTCString().replace('GMT', 'EDT'));

  setTimeout(update_time, 1000);
}

/****************************
 * Data retrieval functions *
 ****************************/

function refresh_blog_posts() {
  var API_URL = 'http://www.blogger.com/feeds/' + FFRC_BLOG_ID +
                '/posts/summary?alt=json-in-script&max-results=6&callback=?';
  $.getJSON(API_URL, function(data){
    $.each(data.feed.entry, function(idx, post) {
      var $article = $('<article/>');
      var published = new Date(post.published.$t);
      $article.get(0).published = published;
      $article.get(0).link = $($.grep(post.link, function(link, idx) {return link.rel == 'alternate'})).prop('href');
      var title = post.title.$t || '(Untitled)';
      var $title = $('<header/>')
          .append(
            $('<h1/>')
              .addClass('oneline')
              .text(title)
            );
      $title.appendTo($article);
      var $summary = $('<p/>').text(post.summary.$t);
      $summary.appendTo($article);
      $('<div/>')
        .addClass('fadeout')
        .appendTo($article);
      $article
        .click(open_ele_link)
        .hide()
        .appendTo($('#blog-posts'))
        .fadeIn()
        ;
    })
  });
}

function refresh_photos(target, params, limit) {
  var API_URL;
  switch (params.source) {
    case 'flickr':
      API_URL = 'http://api.flickr.com/services/feeds/photos_public.gne?id=' +
                 params.id + '&lang=en-us&format=json&jsoncallback=?';
      break;
    case 'picasa':
      API_URL = 'https://picasaweb.google.com/data/feed/api/user/' + params.id + '?kind=photo' +
                '&alt=json-in-script&callback=?' +
                "&fields=author(name),entry(title,published,link[@rel='alternate'],media:group(media:thumbnail(@url)))";
      if (!limit)
        API_URL += '&max-results=' + limit;
      break;
    default:
      return;
  }

  $.getJSON(API_URL, function(data){
    var photos = data.items || data.feed.entry;
    $.each(limit !== undefined ? photos.slice(0, limit) : photos, function(idx, photo) {
      var $article = $('<article/>');
      var published = new Date(photo.published || photo.published.$t);
      $article.get(0).published = published;
      var author, title, link, description, img_src;
      switch (params.source) {
        case 'flickr':
          description = photo.description;
          author = photo.author.replace(/.*\(|\)/g, '');
          title = photo.title || '(Untitled)';
          link = photo.link;
          img_src = photo.media.m.replace(/_m\.jpg$/, '_s.jpg');
          break;
        case 'picasa':
          author = data.feed.author[0].name.$t;
          title = photo.title.$t;
          link = photo.link[0].href;
          img_src = photo.media$group.media$thumbnail[1].url;
          var pop_img = photo.media$group.media$thumbnail[2];
          description = '<p><a></a></p><p><a href="' + link +'">' +
                        '<img src="' + pop_img.url+ '" width="' +
                        pop_img.width+ '" height="' + pop_img.height + '"/></a></p>';
          break;
      }
      $article.get(0).author = author;
      $article.get(0).description = description;
      $article.attr('title', title + ' by ' + author);
      var $thumb = $('<a/>').attr('href', link);
      var $image = $('<img/>').attr('src', img_src);
      // FIXME keep aspect ratio for source = picasa
      $image.appendTo($thumb);
      $thumb.appendTo($article);
      $article
        .click(open_ele_link)  
        .mouseenter(show_img_m)
        .hide()
        ;

      var added = false;
      $(target + ' article').each(function(idx, ele){
        if (published > this.published) {
          $(this).before($article);
          added = true;
          return false;
        }
      });
      if (!added)
        $article.appendTo($(target));
      $article.fadeIn();
    })
  });
}

function refresh_videos(username) {
  var API_URL = "https://gdata.youtube.com/feeds/api/users/" + username + "/uploads?alt=json-in-script&orderby=published&max-results=6&fields=entry(title,author,published,link[@rel='alternate'],media:group(media:thumbnail(@url)))&callback=?";
  $.getJSON(API_URL, function(data){
    $.each(data.feed.entry, function(idx, video) {
      var $article = $('<article/>');
      var published = new Date(video.published.$t);
      $article.get(0).published = published;
      $article.get(0).link = video.link[0].href;
      $article.click(open_ele_link);
      var title = (video.title.$t || '(Untitled)').replace(/^FFRC /, '');
      $article.attr('title', title + ' by ' + video.author[0].name.$t);
      var $title = $('<header/>')
          .append(
            $('<h1/>')
              .addClass('oneline')
              .text(title)
            );
      $title.appendTo($article);
      var $thumb = $('<a/>').attr('href', video.link[0].href);
      var $image;
      for (var i=1; i<=2; i++) {
        $image = $('<img/>').attr('src', video.media$group.media$thumbnail[i].url);
        $image.appendTo($thumb);
      }
      $thumb.appendTo($article);
      $article.hide();
      // find place to insert
      var added = false;
      $('#cammers-videos article').each(function(idx, ele){
        if (published > this.published) {
          $(this).before($article);
          added = true;
          return false;
        }
      });
      if (!added)
        $article.appendTo($('#cammers-videos'));
      $article.fadeIn();
    })
  });
}

/****************
 * Voting Timer *
 ****************/

function VotingTimerModel() {
  this.last_voted = parseInt(localStorage['last_voted']) || -1;
  this.update = function(){
    this.last_voted = localStorage['last_voted'] = Date.now();
    $(this).trigger('last_voted_update');
  }
}

function VotingTimerView(target, control, model) {
  this.model = model;

  var $target
      = this.$target
      = $('<div/>').attr('id', 'voting');

  var $time = $('<time/>').attr('datetime', new Date(model.last_voted))
                          .text('You have not voted yet!')
                          .attr('title', '')
                          .appendTo($target);
  if (model.last_voted != -1)
    $time.timeago()
  var $button = $('<button/>').text('Vote Now!')
                              .button()
                              .click(control.vote)
                              .appendTo($target);
  var $help = $('<button/>').text('How to Vote')
                            .button({
                              icons: {primary: 'ui-icon-help'},
                              text: false
                              })
                            .click(function(){
                              $("#voting-help" ).dialog({
                                modal: true,
                                width: 640,
                                buttons: { Ok: function(){$(this).dialog('close');}}
                              })
                            })
                            .appendTo($target);
  $(model).bind('last_voted_update', function(){
    var date =  new Date(model.last_voted)
    $time.attr('datetime', date);
    if (!$time.data('timeago'))
      $time.timeago();
    else
      $time.data({timeago: {datetime: date}});
  })
  $target.appendTo(target);
}

function VotingTimer(target) {
  var model = this.model = new VotingTimerModel();
  this.vote = function() {
    model.update();
    window.open('http://www.theanimalrescuesite.com/clickToGive/shelterchallenge.faces?siteId=3');
  }
  var view  = this.view = new VotingTimerView(target, this, model);
}

/***************************
 * Miscellaneous functions *
 ***************************/

function open_ele_link() {
  window.open(this.link);
  return false;
}

function show_img_m() {
  var $article = $(this);
  var off = $article.offset();
  var $pop = $($article.get(0).description).filter('p:nth-child(2)');
  $('.pop-image').remove();
  $pop.appendTo(document.body)
      .css('position', 'absolute')
      .css('z-index', 999)
      .offset({
          top:  off.top  - ($pop.height() - 75) / 2,
          left: off.left - ($pop.width()  - 75) / 2
          })
      .mousemove(function(evt){
        var $pop = $(this);
        if (evt.pageX < $pop.offset().left + ($pop.width()  - 75) / 2
          ||evt.pageY < $pop.offset().top  + ($pop.height() - 75) / 2
          ||evt.pageX > $pop.offset().left + $pop.width()  - ($pop.width()  - 75) / 2
          ||evt.pageY > $pop.offset().top  + $pop.height() - ($pop.height() - 75) / 2)
          $pop.fadeOut('fast', function(){
            $(this).remove();
          });
      })
      .mouseleave(function(){
        $pop.fadeOut('fast', function(){
          $(this).remove();
        });
      })
      ;
  var $img = $pop.find('img');
  $img.attr('alt', $img.attr('alt') + ' by ' + $article.get(0).author)
      .hide()
      .load(function(){
        $(this).fadeIn('fast');
      })
      ;
  var $a = $pop.find('a').attr('title', $img.attr('alt'));
  $pop.get(0).link = $a.attr('href');
  $pop.addClass('pop-image')
      .click(open_ele_link); 
}

function empty_and_refresh(target, callback) {
  $(target)
    .fadeOut(function(){
      $(this).empty().show();
      callback();
    })
    
}

function init_page() {
  for (var i=0; i<7; i++) {
    $('<img/>').attr('src', 'icon16.png').appendTo( 'body > .wrapper > header h2');
    $('<img/>').attr('src', 'icon16.png').prependTo('body > .wrapper > header h2');
  }
  // build official links
  var ffrc_links = [
    ['Website'  , 'http://fofrescue.org'],
    ['Ustream'  , 'http://ustream.tv/ffrc'],
    ['Blog'     , 'http://friendsoffelines.blogspot.com/'],
    ['Facebook' , 'http://www.facebook.com/pages/Friends-of-Felines-Rescue-Center-Earth-Angels-Low-Cost-SpayNeuter-Clinic/288063788071'],
    ['Petfinder', 'http://www.petfinder.com/pet-search?shelterid=OH572'],
    ['Flickr'   , 'http://www.flickr.com/photos/fofrescue/']
  ]
  var $links = $('#links');
  $.each(ffrc_links, function(idx, link){
    var $button = $('<button/>').text(link[0])
                                .click(open_ele_link)
                                .button()
                                .appendTo($links);
    $button.get(0).link = link[1];
  });
  // prefix text for voting timer
  $.timeago.settings.refreshMillis = 1000;
  $.timeago.settings.strings.prefixAgo = 'You have voted';
  new VotingTimer('#controls');
  $("#btn-utv-v")
    .attr('title', 'Change causes Flash reloads')
    .button({
      icons: {primary: 'ui-icon-grip-solid-vertical'},
      text: false
      })
    .click(function(){
      if (utv_layout == 'v')
        return;
      var $utv = $('#utv');
      var $utv_chat = $('#utv-chat');
      var h = Math.max($utv.height(), $utv_chat.height());
      var $utv_cam_chat = $('#utv-cam-chat');
      var $table = $('<table><tbody><tr><td></td><td></td></tr></tbody></table>');
      $table.appendTo($utv_cam_chat);
      $utv
        .appendTo($table.find('td:first'))
        .height(h);
      $('#utv440973').get(0).height   = h  + 'px';
      $('#utv440973-e').get(0).height = h  + 'px';
      $utv_chat
        .appendTo($table.find('td:last'))
        .height(h);
      $('#utv-chat-iframe').get(0).height = h  + 'px';
      $('table:first', $utv_cam_chat).remove();
      utv_layout = 'v';
    })
    ;
  $("#btn-utv-h")
    .attr('title', 'Change causes Flash reloads')
    .button({
      icons: {primary: 'ui-icon-grip-solid-horizontal'},
      text: false
      })
    .click(function(){
      if (utv_layout == 'h')
        return;
      var $utv = $('#utv');
      var $utv_chat = $('#utv-chat');
      var w = Math.max($utv.width(), $utv_chat.width());
      var $utv_cam_chat = $('#utv-cam-chat');
      var $table = $('<table><tbody><tr><td></td></tr><tr><td></td></tr></tbody></table>');
      $table.appendTo($utv_cam_chat);
      $utv
        .appendTo($table.find('td:first'))
        .width(w);
      $('#utv440973').get(0).width  = w  + 'px';
      $('#utv440973-e').get(0).width  = w  + 'px';
      $utv_chat
        .appendTo($table.find('td:last'))
        .width(w);
      $('#utv-chat-iframe').get(0).width  = w  + 'px';
      $('table:first', $utv_cam_chat).remove();
      utv_layout = 'h';
    })
    ;
  $('#utv').resizable({
    resize: function(){
      $('#utv440973').get(0).width  = $('#utv').width()  + 'px';
      $('#utv440973').get(0).height = $('#utv').height() + 'px';
      $('#utv440973-e').get(0).width  = $('#utv').width()  + 'px';
      $('#utv440973-e').get(0).height = $('#utv').height() + 'px';

      if (utv_layout == 'v') {
        $('#utv-chat').height($('#utv').height());
        $('#utv-chat-iframe').get(0).height = $('#utv').height() + 'px';
      } else {
        $('#utv-chat').width($('#utv').width());
        $('#utv-chat-iframe').get(0).width  = $('#utv').width()  + 'px';
      }
    }
  });
  $('#utv-chat').resizable({
    resize: function(){
      $('#utv-chat-iframe').get(0).width  = $('#utv-chat').width()  + 'px';
      $('#utv-chat-iframe').get(0).height = $('#utv-chat').height() + 'px';

      if (utv_layout == 'v') {
        $('#utv').height($('#utv-chat').height());
        $('#utv440973').get(0).height   = $('#utv-chat').height()  + 'px';
        $('#utv440973-e').get(0).height = $('#utv-chat').height() + 'px';
      } else {
        $('#utv').width($('#utv-chat').width());
        $('#utv440973').get(0).width   = $('#utv-chat').width() + 'px';
        $('#utv440973-e').get(0).width = $('#utv-chat').width() + 'px';
      }
    }
  });
  // chat code of conduct button
  $('<button/>').attr('id', 'btn-coc')
                .text('Code of Conduct')
                .button()
                .click(open_ele_link)
                .appendTo($('#utv-chat'))
                .get(0).link = 'http://www.fofrescue.org/?page_id=671';
  update_time();
  refresh_blog_posts();
  refresh_photos('#flickr-photos', {source: 'flickr', id: FFRC_FLICKR_ID});
  function refresh_cammers_videos() {
    var cammers_youtube_ids = [
        'gossamer520',
        'livibetter'
        ]
    $('#cammers-youtube footer').empty();
    $.each(cammers_youtube_ids, function(idx, youtube_id){
      refresh_videos(youtube_id);
      $('<a/>').text(youtube_id)
               .attr('href', 'http://www.youtube.com/user/' + youtube_id)
               .appendTo($('#cammers-youtube footer'))
      if (idx < cammers_youtube_ids.length - 1)
        $('<span/>').append(' ')
                    .append($('<img/>').attr('src', 'icon16.png'))
                    .append(' ')
                    .appendTo($('#cammers-youtube footer'));
    });
  }
  refresh_cammers_videos();
  function refresh_cammers_photos() {
    var cammers_flickr_ids = [
        [{source: 'flickr', id: '47636090@N06'}, 'janak2'],
        [{source: 'flickr', id: '73221929@N03'}, 'luvmy8cats'],
        [{source: 'flickr', id: '65784570@N04'}, 'PJpanda'],
        [{source: 'picasa', id: 'ragsross'}    , 'ragsross']
        ]
    $('#cammers-flickr footer').empty();
    $.each(cammers_flickr_ids, function(idx, flickr_id){
      refresh_photos('#cammers-flickr-photos', flickr_id[0], 12);
      $('<a/>').text(flickr_id[1])
               .attr('href', 'http://www.flickr.com/photos/' + flickr_id[0])
               .appendTo($('#cammers-flickr footer'))
      if (idx < cammers_flickr_ids.length - 1)
        $('<span/>').append(' ')
                    .append($('<img/>').attr('src', 'icon16.png'))
                    .append(' ')
                    .appendTo($('#cammers-flickr footer'));
    });
  }
  refresh_cammers_photos();

  // initialize headers
  $('#blog > header > h2 > span')
    .click(function(){window.open('http://friendsoffelines.blogspot.com/')})
    .bind('contextmenu', function(evt){
      evt.preventDefault();
      empty_and_refresh('#blog-posts', refresh_blog_posts)
      return false;
    })
    ;
  $('#flickr > header > h2 > span')
    .click(function(){window.open('http://www.flickr.com/photos/fofrescue/')})
    .bind('contextmenu', function(evt){
      evt.preventDefault();
      empty_and_refresh('#flickr-photos', function(){
        refresh_flickr_photos('#flickr-photos', FFRC_FLICKR_ID);   
      })
      return false;
    })
    ;
  $('#cammers-youtube > header > h2 > span')
    .bind('contextmenu', function(evt){
      evt.preventDefault();
      empty_and_refresh('#cammers-videos', refresh_cammers_videos)
      return false;
    })
    ;
  $('#cammers-flickr > header > h2 > span')
    .bind('contextmenu', function(evt){
      evt.preventDefault();
      empty_and_refresh('#cammers-flickr-photos', refresh_cammers_photos)
      return false;
    })
    ;
 }

$(init_page);
