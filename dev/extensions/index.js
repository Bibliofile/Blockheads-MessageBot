const bhfansapi = require('app/libraries/bhfansapi');
const ui = require('app/ui');
const hook = require('app/libraries/hook');
const MessageBotExtension = require('app/MessageBotExtension');

var tab = ui.addTab('Extensions');
tab.innerHTML = '<style>' +
    INCLUDE_FILE('/dev/extensions/style.css') +
    '</style>' +
    INCLUDE_FILE('/dev/extensions/tab.html');

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