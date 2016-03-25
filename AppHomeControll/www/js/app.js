var playstate = false;
function togglePlayState (e) {
    if (typeof e != 'boolean') {
        playstate = !playstate;
        socket.emit(playstate ? 'startRadio' : 'stopRadio', $('.selected').attr('data-stream'));
    }
    else {
        playstate = e;
    }
    if (playstate) {
        $('#play').removeClass('btn-play').addClass('btn-pause');
        $('.selected').addClass('playing');
    }
    else {
        $('#play').removeClass('btn-pause').addClass('btn-play');
        $('.playing').removeClass('playing');
    }
}
var selected = false;
var socket;

document.addEventListener('deviceready', function () {
    socket = io.connect('http://rontav.go.ro:7274', {
        'reconnect': true,
        'reconnection delay': 500,
        'reconnection limit': 1000,
        'max reconnection attempts': 'Infinity'
    });

    socket.on('radioStations', function (e) {
        var content = '';

        $.each(e, function (index, value) {
            if (!value.stream || !value.name) return;

            content += '<div data-stream="'+ index +'">'+ value.name +'</div>';
        });

        $('.content').html(content);
    });

    socket.on('state', function (e) {
        $('.playing').removeClass('playing');
        togglePlayState(e.playing);

        if (e.lastPlayed === undefined) return;
        $('.selected').removeClass('selected playing');
        var elem = $('[data-stream="'+ e.lastPlayed +'"]');
        elem.addClass('selected');
        if (e.playing) {
            elem.addClass('playing');
        }
    });

    $(document.body).on('click', '.content div', function () {
        selected = $(this);

        if (selected.hasClass('selected')) {
            socket.emit('stopRadio');
            togglePlayState(false);
        }
        else {
            $('.selected').removeClass('selected playing');
            socket.emit('startRadio', selected.attr('data-stream'));
            selected.addClass('selected');
            togglePlayState(true);
        }
    });

    $('#play').on('click', togglePlayState);
    $('#next, #prev').on('click', function () {
        var e;
        if ($(this).attr('id') == 'next') {
            e = $('.selected', '.content').next();
            if (!e.length) e = $('.content div').first();
        }
        else {
            e = $('.selected').prev();
            if (!e.length) e = $('.content div').last();
        }
        $('.selected').removeClass('selected playing');
        e.addClass('selected playing');
        socket.emit('startRadio', e.attr('data-stream'));
    });
    $('.loader').hide();
});

if (typeof app != 'undefined') {
    app.initialize();
}
else {
    document.dispatchEvent(new Event('deviceready'));
}