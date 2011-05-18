(function ($, undefined) {
    var commands = {
        'cd': {
            '_args': [{
                'name': 'directory',
                'optional': false
            }],
            '_call': function (args) {
                var $this = this,
                    data = $this.data('console'),
                    msgGroup = $this.console('createMessageGroup'),
                    path;
                if (args.length) {
                    path = args[0];
                }
                if (!path) {
                    $this.console('printUsage', data.cmd.cd, 'cd', msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                $this.console('lookupManifest', path, function (manifest) {
                    if (manifest) {
                        data.vfsCd = manifest.path;
                        $this.console('createMessage',
                                'Working directory changed.', '', msgGroup);
                    } else {
                        $this.console('createMessage',
                                'cd: couldn\'t resolve path \'' + path + '\'',
                                data.errorClass, msgGroup);
                    }
                    msgGroup.addClass(data.completedClass);
                });
            },
            '_help': 'change working directory'
        },
        'clear': {
            '_call': function (args, opts) {
                var data = this.data('console'),
                    msgGroup = this.console('createMessageGroup');
                data.output.find('*').remove();
                data.callback();
                if (opts.h.declared) {
                    data.history = [];
                    data.historyIndex = -1;
                }
            },
            '_help': 'clear all the messages from the console',
            '_options': {
                'h': {
                    'description': 'clear command history'
                }
            }
        },
        'help': {
            '_args': [{
                'name': 'command',
                'optional': true
            }],
            '_call': function (args) {
                var arr = [],
                    data = this.data('console'),
                    hints = [],
                    i = 0,
                    msgGroup = this.console('createMessageGroup'),
                    prop = '';
                if (args.length) {
                    hints = this.console('lookupHints', args, true);
                    if (hints.length === 1) {
                        if (hints[0].usage) {
                            this.console('createMessage', hints[0].usage, '',
                                    msgGroup);
                        }
                    } else if (!hints.length) {
                        this.console('createMessage', 'help: command not found',
                                data.errorClass, msgGroup);
                    } else {
                        this.console('createMessage', 'help: ambiguous command',
                                data.errorClass, msgGroup);
                    }
                } else {
                    for (prop in data.cmd) {
                        if (data.cmd.hasOwnProperty(prop)) {
                            if (prop[0] !== '_') {
                                arr.push({
                                    'name': prop,
                                    'tip': data.cmd[prop]._help
                                });
                            }
                        }
                    }
                    // Ensures commands are listed alphabetically
                    arr.sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });
                    for (; i < arr.length; i++) {
                        this.console('createMessage',
                                $('<span/>').append($('<a/>', {
                                    'data-cmd': arr[i].name,
                                    'tabindex': -1,
                                    'text': arr[i].name
                                })).append(' &nbsp;&nbsp; ' + arr[i].tip), '',
                                msgGroup);
                    }
                }
                msgGroup.addClass(data.completedClass);
            },
            '_help': 'show general help information and a list of available ' +
                    'commands'
        },
        'ls': {
            '_args': [{
                'name': 'path',
                'optional': true
            }],
            '_call': function (args, opts) {
                // TODO: Support more options and maybe file arguments?
                var $this = this,
                    data = $this.data('console'),
                    msgGroup = $this.console('createMessageGroup'),
                    path = '';
                if (args.length) {
                    path = args[0];
                }
                $this.console('lookupManifest', path, function (manifest) {
                    var arr = [], arr2 = [], i = 0, name = '';
                    if (manifest) {
                        arr = Array.prototype.concat.call(manifest.directories,
                                manifest.files);
                        if (!arr.length) {
                            $this.console('createMessage', '.<br/>..', '',
                                    msgGroup);
                            msgGroup.addClass(data.completedClass);
                            return;
                        }
                        for (; i < arr.length; i++) {
                            name = arr[i];
                            if (name.indexOf(data.hiddenFilePrefix) === 0) {
                                if (opts.a.declared) {
                                    if (data.hiddenFilePrefixMask) {
                                        name = data.hiddenFilePrefixMask +
                                                name.substring(data.hiddenFilePrefix.length);
                                    }
                                    arr2.push(name);
                                }
                            } else {
                                arr2.push(name);
                            }
                        }
                        arr2.sort();
                        for (i = 0; i < arr2.length; i++) {
                            $this.console('createMessage', arr2[i], '',
                                    msgGroup);
                        }
                    } else {
                        $this.console('createMessage', path +
                                ': No such file or directory', data.errorClass,
                                msgGroup);
                    }
                    msgGroup.addClass(data.completedClass);
                });
            },
            '_help': 'list directory contents',
            '_options': {
                'a': {
                    'description': 'include hidden files'
                }
            }
        },
        'open': {
            '_args': [{
                'name': 'file',
                'optional': false
            }],
            '_call': function (args) {
                var $this = this,
                    data = $this.data('console'),
                    fileName,
                    msgGroup = $this.console('createMessageGroup'),
                    path,
                    rootIndex = -1,
                    rootPath = '';
                if (args.length) {
                    path = args[0];
                }
                if (!path) {
                    $this.console('printUsage', data.cmd.open, 'open', msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                rootIndex = path.lastIndexOf('/');
                if (rootIndex !== -1) {
                    fileName = path.substring(rootIndex + 1);
                    rootPath = path.substring(0, rootIndex);
                } else {
                    fileName = path;
                }
                if (!fileName) {
                    $this.console('createMessage', 'open: must be valid file',
                            data.errorClass, msgGroup);
                    msgGroup.addClass(data.completedClass);
                    return;
                }
                $this.console('lookupManifest', rootPath, function (manifest) {
                    var i = 0;
                    if (manifest) {
                        var fileExists = false,
                            files = manifest.files,
                            message = {};
                        if (fileName.indexOf(data.hiddenFilePrefix) === 0) {
                            $this.console('createMessage',
                                    'open: couldn\'t resolve path \'' + path +
                                    '\'', data.errorClass, msgGroup);
                            msgGroup.addClass(data.completedClass);
                            return;
                        }
                        if (fileName.indexOf(data.hiddenFilePrefixMask) === 0) {
                            fileName = data.hiddenFilePrefix +
                                fileName.substring(data.hiddenFilePrefixMask.length);
                        }
                        for (; i < files.length; i++) {
                            if (files[i] === fileName) {
                                fileExists = true;
                                break;
                            }
                        }
                        if (fileExists) {
                            message = $this.console('createMessage',
                                    data.loading, '', msgGroup);
                            $.get(manifest.path + '/' + fileName,
                                    function (content) {
                                        message.replace(content);
                                        msgGroup.addClass(data.completedClass);
                            });
                        } else {
                            $this.console('createMessage',
                                    'open: couldn\'t resolve path \'' + path +
                                    '\'', data.errorClass, msgGroup);
                            msgGroup.addClass(data.completedClass);
                        }
                    } else {
                        $this.console('createMessage',
                                'open: couldn\'t resolve path \'' + path + '\'',
                                data.errorClass, msgGroup);
                        msgGroup.addClass(data.completedClass);
                    }
                });
            },
            '_help': 'open a file to view'
        },
        'pwd': {
            '_call': function () {
                var data = this.data('console');
                this.console('createMessageGroup', data.vfsCd)
                        .addClass(data.completedClass);
            },
            '_help': 'return working directory name'
        }
    };
    var methods = {
        addHistory: function (str) {
            return this.each(function () {
                var data = $(this).data('console');
                data.history.push(str);
                data.historyIndex = -1;
            });
        },
        callCommand: function (args) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console'),
                    found = false,
                    i = 0,
                    input = {},
                    obj = data.cmd,
                    prop = '';
                for (; i < args.length; i++) {
                    found = false;
                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            if (prop === args[i] && prop[0] !== '_') {
                                obj = obj[prop];
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found) {
                        break;
                    }
                }
                if (obj !== data.cmd) {
                    if (obj.hasOwnProperty('_call')) {
                        input = $this.console('deriveCommandInput', obj,
                                Array.prototype.slice.call(args, i));
                        if (input.error) {
                            $this.console('createMessage', prop + ': ' +
                                    input.error, data.errorClass);
                            $this.console('printUsage', obj, prop);
                        } else {
                            obj._call.apply($this, [input.args, input.options]);
                        }
                    } else if (obj.hasOwnProperty('_usage')) {
                        $this.console('createMessage', obj._usage.apply(obj),
                                data.errorClass);
                    } else {
                        $this.console('printUsage', obj, prop);
                    }
                } else {
                    $this.console('createMessage', 'command not found',
                            data.errorClass);
                }
            });
        },
        clone: function (obj) {
            var copy, i = 0, prop = '';
            if (!obj || typeof(obj) !== 'object') {
                return obj;
            }
            if (obj instanceof Date) {
                copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }
            if (obj instanceof Array) {
                copy = [];
                for (; i < obj.length; i++) {
                    copy[i] = methods.clone(obj[i]);
                }
                return copy;
            }
            if (obj instanceof Object) {
                copy = {};
                for (prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        copy[prop] = methods.clone(obj[prop]);
                    }
                }
                return copy;
            }
            throw new Error('Unsupported object type');
        },
        createMessage: function (content, style, group) {
            var data = this.data('console');
            content = content || '';
            style = style || '';
            var obj = {
                'append': function (newContent) {
                    obj.target.append(newContent || '');
                    data.callback(obj.target);
                    return obj;
                },
                'replace': function (substitution) {
                    obj.target.html(substitution || '');
                    data.callback(obj.target);
                    return obj;
                },
                'target': $('<div/>', {
                    'class': data.messageClass + ' ' + style,
                    'html': content
                })
            };
            if (group) {
                group.append(obj.target);
            } else {
                data.output.append(obj.target);
            }
            data.callback(obj.target);
            return obj;
        },
        createMessageGroup: function (childContent, childStyle) {
            var data = this.data('console'),
                obj = $('<div/>', {
                    'class': data.messageGroupClass
                });
            if (childContent) {
                childStyle = childStyle || '';
                obj.append($('<div/>', {
                    'class': data.messageClass + ' ' + childStyle,
                    'html': childContent
                }));
            }
            data.output.append(obj);
            data.callback(obj);
            return obj;
        },
        deriveCommandInput: function (command, args) {
            var arg = '',
                argUsed = false,
                data = this.data('console'),
                i = 0,
                input = {
                    args: [],
                    error: '',
                    options: {}
                },
                j = 0,
                option = {};
            if (command._options) {
                input.options = this.console('clone', command._options);
                for (; i < args.length; i++) {
                    arg = args[i];
                    if (arg.indexOf(data.optionPrefix) === 0) {
                        option = input.options[arg.substring(1)];
                        if (option) {
                            option.declared = true;
                        } else {
                            input.error('illegal option ' + arg);
                            break;
                        }
                    } else {
                        argUsed = false;
                        if (option && option.args) {
                            for (j = 0; j < option.args.length; j++) {
                                if (!option.args[j].declared) {
                                    option.args[j].declared = true;
                                    option.args[j].value = arg;
                                    argUsed = true;
                                    break;
                                }
                            }
                        }
                        if (!argUsed) {
                            input.args.push(arg);
                        }
                    }
                }
            } else {
                input.args = args;
            }
            return input;
        },
        destroy: function (keepMessages) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console');
                data.hints.find('a[data-hint]').die('.console').remove();
                data.hints.hide();
                data.input.unbind('.console').val('');
                data.output.find('a[data-cmd]').die('.console');
                if (!keepMessages) {
                    data.output.find('div.' + data.messageClass + ', div.' +
                            data.messageGroupClass).remove();
                }
                $this.removeData('console');
            });
        },
        findConsole: function () {
            var data = this.data('console');
            return (data) ? this : methods.findConsole.apply(this.parent());
        },
        findData: function () {
            var data = this.data('console');
            return data || methods.findData.apply(this.parent());
        },
        getPrefix: function () {
            var data = this.data('console'),
                prefix = '';
            if (data.prefixOverride) {
                prefix += data.prefixOverride;
            } else {
                prefix += data.username || 'guest';
                prefix += data.prefixSeperator;
                prefix += data.vfsCd;
            }
            prefix += data.prefixSymbol;
            return prefix;
        },
        getUsage: function (command, name) {
            var arg = {},
                args = command._args,
                container = $('<div/>'),
                header = $('<span/>').appendTo(container),
                headerText = 'usage: ' + name,
                body = $('<div/>').appendTo(container),
                i = 0,
                j = 0,
                opt = {},
                optArgs = '',
                options = command._options,
                optName = '',
                table = $('<table/>').css('margin-left', 30);
            if (options) {
                body.append('options:');
                for (optName in options) {
                    if (options.hasOwnProperty(optName)) {
                        opt = options[optName];
                        optArgs = '';
                        if (opt.args) {
                            for (i = 0; i < opt.args.length; i++) {
                                optArgs += '<em>' + opt.args[i].name +
                                        '</em>, ';
                            }
                            if (optArgs) {
                                optArgs = optArgs.substring(0,
                                        optArgs.length - 2);
                            }
                        }
                        headerText += ' [-' + optName;
                        if (optArgs) {
                            headerText += ' ' + optArgs;
                        }
                        headerText += ']';
                        $('<tr/>').append($('<td/>', {
                            'html': '-' + optName + ' ' + optArgs
                        })).append($('<td/>', {
                            'html': opt.description,
                            'style': 'padding-left: 20px'
                        })).appendTo(table);
                    }
                }
            }
            if (args) {
                for (; j < args.length; j++) {
                    arg = args[j];
                    if (arg.optional) {
                        headerText += ' [' + arg.name.toUpperCase() + ']';
                    } else {
                        headerText += ' ' + arg.name.toUpperCase();
                    }
                }
            }
            header.html(headerText);
            table.appendTo(body);
            return container;
        },
        init: function (options) {
            var settings = {
                'callback': $.noop(),
                'cmd': commands,
                'commandClass': 'command',
                'completedClass': 'completed',
                'dividerClass': 'divider',
                'errorClass': 'error',
                'hiddenFilePrefix': '.',
                'hiddenFilePrefixMask': '',
                'hints': '.hints',
                'history': [],
                'historyIndex': -1,
                'infoClass': 'info',
                'input': 'input[type="text"]',
                'inputStash': '',
                'loading': 'Loading...',
                'maxHints': -1,
                'messageClass': 'message',
                'messageGroupClass': 'message-group',
                'optionPrefix': '-',
                'output': '.output',
                'prefixOverride': '',
                'prefixSeperator': ':',
                'prefixSymbol': '$',
                'username': '',
                'vfsBase': 'root',
                'vfsCd': '',
                'vfsDescriptor': 'manifest.json',
                'warningClass': 'warning',
                'welcomeMessage': 'Welcome to jQuery.console!'
            };
            return this.each(function () {
                var console = $(this),
                    data = console.data('console');
                if (!data) {
                    if (options) {
                        $.extend(true, settings, options);
                    }
                    settings.hints = console.find(settings.hints).hide();
                    settings.input = console.find(settings.input);
                    settings.output = console.find(settings.output);
                    console.data('console', settings);
                    data = console.data('console');
                    data.vfsCd = data.vfsCd || data.vfsBase;
                    data.input.bind('keydown.console', methods.keyDownHandler);
                    data.input.bind('keyup.console', methods.keyUpHandler);
                    if (data.welcomeMessage) {
                        console.console('createMessage', data.welcomeMessage,
                                data.infoClass);
                    }
                    data.hints.find('a[data-hint]').live('click.console',
                            function () {
                                data.input.val($(this).attr('data-hint') +
                                        ' ').focus();
                                data.hints.hide();
                    }).live('mouseenter.console', function () {
                        $(this).addClass('selected');
                    }).live('mouseleave.console', function () {
                        $(this).removeClass('selected');
                    });
                    data.output.find('a[data-cmd]').live('click.console',
                            function () {
                                var $this = $(this);
                                data.inputStash = '';
                                data.input.focus();
                                // Fix to ensure caret positioned at end
                                data.input.val(data.input.val());
                                if ($this.attr('data-cmd-run')) {
                                    console.console('send');
                                } else {
                                    $this.data('console.newcmd', true);
                                    console.console('showHints');
                                }
                    }).live('mouseenter.console', function () {
                        data.inputStash = data.input.val();
                        data.input.val($(this).attr('data-cmd') + ' ');
                    }).live('mouseleave.console', function () {
                        var $this = $(this);
                        if ($this.data('console.newcmd')) {
                            $this.removeData('console.newcmd');
                        } else {
                            data.input.val(data.inputStash);
                        }
                        data.inputStash = '';
                    });
                }
            });
        },
        keyDownHandler: function (event) {
            switch (event.keyCode) {
                case 38: // Up
                case 40: // Down
                    // Prevents default start/end caret positioning behaviour
                    event.preventDefault();
                    break;
                default:
            }
        },
        keyUpHandler: function (event) {
            var console = $(this).console('findConsole'),
                data = console.data('console');
            switch (event.keyCode) {
                case 13: // Enter
                    if (data.hints.is(':visible') &&
                            data.hints.find('.selected').length) {
                        var hint = data.hints.find('.selected')
                                .attr('data-hint');
                        data.input.val(hint + ' ');
                        data.hints.hide();
                    } else {
                        console.console('send');
                    }
                    break;
                case 27: // Escape
                    if (data.hints.is(':visible')) {
                        data.hints.hide();
                    } else {
                        console.console('showHints');
                    }
                    break;
                case 38: // Up
                case 40: // Down
                    var moveUp = event.keyCode === 38;
                    if (data.hints.is(':visible')) {
                        console.console('navigateHints', moveUp);
                    } else {
                        console.console('searchHistory', moveUp);
                    }
                    break;
                default:
                    console.console('showHints');
            }
        },
        lookupHints: function (args, noLimit) {
            var arr = [],
                data = this.data('console'),
                hints = [],
                i = 0,
                lastCommandFound = -1,
                obj = data.cmd,
                prop = '';
            noLimit = noLimit || false;
            for (; i < args.length; i++) {
                for (prop in obj) {
                    if (obj.hasOwnProperty(prop) && prop[0] !== '_') {
                        if (prop === args[i]) {
                            arr.push(obj[prop]);
                            lastCommandFound = i;
                            obj = obj[prop];
                            break;
                        }
                    }
                }
                if (lastCommandFound !== i) {
                    break;
                }
            }
            if (arr.length === args.length) {
                if (obj.hasOwnProperty('_help')) {
                    hints.push({
                        'command': args.join(' '),
                        'name': args[lastCommandFound],
                        'tip': obj._help,
                        'usage': this.console('getUsage', obj,
                                args[lastCommandFound])
                    });
                }
            } else if (arr.length === args.length - 1) {
                for (prop in obj) {
                    if (obj.hasOwnProperty(prop) && prop[0] !== '_') {
                        if (prop.indexOf(args[args.length - 1]) === 0 &&
                                obj[prop].hasOwnProperty('_help')) {
                            if (noLimit || (data.maxHints <= 0 ||
                                    hints.length <= data.maxHints)) {
                                hints.push({
                                    'command': args.slice(0, args.length - 2)
                                            .join(' ') + ' ' + prop,
                                    'name': prop,
                                    'tip': obj[prop]._help,
                                    'usage': this.console('getUsage', obj[prop],
                                            prop)
                                });
                            }
                        }
                    }
                }
            }
            hints.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            return hints;
        },
        lookupManifest: function (path, callback) {
            return this.each(function () {
                var $this = $(this),
                    baseLookup = false,
                    data = $this.data('console'),
                    manifest;
                if (path) {
                    if (path.lastIndexOf('/') !== path.length - 2 ||
                            path === '.') {
                        path += '/';
                    }
                    if (path.indexOf('~/') === 0) {
                        baseLookup = true;
                    }
                }
                if (baseLookup) {
                    path = data.vfsBase + '/' + path.substring(2) +
                            data.vfsDescriptor;
                } else {
                    path = data.vfsCd + '/' + path + data.vfsDescriptor;
                }
                $.getJSON(path, function (descriptor) {
                    manifest = descriptor;
                }).complete(function () {
                    callback.apply($this, [manifest]);
                });
            });
        },
        printUsage: function (command, name, group) {
            var data = this.data('console'),
                usage = this.console('getUsage', command, name);
            return this.console('createMessage', usage, data.errorClass, group);
        },
        navigateHints: function (moveUp) {
            return this.each(function () {
                var data = $(this).data('console'),
                    defaultItem = {},
                    hintItems = data.hints.find('a'),
                    nextItem = {},
                    selectedItem = hintItems.filter('.selected');
                if (moveUp) {
                    defaultItem = hintItems.last();
                    nextItem = selectedItem.prev();
                } else {
                    defaultItem = hintItems.first();
                    nextItem = selectedItem.next();
                }
                selectedItem.removeClass('selected');
                if (selectedItem.length && nextItem.length) {
                    nextItem.addClass('selected');
                } else {
                    defaultItem.addClass('selected');
                }
            });
        },
        resetHistorySearch: function () {
            return this.each(function () {
                $(this).data('console').historyIndex = -1;
            });
        },
        searchHistory: function (moveUp) {
            return this.each(function () {
                var data = $(this).data('console');
                if (data.history.length === 0) {
                    data.historyIndex = -1;
                } else {
                    if (moveUp) {
                        if (data.historyIndex === -1) {
                            data.historyIndex = data.history.length - 1;
                        } else {
                            data.historyIndex--;
                            if (data.historyIndex < 0) {
                                data.historyIndex = 0;
                            }
                        }
                    } else {
                        if (data.historyIndex !== -1) {
                            data.historyIndex++;
                            if (data.historyIndex >= data.history.length) {
                                data.historyIndex = -1;
                            }
                        }
                    }
                }
                if (data.historyIndex === -1) {
                    data.input.val('');
                } else {
                    data.input.val(data.history[data.historyIndex]);
                }
            });
        },
        send: function () {
            return this.each(function () {
                var $this = $(this),
                    args = [],
                    data = $this.data('console'),
                    input = '',
                    str = (data.input.val()) ? data.input.val().trim() : '';
                if (str.length) {
                    data.input.val('');
                    args = str.split(/\s+/);
                    input = args.join(' ');
                    data.hints.hide();
                    $this.console('createMessage', $this.console('getPrefix') +
                            ' ' + input, data.commandClass);
                    $this.console('addHistory', input);
                    $this.console('callCommand', args);
                }
            });
        },
        showHints: function () {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('console'),
                    hideHints = true,
                    hints = [],
                    i = 0,
                    str = (data.input.val()) ? data.input.val().trim() : '';
                if (str.length) {
                    $this.console('resetHistorySearch');
                    hints = $this.console('lookupHints', str.split(/\s+/));
                    if (hints.length) {
                        data.hints.find('a').remove();
                        data.hints.show();
                        hideHints = false;
                        for (; i < hints.length; i++) {
                            data.hints.append($('<a/>', {
                                'data-hint': hints[i].command.trim(),
                                'tabindex': -1,
                                'text': hints[i].name
                            }).append($('<span/>', {
                                'text': hints[i].tip
                            })));
                        }
                    }
                }
                if (hideHints) {
                    data.hints.hide();
                }
            });
        }
    };
    $.fn.console = function (method) {
        if (methods[method]) {
            return methods[method].apply(this,
                    Array.prototype.slice.call(arguments, 1));
        } else if (typeof(method) === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method [' + method + '] does not exist on jQuery.console');
        }
    };
})(jQuery);