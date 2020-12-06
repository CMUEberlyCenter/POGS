'use strict';

exports.postAceInit = function(hook_name, args, cb) {
  console.log ("postAceInit (2)");

  //var timeslider = require('./timeslider.js');
  var timeslider = require('./timeslider');
  
  $('#timesliderlink').click(function() {
    $('#editorloadingbox').show()
    timeslider.init(function() {
      $('#editorloadingbox').hide()
      $('body').addClass('timeslider')
    })
  })
}