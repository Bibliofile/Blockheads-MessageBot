function MessageBotExtension(namespace) { //jshint ignore:line
    var extension = {
        id: namespace,
        bot: window.bot,
        ui: window.botui,
        hook: window.hook,
        storage: window.storage,
    };

    extension.hook.check(`${extension.id}.loaded`);

    /**
     * Used to change whether or not the extension will be
     * Automatically loaded the next time the bot is launched.
     *
     * @param boolean shouldAutoload
     * @return void
     */
    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        window.bhfansapi.autoloadExtension(this.id, shouldAutoload);
    };

    return extension;
}
