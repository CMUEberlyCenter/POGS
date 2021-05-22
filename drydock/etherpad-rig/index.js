'use strict';

var finalhandler = require('finalhandler');
var connect = require('connect');
var serveStatic = require('serve-static');
var api = require('etherpad-lite-client');
var fs = require('fs');
var http = require('http');

var settings = {};
var serve = serveStatic(__dirname, { 'index': ['index.html', 'index.htm'] });
var etherData={
  "groups": {},
  "authors": {},
  "sessions": {}
};

  /**
   * Slow, but I don't really care
   */
function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

/**
 * https://etherpad.org/doc/v1.8.4/
 * https://blog.etherpad.org/2019/03/18/updating-etherpad-for-modern-javascript/
 * https://github.com/expressjs/serve-static
 * https://stackabuse.com/reading-and-writing-json-files-with-node-js/
 * https://github.com/tomassedovic/etherpad-lite-client-js
 */
class EtherpadRig {

  /**
   *
   */
  constructor () {
    this.padsInitialized=false;
  }

  /**
   *
   */
  load () {
    console.log ("load ()");

    try {
      if (fs.existsSync(path)) {
        let rawEtherData = fs.readFileSync('etherdata.json');
        if (rawEtherData) {
          etherData = JSON.parse(rawEtherData);
        }
      }
    } catch(err) {
      console.error("Etherpad data file does not exist yet: " + err);
    }
  }

  /**
   *
   */
  save () {
    console.log ("save ()");

    //console.log (JSON.stringify (etherData, null, '\t'));

    //fs.writeFileSync ('etherdata.json',JSON.stringify (etherData),0);

    var writeFile;
    try {
      /*
      writeFile = fs.openSync('etherdata.json', 'w');
      fs.writeSync(writeFile, JSON.stringify (etherData));
      fs.close(writeFile);
      */
      //callback(null, outFile);

      fs.writeFileSync('etherdata.json', JSON.stringify (etherData, null, '\t'));
    } catch (err) {
      console.log('Error: Unable to save etherdata.json\n' + err + '\n');
      //callback(err);
    }
  }

  /**
   *
   */
  getSession (aSessionName) {
    console.log ("getSession ("+aSessionName+")");

    for (var aName in etherData.sessions) {
      if (aName==aSessionName) {
        if (etherData.sessions.hasOwnProperty(aName)) {
          return (etherData.sessions [aSessionName]);   
        }
      }
    }

    return (null);
  }

  /**
   *
   */
  createSession (aSessionName,aSessionNameFull,aText) {
    if (etherpad.getSession (aSessionName)!=null) {
      return;
    }
  
    let sessionObject={
      id: aSessionName,
      name: aSessionNameFull,
      text: aText
    };

    etherData.sessions [aSessionName]=sessionObject;

    etherpad.save ();
  }  

  /**
   *
   */
  getStats () {
    console.log ("getStats ()");

    return (etherpad.listPads ());

    /*
    return new Promise ((resolve, reject) => {
      this.etherpad.getStats(function (error, data) {
        if (error) {
          console.error('Error getting stats: ' + error.message);
          reject (error.message);
        } else { 
          console.log('Got stats: ' + data);
          resolve(data);
        }
      });
    });
    */
  }

  /**
   *
   */
  createGroup (aGroupName) {
    console.log ("createGroup ()");

    return new Promise ((resolve, reject) => {
      this.etherpad.createGroup(function (error, data) {
        if (error) {
          console.error('Error creating group: ' + error.message);
          reject (error.message);
        } else { 
          console.log('New group created: ' + data.groupID);
          etherData.groups [data.groupID]={
            "name": aGroupName,
            "id": data.groupID,
            "pads": []
          };
          resolve(data);
        }
      });
    });
  }

  /**
   *
   */
  getDefaultGroupID () {
    for (var groupName in etherData.groups) {
      if (etherData.groups.hasOwnProperty(groupName)) {
        let group=etherData.groups [groupName];
        if (group.name) {
          if (group.name=="Default") {
            return (group.id);
          }
        }      
      }
    }

    return (null);
  }

  /**
   *
   */
  createAuthor (anAuthor) {
    console.log ("createAuthor ("+anAuthor+")");

    return new Promise ((resolve, reject) => {
      let args = {
        name: anAuthor
      }

      this.etherpad.createAuthor(function (error, data) {
        if (error) {
          console.error('Error creating group: ' + error.message);
          reject (error.message);
        } else { 
          console.log('New author created: ' + data.authorID);
          etherData.authors [data.authorID]={
            "name": anAuthor
          };
          resolve (data);
        }
      });
    });
  }

  /**
   *
   */
  createPad (aPadName) {
    console.log ("createPad ("+this.getDefaultGroupID ()+","+aPadName+")");

    // First test our internal dataset first

    let cachedSession=etherpad.getSession (aPadName);

    // Now reflect the data in Etherpad

    return new Promise ((resolve, reject) => {
      let args = {
        groupID: this.getDefaultGroupID (),
        padID: aPadName,
        text: '',
      };

      this.etherpad.createPad(args, function(error, data) {
        if (error) { 
          console.error('Error creating pad: ' + error.message);
          reject (error.message);;
        } else {
          //console.log('New pad created: ' + JSON.stringify (data));
          resolve (data);
        }
      });
    });
  }

  /**
   *
   */
  createGroupPad (aGroupName,aPadName) {
    console.log ("createGroupPad ("+aPadName+")");

    return new Promise ((resolve, reject) => {
      let args = {
        groupID: aGroupName,
        padName: aPadName,
        text: '',
      };

      this.etherpad.createGroupPad(args, function(error, data) {
        if (error) { 
          console.error('Error creating pad: ' + error.message);
          reject (error.message);
        } else {
          //console.log('New pad created: ' + JSON.stringify (data));
          resolve(data);
        }
      });
    });
  }  

  /**
   *
   */
  copyPad (aFrom,aTo) {
    console.log ("copyPad ("+aFrom+","+aTo+")");

    return new Promise ((resolve, reject) => {
      let args = {
        sourceID: aFrom,
        destinationID: aTo
      };

      this.etherpad.copyPad(args, function(error, data) {
        if (error) { 
          console.error('Error copying pad: ' + error.message);
          reject (error.message);
        } else {
          //console.log('New pad created: ' + JSON.stringify (data));
          resolve(data);
        }
      });
    });
  }   

  /**
   *
   */
  listGroups () {
    console.log ("listGroups ()");

    return new Promise ((resolve, reject) => {
      let args = {};

      this.etherpad.listAllGroups(args, function(error, data) {
        if (error) { 
          console.error('Error listing groups: ' + error.message);
          reject (null);
        } else {
          //console.log('Pad data: ' + JSON.stringify (data.groupIDs));

          for (let i=0;i<data.groupIDs.length;i++) {
            // Create an object for every group we find, assuming it doesn't already exist
            let groupID=data.groupIDs [i];

            if (etherData.groups.hasOwnProperty(groupID)==false) {
              etherData.groups [groupID] = {
                "pads": {}
              };
            }
          }
          
          resolve (data);
        }
      });
    });
  }  

  /**
   *
   */
  listPads (aGroup) {
    console.log ("listPads ("+aGroup+")");

    return new Promise ((resolve, reject) => {
      if (aGroup) {
        let args = {};

        args = {
          groupID: aGroup
        };

        this.etherpad.listPads(args, function(error, data) {
          if (error) { 
            console.error('Error listing pads: ' + error.message);
            reject (error.message);
          } else {
            console.log('Pad data: ' + JSON.stringify (data));

            resolve (data);
          }
        });
      } else {
         let args = {};
         this.etherpad.listAllPads(args, function(error, data) {
          if (error) { 
            console.error('Error listing pads: ' + error.message);
            reject (error.message);
          } else {
            console.log('Pad data: ' + JSON.stringify (data));

            resolve (data);
          }
        });
      }
    });
  }

  /**
   *
   */
  initPads () {
    if (this.padsInitialized==false) {
      console.log ("initPads ()");
      etherpad.createPad ("Default").catch (() => {});
      this.padsInitialized=true;
    }
  }

  /**
   *
   */
  initGroups () {
    console.log ("initGroups ()");

    this.listGroups ().then (() => {
      for (var group in etherData.groups) {
        if (etherData.groups.hasOwnProperty(group)) {           
          etherpad.listPads (group).then (() => {
            etherpad.initPads ();
          });
        }
      }
    }).catch((error) => { console.log (error); });
  }

  /**
   *
   */
  init () {
    console.log ("init ()");

    etherpad.load ();

    let rawSettings = fs.readFileSync('settings.json');
    settings = JSON.parse(rawSettings);

    console.log (settings);
    
    this.etherpad = api.connect({
      apikey: settings.apikey,
      host: settings.host,
      port: settings.port
    });

    this.createAuthor ("Monitor").then (() => {
      this.createGroup ("Default").then (() => {
        etherpad.initGroups ();
      }).catch (() => {
        // This is most likely an error indicating the group already exists, we should proceed anyway
        etherpad.initGroups ();
      });
    }).catch(()=>{
      this.createGroup ("Default").then (() => {
        etherpad.initGroups ();
      }).catch (() => {
        // This is most likely an error indicating the group already exists, we should proceed anyway
        etherpad.initGroups ();
      });      
    });
  }

  /**
   *
   */
  writeDefault (req,res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<html><body>Default Page</body></html>");
    res.end();
  }
 
  /**
   *
   */
  run () {
    console.log ("run ()");

    this.init ();

    http.createServer(function (req, res) {      
      console.log ("Processing request: " + req.url);
      console.log (req.headers);

      if (isEmpty (req.headers)==true) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({"error": 'no headers provided, bump'}));
        res.end();
        return;
      }
              
      if (req.headers.hasOwnProperty ("origin")==true) {
        console.log ("Using origin for CORS header ...");
        if (typeof  req.headers.origin == undefined) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"error": 'origin field is null'}));
          res.end();
          return;
        }
        res.setHeader('Access-Control-Allow-Headers', req.headers.origin);
      } else {
        console.log ("Using host for CORS header ...");

        if (typeof req.headers.host == undefined) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"error": 'host is null'}));
          res.end();
          return;
        }

        res.setHeader('Access-Control-Allow-Headers', req.headers.host);
      }

      res.setHeader ('Access-Control-Allow-Origin','*');

      var url = new URL (req.url,'http://www.example.com/dogs');

      if (req.url=="/stats") {
        etherpad.getStats().then ((data) => {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(data));
          res.end();
        }).catch((error) => { 
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"error": error}));
          res.end();
        });

        // getStats is not yet implemented in the API wrapper we use

        /*
        etherpad.getStats().then ((data) => {
          console.log ("then ()");
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(data));
          res.end();
        }).catch((error) => { 
          let msg1=(""+error); // Not a string for some reason
          let msg=msg1.replace(":","-");
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"error": msg}));
          res.end();
        });
        */
        return;  
      }  

      if (req.url.indexOf ("/getsession")!=-1) {
        var aSession=url.searchParams.get('session');

        let cachedSession=etherpad.getSession (aSession);

        if (cachedSession!=null) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(cachedSession));
          res.end();
        } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"ok": "Session does not yet exists"}));
          res.end();
        }
        return;  
      }  

      if (req.url=="/settings") {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(settings));
        res.end();
        return;  
      }  

      if (req.url=="/data") {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(etherData));
        res.end();
        return;  
      }  

      if (req.url=="/pads") {
        etherpad.listPads(null).then ((data) => {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(data));
          res.end();
        });
        return;  
      }      

      if (req.url.indexOf ("/copy")!=-1) {
        console.log ("Creating copy of pad ...");

        var aFrom=url.searchParams.get('from');
        var aTo=url.searchParams.get('to');

        etherpad.copyPad(aFrom,aTo).then ((data) => {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(data));
          res.end();
        }).catch((error) => { 
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"error": error}));
          res.end();
        });

        return;    
      }      

      if (req.url.indexOf ("/checkname")!=-1) {
        console.log ("Checking pad name ...");

        var aName=url.searchParams.get('name');

        let cachedSession=etherpad.getSession (aName);

        if (cachedSession!=null) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"error": "Session name already exists"}));
          res.end();
        } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"ok": "all good"}));
          res.end();
        }

        return;    
      }

      // https://stackabuse.com/node-list-files-in-a-directory/
      if (req.url.indexOf ("/listscripts")!=-1) {
        console.log ("Returning list of scripts ...");

        var directory = './data/';
        var fileJSON=[];

        fs.readdir(directory, (err, files) => {
          for (let i=0;i<files.length;i++) {
            let file=files [i];
            if (file.toLowerCase ().indexOf (".json")>0) {
              //console.log(file);
              fileJSON.push (file);
            }
          }

          console.log (fileJSON);
          console.log (fileJSON.length);

          if (fileJSON.length>0) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({"ok": "all good", "data": fileJSON}));
            res.end();          
          } else {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({"error": "No script files found"}));
            res.end();
          }          
        });

        return;    
      }

      // https://stackabuse.com/node-list-files-in-a-directory/
      if (req.url.indexOf ("/loadscript")!=-1) {
        console.log ("Load a particular script");
        
        var fileJSON=[];

        var aName=url.searchParams.get('name');

        console.log ("Loading: " + aName + " ...");

        fs.readFile('data/' + aName, function(err, fileContent){
          if (err) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({"error": "Error loading file"}));
          } else {
            let json=JSON.parse (fileContent);
            res.write(JSON.stringify({"ok": "all good", "data": json}));
            res.end();          
          }
        });        

        return;    
      }

      // https://stackabuse.com/node-list-files-in-a-directory/
      if (req.url.indexOf ("/savescript")!=-1) {
        console.log ("Save a particular script");

        let body = [];

        req.on('data', (chunk) => {
          body.push(chunk);
        }).on('end', () => {
          body = Buffer.concat(body).toString();
          console.log (body);

          var aName=url.searchParams.get('name');

          fs.writeFile('data/' + aName, 
          body,
          function (err) {
            if (err) {
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.write(JSON.stringify({"error": "Error saving file"}));
            } else {
              res.write(JSON.stringify({"ok": "all good"}));
              res.end();                    
            }
          });          
        });

        return;    
      }        


      if (req.url.indexOf ("/createsession")!=-1) {
        console.log ("Creating new session ...");

        var aName=url.searchParams.get('name');
        var aFull=url.searchParams.get('full');
        var aText=url.searchParams.get('text');

        let cachedSession=etherpad.getSession (aName);

        if (cachedSession!=null) {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"error": "Session name already exists"}));
          res.end();
        } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify({"ok": "Session does not yet exists"}));
          res.end();
        }

        etherpad.createSession (aName,aFull,aText);

        return;    
      }        
      
      if (req.url.indexOf (".json")!=-1) {
        res.writeHead(200, {'Content-Type': 'text/json'});
        fs.readFile('data/sample-script.json', function(err, content){
          res.write(content);
          res.end();
        });
        return;
      }

      serve(req, res, finalhandler(req, res));
    }).listen(9000);
  }
}

var etherpad=new EtherpadRig ();
etherpad.run();
