/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//jwplayer.key="z76grQEJ9T/9DixFMpV/mgZlv06McIOJ4aiJtA==";

jwplayer('jwplayerVideo').setup({
    playlist:[{
    file:"https://mm-dev-media.s3.amazonaws.com/test_video_output/awsdash.mpd?AWSAccessKeyId=AKIAJI4PEHVPQC4PV4KQ&Expires=1480544102&Signature=jXHv025WFLPsIBhPd0%2B9flsKeCo%3D",
    title:"Sintel",
    description:"This is a DASH stream!",
    type:"dash"
}],
    dash: 'shaka',
    autostart: true,
//    advertising: {
//        client: "vast",
//        tag: "videos/preroll.xml"
//      }

});
/*
jwplayer("jwplayerVideo").setup({ 
    //"file": 'http://brightcove.vo.llnwd.net/e1/uds/pd/28068717001/28068717001_4915974847001_4915937003001.mp4'
    "playlist": [{
    "title":"One Playlist Item With Multiple Qualities",
    "description":"Two Qualities - One Playlist Item",
    "sources": [{
      "file": "https://dh6v3fta3zctl.cloudfront.net/test_video_output/dash4800k.mp4",
      "label": "HD"
    },{
    "file": "https://dh6v3fta3zctl.cloudfront.net/test_video_output/dash2400k.mp4",
    "label": "2400"
    },
    {
    "file": "https://dh6v3fta3zctl.cloudfront.net/test_video_output/dash1200k.mp4",
    "label": "1200"
    },
    {
    "file": "https://dh6v3fta3zctl.cloudfront.net/test_video_output/dash600k.mp4",
    "label": "600"
    }]
  }]
});
*/
jwplayer().on('pause', function(evt) { 
    console.log(jwplayer().getPosition());
});

jwplayer().on('complete', function(evt){
   alert('video finish'); 
});

