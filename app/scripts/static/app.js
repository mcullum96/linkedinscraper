/**
 * Created by matthew on 2/12/15.
 */
Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};
/**
 * Created by matthew on 2/13/15.
 */
function log(message) {
    console.log(message)
}
/**
 * Created by matthew on 2/13/15.
 */
String.prototype.hasChar = function(char){
  return this.indexOf(char) != -1;
};
/**
 * Created by matthew on 2/11/15.
 */
var urlHelper = function () {

    function segments() {
        return location.pathname.substr(1).split('/')
    }

    function hostName() {
        return location.host.split('.')[1];
    }

    function param(name, link) {
        var href = link || location;
        // name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(href.search);
        return results === null ? "" : decodeURI(results[1]);
    }

    function getSearchParameters() {
        var parameterString = window.location.search.substr(1);
        return parameterString != null && parameterString != "" ? transformToArray(parameterString) : {};
    }

    function transformToArray(parameterString) {
        var params = {};
        var parameterArray = parameterString.split("&");
        for (var i = 0; i < parameterArray.length; i++) {
            var tmparr = decodeURI(parameterArray[i]).split("=");
            params[tmparr[0]] = tmparr[1];
        }
        return params;
    }

    return {
        params: getSearchParameters(),
        getParam: param,
        segments: segments(),
        hostName: hostName()
    }
}();
var app = {};

$(document).ready(function () {

    // array of url GET params
    app.params = urlHelper.params;

    var params = app.params;

    // background page
    app.bp = chrome.extension.getBackgroundPage(); // bp = background page

    // knockout
    app.ko = ko;

    // models
    app.viewModel = new app.models.view();
    app.ko.applyBindings(app.viewModel);

    app.modals = {addToQueue: $('#addToQueue')};

    if (params['a'] == "addToQueue") {
        app.modals.addToQueue.modal('show');
    }

    app.viewModel.delay.subscribe(function (delay) {
        app.bp.app.settings.delay = delay
    });

});







/**
 * Created by matthew on 2/11/15.
 */
app.models = function () {
    function view() {
        var self = this;
        self.queue = app.ko.observableArray(app.bp.queue);


        self.removeFromQueue = function (company) {
            self.queue.remove(company)
        };
        self.start = function () {
            app.bp.go()
        };
        self.invokeCSVDownload = function () {
            app.results.invokeCSVDownload()
        };
        self.reset = function () {
            var go = confirm("This will clear all results and reset the extension. Proceed?");
            if (go) {
                chrome.runtime.reload();
            }
        };
        var companyParam = app.params['company'];
        var companyIDsParam = app.params['companyID'];

        self.emailDomain = app.ko.observable(companyParam.toLowerCase() + '.com');
        self.companyName = app.ko.observable(companyParam);
        self.companyIDs = app.ko.observable(companyIDsParam);
        self.titleFilter = app.ko.observable(null);
        self.skipEmailRetrieval = app.ko.observable(false);

        self.addToQueue = app.queue.add;

        self.delay = app.ko.observable(app.bp.app.settings.delay);

        self.appendQueue = function (item) {
            self.queue.push(item);
        }
    }

    return {
        view: view
    }
}();
/**
 * Created by matthew on 2/11/15.
 */
app.queue = function () {
    function add() {
        var company = {
            emailDomain: app.viewModel.emailDomain(),
            companyName: app.viewModel.companyName(),
            companyID: app.viewModel.companyIDs(),
            titleFilter: app.viewModel.titleFilter(),
            skipEmails: app.viewModel.skipEmailRetrieval()
        };
        company.id = company.companyName + company.companyID;

        var duplicate = false;

        $(app.bp.queue).each(function (index, item) {
            if (item.id == company.id) {
                alert('Company already in queue');
                duplicate = true;
                return false
            }
        });

        if (duplicate) {
            return false;
        }

        app.viewModel.appendQueue(company);
        app.modals.addToQueue.modal('hide');
    }

    function remove(company) {
    }

    return {
        add: add,
        remove: remove
    }
}();
/**
 * Created by matthew on 1/27/15.
 */
app.results = function () {
    function invokeCSVDownload() {
        var companies = app.bp.app.results;
        var csv = "FirstName,LastName,Title,Company,Email,Email Confirmed,Profile URL\n";

        $.each(companies, function (index, company) {
            $.each(company, function (index, person) {
                var dataString = [
                    person.name.first || '',
                    person.name.last || '',
                    person.currentPosition || "",
                    person.companyName,
                    person.email || '',
                    person.emailConfirmed,
                    person.profileLink
                ].map(function (item) {
                        return '"' + item + '"'
                    });

                dataString = dataString.join(',');
                //csv += index < companies[(companies.length-1)].length ? dataString + "\n" : dataString;
                csv += dataString + "\n"
            });
        });
        var name = '';
        $.each(companies, function (index, item) {
            name += item[0].companyName
        });
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        pom.setAttribute('download', name + 'Employees.csv');
        pom.click();
    }

    return {
        invokeCSVDownload: invokeCSVDownload
    }
}();