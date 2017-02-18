
var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');

// setup vsts
// your collection url
// move to environment setting after initial testing
var collectionUrl = process.env.API_URL;
var token = process.env.API_TOKEN;
var auth, url, issueCreationUrl;
auth = 'Basic ' + new Buffer(token).toString('base64');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 4141, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
const LuisModelUrl = process.env.LUIS_MODEL_URL;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('greeting', (session, args) => {
       session.send('Hi There');
    })
     .matches('getticketdetails', (session, args) => {
    //    session.send('So you want details of a ticket');
       var taskNumber=builder.EntityRecognizer.findEntity(args.entities,'builtin.number');
       getItemDetails(session, taskNumber.entity);

    })
     .matches('executebuild', (session, args) => {
       session.send('so you want to execute a build');
       
    })
     .matches('userfacingissue',[
        function (session, args) {
            session.send('Are you facing an issue and want to create an issue?'); 
            builder.Prompts.choice(session, 'Please select one of the choices', ['yes','no']);
            
        },
        function(session,result)
        {
            session.send(result.response.entity);
            if(result.response.entity == "yes" || result.response.entity == 1)
            {
              session.beginDialog('/raiseTicket');      
            }
            else
            {
             session.endDialog('Sorry I did not understand you intent');

            }

        } 
    ])
       
    
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
    });


bot.dialog('/', intents);

bot.dialog('/raiseTicket', [
    function (session, args, next) {
         builder.Prompts.text(session, 'Please Enter the Title of the issue you want to create?');
    },
    function (session, args) {
    // var tickerNumber = Math.ceil(Math.random() * 20000);
    var issueId;
     if (args.response) {
            // issueId = 
            createIssue(session, args.response);
            
        }

    // /  session.endDialog();   
    // session.endDialogWithResult({
    //     response: issueId
    // });
}
]
);

function getItemDetails(session, taskid) {


url = collectionUrl + "/DefaultCollection/_apis/wit/workItems/" + taskid;



request.get({
  url: url,
  headers: {
    'Authorization': auth
  }
}, function(error, response, body) {
  var json;
  body = body.replace("System.TeamProject", "TeamProject");
  body = body.replace("System.State", "State");
  body = body.replace("System.CreatedBy", "CreatedBy");
  body = body.replace("System.Title", "Title");
  json = JSON.parse(body);
  if (json.fields !== void 0) {
    console.log("   *Task: " + json.id + "\n ** Title: <" + decodeURIComponent(json.fields.Title) + ">\n");
    session.send(" *Task* : " + json.id + ", *State*: " + json.fields.State + "\n *Title*: '" + decodeURIComponent(json.fields.Title) + "', *Created By*: " + json.fields.CreatedBy + "\n");
    session.send(" You can View / Edit this Task by clicking on the link : " + collectionUrl + "/DefaultCollection/" + (encodeURI(json.fields.TeamProject)) + "/_workitems/edit/" + taskid + "\n");
  } else {
    return session.send(">>> *No Task with Id '" + taskid + "' exists in the configured visual studio team services account*");
  }
});
}

// Helpers

function createIssue(session, title){
issueCreationUrl = collectionUrl + "/DefaultCollection/" + process.env.API_PROJECT + "/_apis/wit/workItems/$Issue?api-version=1.0";

request.patch({
  url: issueCreationUrl,
  headers: {
    'Content-Type': 'application/json-patch+json',
    'Authorization': auth
  },
  body: "[ {    'op': 'add', 'path': '/fields/System.Title', 'value': '" + title + "' }]"
}, function(error, response, body) {
  var json;
  json = JSON.parse(body);
  if (json.id !== void 0) {
    session.send("New issue created. Issue Id: "+ json.id);
    // return json.id;
  }
  session.endDialog();
});
 

}
