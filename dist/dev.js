(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const bot = require('bot');
const bot_console = require('console');
const ui = require('ui');
const storage = require('libraries/storage');
const ajax = require('libraries/ajax');
const api = require('libraries/blockheads');
const world = require('libraries/world');
const hook = require('libraries/hook');

// Array of IDs to autoload at the next launch.
var autoload = [];
var loaded = [];
const STORAGE_ID = 'mb_extensions';


/**
 * Used to create a new extension.
 *
 * @example
 * var test = MessageBotExtension('test');
 * @param {string} namespace - Should be the same as your variable name.
 * @return {MessageBotExtension} - The extension variable.
 */
function MessageBotExtension(namespace) {
    loaded.push(namespace);
    hook.fire('extension.install', namespace);

    var extension = {
        id: namespace,
        bot,
        console: bot_console,
        ui,
        storage,
        ajax,
        api,
        world,
        hook,
    };

    /**
     * Used to change whether or not the extension will be
     * Automatically loaded the next time the bot is launched.
     *
     * @example
     * var test = MessageBotExtension('test');
     * test.setAutoLaunch(true);
     * @param {bool} shouldAutoload
     */
    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        if (!autoload.includes(namespace) && shouldAutoload) {
            autoload.push(namespace);
            storage.set(STORAGE_ID, autoload, false);
        } else if (!shouldAutoload) {
            if (autoload.includes(namespace)) {
                autoload.splice(autoload.indexOf(namespace), 1);
                storage.set(STORAGE_ID, autoload, false);
            }
        }
    };

    return extension;
}

/**
 * Tries to load the requested extension by ID.
 *
 * @param {string} id
 */
MessageBotExtension.install = function install(id) {
    var el = document.createElement('script');
    el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;
    el.crossOrigin = 'anonymous';
    document.head.appendChild(el);
};

/**
 * Uninstalls an extension.
 *
 * @param {string} id
 */
MessageBotExtension.uninstall = function uninstall(id) {
    try {
        window[id].uninstall();
    } catch (e) {
        //Not installed, or no uninstall function.
    }

    window[id] = undefined;

    if (autoload.includes(id)) {
        autoload.splice(autoload.indexOf(id), 1);
        storage.set(STORAGE_ID, autoload, false);
    }

    if (loaded.includes(id)) {
        loaded.splice(loaded.indexOf(id), 1);
    }

    hook.fire('extension.uninstall', id);
};

/**
 * Used to check if an extension has been loaded.
 *
 * @param {string} id
 * @return {bool}
 */
MessageBotExtension.isLoaded = function isLoaded(id) {
    return loaded.includes(id);
};

// Load extensions that set themselves to autoload last launch.
storage.getObject(STORAGE_ID, [], false)
    .forEach(MessageBotExtension.install);

module.exports = MessageBotExtension;

},{"bot":3,"console":35,"libraries/ajax":8,"libraries/blockheads":10,"libraries/hook":11,"libraries/storage":12,"libraries/world":13,"ui":25}],2:[function(require,module,exports){
/**
 * @file Depricated. Use world.is[Group] instead.
 */

module.exports = {
    checkGroup
};

const world = require('libraries/world');


/**
 * Function used to check if users are in defined groups.
 *
 * @depricated
 * @example
 * checkGroup('admin', 'SERVER') // true
 * @param {string} group the group to check
 * @param {string} name the name of the user to check
 * @return {bool}
 */
function checkGroup(group, name) {
    console.warn('bot.checkGroup is depricated. Use world.isAdmin, world.isMod, etc. instead');

    name = name.toLocaleUpperCase();
    switch (group.toLocaleLowerCase()) {
        case 'all':
            return world.isPlayer(name);
        case 'admin':
            return world.isAdmin(name);
        case 'mod':
            return world.isMod(name);
        case 'staff':
            return world.isStaff(name);
        case 'owner':
            return world.isOwner(name);
        default:
            return false;
    }
}

},{"libraries/world":13}],3:[function(require,module,exports){
const storage = require('libraries/storage');

const bot = Object.assign(
    module.exports,
    require('./send'),
    require('./checkGroup')
);

bot.version = '6.1.0a';

/**
 * @depricated since 6.1.0. Use ex.world instead.
 */
bot.world = require('libraries/world');

storage.set('mb_version', bot.version);

},{"./checkGroup":2,"./send":5,"libraries/storage":12,"libraries/world":13}],4:[function(require,module,exports){
function update(keys, operator) {
    Object.keys(localStorage).forEach(item => {
        for (let key of keys) {
            if (item.startsWith(key)) {
                localStorage.setItem(item, operator(localStorage.getItem(item)));
                break;
            }
        }
    });
}

//jshint -W086
//No break statements as we want to execute all updates after matched version.
switch (localStorage.getItem('mb_version')) {
    case null:
        break; //Nothing to migrate
    case '5.2.0':
    case '5.2.1':
        //With 6.0, newlines are directly supported in messages by the bot.
        update(['announcementArr', 'joinArr', 'leaveArr', 'triggerArr'], function(raw) {
            try {
                var parsed = JSON.parse(raw);
                parsed.forEach(msg => {
                    if (msg.message) {
                        msg.message = msg.message.replace(/\\n/g, '\n');
                    }
                });
                return JSON.stringify(parsed);
            } catch(e) {
                return raw;
            }
        });
        break; //Next bugfix only relates to 6.0 bot.
    case '6.0.0a':
    case '6.0.0':
        setTimeout(function() {
            window.botui.alert("Due to a bug in the 6.0.0 version of the bot, your join and leave messages may be swapped. Sorry! This cannot be fixed automatically. This message will not be shown again.");
        }, 1000);
        break; //Next bugfix only relates to 6.0.1 / 6.0.2.
    case '6.0.1':
    case '6.0.2':
        setTimeout(function() {
            window.botui.alert("Due to a bug in 6.0.1 / 6.0.2, groups may have been mixed up on Join, Leave, and Trigger messages. Sorry! This cannot be fixed automatically if it occured on your bot. Announcements have also been fixed.");
        }, 1000);
    case '6.0.3':
    case '6.0.4':
    case '6.0.5':
}
//jshint +W086

},{}],5:[function(require,module,exports){
var api = require('libraries/blockheads');
var settings = require('settings');

var queue = [];

module.exports = {
    send,
};

/**
 * Function used to queue a message to be sent.
 *
 * @example
 * send('Hello!');
 * @param {string} message the message to be sent.
 */
function send(message) {
    if (settings.splitMessages) {
        //FIXME: If the backslash before the token is escaped by another backslash the token should still split the message.
        let str = message.split(settings.splitToken);
        let toSend = [];

        for (let i = 0; i < str.length; i++) {
            let curr = str[i];
            if (curr[curr.length - 1] == '\\' && i < str.length + 1) {
                curr += settings.splitToken + str[++i];
            }
            toSend.push(curr);
        }

        toSend.forEach(msg => queue.push(msg));
    } else {
        queue.push(message);
    }
}

/**
 * Watches the queue for new messages to send and sends them as soon as possible.
 */
(function checkQueue() {
    if (!queue.length) {
        setTimeout(checkQueue, 500);
        return;
    }

    api.send(queue.shift())
        .catch(console.error)
        .then(() => {
            setTimeout(checkQueue, 1000);
        });
}());

},{"libraries/blockheads":10,"settings":22}],6:[function(require,module,exports){
module.exports = {
    write,
    clear
};

function write(msg, name = '', nameClass = '') {
    var msgEl = document.createElement('li');
    if (nameClass) {
        msgEl.setAttribute('class', nameClass);
    }

    var nameEl = document.createElement('span');
    nameEl.textContent = name;

    var contentEl = document.createElement('span');
    if (name) {
        contentEl.textContent = `: ${msg}`;
    } else {
        contentEl.textContent = msg;
    }
    msgEl.appendChild(nameEl);
    msgEl.appendChild(contentEl);

    var chat = document.querySelector('#mb_console ul');
    chat.appendChild(msgEl);
}

function clear() {
    var chat = document.querySelector('#mb_console ul');
    chat.innerHTML = '';
}

},{}],7:[function(require,module,exports){
const bhfansapi = require('libraries/bhfansapi');
const ui = require('ui');
const hook = require('libraries/hook');
const MessageBotExtension = require('MessageBotExtension');


var tab = ui.addTab('Extensions');
tab.innerHTML = '<style>' +
    "#mb_extensions .top-right-button{width:inherit;padding:0 7px}#mb_extensions h3{margin:0 0 5px 0}#exts{display:flex;flex-flow:row wrap;border-top:1px solid #000}#exts h4,#exts p{margin:0}#exts button{position:absolute;bottom:7px;padding:4px 8px;border-radius:8px;background:#fff}#exts>div{position:relative;height:130px;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}#exts>div:nth-child(odd){background:#ccc}\n" +
    '</style>' +
    "<template id=\"extTemplate\">\r\n    <div>\r\n        <h4>Title</h4>\r\n        <span>Description</span><br>\r\n        <button class=\"button\">Install</button>\r\n    </div>\r\n</template>\r\n<div id=\"mb_extensions\" data-tab-name=\"extensions\">\r\n    <h3>Extensions can increase the functionality of the bot.</h3>\r\n    <span>Interested in creating one? <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/2.-Development:-Start-Here\" target=\"_blank\">Start here.</a></span>\r\n    <span class=\"top-right-button\">Load By ID/URL</span>\r\n    <div id=\"exts\"></div>\r\n</div>\r\n";

//Create the extension store page
bhfansapi.getStore().then(resp => {
    if (resp.status != 'ok') {
        document.getElementById('exts').innerHTML += resp.message;
        throw new Error(resp.message);
    }
    resp.extensions.forEach(extension => {
        ui.buildContentFromTemplate('#extTemplate', '#exts', [
            {selector: 'h4', text: extension.title},
            {selector: 'span', html: extension.snippet},
            {selector: 'div', 'data-id': extension.id},
            {selector: 'button', text: MessageBotExtension.isLoaded(extension.id) ? 'Remove' : 'Install'}
        ]);
    });
}).catch(bhfansapi.reportError);

// Install / uninstall extensions
document.querySelector('#exts')
    .addEventListener('click', function extActions(e) {
        if (e.target.tagName != 'BUTTON') {
            return;
        }
        var el = e.target;
        var id = el.parentElement.dataset.id;

        if (el.textContent == 'Install') {
            MessageBotExtension.install(id);
        } else {
            MessageBotExtension.uninstall(id);
        }
    });


hook.on('extension.install', function(id) {
    // Show remove to let users remove extensions
    var button = document.querySelector(`#mb_extensions [data-id="${id}"] button`);
    if (button) {
        button.textContent = 'Remove';
    }
});

hook.on('extension.uninstall', function(id) {
    // Show removed for store install button
    var button = document.querySelector(`#mb_extensions [data-id="${id}"] button`);
    if (button) {
        button.textContent = 'Removed';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Install';
            button.disabled = false;
        }, 3000);
    }
});

},{"MessageBotExtension":1,"libraries/bhfansapi":9,"libraries/hook":11,"ui":25}],8:[function(require,module,exports){
//TODO: Use fetch
/**
 * Function to GET a page. Passes the response of the XHR in the resolve promise.
 *
 * @example
 * //sends a GET request to /some/url.php?a=test
 * get('/some/url.php', {a: 'test'}).then(console.log)
 * @param {string} url
 * @param {object} paramsStr
 * @return {Promise}
 */
function get(url = '/', params = {}) {
    if (Object.keys(params).length) {
        var addition = urlStringify(params);
        if (url.includes('?')) {
            url += `&${addition}`;
        } else {
            url += `?${addition}`;
        }
    }

    return xhr('GET', url, {});
}


/**
 * Returns a JSON object in the promise resolve method.
 *
 * @param {string} url
 * @param {object} paramObj
 * @return {Promise}
 */
function getJSON(url = '/', paramObj = {}) {
    return get(url, paramObj).then(JSON.parse);
}


/**
 * Function to make a post request
 *
 * @param {string} url
 * @param {object} paramObj
 * @return {Promise}
 */
function post(url = '/', paramObj = {}) {
    return xhr('POST', url, paramObj);
}


/**
 * Function to fetch JSON from a page through post.
 *
 * @param string url
 * @param string paramObj
 * @return Promise
 */
function postJSON(url = '/', paramObj = {}) {
    return post(url, paramObj).then(JSON.parse);
}


/**
* Helper function to make XHR requests, if possible use the get and post functions instead.
*
* @depricated since version 6.1
* @param string protocol
* @param string url
* @param object paramObj -- WARNING. Only accepts shallow objects.
* @return Promise
*/
function xhr(protocol, url = '/', paramObj = {}) {
    var paramStr = urlStringify(paramObj);
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(protocol, url);
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (protocol == 'POST') {
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        req.onload = function() {
            if (req.status == 200) {
                resolve(req.response);
            } else {
                reject(new Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };
        if (paramStr) {
            req.send(paramStr);
        } else {
            req.send();
        }
    });
}


/**
 * Internal function used to stringify url parameters
 */
function urlStringify(obj) {
    return Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&');
}


module.exports = {xhr, get, getJSON, post, postJSON};

},{}],9:[function(require,module,exports){
/**
 * @file Contains functions to interact with blockheadsfans.com - cannot be used by extensions.
 */

const hook = require('libraries/hook');
const ajax = require('libraries/ajax');

const API_URLS = {
    STORE: '//blockheadsfans.com/messagebot/extension/store',
    NAME: '//blockheadsfans.com/messagebot/extension/name',
    ERROR: '//blockheadsfans.com/messagebot/bot/error',
};

var cache = {
    names: new Map(),
};

/**
 * Used to get public extensions
 *
 * @example
 * getStore().then(store => console.log(store));
 * @param {bool} [refresh=false] whether or not to use the cached response should be cleared.
 * @return {Promise} resolves with the response
 */
function getStore(refresh = false) {
    if (refresh || !cache.getStore) {
        cache.getStore = ajax.getJSON(API_URLS.STORE)
            .then(store => {
                //Build the initial names map
                if (store.status != 'ok') {
                    return store;
                }

                for (let ex of store.extensions) {
                    cache.names.set(ex.id, ex.title);
                }
                return store;
            });
    }

    return cache.getStore;
}


/**
 * Gets the name of the provided extension ID.
 * If the extension was not found, resolves with the original passed ID.
 *
 * @example
 * getExtensionName('test').then(name => console.log(name));
 * @param {string} id the id to search for.
 * @return {Promise} resolves with the extension name.
 */
function getExtensionName(id) {
    if (cache.names.has(id)) {
        return Promise.resolve(cache.names.get(id));
    }

    return ajax.postJSON(API_URLS.NAME, {id}).then(name => {
        cache.names.set(id, name);
        return name;
    }, err => {
        reportError(err);
        return id;
    });
}


/**
 * Reports an error so that it can be reviewed and fixed by extension or bot developers.
 *
 * @example
 * reportError(Error("Report me"));
 * @param {Error} err the error to report
 */
function reportError(err) {
    ajax.postJSON(API_URLS.ERROR, {
            error_text: err.message,
            error_file: err.filename,
            error_row: err.lineno || 0,
            error_column: err.colno || 0,
            error_stack: err.stack || '',
        })
        .then((resp) => {
            if (resp.status == 'ok') {
                hook.fire('error_report', 'Something went wrong, it has been reported.');
            } else {
                hook.fire('error_report', `Error reporting exception: ${resp.message}`);
            }
        })
        .catch(console.error);
}

module.exports = {
    getStore,
    getExtensionName,
    reportError,
};

},{"libraries/ajax":8,"libraries/hook":11}],10:[function(require,module,exports){
var ajax = require('./ajax');
var hook = require('./hook');
var bhfansapi = require('./bhfansapi');

const worldId = window.worldId;
var cache = {
    firstId: 0,
};

// Used to parse messages more accurately
var world = {
    name: '',
    online: []
};
getOnlinePlayers()
    .then(players => world.players = [...new Set(players.concat(world.players))]);

getWorldName()
    .then(name => world.name = name);


module.exports = {
    worldStarted,
    getLogs,
    getLists,
    getHomepage,
    getOnlinePlayers,
    getOwnerName,
    getWorldName,
    send,
};


/**
 * Resolves after starting the world if neccessary, rejects if the world takes too long to start or is unavailible
 * Refactoring welcome. This seems overly pyramid like.
 *
 * @example
 * worldStarted().then(() => console.log('started!'));
 * @param {bool} [refresh=false] whether or not to recheck if the world is started.
 * @return {Promise}
 */
function worldStarted(refresh = false) {
    if (refresh || !cache.worldStarted) {
        cache.worldStarted = new Promise(function (resolve, reject) {
            var fails = 0;
            (function check() {
                // Could this be more simplified?
                ajax.postJSON('/api', { command: 'status', worldId }).then(response => {
                    switch (response.worldStatus) {
                        case 'online':
                            return resolve();
                        case 'offline':
                            ajax.postJSON('/api', { command: 'start', worldId })
                                .then(check, check);
                            break;
                        case 'unavailible':
                            return reject(new Error('World unavailible.'));
                        case 'startup':
                        case 'shutdown':
                            setTimeout(check, 3000);
                            if (++fails > 10) {
                                return reject(new Error('World took too long to start.'));
                            }
                            break;
                        default:
                            return reject(new Error('Unknown response.'));
                    }
                }).catch(bhfansapi.reportError);
            }());
        });
    }

    return cache.worldStarted;
}


/**
 * Resolves with an array of the log's lines.
 *
 * @example
 * getLogs().then(lines => console.log(lines[0]));
 * @param {bool} [refresh=false] whether or not to redownload the logs
 * @return {Promise}
 */
function getLogs(refresh = false) {
    if (refresh || !cache.getLogs) {
        cache.getLogs = worldStarted()
            .then(() => ajax.get(`/worlds/logs/${worldId}`))
            .then(log => log.split('\n'));
    }

    return cache.getLogs;
}


/**
 * Resolves with a list of admins, mods, staff (admins + mods), whitelist, and blacklist.
 *
 * @example
 * getLists().then(lists => console.log(lists.admin));
 * @param {bool} [refresh=false] whether or not to refetch the lists.
 * @return {Promise}
 */
function getLists(refresh = false) {
    if (refresh || !cache.getLists) {
        cache.getLists = worldStarted()
            .then(() => ajax.get(`/worlds/lists/${worldId}`))
            .then(html => {
                var doc = (new DOMParser()).parseFromString(html, 'text/html');

                function getList(name) {
                    var list = doc.querySelector(`textarea[name=${name}]`)
                    .value
                    .toLocaleUpperCase()
                    .split('\n');
                    return [...new Set(list)]; //Remove duplicates
                }

                var lists = {
                    admin: getList('admins'),
                    mod: getList('modlist'),
                    white: getList('whitelist'),
                    black: getList('blacklist'),
                };
                lists.mod = lists.mod.filter(name => !lists.admin.includes(name));
                lists.staff = lists.admin.concat(lists.mod);

                return lists;
            });
    }

    return cache.getLists;
}


/**
 * Resolves with the homepage of the server.
 *
 * @example
 * getHomepage().then(html => console.log(html.substring(0, 100)));
 * @param {bool} [refresh=false] whether or not to refetch the page.
 * @return {Promise}
 */
function getHomepage(refresh = false) {
    if (refresh || !cache.getHomepage) {
        cache.getHomepage = ajax.get(`/worlds/${worldId}`)
            .catch(() => getHomepage(true));
    }

    return cache.getHomepage;
}


/**
 * Resolves with an array of player names.
 * An online list is maintained by the bot, this should generally not be used.
 *
 * @example
 * getOnlinePlayers().then(online => { for (let n of online) { console.log(n, 'is online!')}});
 * @param {bool} [refresh=false] whether or not to refresh the online names.
 * @return {Promise}
 */
function getOnlinePlayers(refresh = false) {
    if (refresh || !cache.getOnlinePlayers) {
        cache.getOnlinePlayers = getHomepage(true)
            .then((html) => {
                var doc = (new DOMParser()).parseFromString(html, 'text/html');
                var playerElems = doc.querySelector('.manager.padded:nth-child(1)')
                    .querySelectorAll('tr:not(.history) > td.left');
                var players = [];

                Array.from(playerElems).forEach((el) => {
                    players.push(el.textContent.toLocaleUpperCase());
                });

                return players;
            });
    }

    return cache.getOnlinePlayers;
}


/**
 * Resolves with the server owner's name.
 *
 * @example
 * getOwnerName().then(name => console.log('World is owned by', name));
 * @return {Promise}
 */
function getOwnerName() {
    return getHomepage().then(html => {
        var doc = (new DOMParser()).parseFromString(html, 'text/html');
        return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
    });
}

/**
 * Resolves with the world's name.
 *
 * @example
 * getWorldName().then(name => console.log('World name:', name));
 * @return {Promise}
 */
function getWorldName() {
    return getHomepage().then(html => {
        var doc = (new DOMParser()).parseFromString(html, 'text/html');
        return doc.querySelector('#title').textContent.toLocaleUpperCase();
    });
}

/**
 * Sends a message, returns a promise that resolves when the message has been sent or rejects on failure.
 *
 * @example
 * send('hello!').then(() => console.log('sent')).catch(console.error);
 * @param {string} message the message to send.
 * @return {Promise}
 */
function send(message) {
    return ajax.postJSON(`/api`, {command: 'send', message, worldId})
        .then(resp => {
            if (resp.status != 'ok') {
                throw new Error(resp.message);
            }
            return resp;
        })
        .then(resp => {
            //Handle hooks
            hook.fire('world.send', message);
            hook.fire('world.servermessage', message);

            //Disallow commands starting with space.
            if (message.startsWith('/') && !message.startsWith('/ ')) {
                let command = message.substr(1);

                let args = '';
                if (command.includes(' ')) {
                    command = command.substring(0, command.indexOf(' '));
                    args = message.substring(message.indexOf(' ') + 1);
                }
                hook.check('world.command', 'SERVER', command, args);
            }

            return resp;
        }).catch(err => {
            if (err == 'World not running.') {
                cache.firstId = 0;
            }
            throw err;
        });
}


/**
 * Internal function to watch chat.
 */
function checkChat() {
    getMessages().then((msgs) => {
        msgs.forEach((message) => {
            if (message.startsWith(`${world.name} - Player Connected `)) {
                let [, name, ip] = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
                handleJoinMessages(name, ip);

            } else if (message.startsWith(`${world.name} - Player Disconnected `)) {
                let name = message.substring(world.name.length + 23);
                handleLeaveMessages(name);

            } else if (message.includes(': ')) {
                let name = getUsername(message);
                let msg = message.substring(name.length + 2);
                handleUserMessages(name, msg);

            } else {
                handleOtherMessages(message);

            }
        });
    })
    .catch(bhfansapi.reportError)
    .then(() => {
        setTimeout(checkChat, 5000);
    });
}
checkChat();


/**
 * Internal function to get the latest chat messages.
 *
 * @return {Promise}
 */
function getMessages() {
    return worldStarted()
        .then(() => ajax.postJSON(`/api`, { command: 'getchat', worldId, firstId: cache.firstId }))
        .then(data => {
            if (data.status == 'ok' && data.nextId != cache.firstId) {
                cache.firstId = data.nextId;
                return data.log;
            } else if (data.status == 'error') {
                throw new Error(data.message);
            }

            return [];
        });
}


/**
 * Internal function to figure out who sent a message.
 *
 * @example
 * var name = getUsername('SERVER: Hi there!');
 * //name == 'SERVER'
 * @param {string} message the message to parse.
 * @return {string} the name of the user who sent the message.
 */
function getUsername(message) {
    for (let i = 18; i > 4; i--) {
        let possibleName = message.substring(0, message.lastIndexOf(': ', i));
        if (world.online.includes(possibleName) || possibleName == 'SERVER') {
            return possibleName;
        }
    }
    // Should ideally never happen.
    return message.substring(0, message.lastIndexOf(': ', 18));
}


/**
 * Internal function to handle player joins.
 *
 * @param {string} name the name of the player joining.
 * @param {string} ip the ip of the player joining.
 */
function handleJoinMessages(name, ip) {
    if (!world.online.includes(name)) {
        world.online.push(name);
    }

    hook.check('world.join', name, ip);
}

/**
 * Internal function to handle player disconnections.
 *
 * @param {string} name the name of the player leaving.
 */
function handleLeaveMessages(name) {
    if (world.online.includes(name)) {
        world.online.splice(world.online.indexOf(name), 1);
        hook.check('world.leave', name);
    }
}


/**
 * Internal function to handle user chat
 *
 * @param {string} name the name of the user.
 * @param {string} message the message sent.
 */
function handleUserMessages(name, message) {
    if (name == 'SERVER') {
        hook.check('world.serverchat', message);
        return;
    }

    hook.check('world.message', name, message);

    if (message.startsWith('/') && !message.startsWith('/ ')) {

        let command = message.substr(1);

        let args = '';
        if (command.includes(' ')) {
            command = command.substring(0, command.indexOf(' '));
            args = message.substring(message.indexOf(' ') + 1);
        }
        hook.check('world.command', name, command, args);
        return; //not chat
    }

    hook.check('world.chat', name, message);
}


/**
 * Internal function used to handle messages which are not simply parsed.
 *
 * @param {string} message the message to handle
 */
function handleOtherMessages(message) {
    hook.check('world.other', message);
}

},{"./ajax":8,"./bhfansapi":9,"./hook":11}],11:[function(require,module,exports){
var listeners = {};

/**
 * Function used to begin listening to an event.
 *
 * @example
 * listen('event', console.log);
 * //alternatively
 * on('event', console.log);
 * @param {string} key the event to listen to.
 * @param {Function} callback the event handler
 */
function listen(key, callback) {
    if (typeof callback != 'function') {
        throw new Error('callback must be a function.');
    }

    key = key.toLocaleLowerCase();
    if (!listeners[key]) {
        listeners[key] = [];
    }

    if (!listeners[key].includes(callback)) {
        listeners[key].push(callback);
    }
}


/**
 * Function used to stop listening to an event. If the listener was not found, no action will be taken.
 *
 * @example
 * //Earlier attached myFunc to 'event'
 * remove('event', myFunc);
 * @param {string} key the event to stop listening to.
 * @param {Function} callback the callback to remove from the event listeners.
 */
function remove(key, callback) {
    key = key.toLocaleLowerCase();
    if (listeners[key]) {
        if (listeners[key].includes(callback)) {
            listeners[key].splice(listeners[key].indexOf(callback), 1);
        }
    }
}


/**
 * Function used to call events.
 *
 * @example
 * check('test', 1, 2, 3);
 * check('test', true);
 * // alternatively
 * fire('test', 1, 2, 3);
 * fire('test', true);
 * @param {string} key the event to call.
 * @param {mixed} args any arguments to pass to listening functions.
 */
function check(key, ...args) {
    key = key.toLocaleLowerCase();
    if (!listeners[key]) {
        return;
    }

    listeners[key].forEach(function(listener) {
        try {
            listener(...args);
        } catch (e) {
            if (key != 'error') {
                check('error', e);
            }
        }
    });
}


/**
 * Function used to update a value based on input from listeners.
 *
 * @depricated since 6.1.0. Instead, update requests should be handled by the extension iteself.
 *
 * @example
 * update('event', true, 1, 2, 3);
 * @param {string} key the event to call
 * @param {mixed} initial the initial value to be passed to listeners.
 * @param {mixed} args any additional arguments to be passed to listeners.
 * @return {mixed}
 */
function update(key, initial, ...args) {
    key = key.toLocaleLowerCase();
    if (!listeners[key]) {
        return initial;
    }

    return listeners[key].reduce(function(previous, current) {
        try {
            var result = current(previous, ...args);
            if (typeof result != 'undefined') {
                return result;
            }
            return previous;
        } catch(e) {
            if (key != 'error') {
                check('error', e);
            }
            return previous;
        }
    }, initial);
}

module.exports = {
    listen,
    on: listen,
    remove,
    check,
    fire: check,
    update,
};

},{}],12:[function(require,module,exports){
module.exports = {
    getString,
    getObject,
    set,
    clearNamespace,
};

//REVIEW: Is there a better way to do this? require('./config') maybe?
const NAMESPACE = window.worldId;

/**
 * Gets a string from the storage if it exists and returns it, otherwise returns fallback.
 *
 * @example
 * var x = getString('stored_prefs', 'nothing');
 * var y = getString('stored_prefs', 'nothing', false);
 *
 * @param {string} key the key to retrieve.
 * @param {mixed} fallback what to return if the key was not found.
 * @param {bool} [local=true] whether or not to use a namespace when checking for the key.
 * @return {mixed}
 */
function getString(key, fallback, local = true) {
    var result;
    if (local) {
        result = localStorage.getItem(`${key}${NAMESPACE}`);
    } else {
        result = localStorage.getItem(key);
    }

    return (result === null) ? fallback : result;
}

/**
 * Gets a stored object if it exists, otherwise returns fallback.
 *
 * @example
 * var x = getObject('stored_key', [1, 2, 3]);
 *
 * @param {string} key the item to retrieve.
 * @param {mixed} fallback what to return if the item does not exist or fails to parse correctly.
 * @param {bool} [local=true] whether or not a namespace should be used.
 * @return {mixed}
 */
function getObject(key, fallback, local = true) {
    var result = getString(key, false, local);

    if (!result) {
        return fallback;
    }

    try {
        result = JSON.parse(result);
    } catch(e) {
        result = fallback;
    } finally {
        if (result === null) {
            result = fallback;
        }
    }

    return result;
}

/**
 * Sets an object in the storage, stringifying it first if neccessary.
 *
 * @example
 * set('some_key', {a: [1, 2, 3], b: 'test'});
 * //returns '{"a":[1,2,3],"b":"test"}'
 * getString('some_key');
 * @param {string} key the item to overwrite or create.
 * @param {mixed} data any stringifyable type.
 * @param {bool} [local=true] whether to save the item with a namespace.
 */
function set(key, data, local = true) {
    if (local) {
        key = `${key}${NAMESPACE}`;
    }

    if (typeof data == 'string') {
        localStorage.setItem(key, data);
    } else {
        localStorage.setItem(key, JSON.stringify(data));
    }
}

/**
 * Removes all items starting with namespace from the storage.
 *
 * @example
 * set('key_test', 1);
 * set('key_test2', 2);
 * clearNamespace('key_'); //both key_test and key_test2 have been removed.
 *
 * @param {string} namespace the prefix to check for when removing items.
 */
function clearNamespace(namespace) {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(namespace)) {
            localStorage.removeItem(key);
        }
    });
}

},{}],13:[function(require,module,exports){
const api = require('./blockheads');
const storage = require('./storage');
const hook = require('./hook');

const STORAGE = {
    PLAYERS: 'mb_players',
    LOG_LOAD: 'mb_lastLogLoad',
};

var world = module.exports = {
    name: '',
    online: [],
    owner: '',
    players: storage.getObject(STORAGE.PLAYERS, {}),
    lists: {admin: [], mod: [], staff: [], black: [], white: []},
    isPlayer,
    isServer,
    isOwner,
    isAdmin,
    isStaff,
    isMod,
    isOnline,
    getJoins,
};
var lists = world.lists;

/**
 * Checks if a player has joined the server.
 *
 * @param {string} name
 * @return {bool}
 */
function isPlayer(name) {
    return world.players.hasOwnProperty(name.toLocaleUpperCase());
}

/**
 * Checks if the player is the server
 *
 * @param {string} name
 * @return {bool}
 */
function isServer(name) {
    return name.toLocaleUpperCase() == 'SERVER';
}

/**
 * Checks if the player is the owner or server.
 *
 * @param {string} name
 * @return {bool}
 */
function isOwner(name) {
    return world.owner == name.toLocaleUpperCase() || isServer(name);
}

/**
 * Checks if the player is an admin
 *
 * @param {string} name
 * @return {bool}
 */
function isAdmin(name) {
    return lists.admin.includes(name.toLocaleUpperCase()) || isOwner(name);
}

/**
 * Checks if the player is a mod
 *
 * @param {string} name
 * @return {bool}
 */
function isMod(name) {
    return lists.mod.includes(name.toLocaleUpperCase());
}

/**
 * Checks if the player is a staff member.
 *
 * @param {string} name
 * @return {bool}
 */
function isStaff(name) {
    return isAdmin(name) || isMod(name);
}

/**
 * Checks if a player is online
 *
 * @param {string} name
 * @return {bool}
 */
function isOnline(name) {
    return world.online.includes(name.toLocaleUpperCase());
}

/**
 * Gets the number of times the player has joined the server.
 *
 * @param {string} name
 * @return {Number}
 */
function getJoins(name) {
    return isPlayer(name) ? world.players[name.toLocaleUpperCase()].joins : 0;
}

// Keep the online list up to date
hook.on('world.join', function(name) {
    if (!world.online.includes(name)) {
        world.online.push(name);
    }
});
hook.on('world.leave', function(name) {
    if (world.online.includes(name)) {
        world.online.splice(world.online.indexOf(name), 1);
    }
});

// Keep players list up to date
hook.on('world.join', checkPlayerJoin);

/**
 * Internal function.
 * Removes admins from the mod list and creates the staff list.
 */
function buildStaffList() {
    lists.mod = lists.mod.filter((name) => !lists.admin.includes(name) && name != 'SERVER' && name != world.owner);
    lists.staff = lists.admin.concat(lists.mod);
}

/**
 * Internal function.
 * Checks if a player has permission to perform a command
 *
 * @param {string} name
 * @param {string} command
 */
function permissionCheck(name, command) {
    command = command.toLocaleLowerCase();

    if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {
        return isAdmin(name);
    }

    if (['whitelist', 'unwhitelist', 'ban', 'unban'].includes(command)) {
        return isStaff(name);
    }

    return false;
}

// Keep lists up to date
hook.on('world.command', function(name, command, target) {
    if (!permissionCheck(name, command)) {
        return;
    }

    var un = command.startsWith('un');

    var group = {
        admin: 'admin',
        mod: 'mod',
        whitelist: 'white',
        ban: 'black',
    }[un ? command.substr(2) : command];

    if (un && lists[group].includes(target)) {
        lists[group].splice(lists[group].indexOf(target), 1);
        buildStaffList();
    } else if (!un && !lists[group].includes(target)) {
        lists[group].push(target);
        buildStaffList();
    }
});

/**
 * Internal function. Increments a player's joins.
 *
 * @param {string} name
 * @param {string} ip
 */
function checkPlayerJoin(name, ip) {
    if (world.players.hasOwnProperty(name)) {
        //Returning player
        world.players[name].joins++;
        if (!world.players[name].ips.includes(ip)) {
            world.players[name].ips.push(ip);
        }
    } else {
        //New player
        world.players[name] = {joins: 1, ips: [ip]};
    }
    world.players[name].ip = ip;

    // Otherwise, we will double parse joins
    storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));
    storage.set(STORAGE.PLAYERS, world.players);
}


// Update lists
Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])
    .then((values) => {
        var [apiLists, worldName, owner] = values;

        world.lists = apiLists;
        buildStaffList();
        world.name = worldName;
        world.owner = owner;
    })
    .catch(console.error);

// Update players since last bot load
Promise.all([api.getLogs(), api.getWorldName()])
    .then((values) => {
        var [lines, worldName] = values;

        var last = storage.getObject(STORAGE.LOG_LOAD, 0);
        storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));

        for (let line of lines) {
            let time = new Date(line.substring(0, line.indexOf('b')).replace(' ', 'T').replace(' ', 'Z'));
            let message = line.substring(line.indexOf(']') + 2);

            if (time < last) {
                continue;
            }

            if (message.startsWith(`${worldName} - Player Connected `)) {
                let parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID
                let [, name, ip] = parts.match(/(.*) \| ([\w.]+) \| .{32}\s*/);

                checkPlayerJoin(name, ip);
            }
        }

        storage.set(STORAGE.PLAYERS, world.players);
    });

},{"./blockheads":10,"./hook":11,"./storage":12}],14:[function(require,module,exports){
const ui = require('ui');
const storage = require('libraries/storage');
const send = require('bot').send;
const preferences = require('settings');


var tab = ui.addTab('Announcements', 'messages');
tab.innerHTML = "<template id=\"aTemplate\">\r\n    <div>\r\n        <label>Send:</label>\r\n        <textarea class=\"m\"></textarea>\r\n        <a>Delete</a>\r\n        <label style=\"display:block;margin-top:5px;\">Wait X minutes...</label>\r\n    </div>\r\n</template>\r\n<div id=\"mb_announcements\">\r\n    <h3>These are sent according to a regular schedule.</h3>\r\n    <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"aMsgs\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => announcementCheck(0),
};

function addMessage(text = '') {
    ui.buildContentFromTemplate('#aTemplate', '#aMsgs', [
        {selector: '.m', text: text}
    ]);
}

function save() {
    announcements = Array.from(tab.querySelectorAll('.m'))
        .map(el => {
            return {message: el.value};
        });

    storage.set('announcementArr', announcements);
}

// Announcements collection
var announcements = storage.getObject('announcementArr', []);

// Show saved announcements
announcements
    .map(ann => ann.message)
    .forEach(addMessage);


// Sends announcements after the specified delay.
function announcementCheck(i) {
    i = (i >= announcements.length) ? 0 : i;

    var ann = announcements[i];

    if (ann && ann.message) {
        send(ann.message);
    }
    setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
}

},{"bot":3,"libraries/storage":12,"settings":22,"ui":25}],15:[function(require,module,exports){
module.exports = {
    buildAndSendMessage,
    buildMessage,
};

const world = require('libraries/world');
const send = require('bot').send;

function buildAndSendMessage(message, name) {
    send(buildMessage(message, name));
}

function buildMessage(message, name) {
    message = message.replace(/{{([^}]+)}}/g, function(full, key) {
        return {
            NAME: name,
            Name: name[0] + name.substring(1).toLocaleLowerCase(),
            name: name.toLocaleLowerCase()
        }[key] || full;
    });

    if (message.startsWith('/')) {
        message = message.replace(/{{ip}}/gi, world.players.getIP(name));
    }

    return message;
}

},{"bot":3,"libraries/world":13}],16:[function(require,module,exports){
module.exports = {
    checkJoinsAndGroup,
    checkJoins,
    checkGroup,
};

const world = require('libraries/world');


function checkJoinsAndGroup(name, msg) {
    return checkJoins(name, msg.joins_low, msg.joins_high) && checkGroup(name, msg.group, msg.not_group);
}

function checkJoins(name, low, high) {
    return world.getJoins(name) >= low && world.getJoins(name) <= high;
}

function checkGroup(name, group, not_group) {
    return isInGroup(name, group) && !isInGroup(name, not_group);
}

function isInGroup(name, group) {
    name = name.toLocaleUpperCase();
    switch (group.toLocaleLowerCase()) {
        case 'all':
            return world.isPlayer(name);
        case 'admin':
            return world.isAdmin(name);
        case 'mod':
            return world.isMod(name);
        case 'staff':
            return world.isStaff(name);
        case 'owner':
            return world.isOwner(name);
        default:
            return false;
    }
}

},{"libraries/world":13}],17:[function(require,module,exports){
Object.assign(
    module.exports,
    require('./buildMessage'),
    require('./checkJoinsAndGroup')
);

},{"./buildMessage":15,"./checkJoinsAndGroup":16}],18:[function(require,module,exports){
const ui = require('ui');


var el = document.createElement('style');
el.innerHTML = "#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#jMsgs,#lMsgs,#tMsgs{position:relative;display:flex;flex-flow:row wrap;border-top:1px solid #000}#jMsgs>div,#lMsgs>div,#tMsgs>div{width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}#jMsgs>div:nth-child(odd),#lMsgs>div:nth-child(odd),#tMsgs>div:nth-child(odd){background:#ccc}\n";
document.head.appendChild(el);

ui.addTabGroup('Messages', 'messages');

[
    require('./join'),
    require('./leave'),
    require('./trigger'),
    require('./announcements')
].forEach(type => {
    type.tab.addEventListener('click', function checkDelete(event) {
        if (event.target.tagName != 'A') {
            return;
        }

        ui.alert('Really delete this message?', [
            {text: 'Yes', style: 'danger', action: function() {
                event.target.parentNode.remove();
                type.save();
            }},
            {text: 'Cancel'}
        ]);
    });

    type.tab.addEventListener('change', type.save);

    type.tab.querySelector('.top-right-button')
        .addEventListener('click', () => type.addMessage());

    // Don't start responding to chat for 10 seconds
    setTimeout(type.start, 10000);
});

},{"./announcements":14,"./join":19,"./leave":20,"./trigger":21,"ui":25}],19:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');


const STORAGE_ID = 'joinArr';

var tab = ui.addTab('Join', 'messages');
tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div>\r\n        <label> Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" data-tab-name=\"join\">\r\n    <h3>These are checked when a player joins the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"jMsgs\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.join', onJoin),
};

var joinMessages = storage.getObject(STORAGE_ID, []);
joinMessages.forEach(addMessage);

/**
 * Function to add a trigger message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#jTemplate', '#jMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'All'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'Nobody'}"]`, selected: 'selected'}
    ]);
}

/**
 * Function used to save the user's messages.
 */
function save() {
    joinMessages = [];
    Array.from(tab.querySelectorAll('#jMsgs > div')).forEach(container => {
        if (!container.querySelector('.m').value) {
            return;
        }

        joinMessages.push({
            message: container.querySelector('.m').value,
            joins_low: +container.querySelector('[data-target="joins_low"]').value,
            joins_high: +container.querySelector('[data-target="joins_high"]').value,
            group: container.querySelector('[data-target="group"]').value,
            not_group: container.querySelector('[data-target="not_group"]').value,
        });
    });

    storage.set(STORAGE_ID, joinMessages);
}

/**
 * Function used to listen to player joins
 *
 * @param {string} name
 */
function onJoin(name) {
    joinMessages.forEach(msg => {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"ui":25}],20:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');


const STORAGE_ID = 'leaveArr';

var tab = ui.addTab('Leave', 'messages');
tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div>\r\n        <label>Message <textarea class=\"m\"></textarea></label>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\">\r\n    <h3>These are checked when a player leaves the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"lMsgs\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.leave', onLeave),
};

var leaveMessages = storage.getObject(STORAGE_ID, []);
leaveMessages.forEach(addMessage);

/**
 * Adds a leave message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#lTemplate', '#lMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'All'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'Nobody'}"]`, selected: 'selected'}
    ]);
}

/**
 * Function used to save the current leave messages
 */
function save() {
    leaveMessages = [];
    Array.from(tab.querySelectorAll('#lMsgs > div')).forEach(container => {
        if (!container.querySelector('.m').value) {
            return;
        }

        leaveMessages.push({
            message: container.querySelector('.m').value,
            joins_low: +container.querySelector('[data-target="joins_low"]').value,
            joins_high: +container.querySelector('[data-target="joins_high"]').value,
            group: container.querySelector('[data-target="group"]').value,
            not_group: container.querySelector('[data-target="not_group"]').value,
        });
    });

    storage.set(STORAGE_ID, leaveMessages);
}

/**
 * Function used to listen to player disconnections.
 *
 * @param {string} name the player leaving.
 */
function onLeave(name) {
    leaveMessages.forEach(msg => {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"ui":25}],21:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');
const settings = require('settings');


const STORAGE_ID = 'triggerArr';

var tab = ui.addTab('Trigger', 'messages');
tab.innerHTML = "<template id=\"tTemplate\">\r\n    <div>\r\n        <label>Trigger: <input class=\"t\"></label>\r\n        <label>Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_trigger\">\r\n    <h3>These are checked whenever someone says something.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"tMsgs\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.message', checkTriggers),
};

var triggerMessages = storage.getObject(STORAGE_ID, []);
triggerMessages.forEach(addMessage);

/**
 * Adds a trigger message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#tTemplate', '#tMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '.t', value: msg.trigger || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'All'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'Nobody'}"]`, selected: 'selected'}
    ]);
}

/**
 * Saves the current trigger messages.
 */
function save() {
    triggerMessages = [];
    Array.from(tab.querySelectorAll('#tMsgs > div')).forEach(container => {
        if (!container.querySelector('.m').value || !container.querySelector('.t').value) {
            return;
        }

        triggerMessages.push({
            message: container.querySelector('.m').value,
            trigger: container.querySelector('.t').value,
            joins_low: +container.querySelector('[data-target="joins_low"]').value,
            joins_high: +container.querySelector('[data-target="joins_high"]').value,
            group: container.querySelector('[data-target="group"]').value,
            not_group: container.querySelector('[data-target="not_group"]').value,
        });
    });

    storage.set(STORAGE_ID, triggerMessages);
}

/**
 * Checks a trigger against a message to see if it matches.
 *
 * @param {string} trigger the trigger to try to match
 * @param {string} message
 */
function triggerMatch(trigger, message) {
    if (settings.regexTriggers) {
        try {
            return new RegExp(trigger, 'i').test(message);
        } catch (e) {
            ui.notify(`Skipping trigger '${trigger}' as the RegEx is invaild.`);
            return false;
        }
    }
    return new RegExp(
            trigger
                .replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1")
                .replace(/\*/g, ".*"),
            'i'
        ).test(message);
}

/**
 * Function used to check incoming player messages for triggers
 *
 * @param {string} name the player's name
 * @param {string} message
 */
function checkTriggers(name, message) {
    var totalAllowed = settings.maxResponses;
    triggerMessages.forEach(msg => {
        if (totalAllowed && helpers.checkJoinsAndGroup(name, msg) && triggerMatch(msg.trigger, message)) {
            helpers.buildAndSendMessage(msg.message, name);
            totalAllowed--;
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"settings":22,"ui":25}],22:[function(require,module,exports){
const storage = require('libraries/storage');
const STORAGE_ID = 'mb_preferences';

var prefs = storage.getObject(STORAGE_ID, {}, false);

// Auto save on change
// IE (all) / Safari (< 10) doesn't support proxies
if (typeof Proxy == 'undefined') {
    module.exports = prefs;
    setInterval(function() {
        storage.set(STORAGE_ID, prefs, false);
    }, 30 * 1000);
} else {
    module.exports = new Proxy(prefs, {
        set: function(obj, prop, val) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = val;
                storage.set(STORAGE_ID, prefs, false);
                return true;
            }
            return false;
        }
    });
}

var prefsMap = [
    {type: 'number', key: 'announcementDelay', default: 10},
    {type: 'number', key: 'maxResponses', default: 2},
    {type: 'boolean', key: 'notify', default: true},
    // Advanced
    {type: 'boolean', key: 'disableTrim', default: false},
    {type: 'boolean', key: 'regexTriggers', default: false},
    {type: 'boolean', key: 'splitMessages', default: false},
    {type: 'text', key: 'splitToken', default: '<split>'},
];

prefsMap.forEach(pref => {
    // Set defaults if not set
    if (typeof prefs[pref.key] !=  pref.type) {
        prefs[pref.key] = pref.default;
    }
});

},{"libraries/storage":12}],23:[function(require,module,exports){
const ui = require('ui');
const prefs = require('settings');


var tab = ui.addTab('Settings');
tab.innerHTML = '<style>' +
    "#mb_settings h3{border-bottom:1px solid #999}\n" +
    '</style>' +
    "<div id=\"mb_settings\">\r\n    <h3>Settings</h3>\r\n    <label>Minutes between announcements:</label><br>\r\n        <input data-key=\"announcementDelay\" type=\"number\"><br>\r\n    <label>Maximum trigger responses to a message:</label><br>\r\n        <input data-key=\"maxResponses\" type=\"number\"><br>\r\n    <label>New chat notifications: </label>\r\n        <input data-key=\"notify\" type=\"checkbox\"><br>\r\n\r\n    <h3>Advanced Settings - <small><a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/1.-Advanced-Options/\" target=\"_blank\">Read this first</a></small></h3>\r\n    <label>Disable whitespace trimming: </label>\r\n        <input data-key=\"disableTrim\" type=\"checkbox\"><br>\r\n    <label>Parse triggers as RegEx: </label>\r\n        <input data-key=\"regexTriggers\" type=\"checkbox\"><br>\r\n    <label>Split messages: </label>\r\n        <input data-key=\"splitMessages\" type=\"checkbox\"><br>\r\n    <label>Split token: </label><br>\r\n        <input data-key=\"splitToken\" type=\"text\">\r\n\r\n    <h3>Backup / Restore</h3>\r\n    <a id=\"mb_backup_save\">Get backup code</a><br>\r\n    <a id=\"mb_backup_load\">Load previous backup</a>\r\n    <div id=\"mb_backup\"></div>\r\n</div>\r\n";

// Show prefs
Object.keys(prefs).forEach(key => {
    var el = tab.querySelector(`[data-key="${key}"]`);
    switch (typeof prefs[key]) {
        case 'boolean':
            el.checked = prefs[key];
            break;
        default:
            el.value = prefs[key];
    }
});


// Watch for changes
tab.addEventListener('change', function save() {
    var getValue = (key) => tab.querySelector(`[data-key="${key}"]`).value;
    var getInt = (key) => +getValue(key);
    var getChecked = (key) => tab.querySelector(`[data-key="${key}"]`).checked;

    Object.keys(prefs).forEach(key => {
        var func;

        switch(typeof prefs[key]) {
            case 'boolean':
                func = getChecked;
                break;
            case 'number':
                func = getInt;
                break;
            default:
                func = getValue;
        }

        prefs[key] = func(key);
    });
});


// Get backup
tab.querySelector('#mb_backup_save').addEventListener('click', function showBackup() {
    var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
    ui.alert(`Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">${backup}</textarea>`);
});


// Load backup
tab.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
    ui.alert('Enter the backup code:<textarea style="width:calc(100% - 7px);height:160px;"></textarea>',
                [
                    { text: 'Load & refresh page', style: 'success', action: function() {
                        var code = document.querySelector('#alert textarea').value;
                        try {
                            code = JSON.parse(code);
                            if (code === null) {
                                throw new Error('Invalid backup');
                            }
                        } catch (e) {
                            ui.notify('Invalid backup code. No action taken.');
                            return;
                        }

                        localStorage.clear();

                        Object.keys(code).forEach((key) => {
                            localStorage.setItem(key, code[key]);
                        });

                        location.reload();
                    } },
                    { text: 'Cancel' }
                ]);
});

},{"settings":22,"ui":25}],24:[function(require,module,exports){
// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
// Style reset
document.querySelectorAll('[type="text/css"]')
    .forEach(el => el.remove());

document.querySelector('title').textContent = 'Console - MessageBot';

// Set the icon to the blockhead icon used on the forums
var el = document.createElement('link');
el.rel = 'icon';
el.href = 'https://is.gd/MBvUHF';
document.head.appendChild(el);

require('ui/polyfills/console');
require('bot/migration');

// Expose the extension API
window.MessageBotExtension = require('MessageBotExtension');

const bhfansapi = require('libraries/bhfansapi');
const hook = require('libraries/hook');
const ui = require('ui');
hook.on('error_report', function(msg) {
    ui.notify(msg);
});


require('console');
// By default no tab is selected, show the console.
document.querySelector('#leftNav span').click();
require('messages');
require('extensions');
require('settings/page');

// Error reporting
window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        bhfansapi.reportError(err);
    }
});

},{"MessageBotExtension":1,"bot/migration":4,"console":35,"extensions":7,"libraries/bhfansapi":9,"libraries/hook":11,"messages":18,"settings/page":23,"ui":25,"ui/polyfills/console":30}],25:[function(require,module,exports){
require('./polyfills/details');

// Build the API
Object.assign(
    module.exports,
    require('./layout'),
    require('./template'),
    require('./notifications')
);

// Functions which are no longer contained in this module, but are retained for now for backward compatability.
const write = require('console/exports').write;
module.exports.addMessageToConsole = function(msg, name = '', nameClass = '') {
    console.warn('ui.addMessageToConsole has been depricated. Use ex.console.write instead.');
    write(msg, name, nameClass);
};

},{"./layout":26,"./notifications":28,"./polyfills/details":31,"./template":33,"console/exports":6}],26:[function(require,module,exports){
/**
 * @file Contains functions for managing the page layout
 */



// Build page - only case in which body.innerHTML should be used.
document.body.innerHTML += "<div id=\"leftNav\">\r\n    <input type=\"checkbox\" id=\"leftToggle\">\r\n    <label for=\"leftToggle\">&#9776; Menu</label>\r\n\r\n    <nav data-tab-group=\"main\"></nav>\r\n    <div class=\"overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\">\r\n    <header></header>\r\n</div>\r\n";
document.head.innerHTML += '<style>' + "html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}header{background:#182b73 url(\"http://portal.theblockheads.net/static/images/portalHeader.png\") no-repeat;background-position:80px;height:80px}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}.top-right-button{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}\n" + '</style>';

// Hide the menu when clicking the overlay
document.querySelector('#leftNav .overlay').addEventListener('click', toggleMenu);

// Change tabs
document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
    var tabName = event.target.dataset.tabName;
    if(!tabName) {
        return;
    }

    //Content
    //We can't just remove the first due to browser lag
    Array.from(document.querySelectorAll('#container > .visible'))
        .forEach(el => el.classList.remove('visible'));
    document.querySelector(`#container > [data-tab-name=${tabName}]`).classList.add('visible');

    //Tabs
    Array.from(document.querySelectorAll('#leftNav .selected'))
        .forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
});


module.exports = {
    toggleMenu,
    addTab,
    removeTab,
    addTabGroup,
    removeTabGroup,
};


/**
 * Function used to show/hide the menu.
 *
 * @example
 * toggleMenu();
 */
function toggleMenu() {
    var mainToggle = document.querySelector('#leftNav input');
    mainToggle.checked = !mainToggle.checked;
}

var tabUID = 0;
/**
 * Used to add a tab to the bot's navigation.
 *
 * @example
 * var tab = ui.addTab('Text');
 * var tab2 = ui.addTab('Custom Messages', 'messages');
 * @param {string} tabText
 * @param {string} [groupName=main] Optional. If provided, the name of the group of tabs to add this tab to.
 * @return {Node} - The div to place tab content in.
 */
function addTab(tabText, groupName = 'main') {
    var tabName = 'botTab_' + tabUID++;

    var tab = document.createElement('span');
    tab.textContent = tabText;
    tab.classList.add('tab');
    tab.dataset.tabName = tabName;

    var tabContent = document.createElement('div');
    tabContent.dataset.tabName = tabName;

    document.querySelector(`#leftNav [data-tab-group=${groupName}]`).appendChild(tab);
    document.querySelector('#container').appendChild(tabContent);

    return tabContent;
}


/**
 * Removes a global tab.
 *
 * @example
 * var tab = ui.addTab('Tab');
 * ui.removeTab(tab);
 * @param {Node} tabContent The div returned by the addTab function.
 */
function removeTab(tabContent) {
    document.querySelector(`#leftNav [data-tab-name=${tabContent.dataset.tabName}]`).remove();
    tabContent.remove();
}


/**
 * Creates a tab group in which tabs can be placed.
 *
 * @example
 * ui.addTabGroup('Group Text', 'some_group');
 * ui.addTab('Within group', 'some_group');
 * @param {string} text - The text the user will see
 * @param {string} groupName - The name of the group which can be used to add tabs within the group.
 */
function addTabGroup(text, groupName) {
    var details = document.createElement('details');
    details.dataset.tabGroup = groupName;

    var summary = document.createElement('summary');
    summary.textContent = text;
    details.appendChild(summary);

    document.querySelector('#leftNav [data-tab-group=main]').appendChild(details);
}


/**
 * Removes a tab group and all tabs contained within the specified group.
 *
 * @example
 * addTabGroup('Group', 'group1');
 * var inner = addTab('Inner', 'group1');
 * removeTabGroup('group1'); // inner has been removed.
 * @param string groupName the name of the group that was used in ui.addTabGroup.
 */
function removeTabGroup(groupName) {
    var group = document.querySelector(`#leftNav [data-tab-group="${groupName}"]`);
    var items = Array.from(group.querySelectorAll('span'));

    items.forEach(item => {
        //Tab content
        document.querySelector(`#container > [data-tab-name="${item.dataset.tabName}"]`).remove();
    });

    group.remove();
}

},{}],27:[function(require,module,exports){
module.exports = {
    alert
};

/**
* Function used to require action from the user.
*
* @param {string} text the text to display in the alert
* @param {Array} buttons an array of buttons to add to the alert.
*        Format: [{text: 'Test', style:'success', action: function(){}, thisArg: window, dismiss: false}]
*        Note: text is the only required paramater. If no button array is specified
*        then a single OK button will be shown.
*         Provided styles: success, danger, warning, info
*        Defaults: style: '', action: undefined, thisArg: undefined, dismiss: true
*/
function alert(text, buttons = [{text: 'OK'}]) {
    if (instance.active) {
        instance.queue.push({text, buttons});
        return;
    }
    instance.active = true;

    buttons.forEach(function(button, i) {
        button.dismiss = (button.dismiss === false) ? false : true;
        instance.buttons['button_' + i] = {
            action: button.action,
            thisArg: button.thisArg || undefined,
            dismiss: typeof button.dismiss == 'boolean' ? button.dismiss : true,
        };
        button.id = 'button_' + i;
        buildButton(button);
    });
    document.querySelector('#alertContent').innerHTML = text;

    document.querySelector('#alert ~ .overlay').classList.add('visible');
    document.querySelector('#alert').classList.add('visible');
}

/**
 * Holds the current alert and queue of further alerts.
 */
var instance = {
    active: false,
    queue: [],
    buttons: {},
};

/**
 * Internal function used to add button elements to an alert.
 *
 * @param {Object} button
 */
function buildButton(button) {
    var el = document.createElement('span');
    el.innerHTML = button.text;
    if (button.style) {
        el.classList.add(button.style);
    }
    el.id = button.id;
    el.addEventListener('click', buttonHandler);
    document.querySelector('#alert .buttons').appendChild(el);
}

/**
 * Internal function to determine the functionality of each button added to an alert.
 *
 * @param {MouseEvent} event
 */
function buttonHandler(event) {
    var button = instance.buttons[event.target.id] || {};
    if (typeof button.action == 'function') {
        button.action.call(button.thisArg);
    }

    //Require that there be an action asociated with no-dismiss buttons.
    if (button.dismiss || typeof button.action != 'function') {
        document.querySelector('#alert').classList.remove('visible');
        document.querySelector('#alert ~ .overlay').classList.remove('visible');
        document.querySelector('#alert .buttons').innerHTML = '';
        instance.buttons = {};
        instance.active = false;

        // Are more alerts waiting to be shown?
        if (instance.queue.length) {
            let next = instance.queue.shift();
            alert(next.text, next.buttons);
        }
    }
}

},{}],28:[function(require,module,exports){


Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);

var el = document.createElement('style');
el.innerHTML = "#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}\n";
document.head.appendChild(el);

el = document.createElement('div');
el.id = 'alertWrapper';
el.innerHTML = "<div id=\"alert\">\r\n    <div id=\"alertContent\"></div>\r\n    <div class=\"buttons\"/></div>\r\n</div>\r\n<div class=\"overlay\"/></div>\r\n";

document.body.appendChild(el);

},{"./alert":27,"./notify":29}],29:[function(require,module,exports){
module.exports = {
    notify,
};

/**
 * Function used to send a non-critical alert to the user.
 * Should be used in place of ui.alert if possible as it is non-blocking.
 *
 * @example
 * //Shows a notfication for 2 seconds
 * ui.notify('Notification');
 * //Shows a notification for 5 seconds
 * ui.notify('Notification', 5);
 * @param String text the text to display. Should be kept short to avoid visually blocking the menu on small devices.
 * @param Number displayTime the number of seconds to show the notification for.
 */
function notify(text, displayTime = 2) {
    var el = document.createElement('div');
    el.classList.add('notification');
    el.classList.add('visible');
    el.textContent = text;
    document.body.appendChild(el);

    el.addEventListener('click', function() {
        this.remove();
    });

    setTimeout(function() {
        this.classList.remove('visible');
    }.bind(el), displayTime * 1000);

    setTimeout(function() {
        if (this.parentNode) {
            this.remove();
        }
    }.bind(el), displayTime * 1000 + 2100);
}

},{}],30:[function(require,module,exports){
//IE doesn't like console.log unless dev tools are open.
if (!window.console) {
    window.console = {};
    window.log = window.log || [];
    console.log = function(...args) {
        window.log.push(args);
    };
}
['info', 'error', 'warn', 'assert'].forEach(method => {
    if (!console[method]) {
        console[method] = console.log;
    }
});

},{}],31:[function(require,module,exports){
//Details polyfill, older firefox, IE
if (!('open' in document.createElement('details'))) {
    let style = document.createElement('style');
    style.textContent += `details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; font-family:"Courier New"; } details[open] > summary:before { transform: rotate(90deg); }`;
    document.head.appendChild(style);

    window.addEventListener('click', function(event) {
        if (event.target.tagName == 'SUMMARY') {
            let details = event.target.parentNode;

            if (!details) {
                return;
            }

            if (details.getAttribute('open')) {
                details.open = false;
                details.removeAttribute('open');
            } else {
                details.open = true;
                details.setAttribute('open', 'open');
            }
        }
    });
}

},{}],32:[function(require,module,exports){
// IE Fix

module.exports = function(template) {
    if (!('content' in template)) {
        let content = template.childNodes;
        let fragment = document.createDocumentFragment();

        for (let j = 0; j < content.length; j++) {
            fragment.appendChild(content[j]);
        }

        template.content = fragment;
    }
};

},{}],33:[function(require,module,exports){
module.exports = {
    buildContentFromTemplate,
};

var polyfill = require('ui/polyfills/template');

/**
 * Function used to clone a template after altering the provided rules.
 *
 * @example
 * ui.buildContentFromTemplate('#template', '#target', [{selector: 'input', value: 'Value'}]);
 * ui.buildContentFromTemplate('template', 'div', [{selector: 'a', remove: ['href'], multiple: true}]);
 * @param {string} templateSelector
 * @param {string} targetSelector
 * @param {array} rules format: array of objects
 *      each object must have "selector".
 *      each object can have "multiple" set to update all matching elements.
 *      each object can have "remove" - an array of attributes to remove.
 *      each object can have "text" or "html" - further keys will be set as attributes.
 *      if both text and html are set, text will take precendence.
 *      rules will be parsed in the order that they are present in the array.
 */
function buildContentFromTemplate(templateSelector, targetSelector, rules = []) {
    var template = document.querySelector(templateSelector);

    polyfill(template);

    var content = template.content;

    rules.forEach(rule => handleRule(content, rule));

    document.querySelector(targetSelector).appendChild(document.importNode(content, true));
}

/**
 * Internal function to apply rules to the template.
 *
 * @param {Node} content - the content of the template.
 * @param {Object} rule - the rule to apply.
 */
function handleRule(content, rule) {
    if (rule.multiple) {
        let els = content.querySelectorAll(rule.selector);

        Array.from(els)
            .forEach(el => updateElement(el, rule));
    } else {
        let el = content.querySelector(rule.selector);
        if (!el) {
            console.warn(`Unable to update ${rule.selector}.`, rule);
            return;
        }

        updateElement(el, rule);
    }
}

/**
 * Internal function to update an element with a rule.
 *
 * @param {Node} el the element to apply the rules to.
 * @param {Object} rule the rule object.
 */
function updateElement(el, rule) {
    if ('text' in rule) {
        el.textContent = rule.text;
    } else if ('html' in rule) {
        el.innerHTML = rule.html;
    }

    Object.keys(rule)
        .filter(key => !['selector', 'text', 'html', 'remove', 'multiple'].includes(key))
        .forEach(key => el.setAttribute(key, rule[key]));

    if (Array.isArray(rule.remove)) {
        rule.remove.forEach(key => el.removeAttribute(key));
    }
}

},{"ui/polyfills/template":32}],34:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"util/":40}],35:[function(require,module,exports){
(function (global){
/*global window, global*/
var util = require("util")
var assert = require("assert")
var now = require("date-now")

var slice = Array.prototype.slice
var console
var times = {}

if (typeof global !== "undefined" && global.console) {
    console = global.console
} else if (typeof window !== "undefined" && window.console) {
    console = window.console
} else {
    console = {}
}

var functions = [
    [log, "log"],
    [info, "info"],
    [warn, "warn"],
    [error, "error"],
    [time, "time"],
    [timeEnd, "timeEnd"],
    [trace, "trace"],
    [dir, "dir"],
    [consoleAssert, "assert"]
]

for (var i = 0; i < functions.length; i++) {
    var tuple = functions[i]
    var f = tuple[0]
    var name = tuple[1]

    if (!console[name]) {
        console[name] = f
    }
}

module.exports = console

function log() {}

function info() {
    console.log.apply(console, arguments)
}

function warn() {
    console.log.apply(console, arguments)
}

function error() {
    console.warn.apply(console, arguments)
}

function time(label) {
    times[label] = now()
}

function timeEnd(label) {
    var time = times[label]
    if (!time) {
        throw new Error("No such label: " + label)
    }

    var duration = now() - time
    console.log(label + ": " + duration + "ms")
}

function trace() {
    var err = new Error()
    err.name = "Trace"
    err.message = util.format.apply(null, arguments)
    console.error(err.stack)
}

function dir(object) {
    console.log(util.inspect(object) + "\n")
}

function consoleAssert(expression) {
    if (!expression) {
        var arr = slice.call(arguments, 1)
        assert.ok(false, util.format.apply(null, arr))
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"assert":34,"date-now":36,"util":40}],36:[function(require,module,exports){
module.exports = now

function now() {
    return new Date().getTime()
}

},{}],37:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],38:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],39:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],40:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":39,"_process":37,"inherits":38}]},{},[24])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdEV4dGVuc2lvbi5qcyIsImRldi9ib3QvY2hlY2tHcm91cC5qcyIsImRldi9ib3QvaW5kZXguanMiLCJkZXYvYm90L21pZ3JhdGlvbi5qcyIsImRldi9ib3Qvc2VuZC5qcyIsImRldi9jb25zb2xlL2V4cG9ydHMuanMiLCJkZXYvZXh0ZW5zaW9ucy9pbmRleC5qcyIsImRldi9saWJyYXJpZXMvYWpheC5qcyIsImRldi9saWJyYXJpZXMvYmhmYW5zYXBpLmpzIiwiZGV2L2xpYnJhcmllcy9ibG9ja2hlYWRzLmpzIiwiZGV2L2xpYnJhcmllcy9ob29rLmpzIiwiZGV2L2xpYnJhcmllcy9zdG9yYWdlLmpzIiwiZGV2L2xpYnJhcmllcy93b3JsZC5qcyIsImRldi9tZXNzYWdlcy9hbm5vdW5jZW1lbnRzL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2hlbHBlcnMvYnVpbGRNZXNzYWdlLmpzIiwiZGV2L21lc3NhZ2VzL2hlbHBlcnMvY2hlY2tKb2luc0FuZEdyb3VwLmpzIiwiZGV2L21lc3NhZ2VzL2hlbHBlcnMvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvam9pbi9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9sZWF2ZS9pbmRleC5qcyIsImRldi9tZXNzYWdlcy90cmlnZ2VyL2luZGV4LmpzIiwiZGV2L3NldHRpbmdzL2luZGV4LmpzIiwiZGV2L3NldHRpbmdzL3BhZ2UuanMiLCJkZXYvc3RhcnQuanMiLCJkZXYvdWkvaW5kZXguanMiLCJkZXYvdWkvbGF5b3V0L2luZGV4LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvYWxlcnQuanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9pbmRleC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL25vdGlmeS5qcyIsImRldi91aS9wb2x5ZmlsbHMvY29uc29sZS5qcyIsImRldi91aS9wb2x5ZmlsbHMvZGV0YWlscy5qcyIsImRldi91aS9wb2x5ZmlsbHMvdGVtcGxhdGUuanMiLCJkZXYvdWkvdGVtcGxhdGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9jb25zb2xlLWJyb3dzZXJpZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGF0ZS1ub3cvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBib3QgPSByZXF1aXJlKCdib3QnKTtcclxuY29uc3QgYm90X2NvbnNvbGUgPSByZXF1aXJlKCdjb25zb2xlJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGFqYXggPSByZXF1aXJlKCdsaWJyYXJpZXMvYWpheCcpO1xyXG5jb25zdCBhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmxvY2toZWFkcycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuXHJcbi8vIEFycmF5IG9mIElEcyB0byBhdXRvbG9hZCBhdCB0aGUgbmV4dCBsYXVuY2guXHJcbnZhciBhdXRvbG9hZCA9IFtdO1xyXG52YXIgbG9hZGVkID0gW107XHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfZXh0ZW5zaW9ucyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY3JlYXRlIGEgbmV3IGV4dGVuc2lvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRlc3QgPSBNZXNzYWdlQm90RXh0ZW5zaW9uKCd0ZXN0Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgLSBTaG91bGQgYmUgdGhlIHNhbWUgYXMgeW91ciB2YXJpYWJsZSBuYW1lLlxyXG4gKiBAcmV0dXJuIHtNZXNzYWdlQm90RXh0ZW5zaW9ufSAtIFRoZSBleHRlbnNpb24gdmFyaWFibGUuXHJcbiAqL1xyXG5mdW5jdGlvbiBNZXNzYWdlQm90RXh0ZW5zaW9uKG5hbWVzcGFjZSkge1xyXG4gICAgbG9hZGVkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLmluc3RhbGwnLCBuYW1lc3BhY2UpO1xyXG5cclxuICAgIHZhciBleHRlbnNpb24gPSB7XHJcbiAgICAgICAgaWQ6IG5hbWVzcGFjZSxcclxuICAgICAgICBib3QsXHJcbiAgICAgICAgY29uc29sZTogYm90X2NvbnNvbGUsXHJcbiAgICAgICAgdWksXHJcbiAgICAgICAgc3RvcmFnZSxcclxuICAgICAgICBhamF4LFxyXG4gICAgICAgIGFwaSxcclxuICAgICAgICB3b3JsZCxcclxuICAgICAgICBob29rLFxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgdG8gY2hhbmdlIHdoZXRoZXIgb3Igbm90IHRoZSBleHRlbnNpb24gd2lsbCBiZVxyXG4gICAgICogQXV0b21hdGljYWxseSBsb2FkZWQgdGhlIG5leHQgdGltZSB0aGUgYm90IGlzIGxhdW5jaGVkLlxyXG4gICAgICpcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICAgICAqIHRlc3Quc2V0QXV0b0xhdW5jaCh0cnVlKTtcclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc2hvdWxkQXV0b2xvYWRcclxuICAgICAqL1xyXG4gICAgZXh0ZW5zaW9uLnNldEF1dG9MYXVuY2ggPSBmdW5jdGlvbiBzZXRBdXRvTGF1bmNoKHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgaWYgKCFhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpICYmIHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGF1dG9sb2FkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YobmFtZXNwYWNlKSwgMSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZXh0ZW5zaW9uO1xyXG59XHJcblxyXG4vKipcclxuICogVHJpZXMgdG8gbG9hZCB0aGUgcmVxdWVzdGVkIGV4dGVuc2lvbiBieSBJRC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwgPSBmdW5jdGlvbiBpbnN0YWxsKGlkKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgIGVsLnNyYyA9IGAvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi8ke2lkfS9jb2RlL3Jhd2A7XHJcbiAgICBlbC5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xyXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVW5pbnN0YWxscyBhbiBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwgPSBmdW5jdGlvbiB1bmluc3RhbGwoaWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93W2lkXS51bmluc3RhbGwoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvL05vdCBpbnN0YWxsZWQsIG9yIG5vIHVuaW5zdGFsbCBmdW5jdGlvbi5cclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3dbaWRdID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGxvYWRlZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBsb2FkZWQuc3BsaWNlKGxvYWRlZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5maXJlKCdleHRlbnNpb24udW5pbnN0YWxsJywgaWQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY2hlY2sgaWYgYW4gZXh0ZW5zaW9uIGhhcyBiZWVuIGxvYWRlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmlzTG9hZGVkID0gZnVuY3Rpb24gaXNMb2FkZWQoaWQpIHtcclxuICAgIHJldHVybiBsb2FkZWQuaW5jbHVkZXMoaWQpO1xyXG59O1xyXG5cclxuLy8gTG9hZCBleHRlbnNpb25zIHRoYXQgc2V0IHRoZW1zZWx2ZXMgdG8gYXV0b2xvYWQgbGFzdCBsYXVuY2guXHJcbnN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdLCBmYWxzZSlcclxuICAgIC5mb3JFYWNoKE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2VCb3RFeHRlbnNpb247XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBEZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNbR3JvdXBdIGluc3RlYWQuXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0dyb3VwXHJcbn07XHJcblxyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGlmIHVzZXJzIGFyZSBpbiBkZWZpbmVkIGdyb3Vwcy5cclxuICpcclxuICogQGRlcHJpY2F0ZWRcclxuICogQGV4YW1wbGVcclxuICogY2hlY2tHcm91cCgnYWRtaW4nLCAnU0VSVkVSJykgLy8gdHJ1ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXAgdGhlIGdyb3VwIHRvIGNoZWNrXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIGNoZWNrXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0dyb3VwKGdyb3VwLCBuYW1lKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ2JvdC5jaGVja0dyb3VwIGlzIGRlcHJpY2F0ZWQuIFVzZSB3b3JsZC5pc0FkbWluLCB3b3JsZC5pc01vZCwgZXRjLiBpbnN0ZWFkJyk7XHJcblxyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsImNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5cclxuY29uc3QgYm90ID0gT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9zZW5kJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrR3JvdXAnKVxyXG4pO1xyXG5cclxuYm90LnZlcnNpb24gPSAnNi4xLjBhJztcclxuXHJcbi8qKlxyXG4gKiBAZGVwcmljYXRlZCBzaW5jZSA2LjEuMC4gVXNlIGV4LndvcmxkIGluc3RlYWQuXHJcbiAqL1xyXG5ib3Qud29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcbnN0b3JhZ2Uuc2V0KCdtYl92ZXJzaW9uJywgYm90LnZlcnNpb24pO1xyXG4iLCJmdW5jdGlvbiB1cGRhdGUoa2V5cywgb3BlcmF0b3IpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5zdGFydHNXaXRoKGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGl0ZW0sIG9wZXJhdG9yKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGl0ZW0pKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vL2pzaGludCAtVzA4NlxyXG4vL05vIGJyZWFrIHN0YXRlbWVudHMgYXMgd2Ugd2FudCB0byBleGVjdXRlIGFsbCB1cGRhdGVzIGFmdGVyIG1hdGNoZWQgdmVyc2lvbi5cclxuc3dpdGNoIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWJfdmVyc2lvbicpKSB7XHJcbiAgICBjYXNlIG51bGw6XHJcbiAgICAgICAgYnJlYWs7IC8vTm90aGluZyB0byBtaWdyYXRlXHJcbiAgICBjYXNlICc1LjIuMCc6XHJcbiAgICBjYXNlICc1LjIuMSc6XHJcbiAgICAgICAgLy9XaXRoIDYuMCwgbmV3bGluZXMgYXJlIGRpcmVjdGx5IHN1cHBvcnRlZCBpbiBtZXNzYWdlcyBieSB0aGUgYm90LlxyXG4gICAgICAgIHVwZGF0ZShbJ2Fubm91bmNlbWVudEFycicsICdqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXNnLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLm1lc3NhZ2UgPSBtc2cubWVzc2FnZS5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMCBib3QuXHJcbiAgICBjYXNlICc2LjAuMGEnOlxyXG4gICAgY2FzZSAnNi4wLjAnOlxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ib3R1aS5hbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiB0aGUgNi4wLjAgdmVyc2lvbiBvZiB0aGUgYm90LCB5b3VyIGpvaW4gYW5kIGxlYXZlIG1lc3NhZ2VzIG1heSBiZSBzd2FwcGVkLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseS4gVGhpcyBtZXNzYWdlIHdpbGwgbm90IGJlIHNob3duIGFnYWluLlwiKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wLjEgLyA2LjAuMi5cclxuICAgIGNhc2UgJzYuMC4xJzpcclxuICAgIGNhc2UgJzYuMC4yJzpcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB3aW5kb3cuYm90dWkuYWxlcnQoXCJEdWUgdG8gYSBidWcgaW4gNi4wLjEgLyA2LjAuMiwgZ3JvdXBzIG1heSBoYXZlIGJlZW4gbWl4ZWQgdXAgb24gSm9pbiwgTGVhdmUsIGFuZCBUcmlnZ2VyIG1lc3NhZ2VzLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseSBpZiBpdCBvY2N1cmVkIG9uIHlvdXIgYm90LiBBbm5vdW5jZW1lbnRzIGhhdmUgYWxzbyBiZWVuIGZpeGVkLlwiKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIGNhc2UgJzYuMC4zJzpcclxuICAgIGNhc2UgJzYuMC40JzpcclxuICAgIGNhc2UgJzYuMC41JzpcclxufVxyXG4vL2pzaGludCArVzA4NlxyXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MnKTtcclxuXHJcbnZhciBxdWV1ZSA9IFtdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gcXVldWUgYSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNlbmQoJ0hlbGxvIScpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBiZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3Muc3BsaXRNZXNzYWdlcykge1xyXG4gICAgICAgIC8vRklYTUU6IElmIHRoZSBiYWNrc2xhc2ggYmVmb3JlIHRoZSB0b2tlbiBpcyBlc2NhcGVkIGJ5IGFub3RoZXIgYmFja3NsYXNoIHRoZSB0b2tlbiBzaG91bGQgc3RpbGwgc3BsaXQgdGhlIG1lc3NhZ2UuXHJcbiAgICAgICAgbGV0IHN0ciA9IG1lc3NhZ2Uuc3BsaXQoc2V0dGluZ3Muc3BsaXRUb2tlbik7XHJcbiAgICAgICAgbGV0IHRvU2VuZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgY3VyciA9IHN0cltpXTtcclxuICAgICAgICAgICAgaWYgKGN1cnJbY3Vyci5sZW5ndGggLSAxXSA9PSAnXFxcXCcgJiYgaSA8IHN0ci5sZW5ndGggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyICs9IHNldHRpbmdzLnNwbGl0VG9rZW4gKyBzdHJbKytpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0b1NlbmQucHVzaChjdXJyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU2VuZC5mb3JFYWNoKG1zZyA9PiBxdWV1ZS5wdXNoKG1zZykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogV2F0Y2hlcyB0aGUgcXVldWUgZm9yIG5ldyBtZXNzYWdlcyB0byBzZW5kIGFuZCBzZW5kcyB0aGVtIGFzIHNvb24gYXMgcG9zc2libGUuXHJcbiAqL1xyXG4oZnVuY3Rpb24gY2hlY2tRdWV1ZSgpIHtcclxuICAgIGlmICghcXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCA1MDApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBhcGkuc2VuZChxdWV1ZS5zaGlmdCgpKVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCAxMDAwKTtcclxuICAgICAgICB9KTtcclxufSgpKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB3cml0ZSxcclxuICAgIGNsZWFyXHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZShtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIHZhciBtc2dFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBpZiAobmFtZUNsYXNzKSB7XHJcbiAgICAgICAgbXNnRWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIG5hbWVDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG5hbWVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIG5hbWVFbC50ZXh0Q29udGVudCA9IG5hbWU7XHJcblxyXG4gICAgdmFyIGNvbnRlbnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gYDogJHttc2d9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gbXNnO1xyXG4gICAgfVxyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQobmFtZUVsKTtcclxuICAgIG1zZ0VsLmFwcGVuZENoaWxkKGNvbnRlbnRFbCk7XHJcblxyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5hcHBlbmRDaGlsZChtc2dFbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsZWFyKCkge1xyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5pbm5lckhUTUwgPSAnJztcclxufVxyXG4iLCJjb25zdCBiaGZhbnNhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IE1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCdNZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignRXh0ZW5zaW9ucycpO1xyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIFwiI21iX2V4dGVuc2lvbnMgLnRvcC1yaWdodC1idXR0b257d2lkdGg6aW5oZXJpdDtwYWRkaW5nOjAgN3B4fSNtYl9leHRlbnNpb25zIGgze21hcmdpbjowIDAgNXB4IDB9I2V4dHN7ZGlzcGxheTpmbGV4O2ZsZXgtZmxvdzpyb3cgd3JhcDtib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfSNleHRzIGg0LCNleHRzIHB7bWFyZ2luOjB9I2V4dHMgYnV0dG9ue3Bvc2l0aW9uOmFic29sdXRlO2JvdHRvbTo3cHg7cGFkZGluZzo0cHggOHB4O2JvcmRlci1yYWRpdXM6OHB4O2JhY2tncm91bmQ6I2ZmZn0jZXh0cz5kaXZ7cG9zaXRpb246cmVsYXRpdmU7aGVpZ2h0OjEzMHB4O3dpZHRoOmNhbGMoMzMlIC0gMTlweCk7bWluLXdpZHRoOjI4MHB4O3BhZGRpbmc6NXB4O21hcmdpbi1sZWZ0OjVweDttYXJnaW4tYm90dG9tOjVweDtib3JkZXI6M3B4IHNvbGlkICM5OTk7Ym9yZGVyLXJhZGl1czoxMHB4fSNleHRzPmRpdjpudGgtY2hpbGQob2RkKXtiYWNrZ3JvdW5kOiNjY2N9XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjx0ZW1wbGF0ZSBpZD1cXFwiZXh0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2PlxcclxcbiAgICAgICAgPGg0PlRpdGxlPC9oND5cXHJcXG4gICAgICAgIDxzcGFuPkRlc2NyaXB0aW9uPC9zcGFuPjxicj5cXHJcXG4gICAgICAgIDxidXR0b24gY2xhc3M9XFxcImJ1dHRvblxcXCI+SW5zdGFsbDwvYnV0dG9uPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2V4dGVuc2lvbnNcXFwiIGRhdGEtdGFiLW5hbWU9XFxcImV4dGVuc2lvbnNcXFwiPlxcclxcbiAgICA8aDM+RXh0ZW5zaW9ucyBjYW4gaW5jcmVhc2UgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIGJvdC48L2gzPlxcclxcbiAgICA8c3Bhbj5JbnRlcmVzdGVkIGluIGNyZWF0aW5nIG9uZT8gPGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL0JpYmxpb2ZpbGUvQmxvY2toZWFkcy1NZXNzYWdlQm90L3dpa2kvMi4tRGV2ZWxvcG1lbnQ6LVN0YXJ0LUhlcmVcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5TdGFydCBoZXJlLjwvYT48L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj5Mb2FkIEJ5IElEL1VSTDwvc3Bhbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwiZXh0c1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vL0NyZWF0ZSB0aGUgZXh0ZW5zaW9uIHN0b3JlIHBhZ2VcclxuYmhmYW5zYXBpLmdldFN0b3JlKCkudGhlbihyZXNwID0+IHtcclxuICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4dHMnKS5pbm5lckhUTUwgKz0gcmVzcC5tZXNzYWdlO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgcmVzcC5leHRlbnNpb25zLmZvckVhY2goZXh0ZW5zaW9uID0+IHtcclxuICAgICAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNleHRUZW1wbGF0ZScsICcjZXh0cycsIFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnaDQnLCB0ZXh0OiBleHRlbnNpb24udGl0bGV9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdzcGFuJywgaHRtbDogZXh0ZW5zaW9uLnNuaXBwZXR9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdkaXYnLCAnZGF0YS1pZCc6IGV4dGVuc2lvbi5pZH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2J1dHRvbicsIHRleHQ6IE1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQoZXh0ZW5zaW9uLmlkKSA/ICdSZW1vdmUnIDogJ0luc3RhbGwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcbn0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4vLyBJbnN0YWxsIC8gdW5pbnN0YWxsIGV4dGVuc2lvbnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V4dHMnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZXh0QWN0aW9ucyhlKSB7XHJcbiAgICAgICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUgIT0gJ0JVVFRPTicpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB2YXIgaWQgPSBlbC5wYXJlbnRFbGVtZW50LmRhdGFzZXQuaWQ7XHJcblxyXG4gICAgICAgIGlmIChlbC50ZXh0Q29udGVudCA9PSAnSW5zdGFsbCcpIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLmluc3RhbGwnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy8gU2hvdyByZW1vdmUgdG8gbGV0IHVzZXJzIHJlbW92ZSBleHRlbnNpb25zXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXSBidXR0b25gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlJztcclxuICAgIH1cclxufSk7XHJcblxyXG5ob29rLm9uKCdleHRlbnNpb24udW5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlZCBmb3Igc3RvcmUgaW5zdGFsbCBidXR0b25cclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdIGJ1dHRvbmApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmVkJztcclxuICAgICAgICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnSW5zdGFsbCc7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIDMwMDApO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLy9UT0RPOiBVc2UgZmV0Y2hcclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIEdFVCBhIHBhZ2UuIFBhc3NlcyB0aGUgcmVzcG9uc2Ugb2YgdGhlIFhIUiBpbiB0aGUgcmVzb2x2ZSBwcm9taXNlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL3NlbmRzIGEgR0VUIHJlcXVlc3QgdG8gL3NvbWUvdXJsLnBocD9hPXRlc3RcclxuICogZ2V0KCcvc29tZS91cmwucGhwJywge2E6ICd0ZXN0J30pLnRoZW4oY29uc29sZS5sb2cpXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1N0clxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0KHVybCA9ICcvJywgcGFyYW1zID0ge30pIHtcclxuICAgIGlmIChPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBhZGRpdGlvbiA9IHVybFN0cmluZ2lmeShwYXJhbXMpO1xyXG4gICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJz8nKSkge1xyXG4gICAgICAgICAgICB1cmwgKz0gYCYke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJsICs9IGA/JHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geGhyKCdHRVQnLCB1cmwsIHt9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgSlNPTiBvYmplY3QgaW4gdGhlIHByb21pc2UgcmVzb2x2ZSBtZXRob2QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIGdldCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIG1ha2UgYSBwb3N0IHJlcXVlc3RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHBvc3QodXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4geGhyKCdQT1NUJywgdXJsLCBwYXJhbU9iaik7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gZmV0Y2ggSlNPTiBmcm9tIGEgcGFnZSB0aHJvdWdoIHBvc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiAqIEBwYXJhbSBzdHJpbmcgcGFyYW1PYmpcclxuICogQHJldHVybiBQcm9taXNlXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBwb3N0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuKiBIZWxwZXIgZnVuY3Rpb24gdG8gbWFrZSBYSFIgcmVxdWVzdHMsIGlmIHBvc3NpYmxlIHVzZSB0aGUgZ2V0IGFuZCBwb3N0IGZ1bmN0aW9ucyBpbnN0ZWFkLlxyXG4qXHJcbiogQGRlcHJpY2F0ZWQgc2luY2UgdmVyc2lvbiA2LjFcclxuKiBAcGFyYW0gc3RyaW5nIHByb3RvY29sXHJcbiogQHBhcmFtIHN0cmluZyB1cmxcclxuKiBAcGFyYW0gb2JqZWN0IHBhcmFtT2JqIC0tIFdBUk5JTkcuIE9ubHkgYWNjZXB0cyBzaGFsbG93IG9iamVjdHMuXHJcbiogQHJldHVybiBQcm9taXNlXHJcbiovXHJcbmZ1bmN0aW9uIHhocihwcm90b2NvbCwgdXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICB2YXIgcGFyYW1TdHIgPSB1cmxTdHJpbmdpZnkocGFyYW1PYmopO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICByZXEub3Blbihwcm90b2NvbCwgdXJsKTtcclxuICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEhhbmRsZSBuZXR3b3JrIGVycm9yc1xyXG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChFcnJvcihcIk5ldHdvcmsgRXJyb3JcIikpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHBhcmFtU3RyKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKHBhcmFtU3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXEuc2VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gc3RyaW5naWZ5IHVybCBwYXJhbWV0ZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiB1cmxTdHJpbmdpZnkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKX1gKVxyXG4gICAgLmpvaW4oJyYnKTtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge3hociwgZ2V0LCBnZXRKU09OLCBwb3N0LCBwb3N0SlNPTn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgdG8gaW50ZXJhY3Qgd2l0aCBibG9ja2hlYWRzZmFucy5jb20gLSBjYW5ub3QgYmUgdXNlZCBieSBleHRlbnNpb25zLlxyXG4gKi9cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBhamF4ID0gcmVxdWlyZSgnbGlicmFyaWVzL2FqYXgnKTtcclxuXHJcbmNvbnN0IEFQSV9VUkxTID0ge1xyXG4gICAgU1RPUkU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi9zdG9yZScsXHJcbiAgICBOQU1FOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vbmFtZScsXHJcbiAgICBFUlJPUjogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYm90L2Vycm9yJyxcclxufTtcclxuXHJcbnZhciBjYWNoZSA9IHtcclxuICAgIG5hbWVzOiBuZXcgTWFwKCksXHJcbn07XHJcblxyXG4vKipcclxuICogVXNlZCB0byBnZXQgcHVibGljIGV4dGVuc2lvbnNcclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0U3RvcmUoKS50aGVuKHN0b3JlID0+IGNvbnNvbGUubG9nKHN0b3JlKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHVzZSB0aGUgY2FjaGVkIHJlc3BvbnNlIHNob3VsZCBiZSBjbGVhcmVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSByZXNwb25zZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RvcmUocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0U3RvcmUpIHtcclxuICAgICAgICBjYWNoZS5nZXRTdG9yZSA9IGFqYXguZ2V0SlNPTihBUElfVVJMUy5TVE9SRSlcclxuICAgICAgICAgICAgLnRoZW4oc3RvcmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy9CdWlsZCB0aGUgaW5pdGlhbCBuYW1lcyBtYXBcclxuICAgICAgICAgICAgICAgIGlmIChzdG9yZS5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBleCBvZiBzdG9yZS5leHRlbnNpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUubmFtZXMuc2V0KGV4LmlkLCBleC50aXRsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRTdG9yZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBwcm92aWRlZCBleHRlbnNpb24gSUQuXHJcbiAqIElmIHRoZSBleHRlbnNpb24gd2FzIG5vdCBmb3VuZCwgcmVzb2x2ZXMgd2l0aCB0aGUgb3JpZ2luYWwgcGFzc2VkIElELlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRFeHRlbnNpb25OYW1lKCd0ZXN0JykudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKG5hbWUpKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkIHRoZSBpZCB0byBzZWFyY2ggZm9yLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSBleHRlbnNpb24gbmFtZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldEV4dGVuc2lvbk5hbWUoaWQpIHtcclxuICAgIGlmIChjYWNoZS5uYW1lcy5oYXMoaWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5uYW1lcy5nZXQoaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihBUElfVVJMUy5OQU1FLCB7aWR9KS50aGVuKG5hbWUgPT4ge1xyXG4gICAgICAgIGNhY2hlLm5hbWVzLnNldChpZCwgbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIG5hbWU7XHJcbiAgICB9LCBlcnIgPT4ge1xyXG4gICAgICAgIHJlcG9ydEVycm9yKGVycik7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCAnU29tZXRoaW5nIHdlbnQgd3JvbmcsIGl0IGhhcyBiZWVuIHJlcG9ydGVkLicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCBgRXJyb3IgcmVwb3J0aW5nIGV4Y2VwdGlvbjogJHtyZXNwLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdG9yZSxcclxuICAgIGdldEV4dGVuc2lvbk5hbWUsXHJcbiAgICByZXBvcnRFcnJvcixcclxufTtcclxuIiwidmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vYmhmYW5zYXBpJyk7XHJcblxyXG5jb25zdCB3b3JsZElkID0gd2luZG93LndvcmxkSWQ7XHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29ubGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvZmZsaW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGFydCcsIHdvcmxkSWQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjaGVjaywgY2hlY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXZhaWxpYmxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB1bmF2YWlsaWJsZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAzMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK2ZhaWxzID4gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignV29ybGQgdG9vayB0b28gbG9uZyB0byBzdGFydC4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdVbmtub3duIHJlc3BvbnNlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG4gICAgICAgICAgICB9KCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS53b3JsZFN0YXJ0ZWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiB0aGUgbG9nJ3MgbGluZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExvZ3MoKS50aGVuKGxpbmVzID0+IGNvbnNvbGUubG9nKGxpbmVzWzBdKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZG93bmxvYWQgdGhlIGxvZ3NcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExvZ3MocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0TG9ncykge1xyXG4gICAgICAgIGNhY2hlLmdldExvZ3MgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9sb2dzLyR7d29ybGRJZH1gKSlcclxuICAgICAgICAgICAgLnRoZW4obG9nID0+IGxvZy5zcGxpdCgnXFxuJykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMb2dzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYSBsaXN0IG9mIGFkbWlucywgbW9kcywgc3RhZmYgKGFkbWlucyArIG1vZHMpLCB3aGl0ZWxpc3QsIGFuZCBibGFja2xpc3QuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExpc3RzKCkudGhlbihsaXN0cyA9PiBjb25zb2xlLmxvZyhsaXN0cy5hZG1pbikpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZldGNoIHRoZSBsaXN0cy5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExpc3RzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExpc3RzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0TGlzdHMgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9saXN0cy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TGlzdChuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBkb2MucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0ke25hbWV9XWApXHJcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvTG9jYWxlVXBwZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbLi4ubmV3IFNldChsaXN0KV07IC8vUmVtb3ZlIGR1cGxpY2F0ZXNcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRtaW46IGdldExpc3QoJ2FkbWlucycpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZDogZ2V0TGlzdCgnbW9kbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdoaXRlOiBnZXRMaXN0KCd3aGl0ZWxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICBibGFjazogZ2V0TGlzdCgnYmxhY2tsaXN0JyksXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgbGlzdHMubW9kID0gbGlzdHMubW9kLmZpbHRlcihuYW1lID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5zdGFmZiA9IGxpc3RzLmFkbWluLmNvbmNhdChsaXN0cy5tb2QpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldExpc3RzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIGhvbWVwYWdlIG9mIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IGNvbnNvbGUubG9nKGh0bWwuc3Vic3RyaW5nKDAsIDEwMCkpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgcGFnZS5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEhvbWVwYWdlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldEhvbWVwYWdlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0SG9tZXBhZ2UgPSBhamF4LmdldChgL3dvcmxkcy8ke3dvcmxkSWR9YClcclxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IGdldEhvbWVwYWdlKHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0SG9tZXBhZ2U7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiBwbGF5ZXIgbmFtZXMuXHJcbiAqIEFuIG9ubGluZSBsaXN0IGlzIG1haW50YWluZWQgYnkgdGhlIGJvdCwgdGhpcyBzaG91bGQgZ2VuZXJhbGx5IG5vdCBiZSB1c2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPbmxpbmVQbGF5ZXJzKCkudGhlbihvbmxpbmUgPT4geyBmb3IgKGxldCBuIG9mIG9ubGluZSkgeyBjb25zb2xlLmxvZyhuLCAnaXMgb25saW5lIScpfX0pO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZyZXNoIHRoZSBvbmxpbmUgbmFtZXMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPbmxpbmVQbGF5ZXJzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldE9ubGluZVBsYXllcnMpIHtcclxuICAgICAgICBjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzID0gZ2V0SG9tZXBhZ2UodHJ1ZSlcclxuICAgICAgICAgICAgLnRoZW4oKGh0bWwpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllckVsZW1zID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5tYW5hZ2VyLnBhZGRlZDpudGgtY2hpbGQoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCd0cjpub3QoLmhpc3RvcnkpID4gdGQubGVmdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHBsYXllckVsZW1zKS5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcnMucHVzaChlbC50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBwbGF5ZXJzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0T25saW5lUGxheWVycztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBzZXJ2ZXIgb3duZXIncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPd25lck5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIGlzIG93bmVkIGJ5JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T3duZXJOYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5zdWJoZWFkZXJ+dHI+dGQ6bm90KFtjbGFzc10pJykudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgd29ybGQncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRXb3JsZE5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIG5hbWU6JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0V29ybGROYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJyN0aXRsZScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRzIGEgbWVzc2FnZSwgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHNlbnQgb3IgcmVqZWN0cyBvbiBmYWlsdXJlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZW5kKCdoZWxsbyEnKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzZW50JykpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBzZW5kLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHtjb21tYW5kOiAnc2VuZCcsIG1lc3NhZ2UsIHdvcmxkSWR9KVxyXG4gICAgICAgIC50aGVuKHJlc3AgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgLy9IYW5kbGUgaG9va3NcclxuICAgICAgICAgICAgaG9vay5maXJlKCd3b3JsZC5zZW5kJywgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VydmVybWVzc2FnZScsIG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgLy9EaXNhbGxvdyBjb21tYW5kcyBzdGFydGluZyB3aXRoIHNwYWNlLlxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykgJiYgIW1lc3NhZ2Uuc3RhcnRzV2l0aCgnLyAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJncyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG1lc3NhZ2UuaW5kZXhPZignICcpICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgJ1NFUlZFUicsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcDtcclxuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyID09ICdXb3JsZCBub3QgcnVubmluZy4nKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gd2F0Y2ggY2hhdC5cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrQ2hhdCgpIHtcclxuICAgIGdldE1lc3NhZ2VzKCkudGhlbigobXNncykgPT4ge1xyXG4gICAgICAgIG1zZ3MuZm9yRWFjaCgobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IG1lc3NhZ2UubWF0Y2goLyAtIFBsYXllciBDb25uZWN0ZWQgKC4qKSBcXHwgKFtcXGQuXSspIFxcfCAoW1xcd117MzJ9KVxccyokLyk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGQubmFtZX0gLSBQbGF5ZXIgRGlzY29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKHdvcmxkLm5hbWUubGVuZ3RoICsgMjMpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5pbmNsdWRlcygnOiAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBnZXRVc2VybmFtZShtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGxldCBtc2cgPSBtZXNzYWdlLnN1YnN0cmluZyhuYW1lLmxlbmd0aCArIDIpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1zZyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tDaGF0LCA1MDAwKTtcclxuICAgIH0pO1xyXG59XHJcbmNoZWNrQ2hhdCgpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBnZXQgdGhlIGxhdGVzdCBjaGF0IG1lc3NhZ2VzLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TWVzc2FnZXMoKSB7XHJcbiAgICByZXR1cm4gd29ybGRTdGFydGVkKClcclxuICAgICAgICAudGhlbigoKSA9PiBhamF4LnBvc3RKU09OKGAvYXBpYCwgeyBjb21tYW5kOiAnZ2V0Y2hhdCcsIHdvcmxkSWQsIGZpcnN0SWQ6IGNhY2hlLmZpcnN0SWQgfSkpXHJcbiAgICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PSAnb2snICYmIGRhdGEubmV4dElkICE9IGNhY2hlLmZpcnN0SWQpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLmZpcnN0SWQgPSBkYXRhLm5leHRJZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmxvZztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnN0YXR1cyA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgd2hvIHNlbnQgYSBtZXNzYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgbmFtZSA9IGdldFVzZXJuYW1lKCdTRVJWRVI6IEhpIHRoZXJlIScpO1xyXG4gKiAvL25hbWUgPT0gJ1NFUlZFUidcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gcGFyc2UuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIHVzZXIgd2hvIHNlbnQgdGhlIG1lc3NhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRVc2VybmFtZShtZXNzYWdlKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMTg7IGkgPiA0OyBpLS0pIHtcclxuICAgICAgICBsZXQgcG9zc2libGVOYW1lID0gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCBpKSk7XHJcbiAgICAgICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhwb3NzaWJsZU5hbWUpIHx8IHBvc3NpYmxlTmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVOYW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFNob3VsZCBpZGVhbGx5IG5ldmVyIGhhcHBlbi5cclxuICAgIHJldHVybiBtZXNzYWdlLnN1YnN0cmluZygwLCBtZXNzYWdlLmxhc3RJbmRleE9mKCc6ICcsIDE4KSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBqb2luaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaXAgdGhlIGlwIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUpvaW5NZXNzYWdlcyhuYW1lLCBpcCkge1xyXG4gICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5qb2luJywgbmFtZSwgaXApO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQubGVhdmUnLCBuYW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgdXNlciBjaGF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB1c2VyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChuYW1lID09ICdTRVJWRVInKSB7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuc2VydmVyY2hhdCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5tZXNzYWdlJywgbmFtZSwgbWVzc2FnZSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuXHJcbiAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICBpZiAoY29tbWFuZC5pbmNsdWRlcygnICcpKSB7XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgbmFtZSwgY29tbWFuZCwgYXJncyk7XHJcbiAgICAgICAgcmV0dXJuOyAvL25vdCBjaGF0XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuY2hhdCcsIG5hbWUsIG1lc3NhZ2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gaGFuZGxlIG1lc3NhZ2VzIHdoaWNoIGFyZSBub3Qgc2ltcGx5IHBhcnNlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gaGFuZGxlXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVPdGhlck1lc3NhZ2VzKG1lc3NhZ2UpIHtcclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLm90aGVyJywgbWVzc2FnZSk7XHJcbn1cclxuIiwidmFyIGxpc3RlbmVycyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gYmVnaW4gbGlzdGVuaW5nIHRvIGFuIGV2ZW50LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBsaXN0ZW4oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiAvL2FsdGVybmF0aXZlbHlcclxuICogb24oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBsaXN0ZW4gdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBldmVudCBoYW5kbGVyXHJcbiAqL1xyXG5mdW5jdGlvbiBsaXN0ZW4oa2V5LCBjYWxsYmFjaykge1xyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcbiAgICB9XHJcblxyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgbGlzdGVuZXJzW2tleV0gPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldLnB1c2goY2FsbGJhY2spO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gYW4gZXZlbnQuIElmIHRoZSBsaXN0ZW5lciB3YXMgbm90IGZvdW5kLCBubyBhY3Rpb24gd2lsbCBiZSB0YWtlbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9FYXJsaWVyIGF0dGFjaGVkIG15RnVuYyB0byAnZXZlbnQnXHJcbiAqIHJlbW92ZSgnZXZlbnQnLCBteUZ1bmMpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBzdG9wIGxpc3RlbmluZyB0by5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdGhlIGNhbGxiYWNrIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudCBsaXN0ZW5lcnMuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmUoa2V5LCBjYWxsYmFjaykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAobGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICBpZiAobGlzdGVuZXJzW2tleV0uaW5jbHVkZXMoY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnNwbGljZShsaXN0ZW5lcnNba2V5XS5pbmRleE9mKGNhbGxiYWNrKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2FsbCBldmVudHMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrKCd0ZXN0JywgMSwgMiwgMyk7XHJcbiAqIGNoZWNrKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIC8vIGFsdGVybmF0aXZlbHlcclxuICogZmlyZSgndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBmaXJlKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGwuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFyZ3VtZW50cyB0byBwYXNzIHRvIGxpc3RlbmluZyBmdW5jdGlvbnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVjayhrZXksIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsaXN0ZW5lcnNba2V5XS5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGlzdGVuZXIoLi4uYXJncyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSB2YWx1ZSBiYXNlZCBvbiBpbnB1dCBmcm9tIGxpc3RlbmVycy5cclxuICpcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIEluc3RlYWQsIHVwZGF0ZSByZXF1ZXN0cyBzaG91bGQgYmUgaGFuZGxlZCBieSB0aGUgZXh0ZW5zaW9uIGl0ZXNlbGYuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVwZGF0ZSgnZXZlbnQnLCB0cnVlLCAxLCAyLCAzKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gY2FsbFxyXG4gKiBAcGFyYW0ge21peGVkfSBpbml0aWFsIHRoZSBpbml0aWFsIHZhbHVlIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlKGtleSwgaW5pdGlhbCwgLi4uYXJncykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgcmV0dXJuIGluaXRpYWw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGxpc3RlbmVyc1trZXldLnJlZHVjZShmdW5jdGlvbihwcmV2aW91cywgY3VycmVudCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBjdXJyZW50KHByZXZpb3VzLCAuLi5hcmdzKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzO1xyXG4gICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9XHJcbiAgICB9LCBpbml0aWFsKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBsaXN0ZW4sXHJcbiAgICBvbjogbGlzdGVuLFxyXG4gICAgcmVtb3ZlLFxyXG4gICAgY2hlY2ssXHJcbiAgICBmaXJlOiBjaGVjayxcclxuICAgIHVwZGF0ZSxcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdHJpbmcsXHJcbiAgICBnZXRPYmplY3QsXHJcbiAgICBzZXQsXHJcbiAgICBjbGVhck5hbWVzcGFjZSxcclxufTtcclxuXHJcbi8vUkVWSUVXOiBJcyB0aGVyZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz8gcmVxdWlyZSgnLi9jb25maWcnKSBtYXliZT9cclxuY29uc3QgTkFNRVNQQUNFID0gd2luZG93LndvcmxkSWQ7XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0cmluZyBmcm9tIHRoZSBzdG9yYWdlIGlmIGl0IGV4aXN0cyBhbmQgcmV0dXJucyBpdCwgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0U3RyaW5nKCdzdG9yZWRfcHJlZnMnLCAnbm90aGluZycpO1xyXG4gKiB2YXIgeSA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnLCBmYWxzZSk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGtleSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGtleSB3YXMgbm90IGZvdW5kLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgYSBuYW1lc3BhY2Ugd2hlbiBjaGVja2luZyBmb3IgdGhlIGtleS5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdHJpbmcoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYCR7a2V5fSR7TkFNRVNQQUNFfWApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAocmVzdWx0ID09PSBudWxsKSA/IGZhbGxiYWNrIDogcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JlZCBvYmplY3QgaWYgaXQgZXhpc3RzLCBvdGhlcndpc2UgcmV0dXJucyBmYWxsYmFjay5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHggPSBnZXRPYmplY3QoJ3N0b3JlZF9rZXknLCBbMSwgMiwgM10pO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBpdGVtIHRvIHJldHJpZXZlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBmYWxsYmFjayB3aGF0IHRvIHJldHVybiBpZiB0aGUgaXRlbSBkb2VzIG5vdCBleGlzdCBvciBmYWlscyB0byBwYXJzZSBjb3JyZWN0bHkuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgb3Igbm90IGEgbmFtZXNwYWNlIHNob3VsZCBiZSB1c2VkLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIGdldE9iamVjdChrZXksIGZhbGxiYWNrLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBnZXRTdHJpbmcoa2V5LCBmYWxzZSwgbG9jYWwpO1xyXG5cclxuICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXN1bHQpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIGFuIG9iamVjdCBpbiB0aGUgc3RvcmFnZSwgc3RyaW5naWZ5aW5nIGl0IGZpcnN0IGlmIG5lY2Nlc3NhcnkuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgnc29tZV9rZXknLCB7YTogWzEsIDIsIDNdLCBiOiAndGVzdCd9KTtcclxuICogLy9yZXR1cm5zICd7XCJhXCI6WzEsMiwzXSxcImJcIjpcInRlc3RcIn0nXHJcbiAqIGdldFN0cmluZygnc29tZV9rZXknKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byBvdmVyd3JpdGUgb3IgY3JlYXRlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBkYXRhIGFueSBzdHJpbmdpZnlhYmxlIHR5cGUuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgdG8gc2F2ZSB0aGUgaXRlbSB3aXRoIGEgbmFtZXNwYWNlLlxyXG4gKi9cclxuZnVuY3Rpb24gc2V0KGtleSwgZGF0YSwgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICBpZiAobG9jYWwpIHtcclxuICAgICAgICBrZXkgPSBgJHtrZXl9JHtOQU1FU1BBQ0V9YDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRhdGEgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGRhdGEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYWxsIGl0ZW1zIHN0YXJ0aW5nIHdpdGggbmFtZXNwYWNlIGZyb20gdGhlIHN0b3JhZ2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgna2V5X3Rlc3QnLCAxKTtcclxuICogc2V0KCdrZXlfdGVzdDInLCAyKTtcclxuICogY2xlYXJOYW1lc3BhY2UoJ2tleV8nKTsgLy9ib3RoIGtleV90ZXN0IGFuZCBrZXlfdGVzdDIgaGF2ZSBiZWVuIHJlbW92ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgdGhlIHByZWZpeCB0byBjaGVjayBmb3Igd2hlbiByZW1vdmluZyBpdGVtcy5cclxuICovXHJcbmZ1bmN0aW9uIGNsZWFyTmFtZXNwYWNlKG5hbWVzcGFjZSkge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBhcGkgPSByZXF1aXJlKCcuL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnLi9ob29rJyk7XHJcblxyXG5jb25zdCBTVE9SQUdFID0ge1xyXG4gICAgUExBWUVSUzogJ21iX3BsYXllcnMnLFxyXG4gICAgTE9HX0xPQUQ6ICdtYl9sYXN0TG9nTG9hZCcsXHJcbn07XHJcblxyXG52YXIgd29ybGQgPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXSxcclxuICAgIG93bmVyOiAnJyxcclxuICAgIHBsYXllcnM6IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0UuUExBWUVSUywge30pLFxyXG4gICAgbGlzdHM6IHthZG1pbjogW10sIG1vZDogW10sIHN0YWZmOiBbXSwgYmxhY2s6IFtdLCB3aGl0ZTogW119LFxyXG4gICAgaXNQbGF5ZXIsXHJcbiAgICBpc1NlcnZlcixcclxuICAgIGlzT3duZXIsXHJcbiAgICBpc0FkbWluLFxyXG4gICAgaXNTdGFmZixcclxuICAgIGlzTW9kLFxyXG4gICAgaXNPbmxpbmUsXHJcbiAgICBnZXRKb2lucyxcclxufTtcclxudmFyIGxpc3RzID0gd29ybGQubGlzdHM7XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzUGxheWVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyB0aGUgc2VydmVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1NlcnZlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpID09ICdTRVJWRVInO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIG93bmVyIG9yIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT3duZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm93bmVyID09IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSB8fCBpc1NlcnZlcihuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGFuIGFkbWluXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc0FkbWluKG5hbWUpIHtcclxuICAgIHJldHVybiBsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpIHx8IGlzT3duZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhIG1vZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNNb2QobmFtZSkge1xyXG4gICAgcmV0dXJuIGxpc3RzLm1vZC5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBzdGFmZiBtZW1iZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1N0YWZmKG5hbWUpIHtcclxuICAgIHJldHVybiBpc0FkbWluKG5hbWUpIHx8IGlzTW9kKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGlzIG9ubGluZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNPbmxpbmUobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBwbGF5ZXIgaGFzIGpvaW5lZCB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKb2lucyhuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNQbGF5ZXIobmFtZSkgPyB3b3JsZC5wbGF5ZXJzW25hbWUudG9Mb2NhbGVVcHBlckNhc2UoKV0uam9pbnMgOiAwO1xyXG59XHJcblxyXG4vLyBLZWVwIHRoZSBvbmxpbmUgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59KTtcclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gS2VlcCBwbGF5ZXJzIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgY2hlY2tQbGF5ZXJKb2luKTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogUmVtb3ZlcyBhZG1pbnMgZnJvbSB0aGUgbW9kIGxpc3QgYW5kIGNyZWF0ZXMgdGhlIHN0YWZmIGxpc3QuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZFN0YWZmTGlzdCgpIHtcclxuICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIoKG5hbWUpID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSAmJiBuYW1lICE9ICdTRVJWRVInICYmIG5hbWUgIT0gd29ybGQub3duZXIpO1xyXG4gICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaGFzIHBlcm1pc3Npb24gdG8gcGVyZm9ybSBhIGNvbW1hbmRcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmRcclxuICovXHJcbmZ1bmN0aW9uIHBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSB7XHJcbiAgICBjb21tYW5kID0gY29tbWFuZC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGlmIChbJ2FkbWluJywgJ3VuYWRtaW4nLCAnbW9kJywgJ3VubW9kJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNBZG1pbihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWyd3aGl0ZWxpc3QnLCAndW53aGl0ZWxpc3QnLCAnYmFuJywgJ3VuYmFuJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNTdGFmZihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8vIEtlZXAgbGlzdHMgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5jb21tYW5kJywgZnVuY3Rpb24obmFtZSwgY29tbWFuZCwgdGFyZ2V0KSB7XHJcbiAgICBpZiAoIXBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdW4gPSBjb21tYW5kLnN0YXJ0c1dpdGgoJ3VuJyk7XHJcblxyXG4gICAgdmFyIGdyb3VwID0ge1xyXG4gICAgICAgIGFkbWluOiAnYWRtaW4nLFxyXG4gICAgICAgIG1vZDogJ21vZCcsXHJcbiAgICAgICAgd2hpdGVsaXN0OiAnd2hpdGUnLFxyXG4gICAgICAgIGJhbjogJ2JsYWNrJyxcclxuICAgIH1bdW4gPyBjb21tYW5kLnN1YnN0cigyKSA6IGNvbW1hbmRdO1xyXG5cclxuICAgIGlmICh1biAmJiBsaXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIGxpc3RzW2dyb3VwXS5zcGxpY2UobGlzdHNbZ3JvdXBdLmluZGV4T2YodGFyZ2V0KSwgMSk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH0gZWxzZSBpZiAoIXVuICYmICFsaXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIGxpc3RzW2dyb3VwXS5wdXNoKHRhcmdldCk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uIEluY3JlbWVudHMgYSBwbGF5ZXIncyBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGlwXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja1BsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIGlmICh3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgLy9SZXR1cm5pbmcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5qb2lucysrO1xyXG4gICAgICAgIGlmICghd29ybGQucGxheWVyc1tuYW1lXS5pcHMuaW5jbHVkZXMoaXApKSB7XHJcbiAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLnB1c2goaXApO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9OZXcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXSA9IHtqb2luczogMSwgaXBzOiBbaXBdfTtcclxuICAgIH1cclxuICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXAgPSBpcDtcclxuXHJcbiAgICAvLyBPdGhlcndpc2UsIHdlIHdpbGwgZG91YmxlIHBhcnNlIGpvaW5zXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG59XHJcblxyXG5cclxuLy8gVXBkYXRlIGxpc3RzXHJcblByb21pc2UuYWxsKFthcGkuZ2V0TGlzdHMoKSwgYXBpLmdldFdvcmxkTmFtZSgpLCBhcGkuZ2V0T3duZXJOYW1lKCldKVxyXG4gICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgIHZhciBbYXBpTGlzdHMsIHdvcmxkTmFtZSwgb3duZXJdID0gdmFsdWVzO1xyXG5cclxuICAgICAgICB3b3JsZC5saXN0cyA9IGFwaUxpc3RzO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICAgICAgd29ybGQubmFtZSA9IHdvcmxkTmFtZTtcclxuICAgICAgICB3b3JsZC5vd25lciA9IG93bmVyO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuXHJcbi8vIFVwZGF0ZSBwbGF5ZXJzIHNpbmNlIGxhc3QgYm90IGxvYWRcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMb2dzKCksIGFwaS5nZXRXb3JsZE5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFtsaW5lcywgd29ybGROYW1lXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgdmFyIGxhc3QgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLkxPR19MT0FELCAwKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICAgICAgbGV0IHRpbWUgPSBuZXcgRGF0ZShsaW5lLnN1YnN0cmluZygwLCBsaW5lLmluZGV4T2YoJ2InKSkucmVwbGFjZSgnICcsICdUJykucmVwbGFjZSgnICcsICdaJykpO1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGxpbmUuc3Vic3RyaW5nKGxpbmUuaW5kZXhPZignXScpICsgMik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGltZSA8IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkTmFtZX0gLSBQbGF5ZXIgQ29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAtIFBsYXllciBDb25uZWN0ZWQgJykgKyAyMCk7IC8vTkFNRSB8IElQIHwgSURcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBwYXJ0cy5tYXRjaCgvKC4qKSBcXHwgKFtcXHcuXSspIFxcfCAuezMyfVxccyovKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGVja1BsYXllckpvaW4obmFtZSwgaXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG4gICAgfSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5jb25zdCBwcmVmZXJlbmNlcyA9IHJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQW5ub3VuY2VtZW50cycsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImFUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXY+XFxyXFxuICAgICAgICA8bGFiZWw+U2VuZDo8L2xhYmVsPlxcclxcbiAgICAgICAgPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPlxcclxcbiAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICAgICAgPGxhYmVsIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6NXB4O1xcXCI+V2FpdCBYIG1pbnV0ZXMuLi48L2xhYmVsPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2Fubm91bmNlbWVudHNcXFwiPlxcclxcbiAgICA8aDM+VGhlc2UgYXJlIHNlbnQgYWNjb3JkaW5nIHRvIGEgcmVndWxhciBzY2hlZHVsZS48L2gzPlxcclxcbiAgICA8c3Bhbj5JZiB5b3UgaGF2ZSBvbmUgYW5ub3VuY2VtZW50LCBpdCBpcyBzZW50IGV2ZXJ5IFggbWludXRlcywgaWYgeW91IGhhdmUgdHdvLCB0aGVuIHRoZSBmaXJzdCBpcyBzZW50IGF0IFggbWludXRlcywgYW5kIHRoZSBzZWNvbmQgaXMgc2VudCBYIG1pbnV0ZXMgYWZ0ZXIgdGhlIGZpcnN0LiBDaGFuZ2UgWCBpbiB0aGUgc2V0dGluZ3MgdGFiLiBPbmNlIHRoZSBib3QgcmVhY2hlcyB0aGUgZW5kIG9mIHRoZSBsaXN0LCBpdCBzdGFydHMgb3ZlciBhdCB0aGUgdG9wLjwvc3Bhbj5cXHJcXG4gICAgPHNwYW4gY2xhc3M9XFxcInRvcC1yaWdodC1idXR0b25cXFwiPis8L3NwYW4+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImFNc2dzXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gYW5ub3VuY2VtZW50Q2hlY2soMCksXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKHRleHQgPSAnJykge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjYVRlbXBsYXRlJywgJyNhTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IHRleHR9XHJcbiAgICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGFubm91bmNlbWVudHMgPSBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcubScpKVxyXG4gICAgICAgIC5tYXAoZWwgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge21lc3NhZ2U6IGVsLnZhbHVlfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldCgnYW5ub3VuY2VtZW50QXJyJywgYW5ub3VuY2VtZW50cyk7XHJcbn1cclxuXHJcbi8vIEFubm91bmNlbWVudHMgY29sbGVjdGlvblxyXG52YXIgYW5ub3VuY2VtZW50cyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KCdhbm5vdW5jZW1lbnRBcnInLCBbXSk7XHJcblxyXG4vLyBTaG93IHNhdmVkIGFubm91bmNlbWVudHNcclxuYW5ub3VuY2VtZW50c1xyXG4gICAgLm1hcChhbm4gPT4gYW5uLm1lc3NhZ2UpXHJcbiAgICAuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcblxyXG4vLyBTZW5kcyBhbm5vdW5jZW1lbnRzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuXHJcbmZ1bmN0aW9uIGFubm91bmNlbWVudENoZWNrKGkpIHtcclxuICAgIGkgPSAoaSA+PSBhbm5vdW5jZW1lbnRzLmxlbmd0aCkgPyAwIDogaTtcclxuXHJcbiAgICB2YXIgYW5uID0gYW5ub3VuY2VtZW50c1tpXTtcclxuXHJcbiAgICBpZiAoYW5uICYmIGFubi5tZXNzYWdlKSB7XHJcbiAgICAgICAgc2VuZChhbm4ubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICBzZXRUaW1lb3V0KGFubm91bmNlbWVudENoZWNrLCBwcmVmZXJlbmNlcy5hbm5vdW5jZW1lbnREZWxheSAqIDYwMDAwLCBpICsgMSk7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZEFuZFNlbmRNZXNzYWdlLFxyXG4gICAgYnVpbGRNZXNzYWdlLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcblxyXG5mdW5jdGlvbiBidWlsZEFuZFNlbmRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIHNlbmQoYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7KFtefV0rKX19L2csIGZ1bmN0aW9uKGZ1bGwsIGtleSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIE5BTUU6IG5hbWUsXHJcbiAgICAgICAgICAgIE5hbWU6IG5hbWVbMF0gKyBuYW1lLnN1YnN0cmluZygxKS50b0xvY2FsZUxvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLnRvTG9jYWxlTG93ZXJDYXNlKClcclxuICAgICAgICB9W2tleV0gfHwgZnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7aXB9fS9naSwgd29ybGQucGxheWVycy5nZXRJUChuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0pvaW5zQW5kR3JvdXAsXHJcbiAgICBjaGVja0pvaW5zLFxyXG4gICAgY2hlY2tHcm91cCxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykge1xyXG4gICAgcmV0dXJuIGNoZWNrSm9pbnMobmFtZSwgbXNnLmpvaW5zX2xvdywgbXNnLmpvaW5zX2hpZ2gpICYmIGNoZWNrR3JvdXAobmFtZSwgbXNnLmdyb3VwLCBtc2cubm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2lucyhuYW1lLCBsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiB3b3JsZC5nZXRKb2lucyhuYW1lKSA+PSBsb3cgJiYgd29ybGQuZ2V0Sm9pbnMobmFtZSkgPD0gaGlnaDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tHcm91cChuYW1lLCBncm91cCwgbm90X2dyb3VwKSB7XHJcbiAgICByZXR1cm4gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSAmJiAhaXNJbkdyb3VwKG5hbWUsIG5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5Hcm91cChuYW1lLCBncm91cCkge1xyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsIk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYnVpbGRNZXNzYWdlJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrSm9pbnNBbmRHcm91cCcpXHJcbik7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBcIiNtYl9qb2luIGgzLCNtYl9sZWF2ZSBoMywjbWJfdHJpZ2dlciBoMywjbWJfYW5ub3VuY2VtZW50cyBoM3ttYXJnaW46MCAwIDVweCAwfSNtYl9qb2luIGlucHV0LCNtYl9qb2luIHRleHRhcmVhLCNtYl9sZWF2ZSBpbnB1dCwjbWJfbGVhdmUgdGV4dGFyZWEsI21iX3RyaWdnZXIgaW5wdXQsI21iX3RyaWdnZXIgdGV4dGFyZWEsI21iX2Fubm91bmNlbWVudHMgaW5wdXQsI21iX2Fubm91bmNlbWVudHMgdGV4dGFyZWF7Ym9yZGVyOjJweCBzb2xpZCAjNjY2O3dpZHRoOmNhbGMoMTAwJSAtIDEwcHgpfSNtYl9qb2luIHRleHRhcmVhLCNtYl9sZWF2ZSB0ZXh0YXJlYSwjbWJfdHJpZ2dlciB0ZXh0YXJlYSwjbWJfYW5ub3VuY2VtZW50cyB0ZXh0YXJlYXtyZXNpemU6bm9uZTtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzoxcHggMDtoZWlnaHQ6MjFweDt0cmFuc2l0aW9uOmhlaWdodCAuNXN9I21iX2pvaW4gdGV4dGFyZWE6Zm9jdXMsI21iX2xlYXZlIHRleHRhcmVhOmZvY3VzLCNtYl90cmlnZ2VyIHRleHRhcmVhOmZvY3VzLCNtYl9hbm5vdW5jZW1lbnRzIHRleHRhcmVhOmZvY3Vze2hlaWdodDo1ZW19I21iX2pvaW4gaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX2xlYXZlIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl90cmlnZ2VyIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl9hbm5vdW5jZW1lbnRzIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJde3dpZHRoOjVlbX0jak1zZ3MsI2xNc2dzLCN0TXNnc3twb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmZsZXg7ZmxleC1mbG93OnJvdyB3cmFwO2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDB9I2pNc2dzPmRpdiwjbE1zZ3M+ZGl2LCN0TXNncz5kaXZ7d2lkdGg6Y2FsYygzMyUgLSAxOXB4KTttaW4td2lkdGg6MjgwcHg7cGFkZGluZzo1cHg7bWFyZ2luLWxlZnQ6NXB4O21hcmdpbi1ib3R0b206NXB4O2JvcmRlcjozcHggc29saWQgIzk5OTtib3JkZXItcmFkaXVzOjEwcHh9I2pNc2dzPmRpdjpudGgtY2hpbGQob2RkKSwjbE1zZ3M+ZGl2Om50aC1jaGlsZChvZGQpLCN0TXNncz5kaXY6bnRoLWNoaWxkKG9kZCl7YmFja2dyb3VuZDojY2NjfVxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnVpLmFkZFRhYkdyb3VwKCdNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG5cclxuW1xyXG4gICAgcmVxdWlyZSgnLi9qb2luJyksXHJcbiAgICByZXF1aXJlKCcuL2xlYXZlJyksXHJcbiAgICByZXF1aXJlKCcuL3RyaWdnZXInKSxcclxuICAgIHJlcXVpcmUoJy4vYW5ub3VuY2VtZW50cycpXHJcbl0uZm9yRWFjaCh0eXBlID0+IHtcclxuICAgIHR5cGUudGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gY2hlY2tEZWxldGUoZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgIT0gJ0EnKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVpLmFsZXJ0KCdSZWFsbHkgZGVsZXRlIHRoaXMgbWVzc2FnZT8nLCBbXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnWWVzJywgc3R5bGU6ICdkYW5nZXInLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB0eXBlLnNhdmUoKTtcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnQ2FuY2VsJ31cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHR5cGUudGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHR5cGUuc2F2ZSk7XHJcblxyXG4gICAgdHlwZS50YWIucXVlcnlTZWxlY3RvcignLnRvcC1yaWdodC1idXR0b24nKVxyXG4gICAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHR5cGUuYWRkTWVzc2FnZSgpKTtcclxuXHJcbiAgICAvLyBEb24ndCBzdGFydCByZXNwb25kaW5nIHRvIGNoYXQgZm9yIDEwIHNlY29uZHNcclxuICAgIHNldFRpbWVvdXQodHlwZS5zdGFydCwgMTAwMDApO1xyXG59KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnbWVzc2FnZXMvaGVscGVycycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnam9pbkFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdKb2luJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwialRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdj5cXHJcXG4gICAgICAgIDxsYWJlbD4gTWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zcGFuPlxcclxcbiAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zPC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWxsXFxcIj5hbnlvbmU8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiU3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiTm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiU3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiMFxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2xvd1xcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxzcGFuPiAmbGU7IHBsYXllciBqb2lucyAmbGU7IDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2pvaW5cXFwiIGRhdGEtdGFiLW5hbWU9XFxcImpvaW5cXFwiPlxcclxcbiAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbiBhIHBsYXllciBqb2lucyB0aGUgc2VydmVyLjwvaDM+XFxyXFxuICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLjwvc3Bhbj5cXHJcXG4gICAgPHNwYW4gY2xhc3M9XFxcInRvcC1yaWdodC1idXR0b25cXFwiPis8L3NwYW4+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImpNc2dzXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gaG9vay5vbignd29ybGQuam9pbicsIG9uSm9pbiksXHJcbn07XHJcblxyXG52YXIgam9pbk1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG5qb2luTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBhZGQgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNqVGVtcGxhdGUnLCAnI2pNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJywgdmFsdWU6IG1zZy5qb2luc19sb3cgfHwgMH0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScsIHZhbHVlOiBtc2cuam9pbnNfaGlnaCB8fCA5OTk5fSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJncm91cFwiXSBbdmFsdWU9XCIke21zZy5ncm91cCB8fCAnQWxsJ31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLm5vdF9ncm91cCB8fCAnTm9ib2R5J31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ31cclxuICAgIF0pO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzYXZlIHRoZSB1c2VyJ3MgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgam9pbk1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjak1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgam9pbk1lc3NhZ2VzLnB1c2goe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGpvaW5NZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGxpc3RlbiB0byBwbGF5ZXIgam9pbnNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICovXHJcbmZ1bmN0aW9uIG9uSm9pbihuYW1lKSB7XHJcbiAgICBqb2luTWVzc2FnZXMuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpKSB7XHJcbiAgICAgICAgICAgIGhlbHBlcnMuYnVpbGRBbmRTZW5kTWVzc2FnZShtc2cubWVzc2FnZSwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnbWVzc2FnZXMvaGVscGVycycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbGVhdmVBcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignTGVhdmUnLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJsVGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2PlxcclxcbiAgICAgICAgPGxhYmVsPk1lc3NhZ2UgPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICA8ZGV0YWlscz48c3VtbWFyeT5Nb3JlIG9wdGlvbnM8L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpczogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwiZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJTdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiTW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiT3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJOb2JvZHlcXFwiPm5vYm9keTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJTdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiTW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiT3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICA8L2RldGFpbHM+XFxyXFxuICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfbGVhdmVcXFwiPlxcclxcbiAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbiBhIHBsYXllciBsZWF2ZXMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS48L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj4rPC9zcGFuPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJsTXNnc1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLmxlYXZlJywgb25MZWF2ZSksXHJcbn07XHJcblxyXG52YXIgbGVhdmVNZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxubGVhdmVNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSBsZWF2ZSBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjbFRlbXBsYXRlJywgJyNsTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ0FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ05vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2F2ZSB0aGUgY3VycmVudCBsZWF2ZSBtZXNzYWdlc1xyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGxlYXZlTWVzc2FnZXMgPSBbXTtcclxuICAgIEFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNsTXNncyA+IGRpdicpKS5mb3JFYWNoKGNvbnRhaW5lciA9PiB7XHJcbiAgICAgICAgaWYgKCFjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZWF2ZU1lc3NhZ2VzLnB1c2goe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGxlYXZlTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBsaXN0ZW4gdG8gcGxheWVyIGRpc2Nvbm5lY3Rpb25zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgcGxheWVyIGxlYXZpbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkxlYXZlKG5hbWUpIHtcclxuICAgIGxlYXZlTWVzc2FnZXMuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpKSB7XHJcbiAgICAgICAgICAgIGhlbHBlcnMuYnVpbGRBbmRTZW5kTWVzc2FnZShtc2cubWVzc2FnZSwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnbWVzc2FnZXMvaGVscGVycycpO1xyXG5jb25zdCBzZXR0aW5ncyA9IHJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG5cclxuY29uc3QgU1RPUkFHRV9JRCA9ICd0cmlnZ2VyQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ1RyaWdnZXInLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJ0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2PlxcclxcbiAgICAgICAgPGxhYmVsPlRyaWdnZXI6IDxpbnB1dCBjbGFzcz1cXFwidFxcXCI+PC9sYWJlbD5cXHJcXG4gICAgICAgIDxsYWJlbD5NZXNzYWdlOiA8dGV4dGFyZWEgY2xhc3M9XFxcIm1cXFwiPjwvdGV4dGFyZWE+PC9sYWJlbD5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48L3NwYW4+XFxyXFxuICAgICAgICA8ZGV0YWlscz48c3VtbWFyeT5Nb3JlIG9wdGlvbnM8L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpczogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwiZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJTdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiTW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiT3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJOb2JvZHlcXFwiPm5vYm9keTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJTdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiTW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiT3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICA8L2RldGFpbHM+XFxyXFxuICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfdHJpZ2dlclxcXCI+XFxyXFxuICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuZXZlciBzb21lb25lIHNheXMgc29tZXRoaW5nLjwvaDM+XFxyXFxuICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLiBJZiB5b3UgcHV0IGFuIGFzdGVyaXNrICgqKSBpbiB5b3VyIHRyaWdnZXIsIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyBhIHdpbGRjYXJkLiAoVHJpZ2dlciBcXFwidGUqc3RcXFwiIHdpbGwgbWF0Y2ggXFxcInRlYSBzdHVmZlxcXCIgYW5kIFxcXCJ0ZXN0XFxcIik8L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj4rPC9zcGFuPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJ0TXNnc1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBjaGVja1RyaWdnZXJzKSxcclxufTtcclxuXHJcbnZhciB0cmlnZ2VyTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbnRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0VGVtcGxhdGUnLCAnI3RNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLnQnLCB2YWx1ZTogbXNnLnRyaWdnZXIgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ0FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ05vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhdmVzIHRoZSBjdXJyZW50IHRyaWdnZXIgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUgfHwgIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXJNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIHRyaWdnZXI6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgdHJpZ2dlck1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBhIHRyaWdnZXIgYWdhaW5zdCBhIG1lc3NhZ2UgdG8gc2VlIGlmIGl0IG1hdGNoZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0cmlnZ2VyIHRoZSB0cmlnZ2VyIHRvIHRyeSB0byBtYXRjaFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gdHJpZ2dlck1hdGNoKHRyaWdnZXIsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5yZWdleFRyaWdnZXJzKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodHJpZ2dlciwgJ2knKS50ZXN0KG1lc3NhZ2UpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdWkubm90aWZ5KGBTa2lwcGluZyB0cmlnZ2VyICcke3RyaWdnZXJ9JyBhcyB0aGUgUmVnRXggaXMgaW52YWlsZC5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICB0cmlnZ2VyXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFsuKz9ePSE6JHt9KCl8XFxbXFxdXFwvXFxcXF0pL2csIFwiXFxcXCQxXCIpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqL2csIFwiLipcIiksXHJcbiAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICkudGVzdChtZXNzYWdlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaW5jb21pbmcgcGxheWVyIG1lc3NhZ2VzIGZvciB0cmlnZ2Vyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgcGxheWVyJ3MgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tUcmlnZ2VycyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgdG90YWxBbGxvd2VkID0gc2V0dGluZ3MubWF4UmVzcG9uc2VzO1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAodG90YWxBbGxvd2VkICYmIGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykgJiYgdHJpZ2dlck1hdGNoKG1zZy50cmlnZ2VyLCBtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgICAgICB0b3RhbEFsbG93ZWQtLTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9wcmVmZXJlbmNlcyc7XHJcblxyXG52YXIgcHJlZnMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCB7fSwgZmFsc2UpO1xyXG5cclxuLy8gQXV0byBzYXZlIG9uIGNoYW5nZVxyXG4vLyBJRSAoYWxsKSAvIFNhZmFyaSAoPCAxMCkgZG9lc24ndCBzdXBwb3J0IHByb3hpZXNcclxuaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwcmVmcztcclxuICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICB9LCAzMCAqIDEwMDApO1xyXG59IGVsc2Uge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBuZXcgUHJveHkocHJlZnMsIHtcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKG9iaiwgcHJvcCwgdmFsKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnZhciBwcmVmc01hcCA9IFtcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnYW5ub3VuY2VtZW50RGVsYXknLCBkZWZhdWx0OiAxMH0sXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ21heFJlc3BvbnNlcycsIGRlZmF1bHQ6IDJ9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnbm90aWZ5JywgZGVmYXVsdDogdHJ1ZX0sXHJcbiAgICAvLyBBZHZhbmNlZFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnZGlzYWJsZVRyaW0nLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdyZWdleFRyaWdnZXJzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnc3BsaXRNZXNzYWdlcycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAndGV4dCcsIGtleTogJ3NwbGl0VG9rZW4nLCBkZWZhdWx0OiAnPHNwbGl0Pid9LFxyXG5dO1xyXG5cclxucHJlZnNNYXAuZm9yRWFjaChwcmVmID0+IHtcclxuICAgIC8vIFNldCBkZWZhdWx0cyBpZiBub3Qgc2V0XHJcbiAgICBpZiAodHlwZW9mIHByZWZzW3ByZWYua2V5XSAhPSAgcHJlZi50eXBlKSB7XHJcbiAgICAgICAgcHJlZnNbcHJlZi5rZXldID0gcHJlZi5kZWZhdWx0O1xyXG4gICAgfVxyXG59KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBwcmVmcyA9IHJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignU2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIiNtYl9zZXR0aW5ncyBoM3tib3JkZXItYm90dG9tOjFweCBzb2xpZCAjOTk5fVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8ZGl2IGlkPVxcXCJtYl9zZXR0aW5nc1xcXCI+XFxyXFxuICAgIDxoMz5TZXR0aW5nczwvaDM+XFxyXFxuICAgIDxsYWJlbD5NaW51dGVzIGJldHdlZW4gYW5ub3VuY2VtZW50czo8L2xhYmVsPjxicj5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwiYW5ub3VuY2VtZW50RGVsYXlcXFwiIHR5cGU9XFxcIm51bWJlclxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+TWF4aW11bSB0cmlnZ2VyIHJlc3BvbnNlcyB0byBhIG1lc3NhZ2U6PC9sYWJlbD48YnI+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcIm1heFJlc3BvbnNlc1xcXCIgdHlwZT1cXFwibnVtYmVyXFxcIj48YnI+XFxyXFxuICAgIDxsYWJlbD5OZXcgY2hhdCBub3RpZmljYXRpb25zOiA8L2xhYmVsPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJub3RpZnlcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj48YnI+XFxyXFxuXFxyXFxuICAgIDxoMz5BZHZhbmNlZCBTZXR0aW5ncyAtIDxzbWFsbD48YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vQmlibGlvZmlsZS9CbG9ja2hlYWRzLU1lc3NhZ2VCb3Qvd2lraS8xLi1BZHZhbmNlZC1PcHRpb25zL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlJlYWQgdGhpcyBmaXJzdDwvYT48L3NtYWxsPjwvaDM+XFxyXFxuICAgIDxsYWJlbD5EaXNhYmxlIHdoaXRlc3BhY2UgdHJpbW1pbmc6IDwvbGFiZWw+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcImRpc2FibGVUcmltXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+UGFyc2UgdHJpZ2dlcnMgYXMgUmVnRXg6IDwvbGFiZWw+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInJlZ2V4VHJpZ2dlcnNcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj48YnI+XFxyXFxuICAgIDxsYWJlbD5TcGxpdCBtZXNzYWdlczogPC9sYWJlbD5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwic3BsaXRNZXNzYWdlc1xcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPjxicj5cXHJcXG4gICAgPGxhYmVsPlNwbGl0IHRva2VuOiA8L2xhYmVsPjxicj5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwic3BsaXRUb2tlblxcXCIgdHlwZT1cXFwidGV4dFxcXCI+XFxyXFxuXFxyXFxuICAgIDxoMz5CYWNrdXAgLyBSZXN0b3JlPC9oMz5cXHJcXG4gICAgPGEgaWQ9XFxcIm1iX2JhY2t1cF9zYXZlXFxcIj5HZXQgYmFja3VwIGNvZGU8L2E+PGJyPlxcclxcbiAgICA8YSBpZD1cXFwibWJfYmFja3VwX2xvYWRcXFwiPkxvYWQgcHJldmlvdXMgYmFja3VwPC9hPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJtYl9iYWNrdXBcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy8gU2hvdyBwcmVmc1xyXG5PYmplY3Qua2V5cyhwcmVmcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgdmFyIGVsID0gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApO1xyXG4gICAgc3dpdGNoICh0eXBlb2YgcHJlZnNba2V5XSkge1xyXG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgICAgICBlbC5jaGVja2VkID0gcHJlZnNba2V5XTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgZWwudmFsdWUgPSBwcmVmc1trZXldO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG4vLyBXYXRjaCBmb3IgY2hhbmdlc1xyXG50YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIHZhciBnZXRWYWx1ZSA9IChrZXkpID0+IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKS52YWx1ZTtcclxuICAgIHZhciBnZXRJbnQgPSAoa2V5KSA9PiArZ2V0VmFsdWUoa2V5KTtcclxuICAgIHZhciBnZXRDaGVja2VkID0gKGtleSkgPT4gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApLmNoZWNrZWQ7XHJcblxyXG4gICAgT2JqZWN0LmtleXMocHJlZnMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICB2YXIgZnVuYztcclxuXHJcbiAgICAgICAgc3dpdGNoKHR5cGVvZiBwcmVmc1trZXldKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldENoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRJbnQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByZWZzW2tleV0gPSBmdW5jKGtleSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5cclxuLy8gR2V0IGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9zYXZlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBzaG93QmFja3VwKCkge1xyXG4gICAgdmFyIGJhY2t1cCA9IEpTT04uc3RyaW5naWZ5KGxvY2FsU3RvcmFnZSkucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xyXG4gICAgdWkuYWxlcnQoYENvcHkgdGhpcyB0byBhIHNhZmUgcGxhY2U6PGJyPjx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOiBjYWxjKDEwMCUgLSA3cHgpO2hlaWdodDoxNjBweDtcIj4ke2JhY2t1cH08L3RleHRhcmVhPmApO1xyXG59KTtcclxuXHJcblxyXG4vLyBMb2FkIGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9sb2FkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBsb2FkQmFja3VwKCkge1xyXG4gICAgdWkuYWxlcnQoJ0VudGVyIHRoZSBiYWNrdXAgY29kZTo8dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDpjYWxjKDEwMCUgLSA3cHgpO2hlaWdodDoxNjBweDtcIj48L3RleHRhcmVhPicsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnTG9hZCAmIHJlZnJlc2ggcGFnZScsIHN0eWxlOiAnc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IHRleHRhcmVhJykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gSlNPTi5wYXJzZShjb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhY2t1cCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1aS5ub3RpZnkoJ0ludmFsaWQgYmFja3VwIGNvZGUuIE5vIGFjdGlvbiB0YWtlbi4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb2RlKS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgY29kZVtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnQ2FuY2VsJyB9XHJcbiAgICAgICAgICAgICAgICBdKTtcclxufSk7XHJcbiIsIi8vIE92ZXJ3cml0ZSB0aGUgcG9sbENoYXQgZnVuY3Rpb24gdG8ga2lsbCB0aGUgZGVmYXVsdCBjaGF0IGZ1bmN0aW9uXHJcbndpbmRvdy5wb2xsQ2hhdCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG4vLyBPdmVyd3JpdGUgdGhlIG9sZCBwYWdlXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gJyc7XHJcbi8vIFN0eWxlIHJlc2V0XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0eXBlPVwidGV4dC9jc3NcIl0nKVxyXG4gICAgLmZvckVhY2goZWwgPT4gZWwucmVtb3ZlKCkpO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndGl0bGUnKS50ZXh0Q29udGVudCA9ICdDb25zb2xlIC0gTWVzc2FnZUJvdCc7XHJcblxyXG4vLyBTZXQgdGhlIGljb24gdG8gdGhlIGJsb2NraGVhZCBpY29uIHVzZWQgb24gdGhlIGZvcnVtc1xyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XHJcbmVsLnJlbCA9ICdpY29uJztcclxuZWwuaHJlZiA9ICdodHRwczovL2lzLmdkL01CdlVIRic7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxucmVxdWlyZSgndWkvcG9seWZpbGxzL2NvbnNvbGUnKTtcclxucmVxdWlyZSgnYm90L21pZ3JhdGlvbicpO1xyXG5cclxuLy8gRXhwb3NlIHRoZSBleHRlbnNpb24gQVBJXHJcbndpbmRvdy5NZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG5cclxuY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2JoZmFuc2FwaScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5ob29rLm9uKCdlcnJvcl9yZXBvcnQnLCBmdW5jdGlvbihtc2cpIHtcclxuICAgIHVpLm5vdGlmeShtc2cpO1xyXG59KTtcclxuXHJcblxyXG5yZXF1aXJlKCdjb25zb2xlJyk7XHJcbi8vIEJ5IGRlZmF1bHQgbm8gdGFiIGlzIHNlbGVjdGVkLCBzaG93IHRoZSBjb25zb2xlLlxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiBzcGFuJykuY2xpY2soKTtcclxucmVxdWlyZSgnbWVzc2FnZXMnKTtcclxucmVxdWlyZSgnZXh0ZW5zaW9ucycpO1xyXG5yZXF1aXJlKCdzZXR0aW5ncy9wYWdlJyk7XHJcblxyXG4vLyBFcnJvciByZXBvcnRpbmdcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGVycikgPT4ge1xyXG4gICAgaWYgKGVyci5tZXNzYWdlICE9ICdTY3JpcHQgZXJyb3InKSB7XHJcbiAgICAgICAgYmhmYW5zYXBpLnJlcG9ydEVycm9yKGVycik7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJyZXF1aXJlKCcuL3BvbHlmaWxscy9kZXRhaWxzJyk7XHJcblxyXG4vLyBCdWlsZCB0aGUgQVBJXHJcbk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vbGF5b3V0JyksXHJcbiAgICByZXF1aXJlKCcuL3RlbXBsYXRlJyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmaWNhdGlvbnMnKVxyXG4pO1xyXG5cclxuLy8gRnVuY3Rpb25zIHdoaWNoIGFyZSBubyBsb25nZXIgY29udGFpbmVkIGluIHRoaXMgbW9kdWxlLCBidXQgYXJlIHJldGFpbmVkIGZvciBub3cgZm9yIGJhY2t3YXJkIGNvbXBhdGFiaWxpdHkuXHJcbmNvbnN0IHdyaXRlID0gcmVxdWlyZSgnY29uc29sZS9leHBvcnRzJykud3JpdGU7XHJcbm1vZHVsZS5leHBvcnRzLmFkZE1lc3NhZ2VUb0NvbnNvbGUgPSBmdW5jdGlvbihtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIGNvbnNvbGUud2FybigndWkuYWRkTWVzc2FnZVRvQ29uc29sZSBoYXMgYmVlbiBkZXByaWNhdGVkLiBVc2UgZXguY29uc29sZS53cml0ZSBpbnN0ZWFkLicpO1xyXG4gICAgd3JpdGUobXNnLCBuYW1lLCBuYW1lQ2xhc3MpO1xyXG59O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIGZvciBtYW5hZ2luZyB0aGUgcGFnZSBsYXlvdXRcclxuICovXHJcblxyXG5cclxuXHJcbi8vIEJ1aWxkIHBhZ2UgLSBvbmx5IGNhc2UgaW4gd2hpY2ggYm9keS5pbm5lckhUTUwgc2hvdWxkIGJlIHVzZWQuXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MICs9IFwiPGRpdiBpZD1cXFwibGVmdE5hdlxcXCI+XFxyXFxuICAgIDxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgaWQ9XFxcImxlZnRUb2dnbGVcXFwiPlxcclxcbiAgICA8bGFiZWwgZm9yPVxcXCJsZWZ0VG9nZ2xlXFxcIj4mIzk3NzY7IE1lbnU8L2xhYmVsPlxcclxcblxcclxcbiAgICA8bmF2IGRhdGEtdGFiLWdyb3VwPVxcXCJtYWluXFxcIj48L25hdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwib3ZlcmxheVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuPGRpdiBpZD1cXFwiY29udGFpbmVyXFxcIj5cXHJcXG4gICAgPGhlYWRlcj48L2hlYWRlcj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5pbm5lckhUTUwgKz0gJzxzdHlsZT4nICsgXCJodG1sLGJvZHl7bWluLWhlaWdodDoxMDB2aDtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxMDAlO21hcmdpbjowO2ZvbnQtZmFtaWx5OlxcXCJMdWNpZGEgR3JhbmRlXFxcIixcXFwiTHVjaWRhIFNhbnMgVW5pY29kZVxcXCIsVmVyZGFuYSxzYW5zLXNlcmlmO2NvbG9yOiMwMDB9dGV4dGFyZWEsaW5wdXQsYnV0dG9uLHNlbGVjdHtmb250LWZhbWlseTppbmhlcml0fWF7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6IzE4MmI3M30jbGVmdE5hdnt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9I2xlZnROYXYgbmF2e3dpZHRoOjI1MHB4O2JhY2tncm91bmQ6IzE4MmI3Mztjb2xvcjojZmZmO3Bvc2l0aW9uOmZpeGVkO2xlZnQ6LTI1MHB4O3otaW5kZXg6MTAwO3RvcDowO2JvdHRvbTowO3RyYW5zaXRpb246bGVmdCAuNXN9I2xlZnROYXYgZGV0YWlscywjbGVmdE5hdiBzcGFue2Rpc3BsYXk6YmxvY2s7dGV4dC1hbGlnbjpjZW50ZXI7cGFkZGluZzo1cHggN3B4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHdoaXRlfSNsZWZ0TmF2IC5zZWxlY3RlZHtiYWNrZ3JvdW5kOnJhZGlhbC1ncmFkaWVudCgjOWZhZmViLCAjMTgyYjczKX0jbGVmdE5hdiBzdW1tYXJ5IH4gc3BhbntiYWNrZ3JvdW5kOnJnYmEoMTU5LDE3NSwyMzUsMC40KX0jbGVmdE5hdiBzdW1tYXJ5K3NwYW57Ym9yZGVyLXRvcC1sZWZ0LXJhZGl1czoyMHB4O2JvcmRlci10b3AtcmlnaHQtcmFkaXVzOjIwcHh9I2xlZnROYXYgc3VtbWFyeSB+IHNwYW46bGFzdC1vZi10eXBle2JvcmRlcjowO2JvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6MjBweDtib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czoyMHB4fSNsZWZ0TmF2IGlucHV0e2Rpc3BsYXk6bm9uZX0jbGVmdE5hdiBsYWJlbHtjb2xvcjojZmZmO2JhY2tncm91bmQ6IzIxM2I5ZDtwYWRkaW5nOjVweDtwb3NpdGlvbjpmaXhlZDt0b3A6NXB4O3otaW5kZXg6MTAwO2xlZnQ6NXB4O29wYWNpdHk6MTt0cmFuc2l0aW9uOmxlZnQgLjVzLG9wYWNpdHkgLjVzfSNsZWZ0TmF2IGlucHV0OmNoZWNrZWQgfiBuYXZ7bGVmdDowO3RyYW5zaXRpb246bGVmdCAuNXN9I2xlZnROYXYgaW5wdXQ6Y2hlY2tlZCB+IGxhYmVse2xlZnQ6MjU1cHg7b3BhY2l0eTowO3RyYW5zaXRpb246bGVmdCAuNXMsb3BhY2l0eSAuNXN9I2xlZnROYXYgaW5wdXQ6Y2hlY2tlZCB+IC5vdmVybGF5e3Zpc2liaWxpdHk6dmlzaWJsZTtvcGFjaXR5OjE7dHJhbnNpdGlvbjpvcGFjaXR5IC41c31oZWFkZXJ7YmFja2dyb3VuZDojMTgyYjczIHVybChcXFwiaHR0cDovL3BvcnRhbC50aGVibG9ja2hlYWRzLm5ldC9zdGF0aWMvaW1hZ2VzL3BvcnRhbEhlYWRlci5wbmdcXFwiKSBuby1yZXBlYXQ7YmFja2dyb3VuZC1wb3NpdGlvbjo4MHB4O2hlaWdodDo4MHB4fSNjb250YWluZXI+ZGl2e2hlaWdodDpjYWxjKDEwMHZoIC0gMTAwcHgpO3BhZGRpbmc6MTBweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6ODBweDtsZWZ0OjA7cmlnaHQ6MDtvdmVyZmxvdzphdXRvfSNjb250YWluZXI+ZGl2Om5vdCgudmlzaWJsZSl7ZGlzcGxheTpub25lfS5vdmVybGF5e3Bvc2l0aW9uOmZpeGVkO3RvcDowO2xlZnQ6MDtyaWdodDowO2JvdHRvbTowO3otaW5kZXg6OTk7YmFja2dyb3VuZDpyZ2JhKDAsMCwwLDAuNyk7dmlzaWJpbGl0eTpoaWRkZW47b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAuNXN9Lm92ZXJsYXkudmlzaWJsZXt2aXNpYmlsaXR5OnZpc2libGU7b3BhY2l0eToxO3RyYW5zaXRpb246b3BhY2l0eSAuNXN9LnRvcC1yaWdodC1idXR0b257cG9zaXRpb246YWJzb2x1dGU7ZGlzcGxheTotd2Via2l0LWZsZXg7ZGlzcGxheTpmbGV4Oy13ZWJraXQtYWxpZ24taXRlbXM6Y2VudGVyO2FsaWduLWl0ZW1zOmNlbnRlcjstd2Via2l0LWp1c3RpZnktY29udGVudDpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjt0b3A6MTBweDtyaWdodDoxMnB4O3dpZHRoOjMwcHg7aGVpZ2h0OjMwcHg7YmFja2dyb3VuZDojMTgyQjczO2JvcmRlcjowO2NvbG9yOiNGRkZ9XFxuXCIgKyAnPC9zdHlsZT4nO1xyXG5cclxuLy8gSGlkZSB0aGUgbWVudSB3aGVuIGNsaWNraW5nIHRoZSBvdmVybGF5XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IC5vdmVybGF5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcbi8vIENoYW5nZSB0YWJzXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBnbG9iYWxUYWJDaGFuZ2UoZXZlbnQpIHtcclxuICAgIHZhciB0YWJOYW1lID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQudGFiTmFtZTtcclxuICAgIGlmKCF0YWJOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ29udGVudFxyXG4gICAgLy9XZSBjYW4ndCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgZHVlIHRvIGJyb3dzZXIgbGFnXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjb250YWluZXIgPiAudmlzaWJsZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKSk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjY29udGFpbmVyID4gW2RhdGEtdGFiLW5hbWU9JHt0YWJOYW1lfV1gKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcblxyXG4gICAgLy9UYWJzXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsZWZ0TmF2IC5zZWxlY3RlZCcpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJykpO1xyXG4gICAgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XHJcbn0pO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdG9nZ2xlTWVudSxcclxuICAgIGFkZFRhYixcclxuICAgIHJlbW92ZVRhYixcclxuICAgIGFkZFRhYkdyb3VwLFxyXG4gICAgcmVtb3ZlVGFiR3JvdXAsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2hvdy9oaWRlIHRoZSBtZW51LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB0b2dnbGVNZW51KCk7XHJcbiAqL1xyXG5mdW5jdGlvbiB0b2dnbGVNZW51KCkge1xyXG4gICAgdmFyIG1haW5Ub2dnbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiBpbnB1dCcpO1xyXG4gICAgbWFpblRvZ2dsZS5jaGVja2VkID0gIW1haW5Ub2dnbGUuY2hlY2tlZDtcclxufVxyXG5cclxudmFyIHRhYlVJRCA9IDA7XHJcbi8qKlxyXG4gKiBVc2VkIHRvIGFkZCBhIHRhYiB0byB0aGUgYm90J3MgbmF2aWdhdGlvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGV4dCcpO1xyXG4gKiB2YXIgdGFiMiA9IHVpLmFkZFRhYignQ3VzdG9tIE1lc3NhZ2VzJywgJ21lc3NhZ2VzJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWJUZXh0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZ3JvdXBOYW1lPW1haW5dIE9wdGlvbmFsLiBJZiBwcm92aWRlZCwgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIG9mIHRhYnMgdG8gYWRkIHRoaXMgdGFiIHRvLlxyXG4gKiBAcmV0dXJuIHtOb2RlfSAtIFRoZSBkaXYgdG8gcGxhY2UgdGFiIGNvbnRlbnQgaW4uXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRUYWIodGFiVGV4dCwgZ3JvdXBOYW1lID0gJ21haW4nKSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9ICdib3RUYWJfJyArIHRhYlVJRCsrO1xyXG5cclxuICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICB0YWIudGV4dENvbnRlbnQgPSB0YWJUZXh0O1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ3RhYicpO1xyXG4gICAgdGFiLmRhdGFzZXQudGFiTmFtZSA9IHRhYk5hbWU7XHJcblxyXG4gICAgdmFyIHRhYkNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRhYkNvbnRlbnQuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbGVmdE5hdiBbZGF0YS10YWItZ3JvdXA9JHtncm91cE5hbWV9XWApLmFwcGVuZENoaWxkKHRhYik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29udGFpbmVyJykuYXBwZW5kQ2hpbGQodGFiQ29udGVudCk7XHJcblxyXG4gICAgcmV0dXJuIHRhYkNvbnRlbnQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIGdsb2JhbCB0YWIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RhYicpO1xyXG4gKiB1aS5yZW1vdmVUYWIodGFiKTtcclxuICogQHBhcmFtIHtOb2RlfSB0YWJDb250ZW50IFRoZSBkaXYgcmV0dXJuZWQgYnkgdGhlIGFkZFRhYiBmdW5jdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYih0YWJDb250ZW50KSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbGVmdE5hdiBbZGF0YS10YWItbmFtZT0ke3RhYkNvbnRlbnQuZGF0YXNldC50YWJOYW1lfV1gKS5yZW1vdmUoKTtcclxuICAgIHRhYkNvbnRlbnQucmVtb3ZlKCk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHRhYiBncm91cCBpbiB3aGljaCB0YWJzIGNhbiBiZSBwbGFjZWQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVpLmFkZFRhYkdyb3VwKCdHcm91cCBUZXh0JywgJ3NvbWVfZ3JvdXAnKTtcclxuICogdWkuYWRkVGFiKCdXaXRoaW4gZ3JvdXAnLCAnc29tZV9ncm91cCcpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSB0ZXh0IHRoZSB1c2VyIHdpbGwgc2VlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBncm91cE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZ3JvdXAgd2hpY2ggY2FuIGJlIHVzZWQgdG8gYWRkIHRhYnMgd2l0aGluIHRoZSBncm91cC5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYkdyb3VwKHRleHQsIGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGRldGFpbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJyk7XHJcbiAgICBkZXRhaWxzLmRhdGFzZXQudGFiR3JvdXAgPSBncm91cE5hbWU7XHJcblxyXG4gICAgdmFyIHN1bW1hcnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdW1tYXJ5Jyk7XHJcbiAgICBzdW1tYXJ5LnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgIGRldGFpbHMuYXBwZW5kQ2hpbGQoc3VtbWFyeSk7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgW2RhdGEtdGFiLWdyb3VwPW1haW5dJykuYXBwZW5kQ2hpbGQoZGV0YWlscyk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHRhYiBncm91cCBhbmQgYWxsIHRhYnMgY29udGFpbmVkIHdpdGhpbiB0aGUgc3BlY2lmaWVkIGdyb3VwLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBhZGRUYWJHcm91cCgnR3JvdXAnLCAnZ3JvdXAxJyk7XHJcbiAqIHZhciBpbm5lciA9IGFkZFRhYignSW5uZXInLCAnZ3JvdXAxJyk7XHJcbiAqIHJlbW92ZVRhYkdyb3VwKCdncm91cDEnKTsgLy8gaW5uZXIgaGFzIGJlZW4gcmVtb3ZlZC5cclxuICogQHBhcmFtIHN0cmluZyBncm91cE5hbWUgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIHRoYXQgd2FzIHVzZWQgaW4gdWkuYWRkVGFiR3JvdXAuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmVUYWJHcm91cChncm91cE5hbWUpIHtcclxuICAgIHZhciBncm91cCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1ncm91cD1cIiR7Z3JvdXBOYW1lfVwiXWApO1xyXG4gICAgdmFyIGl0ZW1zID0gQXJyYXkuZnJvbShncm91cC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xyXG5cclxuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgLy9UYWIgY29udGVudFxyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT1cIiR7aXRlbS5kYXRhc2V0LnRhYk5hbWV9XCJdYCkucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBncm91cC5yZW1vdmUoKTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFsZXJ0XHJcbn07XHJcblxyXG4vKipcclxuKiBGdW5jdGlvbiB1c2VkIHRvIHJlcXVpcmUgYWN0aW9uIGZyb20gdGhlIHVzZXIuXHJcbipcclxuKiBAcGFyYW0ge3N0cmluZ30gdGV4dCB0aGUgdGV4dCB0byBkaXNwbGF5IGluIHRoZSBhbGVydFxyXG4qIEBwYXJhbSB7QXJyYXl9IGJ1dHRvbnMgYW4gYXJyYXkgb2YgYnV0dG9ucyB0byBhZGQgdG8gdGhlIGFsZXJ0LlxyXG4qICAgICAgICBGb3JtYXQ6IFt7dGV4dDogJ1Rlc3QnLCBzdHlsZTonc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKXt9LCB0aGlzQXJnOiB3aW5kb3csIGRpc21pc3M6IGZhbHNlfV1cclxuKiAgICAgICAgTm90ZTogdGV4dCBpcyB0aGUgb25seSByZXF1aXJlZCBwYXJhbWF0ZXIuIElmIG5vIGJ1dHRvbiBhcnJheSBpcyBzcGVjaWZpZWRcclxuKiAgICAgICAgdGhlbiBhIHNpbmdsZSBPSyBidXR0b24gd2lsbCBiZSBzaG93bi5cclxuKiAgICAgICAgIFByb3ZpZGVkIHN0eWxlczogc3VjY2VzcywgZGFuZ2VyLCB3YXJuaW5nLCBpbmZvXHJcbiogICAgICAgIERlZmF1bHRzOiBzdHlsZTogJycsIGFjdGlvbjogdW5kZWZpbmVkLCB0aGlzQXJnOiB1bmRlZmluZWQsIGRpc21pc3M6IHRydWVcclxuKi9cclxuZnVuY3Rpb24gYWxlcnQodGV4dCwgYnV0dG9ucyA9IFt7dGV4dDogJ09LJ31dKSB7XHJcbiAgICBpZiAoaW5zdGFuY2UuYWN0aXZlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UucXVldWUucHVzaCh7dGV4dCwgYnV0dG9uc30pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGluc3RhbmNlLmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgYnV0dG9ucy5mb3JFYWNoKGZ1bmN0aW9uKGJ1dHRvbiwgaSkge1xyXG4gICAgICAgIGJ1dHRvbi5kaXNtaXNzID0gKGJ1dHRvbi5kaXNtaXNzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9uc1snYnV0dG9uXycgKyBpXSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBidXR0b24uYWN0aW9uLFxyXG4gICAgICAgICAgICB0aGlzQXJnOiBidXR0b24udGhpc0FyZyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGRpc21pc3M6IHR5cGVvZiBidXR0b24uZGlzbWlzcyA9PSAnYm9vbGVhbicgPyBidXR0b24uZGlzbWlzcyA6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBidXR0b24uaWQgPSAnYnV0dG9uXycgKyBpO1xyXG4gICAgICAgIGJ1aWxkQnV0dG9uKGJ1dHRvbik7XHJcbiAgICB9KTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydENvbnRlbnQnKS5pbm5lckhUTUwgPSB0ZXh0O1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB+IC5vdmVybGF5JykuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0JykuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG59XHJcblxyXG4vKipcclxuICogSG9sZHMgdGhlIGN1cnJlbnQgYWxlcnQgYW5kIHF1ZXVlIG9mIGZ1cnRoZXIgYWxlcnRzLlxyXG4gKi9cclxudmFyIGluc3RhbmNlID0ge1xyXG4gICAgYWN0aXZlOiBmYWxzZSxcclxuICAgIHF1ZXVlOiBbXSxcclxuICAgIGJ1dHRvbnM6IHt9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gYWRkIGJ1dHRvbiBlbGVtZW50cyB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGJ1dHRvblxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRCdXR0b24oYnV0dG9uKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBlbC5pbm5lckhUTUwgPSBidXR0b24udGV4dDtcclxuICAgIGlmIChidXR0b24uc3R5bGUpIHtcclxuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKGJ1dHRvbi5zdHlsZSk7XHJcbiAgICB9XHJcbiAgICBlbC5pZCA9IGJ1dHRvbi5pZDtcclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9uSGFuZGxlcik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgLmJ1dHRvbnMnKS5hcHBlbmRDaGlsZChlbCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBkZXRlcm1pbmUgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgZWFjaCBidXR0b24gYWRkZWQgdG8gYW4gYWxlcnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnRcclxuICovXHJcbmZ1bmN0aW9uIGJ1dHRvbkhhbmRsZXIoZXZlbnQpIHtcclxuICAgIHZhciBidXR0b24gPSBpbnN0YW5jZS5idXR0b25zW2V2ZW50LnRhcmdldC5pZF0gfHwge307XHJcbiAgICBpZiAodHlwZW9mIGJ1dHRvbi5hY3Rpb24gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGJ1dHRvbi5hY3Rpb24uY2FsbChidXR0b24udGhpc0FyZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9SZXF1aXJlIHRoYXQgdGhlcmUgYmUgYW4gYWN0aW9uIGFzb2NpYXRlZCB3aXRoIG5vLWRpc21pc3MgYnV0dG9ucy5cclxuICAgIGlmIChidXR0b24uZGlzbWlzcyB8fCB0eXBlb2YgYnV0dG9uLmFjdGlvbiAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0JykuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB+IC5vdmVybGF5JykuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCAuYnV0dG9ucycpLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGluc3RhbmNlLmJ1dHRvbnMgPSB7fTtcclxuICAgICAgICBpbnN0YW5jZS5hY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gQXJlIG1vcmUgYWxlcnRzIHdhaXRpbmcgdG8gYmUgc2hvd24/XHJcbiAgICAgICAgaWYgKGluc3RhbmNlLnF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsZXQgbmV4dCA9IGluc3RhbmNlLnF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIGFsZXJ0KG5leHQudGV4dCwgbmV4dC5idXR0b25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcblxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2FsZXJ0JyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmeScpXHJcbik7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBcIiNhbGVydHt2aXNpYmlsaXR5OmhpZGRlbjtwb3NpdGlvbjpmaXhlZDt0b3A6NTBweDtsZWZ0OjA7cmlnaHQ6MDttYXJnaW46YXV0bzt6LWluZGV4OjEwMTt3aWR0aDo1MCU7bWluLXdpZHRoOjMwMHB4O21pbi1oZWlnaHQ6MjAwcHg7YmFja2dyb3VuZDojZmZmO2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjEwcHggMTBweCA1NXB4IDEwcHh9I2FsZXJ0LnZpc2libGV7dmlzaWJpbGl0eTp2aXNpYmxlfSNhbGVydD5kaXZ7d2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzp0b3VjaDttYXgtaGVpZ2h0OjY1dmg7b3ZlcmZsb3cteTphdXRvfSNhbGVydD4uYnV0dG9uc3twb3NpdGlvbjphYnNvbHV0ZTtib3R0b206MTBweDtsZWZ0OjVweH0jYWxlcnQ+LmJ1dHRvbnM+c3BhbntkaXNwbGF5OmlubGluZS1ibG9jaztwYWRkaW5nOjZweCAxMnB4O21hcmdpbjowIDVweDt0ZXh0LWFsaWduOmNlbnRlcjt3aGl0ZS1zcGFjZTpub3dyYXA7Y3Vyc29yOnBvaW50ZXI7Ym9yZGVyOjFweCBzb2xpZCByZ2JhKDAsMCwwLDAuMTUpO2JvcmRlci1yYWRpdXM6NnB4O2JhY2tncm91bmQ6I2ZmZiBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjZmZmIDAsICNlMGUwZTAgMTAwJSl9I2FsZXJ0Pi5idXR0b25zIFtjbGFzc117Y29sb3I6I2ZmZn0jYWxlcnQ+LmJ1dHRvbnMgLnN1Y2Nlc3N7YmFja2dyb3VuZDojNWNiODVjIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICM1Y2I4NWMgMCwgIzQxOTY0MSAxMDAlKTtib3JkZXItY29sb3I6IzNlOGYzZX0jYWxlcnQ+LmJ1dHRvbnMgLmluZm97YmFja2dyb3VuZDojNWJjMGRlIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICM1YmMwZGUgMCwgIzJhYWJkMiAxMDAlKTtib3JkZXItY29sb3I6IzI4YTRjOX0jYWxlcnQ+LmJ1dHRvbnMgLmRhbmdlcntiYWNrZ3JvdW5kOiNkOTUzNGYgbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgI2Q5NTM0ZiAwLCAjYzEyZTJhIDEwMCUpO2JvcmRlci1jb2xvcjojYjkyYzI4fSNhbGVydD4uYnV0dG9ucyAud2FybmluZ3tiYWNrZ3JvdW5kOiNmMGFkNGUgbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgI2YwYWQ0ZSAwLCAjZWI5MzE2IDEwMCUpO2JvcmRlci1jb2xvcjojZTM4ZDEzfS5ub3RpZmljYXRpb257b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAxcztwb3NpdGlvbjpmaXhlZDt0b3A6MWVtO3JpZ2h0OjFlbTttaW4td2lkdGg6MjAwcHg7Ym9yZGVyLXJhZGl1czo1cHg7cGFkZGluZzo1cHg7YmFja2dyb3VuZDojOWZhZmVifS5ub3RpZmljYXRpb24udmlzaWJsZXtvcGFjaXR5OjF9XFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuZWwuaWQgPSAnYWxlcnRXcmFwcGVyJztcclxuZWwuaW5uZXJIVE1MID0gXCI8ZGl2IGlkPVxcXCJhbGVydFxcXCI+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImFsZXJ0Q29udGVudFxcXCI+PC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImJ1dHRvbnNcXFwiLz48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIi8+PC9kaXY+XFxyXFxuXCI7XHJcblxyXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBub3RpZnksXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzZW5kIGEgbm9uLWNyaXRpY2FsIGFsZXJ0IHRvIHRoZSB1c2VyLlxyXG4gKiBTaG91bGQgYmUgdXNlZCBpbiBwbGFjZSBvZiB1aS5hbGVydCBpZiBwb3NzaWJsZSBhcyBpdCBpcyBub24tYmxvY2tpbmcuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vU2hvd3MgYSBub3RmaWNhdGlvbiBmb3IgMiBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJyk7XHJcbiAqIC8vU2hvd3MgYSBub3RpZmljYXRpb24gZm9yIDUgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicsIDUpO1xyXG4gKiBAcGFyYW0gU3RyaW5nIHRleHQgdGhlIHRleHQgdG8gZGlzcGxheS4gU2hvdWxkIGJlIGtlcHQgc2hvcnQgdG8gYXZvaWQgdmlzdWFsbHkgYmxvY2tpbmcgdGhlIG1lbnUgb24gc21hbGwgZGV2aWNlcy5cclxuICogQHBhcmFtIE51bWJlciBkaXNwbGF5VGltZSB0aGUgbnVtYmVyIG9mIHNlY29uZHMgdG8gc2hvdyB0aGUgbm90aWZpY2F0aW9uIGZvci5cclxuICovXHJcbmZ1bmN0aW9uIG5vdGlmeSh0ZXh0LCBkaXNwbGF5VGltZSA9IDIpIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgZWwuY2xhc3NMaXN0LmFkZCgnbm90aWZpY2F0aW9uJyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbiAgICBlbC50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgfS5iaW5kKGVsKSwgZGlzcGxheVRpbWUgKiAxMDAwKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDAgKyAyMTAwKTtcclxufVxyXG4iLCIvL0lFIGRvZXNuJ3QgbGlrZSBjb25zb2xlLmxvZyB1bmxlc3MgZGV2IHRvb2xzIGFyZSBvcGVuLlxyXG5pZiAoIXdpbmRvdy5jb25zb2xlKSB7XHJcbiAgICB3aW5kb3cuY29uc29sZSA9IHt9O1xyXG4gICAgd2luZG93LmxvZyA9IHdpbmRvdy5sb2cgfHwgW107XHJcbiAgICBjb25zb2xlLmxvZyA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcclxuICAgICAgICB3aW5kb3cubG9nLnB1c2goYXJncyk7XHJcbiAgICB9O1xyXG59XHJcblsnaW5mbycsICdlcnJvcicsICd3YXJuJywgJ2Fzc2VydCddLmZvckVhY2gobWV0aG9kID0+IHtcclxuICAgIGlmICghY29uc29sZVttZXRob2RdKSB7XHJcbiAgICAgICAgY29uc29sZVttZXRob2RdID0gY29uc29sZS5sb2c7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCIvL0RldGFpbHMgcG9seWZpbGwsIG9sZGVyIGZpcmVmb3gsIElFXHJcbmlmICghKCdvcGVuJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJykpKSB7XHJcbiAgICBsZXQgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gICAgc3R5bGUudGV4dENvbnRlbnQgKz0gYGRldGFpbHM6bm90KFtvcGVuXSkgPiA6bm90KHN1bW1hcnkpIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9IGRldGFpbHMgPiBzdW1tYXJ5OmJlZm9yZSB7IGNvbnRlbnQ6IFwi4pa2XCI7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgZm9udC1zaXplOiAuOGVtOyB3aWR0aDogMS41ZW07IGZvbnQtZmFtaWx5OlwiQ291cmllciBOZXdcIjsgfSBkZXRhaWxzW29wZW5dID4gc3VtbWFyeTpiZWZvcmUgeyB0cmFuc2Zvcm06IHJvdGF0ZSg5MGRlZyk7IH1gO1xyXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgPT0gJ1NVTU1BUlknKSB7XHJcbiAgICAgICAgICAgIGxldCBkZXRhaWxzID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWRldGFpbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRldGFpbHMuZ2V0QXR0cmlidXRlKCdvcGVuJykpIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5yZW1vdmVBdHRyaWJ1dGUoJ29wZW4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnNldEF0dHJpYnV0ZSgnb3BlbicsICdvcGVuJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCIvLyBJRSBGaXhcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuICAgIGlmICghKCdjb250ZW50JyBpbiB0ZW1wbGF0ZSkpIHtcclxuICAgICAgICBsZXQgY29udGVudCA9IHRlbXBsYXRlLmNoaWxkTm9kZXM7XHJcbiAgICAgICAgbGV0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbnRlbnQubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY29udGVudFtqXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZS5jb250ZW50ID0gZnJhZ21lbnQ7XHJcbiAgICB9XHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlLFxyXG59O1xyXG5cclxudmFyIHBvbHlmaWxsID0gcmVxdWlyZSgndWkvcG9seWZpbGxzL3RlbXBsYXRlJyk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjbG9uZSBhIHRlbXBsYXRlIGFmdGVyIGFsdGVyaW5nIHRoZSBwcm92aWRlZCBydWxlcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdGVtcGxhdGUnLCAnI3RhcmdldCcsIFt7c2VsZWN0b3I6ICdpbnB1dCcsIHZhbHVlOiAnVmFsdWUnfV0pO1xyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJ3RlbXBsYXRlJywgJ2RpdicsIFt7c2VsZWN0b3I6ICdhJywgcmVtb3ZlOiBbJ2hyZWYnXSwgbXVsdGlwbGU6IHRydWV9XSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRTZWxlY3RvclxyXG4gKiBAcGFyYW0ge2FycmF5fSBydWxlcyBmb3JtYXQ6IGFycmF5IG9mIG9iamVjdHNcclxuICogICAgICBlYWNoIG9iamVjdCBtdXN0IGhhdmUgXCJzZWxlY3RvclwiLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwibXVsdGlwbGVcIiBzZXQgdG8gdXBkYXRlIGFsbCBtYXRjaGluZyBlbGVtZW50cy5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInJlbW92ZVwiIC0gYW4gYXJyYXkgb2YgYXR0cmlidXRlcyB0byByZW1vdmUuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJ0ZXh0XCIgb3IgXCJodG1sXCIgLSBmdXJ0aGVyIGtleXMgd2lsbCBiZSBzZXQgYXMgYXR0cmlidXRlcy5cclxuICogICAgICBpZiBib3RoIHRleHQgYW5kIGh0bWwgYXJlIHNldCwgdGV4dCB3aWxsIHRha2UgcHJlY2VuZGVuY2UuXHJcbiAqICAgICAgcnVsZXMgd2lsbCBiZSBwYXJzZWQgaW4gdGhlIG9yZGVyIHRoYXQgdGhleSBhcmUgcHJlc2VudCBpbiB0aGUgYXJyYXkuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUodGVtcGxhdGVTZWxlY3RvciwgdGFyZ2V0U2VsZWN0b3IsIHJ1bGVzID0gW10pIHtcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGVtcGxhdGVTZWxlY3Rvcik7XHJcblxyXG4gICAgcG9seWZpbGwodGVtcGxhdGUpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcclxuXHJcbiAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSk7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXRTZWxlY3RvcikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuaW1wb3J0Tm9kZShjb250ZW50LCB0cnVlKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBhcHBseSBydWxlcyB0byB0aGUgdGVtcGxhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGVudCAtIHRoZSBjb250ZW50IG9mIHRoZSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgLSB0aGUgcnVsZSB0byBhcHBseS5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkge1xyXG4gICAgaWYgKHJ1bGUubXVsdGlwbGUpIHtcclxuICAgICAgICBsZXQgZWxzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKHJ1bGUuc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBBcnJheS5mcm9tKGVscylcclxuICAgICAgICAgICAgLmZvckVhY2goZWwgPT4gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgZWwgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3IocnVsZS5zZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCFlbCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFVuYWJsZSB0byB1cGRhdGUgJHtydWxlLnNlbGVjdG9yfS5gLCBydWxlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlRWxlbWVudChlbCwgcnVsZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byB1cGRhdGUgYW4gZWxlbWVudCB3aXRoIGEgcnVsZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBlbCB0aGUgZWxlbWVudCB0byBhcHBseSB0aGUgcnVsZXMgdG8uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIHRoZSBydWxlIG9iamVjdC5cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpIHtcclxuICAgIGlmICgndGV4dCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gcnVsZS50ZXh0O1xyXG4gICAgfSBlbHNlIGlmICgnaHRtbCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9IHJ1bGUuaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3Qua2V5cyhydWxlKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICFbJ3NlbGVjdG9yJywgJ3RleHQnLCAnaHRtbCcsICdyZW1vdmUnLCAnbXVsdGlwbGUnXS5pbmNsdWRlcyhrZXkpKVxyXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBydWxlW2tleV0pKTtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShydWxlLnJlbW92ZSkpIHtcclxuICAgICAgICBydWxlLnJlbW92ZS5mb3JFYWNoKGtleSA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICB9XHJcbn1cclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBjb21wYXJlIGFuZCBpc0J1ZmZlciB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2Jsb2IvNjgwZTllNWU0ODhmMjJhYWMyNzU5OWE1N2RjODQ0YTYzMTU5MjhkZC9pbmRleC5qc1xuLy8gb3JpZ2luYWwgbm90aWNlOlxuXG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciB4ID0gYS5sZW5ndGg7XG4gIHZhciB5ID0gYi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV07XG4gICAgICB5ID0gYltpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGlzQnVmZmVyKGIpIHtcbiAgaWYgKGdsb2JhbC5CdWZmZXIgJiYgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihiKTtcbiAgfVxuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKTtcbn1cblxuLy8gYmFzZWQgb24gbm9kZSBhc3NlcnQsIG9yaWdpbmFsIG5vdGljZTpcblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBmdW5jdGlvbnNIYXZlTmFtZXMgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZm9vKCkge30ubmFtZSA9PT0gJ2Zvbyc7XG59KCkpO1xuZnVuY3Rpb24gcFRvU3RyaW5nIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuZnVuY3Rpb24gaXNWaWV3KGFycmJ1Zikge1xuICBpZiAoaXNCdWZmZXIoYXJyYnVmKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIGdsb2JhbC5BcnJheUJ1ZmZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXcoYXJyYnVmKTtcbiAgfVxuICBpZiAoIWFycmJ1Zikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoYXJyYnVmIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoYXJyYnVmLmJ1ZmZlciAmJiBhcnJidWYuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG52YXIgcmVnZXggPSAvXFxzKmZ1bmN0aW9uXFxzKyhbXlxcKFxcc10qKVxccyovO1xuLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2xqaGFyYi9mdW5jdGlvbi5wcm90b3R5cGUubmFtZS9ibG9iL2FkZWVlZWM4YmZjYzYwNjhiMTg3ZDdkOWZiM2Q1YmIxZDNhMzA4OTkvaW1wbGVtZW50YXRpb24uanNcbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzKSB7XG4gICAgcmV0dXJuIGZ1bmMubmFtZTtcbiAgfVxuICB2YXIgc3RyID0gZnVuYy50b1N0cmluZygpO1xuICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2gocmVnZXgpO1xuICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2hbMV07XG59XG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gZ2V0TmFtZShzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodHlwZW9mIHMgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5mdW5jdGlvbiBpbnNwZWN0KHNvbWV0aGluZykge1xuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzIHx8ICF1dGlsLmlzRnVuY3Rpb24oc29tZXRoaW5nKSkge1xuICAgIHJldHVybiB1dGlsLmluc3BlY3Qoc29tZXRoaW5nKTtcbiAgfVxuICB2YXIgcmF3bmFtZSA9IGdldE5hbWUoc29tZXRoaW5nKTtcbiAgdmFyIG5hbWUgPSByYXduYW1lID8gJzogJyArIHJhd25hbWUgOiAnJztcbiAgcmV0dXJuICdbRnVuY3Rpb24nICsgIG5hbWUgKyAnXSc7XG59XG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5hY3R1YWwpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmV4cGVjdGVkKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5kZWVwU3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBkZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwU3RyaWN0RXF1YWwnLCBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgJiYgaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUoYWN0dWFsLCBleHBlY3RlZCkgPT09IDA7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKChhY3R1YWwgPT09IG51bGwgfHwgdHlwZW9mIGFjdHVhbCAhPT0gJ29iamVjdCcpICYmXG4gICAgICAgICAgICAgKGV4cGVjdGVkID09PSBudWxsIHx8IHR5cGVvZiBleHBlY3RlZCAhPT0gJ29iamVjdCcpKSB7XG4gICAgcmV0dXJuIHN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gSWYgYm90aCB2YWx1ZXMgYXJlIGluc3RhbmNlcyBvZiB0eXBlZCBhcnJheXMsIHdyYXAgdGhlaXIgdW5kZXJseWluZ1xuICAvLyBBcnJheUJ1ZmZlcnMgaW4gYSBCdWZmZXIgZWFjaCB0byBpbmNyZWFzZSBwZXJmb3JtYW5jZVxuICAvLyBUaGlzIG9wdGltaXphdGlvbiByZXF1aXJlcyB0aGUgYXJyYXlzIHRvIGhhdmUgdGhlIHNhbWUgdHlwZSBhcyBjaGVja2VkIGJ5XG4gIC8vIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgKGFrYSBwVG9TdHJpbmcpLiBOZXZlciBwZXJmb3JtIGJpbmFyeVxuICAvLyBjb21wYXJpc29ucyBmb3IgRmxvYXQqQXJyYXlzLCB0aG91Z2gsIHNpbmNlIGUuZy4gKzAgPT09IC0wIGJ1dCB0aGVpclxuICAvLyBiaXQgcGF0dGVybnMgYXJlIG5vdCBpZGVudGljYWwuXG4gIH0gZWxzZSBpZiAoaXNWaWV3KGFjdHVhbCkgJiYgaXNWaWV3KGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgIHBUb1N0cmluZyhhY3R1YWwpID09PSBwVG9TdHJpbmcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgIShhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcbiAgICAgICAgICAgICAgIGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkpIHtcbiAgICByZXR1cm4gY29tcGFyZShuZXcgVWludDhBcnJheShhY3R1YWwuYnVmZmVyKSxcbiAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShleHBlY3RlZC5idWZmZXIpKSA9PT0gMDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgIT09IGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBtZW1vcyA9IG1lbW9zIHx8IHthY3R1YWw6IFtdLCBleHBlY3RlZDogW119O1xuXG4gICAgdmFyIGFjdHVhbEluZGV4ID0gbWVtb3MuYWN0dWFsLmluZGV4T2YoYWN0dWFsKTtcbiAgICBpZiAoYWN0dWFsSW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoYWN0dWFsSW5kZXggPT09IG1lbW9zLmV4cGVjdGVkLmluZGV4T2YoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbW9zLmFjdHVhbC5wdXNoKGFjdHVhbCk7XG4gICAgbWVtb3MuZXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG5cbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykge1xuICBpZiAoYSA9PT0gbnVsbCB8fCBhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gbnVsbCB8fCBiID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSlcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgaWYgKHN0cmljdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSk7XG4gIHZhciBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIsIHN0cmljdCk7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKTtcbiAgdmFyIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgdmFyIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT09IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQubm90RGVlcFN0cmljdEVxdWFsID0gbm90RGVlcFN0cmljdEVxdWFsO1xuZnVuY3Rpb24gbm90RGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwU3RyaWN0RXF1YWwnLCBub3REZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59XG5cblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElnbm9yZS4gIFRoZSBpbnN0YW5jZW9mIGNoZWNrIGRvZXNuJ3Qgd29yayBmb3IgYXJyb3cgZnVuY3Rpb25zLlxuICB9XG5cbiAgaWYgKEVycm9yLmlzUHJvdG90eXBlT2YoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIF90cnlCbG9jayhibG9jaykge1xuICB2YXIgZXJyb3I7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh0eXBlb2YgYmxvY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJsb2NrXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICBhY3R1YWwgPSBfdHJ5QmxvY2soYmxvY2spO1xuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIHVzZXJQcm92aWRlZE1lc3NhZ2UgPSB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZyc7XG4gIHZhciBpc1Vud2FudGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIHV0aWwuaXNFcnJvcihhY3R1YWwpO1xuICB2YXIgaXNVbmV4cGVjdGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIGFjdHVhbCAmJiAhZXhwZWN0ZWQ7XG5cbiAgaWYgKChpc1Vud2FudGVkRXhjZXB0aW9uICYmXG4gICAgICB1c2VyUHJvdmlkZWRNZXNzYWdlICYmXG4gICAgICBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHxcbiAgICAgIGlzVW5leHBlY3RlZEV4Y2VwdGlvbikge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyh0cnVlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MoZmFsc2UsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB0aHJvdyBlcnI7IH07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiLypnbG9iYWwgd2luZG93LCBnbG9iYWwqL1xudmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKVxudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIilcbnZhciBub3cgPSByZXF1aXJlKFwiZGF0ZS1ub3dcIilcblxudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlXG52YXIgY29uc29sZVxudmFyIHRpbWVzID0ge31cblxuaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgJiYgZ2xvYmFsLmNvbnNvbGUpIHtcbiAgICBjb25zb2xlID0gZ2xvYmFsLmNvbnNvbGVcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cuY29uc29sZSkge1xuICAgIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZVxufSBlbHNlIHtcbiAgICBjb25zb2xlID0ge31cbn1cblxudmFyIGZ1bmN0aW9ucyA9IFtcbiAgICBbbG9nLCBcImxvZ1wiXSxcbiAgICBbaW5mbywgXCJpbmZvXCJdLFxuICAgIFt3YXJuLCBcIndhcm5cIl0sXG4gICAgW2Vycm9yLCBcImVycm9yXCJdLFxuICAgIFt0aW1lLCBcInRpbWVcIl0sXG4gICAgW3RpbWVFbmQsIFwidGltZUVuZFwiXSxcbiAgICBbdHJhY2UsIFwidHJhY2VcIl0sXG4gICAgW2RpciwgXCJkaXJcIl0sXG4gICAgW2NvbnNvbGVBc3NlcnQsIFwiYXNzZXJ0XCJdXG5dXG5cbmZvciAodmFyIGkgPSAwOyBpIDwgZnVuY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHR1cGxlID0gZnVuY3Rpb25zW2ldXG4gICAgdmFyIGYgPSB0dXBsZVswXVxuICAgIHZhciBuYW1lID0gdHVwbGVbMV1cblxuICAgIGlmICghY29uc29sZVtuYW1lXSkge1xuICAgICAgICBjb25zb2xlW25hbWVdID0gZlxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb25zb2xlXG5cbmZ1bmN0aW9uIGxvZygpIHt9XG5cbmZ1bmN0aW9uIGluZm8oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiB3YXJuKCkge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gZXJyb3IoKSB7XG4gICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gdGltZShsYWJlbCkge1xuICAgIHRpbWVzW2xhYmVsXSA9IG5vdygpXG59XG5cbmZ1bmN0aW9uIHRpbWVFbmQobGFiZWwpIHtcbiAgICB2YXIgdGltZSA9IHRpbWVzW2xhYmVsXVxuICAgIGlmICghdGltZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBzdWNoIGxhYmVsOiBcIiArIGxhYmVsKVxuICAgIH1cblxuICAgIHZhciBkdXJhdGlvbiA9IG5vdygpIC0gdGltZVxuICAgIGNvbnNvbGUubG9nKGxhYmVsICsgXCI6IFwiICsgZHVyYXRpb24gKyBcIm1zXCIpXG59XG5cbmZ1bmN0aW9uIHRyYWNlKCkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKVxuICAgIGVyci5uYW1lID0gXCJUcmFjZVwiXG4gICAgZXJyLm1lc3NhZ2UgPSB1dGlsLmZvcm1hdC5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spXG59XG5cbmZ1bmN0aW9uIGRpcihvYmplY3QpIHtcbiAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob2JqZWN0KSArIFwiXFxuXCIpXG59XG5cbmZ1bmN0aW9uIGNvbnNvbGVBc3NlcnQoZXhwcmVzc2lvbikge1xuICAgIGlmICghZXhwcmVzc2lvbikge1xuICAgICAgICB2YXIgYXJyID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgICAgIGFzc2VydC5vayhmYWxzZSwgdXRpbC5mb3JtYXQuYXBwbHkobnVsbCwgYXJyKSlcbiAgICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG5vd1xuXG5mdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIl19
