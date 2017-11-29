var raf = require('raf');
var feature = require('feature.js');

function dragScroll(){
    var tickInterval = 20;
    var decel = 1.12; // deceleration - higher = faster
    
    var originXPos = 0;
    var originXScroll = 0;
    var curXPos = 0;
    var curDown = false;
    var xPosArr = [];
    var mouseTicker;

    function getPageScroll(){
        return window.pageXOffset || document.documentElement.scrollLeft;
    }

    function mouseDown(e){
        curDown = true;
        originXScroll = getPageScroll();
        originXPos = curXPos = e.clientX;
        xPosArr = [e.clientX];

        mouseTicker = setInterval(tick, tickInterval);
    }

    function tick(){
        xPosArr.unshift(curXPos);
    }


    function mouseMove(e){ 
        if(curDown === false) return;

        // Set curXPos for mouse interval (it is used to add to the xPosArr)
        curXPos = e.clientX;

        setDocScroll();
    }

    function setDocScroll(){
        var delta = originXPos - curXPos
        var newScrollLeft = originXScroll + delta;

        if (newScrollLeft < 0) newScrollLeft = 0;

        window.scrollTo(newScrollLeft, document.body.scrollTop);
    }


    function mouseUp(e){
        if (curDown === false) return;
        curDown = false;

        clearInterval(mouseTicker);

        animScroll();
    }
    
    function mouseWheel(e){
        if (e.deltaY === 0) return;
        
        // Emulate a mouse flick
        xPosArr = [0, e.deltaY];
        
        animScroll();
    }

    function animScroll(){
        if (xPosArr.length < 2) return;
        
        var delta = xPosArr[0] - xPosArr[1];
        var dist = Math.round(delta / decel);
        
        raf(function animLoop(){
            if (dist <= 1 && dist >= -1) {
                raf.cancel(animLoop);
                return;
            }
            
            window.scrollTo(getPageScroll() - dist, 0);
            
            // Keep reducing distance until it gets < | > 1
            dist = dist / decel;
            
            raf(animLoop);
        });
    }
    
    return {
        bind: function(){
            if (feature.touch || $(window).width() <= 480) return;
            
            window.addEventListener('mousedown', mouseDown);
            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('mouseup', mouseUp);
            window.addEventListener('wheel', mouseWheel);
        },
        unbind: function(){
            window.removeEventListener('mousedown', mouseDown);
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
        }
    };
}

module.exports = new dragScroll();
