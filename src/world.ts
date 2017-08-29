// The /api export of blockheads-api only contains typescript interfaces
// So no code will be imported here.
import { WorldApi, LogEntry, WorldOverview, WorldLists } from 'blockheads-api/api'

import { Player, PlayerInfo } from './player'
import { ChatWatcher } from './chatWatcher'
import { IStorage } from './storage'
import { ISimpleEvent, createSimpleEventDispatcher } from 'strongly-typed-events'

export class World {
    private _api: WorldApi
    private _storage: IStorage
    private _chatWatcher: ChatWatcher

    private _cache: {
        logs?: Promise<LogEntry[]>
        overview?: Promise<WorldOverview>
        lists?: Promise<WorldLists>
    } = {}

    private _events = {
        onJoin: createSimpleEventDispatcher<Player>(),
        onLeave: createSimpleEventDispatcher<Player>(),
        onMessage: createSimpleEventDispatcher<{player: Player, message: string}>(),
    }

    private _online: string[] = []
    private _lists: WorldLists = {adminlist: [], modlist: [], whitelist: [], blacklist: []}
    private _players: {[name: string]: PlayerInfo}
    private _commands: Map<string, (player: Player, args: string) => void> = new Map()

    constructor(api: WorldApi, storage: IStorage) {
        this._api = api
        this._storage = storage
        this._players = storage.get('mb_players', {})
        let watcher = this._chatWatcher = new ChatWatcher(api, this._online)
        watcher.onJoin.sub(({name, ip}) => {
            name = name.toLocaleUpperCase()
            let player = this._players[name] = this._players[name] || { ip, ips: [ip], joins: 0}
            player.joins++
            player.ip = ip
            if (!player.ips.includes(ip)) player.ips.push(ip)
            this._events.onJoin.dispatch(this.getPlayer(name))
        })
        watcher.onLeave.sub(name => this._events.onLeave.dispatch(this.getPlayer(name)))
        watcher.onMessage.sub(({name, message}) => {
            this._events.onMessage.dispatch({player: this.getPlayer(name), message})
            if (/^\/[^ ]/.test(message)) {
                let [, command, args] = message.match(/^\/([^ ]+) ?(.*)$/) as RegExpMatchArray
                let handler = this._commands.get(command.toLocaleUpperCase())
                if (handler) handler(this.getPlayer(name), args)
            }
        })

        this.getOverview() // Sets the owner, gets initial online players
        this.getLists() // Loads the current server lists
    }

    /**
     * Fires whenever a player joins the server
     */
    get onJoin(): ISimpleEvent<Player> {
        return this._events.onJoin.asEvent()
    }

    /**
     * Fires whenever a player leaves the server.
     */
    get onLeave(): ISimpleEvent<Player> {
        return this._events.onLeave.asEvent()
    }

    /**
     * Fires whenever a player or the server sends a message in chat.
     * Includes messages starting with /
     */
    get onMessage(): ISimpleEvent<{player: Player, message: string}> {
        return this._events.onMessage.asEvent()
    }

    /**
     * Fires whenever a message that cannot be parsed is encountered.
     */
    get onOther(): ISimpleEvent<string> {
        // This class doesn't do anything with the onOther events, so just pass it through.
        return this._chatWatcher.onOther
    }

    /**
     * Gets the currently online players
     */
    get online(): string[] {
        return [...this._online]
    }

    /**
     * Gets all players who have joined the server
     */
    get players(): Player[] {
        return Object.keys(this._players).map(this.getPlayer)
    }

    /**
     * Gets an overview of the server info
     */
    getOverview = (refresh = false): Promise<WorldOverview> => {
        if (!this._cache.overview || refresh) {
            this._cache.overview = this._api.getOverview().then(overview => {
                overview.online.forEach(name => this._online.includes(name) || this._online.push(name))
                this._players[overview.owner] = this._players[overview.owner] || { ip: '', ips: [], joins: 0 }
                this._players[overview.owner].owner = true
                return overview
            })
        }
        return this._cache.overview
            .then(overview => ({ ...overview }))
    }

    /**
     * Gets the server's lists
     */
    getLists = (refresh = false): Promise<WorldLists> => {
        if (!this._cache.lists || refresh) {
            this._cache.lists = this._api.getLists().then(lists => this._lists = lists)
        }

        return this._cache.lists
            .then(lists => ({
                adminlist: [...lists.adminlist],
                modlist: [...lists.modlist],
                whitelist: [...lists.whitelist],
                blacklist: [...lists.blacklist]
            }))
    }

    /**
     * Sets the server's lists and reloads the world lists if required.
     *
     * @param lists WorldLists one or more list to update. If a list is not provided it will not be changed.
     * @return a promise which will resolve when the lists have been updated, or throw if an error occurred.
     */
    setLists = async (lists: Partial<WorldLists>): Promise<void> => {
        let currentLists = await this.getLists()
        await this._api.setLists({...currentLists, ...lists})
        await this.getLists(true)
    }

    /**
     * Gets the server logs
     *
     * @param refresh if true, will get the latest logs, otherwise will returned the cached version.
     */
    getLogs = (refresh = false): Promise<LogEntry[]> => {
        if (!this._cache.logs || refresh) this._cache.logs = this._api.getLogs()
        return this._cache.logs
            .then(lines => lines.slice().map(line => ({...line})))
    }


    /**
     * Sends the specified message, returns a promise that will reject if the send fails and resolve otherwise.
     *
     * @param message the message to send
     */
    send = (message: string) => this._api.send(message)

    /**
     * Gets a specific player by name
     */
    getPlayer = (name: string): Player => {
        name = name.toLocaleUpperCase()
        return new Player(name, this._players[name] || {ip: '', ips: [], joins: 0}, this._lists)
    }

    /**
     * Adds a listener for a single command, can be used when a command can be statically matched.
     *
     * @param command the command that the listener should be called for, case insensitive
     * @param listener the function which should be called whenever the command is used
     * @example
     * world.addCommand('marco', () => { ex.bot.send('Polo!'); });
     */
    addCommand = (command: string, listener: (player: Player, args: string) => void): void => {
        command = command.toLocaleUpperCase()
        if (this._commands.has(command)) {
            throw new Error(`The command "${command}" has already been added.`)
        }
        this._commands.set(command, listener)
    }

    /**
     * Removes a listener for a command, if it exists.
     *
     * @param command the command for which the listener should be removed.
     */
    removeCommand = (command: string): void => {
        this._commands.delete(command.toLocaleUpperCase())
    }

    /**
     * Starts the world, if it is not already started. Will not reject.
     */
    start = () => this._api.start()

    /**
     * Stops the world if it is running. Will not throw.
     */
    stop = () => this._api.stop()

    /**
     * Sends a restart request, if the world is offline no actions will be taken.
     */
    restart = () => this._api.restart()
}