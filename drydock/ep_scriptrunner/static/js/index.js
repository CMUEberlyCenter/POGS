'use strict';

var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
var script=null;
var scriptIndex=0;
var currentCommand=null;

/**
 *
 */
function isEmpty (str) {
  if(str === null || str === '') {
    return (true);
  }

  return (false);
}

/**
 *
 */
function selectAll () {
  console.log ("selectAll ()");
  
  window.myAce.ace.callWithAce((ace) => {
    const document = ace.ace_getDocument();
  
    const numberOfLines = $(document).find('body').contents().length;
  
    ace.ace_performSelectionChange([0, 0], [numberOfLines - 1, 0], false);
  }, 'selectAll', true);
}

/**
 *
 */
function parseTimestamp (aTimestamp) {
  console.log ("parseTimestamp ("+aTimestamp+")");

  if (isEmpty (aTimestamp)==true) {
    return(-1);
  }

  if(aTimestamp.indexOf (":")==-1) {
    return (-1);
  }

  var splitter=aTimestamp.split (":");

  var milliseconds=(parseInt(splitter [0])*60*60*1000)+(parseInt(splitter[1])*60*1000)+(parseInt(splitter[2])*1000)+(parseInt(splitter [3])*1);

  return (milliseconds);
}

/**
 *
 */
function getIndicesOf(searchStr, str, caseSensitive) {
  var searchStrLen = searchStr.length;

  if (searchStrLen == 0) {
    return [];
  }

  var startIndex = 0, index, indices = [];

  if (!caseSensitive) {
    str = str.toLowerCase();
    searchStr = searchStr.toLowerCase();
  }

  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }

  return indices;
}

/**
 *
 */
function processParticipants (aParticipantList) {
  console.log ("processParticipants ()");

}

/**
 *
 */
function runScript () {
  console.log ("runScript ("+scriptIndex+")");

  scriptIndex=0;

  if (script==null) {
    return;
  }

  var anEntry=script [0];

  var command=anEntry.command;
  var arg1=anEntry.argument1;
  var timestamp=parseTimestamp (anEntry.timestamp);

  currentCommand=anEntry;

  console.log ("Waiting for command (" + command + ") to kick in in: " + timestamp + " milliseconds");

  setTimeout (nextScriptStep,timestamp);

  scriptIndex++;
}

/**
 *
 */
function nextScriptStep () {
  console.log ("nextScriptStep ("+scriptIndex+")");

  if (script==null) {
    return;
  }

  // Executing current command

  if (currentCommand!=null) {
    executeCommand (currentCommand);
  }

  // Starting wait for next command

  if (scriptIndex<script.length) {
    var anEntry=script [scriptIndex];

    var command=anEntry.command;
    var arg1=anEntry.argument1;
    var timestamp=parseTimestamp (anEntry.timestamp);

    currentCommand=anEntry;

    console.log ("Waiting for command (" + command + ") to kick in in: " + timestamp + " milliseconds");

    setTimeout (nextScriptStep,timestamp);

    scriptIndex++;
  } else {
    console.log ("Script finished");
    currentCommand=null;
  }
}

/**
  e.g.:

    participant: "participant1",
    command: "setText",
    argument1: "Hello World"
    timestamp: "00:00:01:000"
 */
function executeCommand (aCommand) {
  console.log ("Executing: " + aCommand.command + " ...");

  var command=aCommand.command;

  if (command=="setText") {
    var text=aCommand.argument1;

    var current=padeditor.ace.exportText ();
    var length=current.length;

    console.log ("setText (0," + length + ")");

    window.myAce.callWithAce((ace) => {
      ace.ace_performDocumentReplaceCharRange(0,length,text);
    },'scriptrunner',true);
  }

  if (command=="setChatText") {
    console.log ("NOP");
  }

  if (command=="replaceFirst") {
    console.log ("replaceFirst ()");

    var current=padeditor.ace.exportText ();

    var from=aCommand.argument1;
    var to=aCommand.argument2;

    var index=current.indexOf(from);

    if (index==-1) {
      console.log ("Text to be replaced (" + from + ") not found!");
    } else {
      window.myAce.callWithAce((ace) => {
        ace.ace_performDocumentReplaceCharRange(index,from.length,to);
      },'scriptrunner',true);    
    }
  }

  if (command=="replaceAll") {
    console.log ("NOP");

    var from=aCommand.argument1;
    var to=aCommand.argument2;    
  }

  if (command=="addTextAtEnd") {    
    var text=aCommand.argument1;

    var current=padeditor.ace.exportText ();
    var length=current.length;

    console.log ("addTextAtEnd (" + length + ")");

    window.myAce.callWithAce((ace) => {
      ace.ace_performDocumentReplaceCharRange(length,length,text);
    },'scriptrunner',true);    
  }
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/URL#properties
 */
function load () {
  console.log ("load ()");

  var urlParser=new URL (window.location.href);

  var jsonURL="http://" + urlParser.hostname + ":9000/data/sample-script.json";

  console.log ("Loading script from: " + jsonURL);
 
  $.getJSON(jsonURL,function (data) {
    console.log ("Data loaded, processing script ...");

    console.log (data.participants);
    console.log (data.script);

    processParticipants (data.participants);

    script=data.script;

    runScript ();

  }).done(function() {
    console.log("done");
  })
  .fail(function(jqXHR, textStatus, errorThrown) { 
    console.log ('getJSON request failed! ' + textStatus);
    console.log (errorThrown);
  })
  .always(function() {
    console.log("complete");
  });
 
  /*
  $.ajax({
    url: jsonURL,
    type: 'GET',
    dataType: 'text',
    success: function (data) {
      try {
        var output = JSON.parse(data);
        console.log (output);
      } catch (e) {
        console.log ("Error, the downloaded data is not valid JSON " + data);
      }
    }, error: function (request, error) {
      console.log ("AJAX Call Error: " + error);
    }
  });  
  */
}

/**
 *
 */
exports.postAceInit = function(hook_name, args, cb) {
  console.log ("Scriptrunner booting (" + jQuery.fn.jquery + ")...");


  // Quick test to see if we can interact with Ace
  //padeditor.ace.setEditable(false);

  window.myEditor=padeditor;
  window.myAce=padeditor.ace;

  /*
  // Reset the text
  padeditor.ace.ace_setBaseText("This shit again");

 
  // Try a replace-range
  padeditor.ace.replaceRange(undefined, undefined, "Hello cruel world!");

  console.log (padeditor.ace.exportText ());
  */

  load ();
}

/*
const postAceInit = (hook, context) => {
  const $outer = $('iframe[name="ace_outer"]').contents().find('iframe');
  const $inner = $outer.contents().find('#innerdocbody');

  const spellcheck = {
    enable: () => {
      $inner.attr('spellcheck', 'true');
      $inner.find('div').each(function () {
        $(this).attr('spellcheck', 'true');
        $(this).find('div').each(function () {
          $(this).attr('spellcheck', 'true');
        });
      });
    },
    disable: () => {
      $inner.attr('spellcheck', 'false');
      $inner.find('div').each(function () {
        $(this).attr('spellcheck', 'false');
        $(this).find('span').each(function () {
          $(this).attr('spellcheck', 'false');
        });
      });
    },
  };

  // init
  if (padcookie.getPref('spellcheck') === false) {
    $('#options-spellcheck').val();
    $('#options-spellcheck').attr('checked', 'unchecked');
    $('#options-spellcheck').attr('checked', false);
  } else {
    $('#options-spellcheck').attr('checked', 'checked');
  }

  if ($('#options-spellcheck').is(':checked')) {
    spellcheck.enable();
  } else {
    spellcheck.disable();
  }

  // on click
  $('#options-spellcheck').on('click', () => {
    if ($('#options-spellcheck').is(':checked')) {
      padcookie.setPref('spellcheck', true);
      spellcheck.enable();
    } else {
      padcookie.setPref('spellcheck', false);
      spellcheck.disable();
    }
    if (window.browser.chrome) window.location.reload();
  });
};
*/