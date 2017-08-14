const mjpage = require('./lib/main.js').mjpage;
mjpage('<script>console.log("error")</script>', { jsdom: { FetchExternalResources: ['script'], ProcessExternalResources: ['script'], virtualConsole: true } }, {}, function () {});
