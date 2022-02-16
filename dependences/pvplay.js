/*PlayScript for PicVid - SomeBottle 20210405*/
function checkvids() {
    var vdtags = document.getElementsByTagName('video'),hls={};
    for (var i in vdtags) {
        var el = vdtags[i];
        if (el instanceof Element) {
            var vdsrc = el.getAttribute('pvsrc');
            if(!vdsrc||vdsrc.length<=1) continue;
            if (Hls.isSupported()) {
                hls[i] = new Hls();
                hls[i].loadSource(vdsrc);
                hls[i].attachMedia(el);
            } else {
                el.src = vdsrc;
            }
        }
    }
}
function pvplay() {
    var hlschecker = setInterval(function () {
        if (Hls) {
            clearInterval(hlschecker);
            checkvids();
        }
    }, 1000);
}
pvplay();
