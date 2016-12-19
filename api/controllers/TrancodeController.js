var AWS = require('aws-sdk');
var config = new AWS.Config({
    accessKeyId: 'AKIAJI4PEHVPQC4PV4KQ',
    secretAccessKey: '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',
    region: 'us-east-1'
});
var elasticTranscoder = new AWS.ElasticTranscoder(config);

// CONFIG VALUES
var pipelineId = '1479488582529-xprxpp';
var segmentDuration = '2';
var presets = {
    mpegDashVideo600k: '1351620000001-500050',
    mpegDashVideo1200k: '1351620000001-500040',
    mpegDashVideo2400k: '1351620000001-500030',
    mpegDashVideo4800k: '1351620000001-500020',
//    mobile: '1351620000001-100020', // iPhone 5, iPhone 4S, iPad 4G and 3G, iPad mini, Samsung Galaxy S2/S3/Tab 2
//    hls: '1351620000001-200055' // HLS v3 and v4 (Apple HTTP Live Streaming), 400 kilobits/second, Video-only
}
// END CONFIG VALUES

module.exports = {
    index: function (req, res) {
        sails.log.error('checking route');
        
        transcode(res);
        
//        var pipelines = elasticTranscoder.listPipelines(listPipelinesCallback);
//        console.log(pipelines);
//        res.send('TestController.test request completed');
    }
};
var listPipelinesCallback = function (err, res) {
    if (err) {
        console.error('CALLBACK ERROR OCCURED');
        console.error(err);
    } else {
        console.log('callback success');
        console.log(res);
    }
}

var transcode = function (res) {
    sails.log.error('in trancode');
    
    //res.send('disabled for cost purposes');
    
    var inputFolder = 'test_video_input/';
    var inputFile = 'aws_30s.mp4';
    var outputFolder = 'test_video_output/';


    var playlists = [
        {
            Name: outputFolder + 'awsdash',
            Format: 'MPEG-DASH',
            OutputKeys: [outputFolder + 'awsdash600k.mp4', outputFolder + 'awsdash1200k.mp4', outputFolder + 'awsdash2400k.mp4', outputFolder + 'awsdash4800k.mp4']
        }
        
//        {
//            Name: outputFolder + 'hlsv3',
//            Format: 'HLSv3',
//            OutputKeys: ['hls400k.hls']
//        }
    ];

    var outputs = [
        {
            Key: outputFolder + 'awsdash600k.mp4',
//            ThumbnailPattern: outputFolder + 'thumbs-{count}',
            PresetId: presets.mpegDashVideo600k,
            SegmentDuration: segmentDuration
        },
        {
            Key: outputFolder + 'awsdash1200k.mp4',
            PresetId: presets.mpegDashVideo1200k,
            SegmentDuration: segmentDuration
        },
        {
            Key: outputFolder + 'awsdash2400k.mp4',
            PresetId: presets.mpegDashVideo2400k,
            SegmentDuration: segmentDuration
        },
        {
            Key: outputFolder + 'awsdash4800k.mp4',
            PresetId: presets.mpegDashVideo4800k,
            SegmentDuration: segmentDuration
        }
//        {
//            Key: outputFolder + 'hls400k.hls',
//            PresetId: presets.hls,
//            SegmentDuration: segmentDuration
//        },
//        {
//            Key: outputFolder + 'mobile400k.mp4',
//            PresetId: presets.mobile
//        },
    ]

    var request = elasticTranscoder.createJob({
        PipelineId: pipelineId, // specifies output/input buckets in S3
        Input: {
            Key: inputFolder + inputFile,
            FrameRate: 'auto',
            Resolution: 'auto',
            AspectRatio: 'auto',
            Interlaced: 'auto',
            Container: 'auto'}
            ,
//        Output: {
//            Key: outputFolder + outputFile,
//            ThumbnailPattern: outputFolder + 'thumbs-{count}',
//            PresetId: presetId, // specifies the output video format
//            SegmentDuration: segmentDuration},
        Outputs: outputs,
        Playlists: playlists
    });
    
    request.on('success', _jobCreated);
    request.on('error', function(error, response) {
      sails.log.error('SHOW JOB CREATE ERROR', error);
    });
    request.send();
    
};

var _jobCreated = function (response){
    var message = {};
    message.sender = 'Transcoder';
    message.text = 'The job with ID: '+ response.data.Job.Id + ' was created successfully';
    sails.log.error(message);    
    var jobId = response.data.Job.Id;
    
    elasticTranscoder.waitFor('jobComplete', {Id: jobId}, function(err, data){
        var message = {};
        message.sender = 'Transcoder';
        if (err) {
          sails.log.error('JOB CREATE ERROr', err);
        } else {
          message.text = 'The job with ID: ' + jobId + ' completed successfully';
          sails.log.error('JOB CREATED MESSAGE', message);
          sails.log.error('JOB CREATED RESPONSE DATA', data);
        }
    });
    
};
