var script={};
var files=[];

var nrSessions=1;
var sessionNameFull="";
var sessionName="";
var settings={};
var sessionExists=false;
var name1="";
var name2="";
var name3="";
var name4="";  

/**
 *
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 *
 */
function setStatus (aMessage) {
  console.log (aMessage);
  $("#status").text (aMessage);

  //window.setTimeout (function() { clearStatus (); }, 5000);
}  

/**
 *
 */
function checkName (aName) {
  console.log ("checkName ()");

  $.ajax({
    type: "GET",
    url: "/checkname?name="+aName,
    success: function (data) {
      if (data.error) {
        setStatus ("Can't use " + usernameFull + ":" + data.error);
        sessionExists=true;
      } else {
        sessionExists=false;
      }
    }
  });
}

/**
 *
 */
function clearStatus () {
  $("#status").html ("&nbsp;");
} 

/**
 *
 */
function reset () {
  console.log ("reset ()");

  $("#sessioninfo").html("");
  $("#etherpad").attr("src","");

  newScript ();
}  

/**
 *
 */
function showNewSession () {
  console.log ("newSession ()");

  reset ();
  clearStatus ();

  $("#session").hide();
  $("#newsession").show();
  $("#playsession").hide();
  $("#managesessions").hide();
  $("#scriptrunner").hide();    
}

/**
 *
 */
function showPlaySession () {
  console.log ("playSession ()");

  reset ();
  clearStatus ();

  $("#session").hide();
  $("#newsession").hide();
  $("#playsession").show();
  $("#managesessions").hide();
  $("#scriptrunner").hide();

  $.ajax({
    type: "GET",
    url: "/pads",
    success: function (data) {
      //console.log (data.padIDs);

      $("#pads").empty();

      for (var i=0;i<data.padIDs.length;i++) { 
        if (data.padIDs [i].indexOf ("test")!=0) {
          $("#pads").append($('<option></option>').val(data.padIDs [i]).html(data.padIDs [i]));
        }
      }
    }
  });
}

/**
 *
 */
function showManageSessions () {
  console.log ("manageSessions ()");

  reset ();
  clearStatus ();

  $("#session").hide();
  $("#newsession").hide();
  $("#playsession").hide();
  $("#managesessions").show();
  $("#scriptrunner").hide();
} 

/**
 *
 */
function showScriptRunner () {
  console.log ("showScriptRunner ()");

  reset ();
  clearStatus ();

  $("#session").hide();
  $("#newsession").hide();
  $("#playsession").hide();
  $("#managesessions").hide();   
  $("#scriptrunner").show();

  loadScripts ();
} 

  /**
   *
   */
  function confNrSessions () {
    if (nrSessions==1) {
      $("#name1container").show ();
      $("#name2container").hide ();
      $("#name3container").hide ();
      $("#name4container").hide ();

      $("#session1url").show ();
      $("#session2url").hide ();
      $("#session3url").hide ();
      $("#session4url").hide ();      
    }

    if (nrSessions==2) {
      $("#name1container").show ();
      $("#name2container").show ();
      $("#name3container").hide ();
      $("#name4container").hide ();

      $("#session1url").show ();
      $("#session2url").show ();
      $("#session3url").hide ();
      $("#session4url").hide ();        
    }

    if (nrSessions==3) {
      $("#name1container").show ();
      $("#name2container").show ();
      $("#name3container").show ();
      $("#name4container").hide ();

      $("#session1url").show ();
      $("#session2url").show ();
      $("#session3url").show ();
      $("#session4url").hide ();        
    }

    if (nrSessions==4) {
      $("#name1container").show ();
      $("#name2container").show ();
      $("#name3container").show ();
      $("#name4container").show ();

      $("#session1url").show ();
      $("#session2url").show ();
      $("#session3url").show ();
      $("#session4url").show ();        
    }   
  }

  /**
   *
   */
  function changeNrSessions (e) {
    if ($("#sessioncount").val()!="") {
      nrSessions=parseInt ($("#sessioncount").val());
    }

    console.log ("changeNrSessions ("+nrSessions+")");

    confNrSessions ();         
  }

  /**
   *
   */
  function changeSessionName (e) {
    let sName=$("#sessionname").val();

    console.log ("changeSessionName ("+sName+")");

    if (sName!="") {
      sessionNameFull=sName;
      
      checkName (sName);

      sessionName=sName.replace(/ /g,"_").toLowerCase();
    }

    console.log ("changeSessionName ("+sessionName+","+sessionNameFull+") 2");
  }  

  /**
   *
   */
  function previousNames () {
    console.log ("nextNames ()");

    $("#step1").show ();
    $("#step2").hide ();
    $("#step3").hide ();    
  }

  /**
   *
   */
  function nextNames () {
    console.log ("nextNames ("+sessionName+","+sessionNameFull+")");

    let sampleText=$("#text").text();

    //console.log ("sample text: " + sampleText);

    if (sessionExists==true) {
      alert ("Please provide a session name that doesn't already exist");
      return;
    }

    setStatus ("Creating session, please wait ...");

    let textEncoded=window.btoa(sampleText);

    $.ajax({
      type: "GET",
      url: "/createsession?name="+sessionName+"&full="+sessionNameFull+"&text="+textEncoded,
      success: function (data) {
        if (data.error) {
          setStatus ("Error creating new session: " + data.error);
        } else {
          setStatus (" ");
          $("#step1").hide ();
          $("#step2").show ();
          $("#step3").hide ();
        }
      }
    });
  }

  /**
   *
   */
  function previousStart () {
    console.log ("previousStart ()");

    $("#step1").hide ();
    $("#step2").show ();
    $("#step3").hide ();    
  }

  /**
   *
   */
  function nextStart () {
    console.log ("startStart ()");

    changeSessionName (null);

    name1=$("#name1").val().replace(/ /g,"_").toLowerCase();
    name2=$("#name2").val().replace(/ /g,"_").toLowerCase();
    name3=$("#name3").val().replace(/ /g,"_").toLowerCase();
    name4=$("#name4").val().replace(/ /g,"_").toLowerCase();

    if (nrSessions==1) {
      if (name1=="") {
        alert ("Please fill in a name");
        return;
      }
    }

    if (nrSessions==2) {
      if ((name1=="") || (name2=="")) {
        alert ("Please make sure all names are filled in");
        return;
      }
    }

    if (nrSessions==3) {
      if ((name1=="") || (name2=="") || (name3=="")) {
        alert ("Please make sure all names are filled in");
        return;
      }
    }

    if (nrSessions==4) {
      if ((name1=="") || (name2=="") || (name3=="") || (name4=="")) {
        alert ("Please make sure all names are filled in");
        return;
      }
    }

    $("#step1").hide ();
    $("#step2").hide ();
    $("#step3").show ();

    $("#session1url").text ("http://"+settings.host+":"+settings.portmanager+"/participant.html?session="+sessionName+"&username="+name1);
    $("#session2url").text ("http://"+settings.host+":"+settings.portmanager+"/participant.html?session="+sessionName+"&username="+name2);
    $("#session3url").text ("http://"+settings.host+":"+settings.portmanager+"/participant.html?session="+sessionName+"&username="+name3);
    $("#session4url").text ("http://"+settings.host+":"+settings.portmanager+"/participant.html?session="+sessionName+"&username="+name4);
  }

  /**
   *
   */
  function startSessions () {
    console.log ("startSessions ()");

    var monitorURL="http://"+settings.host+":"+settings.port+"/p/"+sessionName+"?userName=Monitor&showChat=true&showControls=false";

    $("#sessioninfo").text(monitorURL);

    $("#etherpad").attr("src",monitorURL);
  }

  /**
   *
   */
  function playSession () {
    console.log ("playSession ()");

    var testPad=("test"+uuidv4());

    $.ajax({
      type: "GET",
      url: "/copy?from="+testPad+"&to="+$("#pads").val(),
      success: function (data) {
        if (data.error) {
          setStatus (data.error);
        } else {
          var monitorURL="http://"+settings.host+":"+settings.port+"/p/"+testPad+"?userName=Monitor&showChat=true&showControls=false";

          $("#sessioninfo").text(monitorURL);

          $("#etherpad").attr("src",monitorURL); 
        }
      }
    });
  }

  /**
   *
   */
  function startOver () {
    console.log ("startOver ()");

    $("#sessioninfo").text(" ");

    $("#etherpad").attr("src",""); 

    nrSessions=1;
    sessionNameFull="";
    sessionName="";
    sessionExists=false;
    name1="";
    name2="";
    name3="";
    name4="";

    $("#text").val("");
    $("#sessionname").val("");

    $("#step1").show ();
    $("#step2").hide ();
    $("#step3").hide ();
  }

  /**
   *
   */
  function runScript () {
    console.log ("runScript ()");

    let filename=$("#scriptname").val();

    if (filename=="") {
      alert ("Please provide a filename");
      return;
    }

    var testPad=uuidv4();
        
    //var monitorURL="http://"+settings.host+":"+settings.port+"/p/"+testPad+"?userName=Monitor&showChat=false&showControls=false&file="+filename;
    var monitorURL="http://"+settings.host+":"+settings.port+"/p/"+testPad+"?userName=Monitor&file="+encodeURIComponent(filename)+"?chatAlwaysVisible=false&noColors=false";

    $("#etherpad").attr("src",monitorURL); 
  }

  /**
   *
   */
  function getLink () {
    console.log ("getLink ()");

    let filename=$("#scriptname").val();

    if (filename=="") {
      alert ("Please provide a filename");
      return;
    }    
    
    var testPad=uuidv4();

    //var monitorURL="http://"+settings.host+":"+settings.port+"/p/"+testPad+"?userName=Monitor&showChat=false&showControls=false&file="+filename;
    var monitorURL="http://"+settings.host+":"+settings.port+"/p/"+testPad+"?userName=Monitor&file="+(filename);
        
    setStatus (monitorURL);
  }

/**
 *
 */
function showFiles () {
  console.log ("showFiles ()");

  $('#scripts').empty();

  for (let i=0;i<files.length;i++) {
    let file=files [i];

    $("#scripts").append('<option value="'+file+'">'+file+'</option>');
  }
} 

  /**
   *
   */
  function saveScript () {
    console.log ("saveScript ()");

    let filename=$("#scriptname").val();

    for (let i=0;i<files.length;i++) {
      let testName=files [i];

      if (testName==filename) {
        if (!confirm('Are you sure you want overwrite the file?')) {
          return;
        }
      }
    }

    if (filename=="") {
      alert ("Please provide a filename");
      return;
    }

    $.ajax({
      type: "POST",
      url: "/savescript?name="+filename,
      data: JSON.stringify(script),
      contentType: "application/json",
      success: function (data) {
        loadScripts ();
      },
      error: function (data) {
        setStatus ("Error saving file");
        loadScripts ();
      }
    });
  }

  /**
   *
   */
  function loadScript () {
    console.log ("loadScript ()");
   
    $.ajax({
      type: "GET",
      url: "/loadscript?name="+$("#scripts").val(),
      success: function (data) {
        if (data.error) {
          setStatus (data.error);
        } else {
          let json=JSON.parse (data);

          console.log (json);

          script=json.data;
          
          showScript (); 
        }
      }
    });           
  }

  /**
   *
   */
  function loadScripts () {
    console.log ("loadScripts ()");
   
    $.ajax({
      type: "GET",
      url: "/listscripts",
      success: function (data) {
        if (data.error) {
          setStatus (data.error);
        } else {
          console.log ("Showing scripts ...");
          let fileList=data.data;

          files=fileList;
 
          showFiles ();
        }
      }
    });        
  }
  
  /**
   *
   */
  function newScript () {
    console.log ("newScript ()");
        
    $("#scriptname").val("");
    $("#sortable").empty ();

    script={
     "participants": [
     ],
     "script": [
    ]   
   }    
  }    

  /**
   *
   */
  function clearScript () {
    console.log ("clearScript ()");
        
    if (!confirm('Are you sure you want clear your work and start fresh?')) {
      return;
    }    

    newScript ();
  }


  /**
   *
   */
  function addAction () {
    console.log ("addAction ()");
  
    let com=$("#action").val();
    let arg1=$("#argument1").val();
    let arg2=$("#argument2").val();
    let timestamp=$("#timestamp").val();

    if (com=="") {
      alert ("Please select an action first");
      return;
    }
    
    if (com=="setText") {
	  if (arg1=="") {
	    alert ("Please provide a first argument");
	    return;
	  }
    }

    if (com=="addTextAtEnd") {
	  if (arg1=="") {
	    alert ("Please provide a first argument");
	    return;
	  }
    }
    
    if (com=="addTextAtStart") {
	  if (arg1=="") {
	    alert ("Please provide a first argument");
	    return;
	  }
    }
    
    if (com=="replaceFirst") {
	  if (arg1=="") {
	    alert ("Please provide a first argument");
	    return;
	  }

      if (arg2=="") {
        alert ("Please provide a second argument");
        return;
      }	  
    }
    
    if (com=="replaceAll") {
	  if (arg1=="") {
	    alert ("Please provide a first argument");
	    return;
	  }

      if (arg2=="") {
        alert ("Please provide a second argument");
        return;
      }
    }         

    if (timestamp=="") {
      alert ("Please provide a timestamp");
      return;
    }

    if ($.isNumeric(timestamp)==false) {
      alert ("Please provide a number for the timestamp");
      return;
    }

    let action={
      "command": com,
      "argument1": arg1,
      "argument2": arg2,
      "timestamp": timestamp
    };

    script.script.push (action);

    showScript ();
  }    

  /**
   *
   */
  function deleteActionItem (actionId) {
    console.log ("deleteActionItem ("+actionId+")");
   
    if (!confirm('Are you sure you want to delete this action?')) {
      return;
    }

    for (let i=0;i<script.script.length;i++) {
      if (actionId==i) {
        script.script.splice(i, 1);
        showScript (); 
        return;
      }
    }
  }

  /**
   *
   */
  function openDropdown () {
    console.log ("openDropdown ()");

    $(".dropdown-content").css("display", "block");
  }

  /**
   *
   */
  function closeDropdown () {
    console.log ("closeDropdown ()");

    $(".dropdown-content").css("display", "block");
  }

  /**
   *
   */
  function setAction (anAction) {
    console.log ("setAction ("+anAction+")");

    $(".dropdown-content").css("display", "none");

    $("#action").val (anAction);
    $("#action").text (anAction);

    if (anAction=="setText") {
      $("#argument1-help").text ("Text to display:");
      $("#argument2-help").text ("(not needed)");
      $("#argument2").prop ("disabled",true);
    }

    if (anAction=="addTextAtEnd") {
      $("#argument1-help").text ("Text to add:");
      $("#argument2-help").text ("(not needed)");
      $("#argument2").prop ("disabled",true);
    }
    
    if (anAction=="addTextAtStart") {
      $("#argument1-help").text ("Text to add:");
      $("#argument2-help").text ("not needed)");
      $("#argument2").prop ("disabled",true);
    }
    
    if (anAction=="replaceFirst") {
      $("#argument1-help").text ("Text to find:");
      $("#argument2-help").text ("Text to replace with");
      $("#argument2").prop ("disabled",false);
    }
    
    if (anAction=="replaceAll") {
      $("#argument1-help").text ("Text to find:");
      $("#argument2-help").text ("Text to replace with");
      $("#argument2").prop ("disabled",false);
    }                
  }

  /**
   *
   */
  function onEditTimestamp (actionId) {
    console.log ("onEditTimestamp ("+actionId+")");
    
    //document.getElementById('timestamp-'+actionId).contentEditable = 'true';
    $("#timestamp-"+actionId).attr('contenteditable','true');

    var div = document.getElementById("timestamp-"+actionId);
    setTimeout(function() {

      div.focus();
    }, 0);
  }

  /**
   *
   */
  function onSaveTimestamp (actionId) {
    console.log ("onSaveTimestamp ("+actionId+")");
    
    //document.getElementById('timestamp-'+actionId).contentEditable = 'false';
    $("#timestamp-"+actionId).attr('contenteditable','false');
  }

  /**
   *
   */
  function showScript () {
    console.log ("showScript ()");

    if (script==null) {
      console.log ("No script available");
      return;
    } else {
      $("#sortable").empty ();

      let actions=script.script;

      for (let i=0;i<actions.length;i++) {
        let anAction=actions [i];
        $("#sortable").append ('<li class="actionitem" id="'+i+'">' + anAction.command + '<div onClick="deleteActionItem('+i+')" class="deletebutton">X</div><div id="timestamp-'+i+'" class="timestamp" onBlur="onSaveTimestamp('+i+')" ondblclick="onEditTimestamp('+i+')">'+anAction.timestamp+'</div></li>');
      }      
    }
  }

/**
 *
 */
function processScriptEvent (anEvent) {
  console.log ("processScriptEvent ("+anEvent.index+","+anEvent.command+")");

  if (anEvent.command=="start") {
    showScript ();
    return;
  }

  if (anEvent.command=="finish") {    
    showScript ();
    return;
  }

  showScript ();
}

/**
 *
 */
function reorder () {
  console.log ("reorder ()");

  var domList = document.getElementsByClassName("actionitem");
  var reOrdered=[];

  if (domList!=null) {
    var i;
    for (i = 0; i < domList.length; i++) {
      console.log ("Re-ordering: " + domList[i].id);
      let index=parseInt(domList[i].id);

      reOrdered.push (script.script [index]);
    }

    script.script=reOrdered;

    showScript ();
  } else {
    console.log ("Error: no items to re-order");
  }
}

/**
 *
 */
function init () {
  console.log ("init ()");

  window.addEventListener ("message",function (event) {
    processScriptEvent (event.data);
  });

  // https://jqueryui.com/sortable/
  $("#sortable").sortable({
    stop: function (event,ui) {
      reorder ();
    }
  });
  $("#sortable").disableSelection();    

  clearStatus ();
  showNewSession ();
  confNrSessions ();
  newScript ();

  $("#scripts").click(function() {
    console.log ("Selected: " + $("#scripts").val());
    $("#scriptname").val($("#scripts").val());
  });

  $.ajax({
    type: "GET",
    url: "/stats",
    success: function (data) {
      if (data.error) {
        console.log (data);
        $("#scrimmessage").html (data.error);
      } else {
        $.ajax({
          type: "GET",
          url: "/settings",
          success: function (data) {
            settings=data;
            $("#scrim").hide ();
          }
        });          
      }
    }
  });
}
