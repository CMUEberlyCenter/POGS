'use strict';

/**
 * This code is mostly from the old Etherpad. Please help us to comment this code.
 * This helps other people to understand this code better and helps them to improve it.
 * TL;DR COMMENTS ON THIS FILE ARE HIGHLY APPRECIATED
 */

/**
 * Copyright 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//JSON = require('ep_etherpad-lite/static/js/json2');

var _ = require('ep_etherpad-lite/static/js/underscore');
var pad = require('ep_etherpad-lite/static/js/pad').pad;
var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

// global clientVars

var export_links;

/**
 *
 */
function init(cb) {
  console.log ("init ()");
  
  // Can't have this, note that this is part of the normal behavior of the plugin
  //padeditor.ace.setEditable(false);
  
  var fireWhenAllScriptsAreLoaded = [];
  
  // register callback
  fireWhenAllScriptsAreLoaded.push(cb);
    
  // register close event
  $('#timeslider-close a').click(function(e) {
    e.preventDefault();
    reset();
  })
  
  console.log ("Assigning socket message handler ...");

  // register timeslider for socket messages
  // route the incoming messages
  pad.socket.on('message', function(message) {
    if(message.type == "CLIENT_VARS") return;
    if(message.accessStatus) return;
    changesetLoader.handleMessageFromServer(message);
  });
  
  console.log ("Setting up interface to Etherpad ...");

  // load the main code

  require('ep_timeslider/static/js/broadcast_revisions').loadBroadcastRevisions();

  console.log ("Revisions loading, attempting to load slider ...");

  //BroadcastSlider = require('ep_timeslider/static/js/broadcast_slider').loadBroadcastSlider(fireWhenAllScriptsAreLoaded);

  changesetLoader = require('ep_timeslider/static/js/broadcast').loadBroadcast(pad, fireWhenAllScriptsAreLoaded/*, BroadcastSlider*/);

  //change export urls when the slider moves
  /*
  var export_rev_regex = /(\/\d+)?\/export/;
  var export_links     = $('#importexport .exportlink');
  BroadcastSlider.onSlider(function(revno) {
    export_links.each(function() {
      this.setAttribute('href', this.href.replace(export_rev_regex, '/' + revno + '/export'));
    });
  });
  */

  fireWhenAllScriptsAreLoaded.push(function() {
    BroadcastSlider.setSliderLength(clientVars.collab_client_vars.rev)
    BroadcastSlider.setSliderPosition(clientVars.collab_client_vars.rev)
  })
  
  //fire all start functions of these scripts
  for(var i=0;i < fireWhenAllScriptsAreLoaded.length;i++) {
    fireWhenAllScriptsAreLoaded[i]();
  }
}

/**
 *
 */
function reset() {
  // Can't have this, note that this is part of the normal behavior of the plugin
  padeditor.ace.setEditable(true);

  $('body').removeClass('timeslider');
  $('#timeslider-content').empty();
}

exports.init = init;
exports.reset = reset;
