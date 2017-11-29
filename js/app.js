var dragscroll = require('./modules/dragscroll');

function App(){
    // Store constants here
    this.c = {
        apiKey: 'c6dc8581507548e535e52e8cdb1dfde6',
        userId: '141580833@N07',
        photoPrefix: 'CWP - ',
        photosets: [],
        activeSet: 0,
        albumRetries: 0,
        
        el: {
            $nav: $('#page-nav-container')
        }
    }
};

App.prototype = {
    init: function(){
        this.bindEvents();
        this.route();
    },

    bindEvents: function(){
        $(window).on('hashchange', function(){
            this.route();
        }.bind(this));
        
        dragscroll.bind();
    },
    
    route: function(){
        var curUrl = location.hash.split('#')[1] || '';
        
        // First load - fetch photosets
        if (this.c.photosets.length == 0) {
            this.getPhotosets();
            return;
        }
        
        // Check if any photoset === current URL
        var photosetToSelect = this.c.photosets.find(function(obj){
            return obj.title.toLowerCase() === curUrl.toLowerCase();
        });
        
        // No photosets match URL - change url to first photoset and trigger a 'replace'
        if (!photosetToSelect) {
            location.replace('#' + this.c.photosets[0].title);
            return;
        } else {
            this.c.activeSet = photosetToSelect.id;
        }
        
        this.selectNavElement(photosetToSelect.title)
        this.getPhotos();
    },
    
    selectNavElement: function(title){
        var $albumList = $('#album-list');
        
        $albumList.find('.active').removeClass('active');
        $albumList.find('a[href="#' + title +'"]').addClass('active');
    },

    getPhotosets: function(){
        var xhr = $.get('https://api.flickr.com/services/rest/?method=flickr.photosets.getList&api_key=' + this.c.apiKey + '&user_id=' + this.c.userId);
        var self = this;
        
        // Clear the array, just in case there are issues with back/forward clickthroughs
        this.c.photosets = [];
        
        // @TODO - check localstorage for stored version. Album list could be updated every 15 minutes instead of on pageload.
        // ---------------

        xhr.done(function(data){
            $(data).find('photoset').each(function(){
                var $this = $(this);
                var title = $this.find('title').text();

                if (title.indexOf(self.c.photoPrefix) !== 0) return;

                self.c.photosets.push({
                    title: title.split(self.c.photoPrefix)[1],
                    id: this.id
                });
            });
            
            self.renderAlbumList();
            self.route();
        });

        xhr.fail(function(err){
            if (self.c.albumRetries < 3) {
                self.c.albumRetries ++;
                self.getPhotosets();
                return;
            }
            
            // Album list couldn't be loaded
            $('#album-list').prepend('<p>Album list couldn\'t be loaded. Try <a href="/">refreshing the page</a></p>').find('.loading-container').remove();
        });
    },
    
    renderAlbumList: function(){
        var html = '';
        this.c.photosets.forEach(function(obj){
            html += '<li><a href="#' + obj.title + '" data-album-id="' + obj.id + '">' + obj.title + '</a></li>';
        });
        
        $('#album-list').prepend(html).find('.loading-container').remove();
    },
    
    getPhotos: function(){
        var xhr = $.get('https://api.flickr.com/services/rest/' +
              '?method=flickr.photosets.getPhotos' +
              '&api_key=' + this.c.apiKey + 
              '&user_id=' + this.c.userId + 
              '&photoset_id=' + this.c.activeSet + 
              '&extras=description');
        var photos = [];
        var self = this;

        xhr.done(xhrDone);
        xhr.fail(xhrFail);

        function xhrDone(data){
            $(data).find('photo').each(function(i, obj){
                var url = 'https://farm' + obj.getAttribute('farm') + 
                          '.staticflickr.com/' + obj.getAttribute('server') + 
                          '/' + obj.getAttribute('id') + 
                          '_' + obj.getAttribute('secret') + '_b.jpg';

                var description = obj.getElementsByTagName('description')[0].innerHTML || '';

                photos.push({
                    url: url,
                    title: obj.getAttribute('title'),
                    description: description
                });
            });

            self.renderPhotos(photos);
        };

        function xhrFail(err){
            // @TODO - add error message saying images couldn't be loaded
            console.error(err);
        };
    },

    renderPhotos: function(photos){
        var html = '';

        $.each(photos, function(i, obj){
            html += '<img src="' + obj.url + '" alt="' + (obj.description || '') + '" data-title="'+ (obj.title || '') + '" />';
        });

        $('#photo-container').html(html);
    }
};

var app = new App();
app.init();
