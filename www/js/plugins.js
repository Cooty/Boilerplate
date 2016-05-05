// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.
/*!
 *         ,/
 *       ,'/
 *     ,' /
 *   ,'  /_____,
 * .'____    ,'
 *      /  ,'
 *     / ,'
 *    /,'
 *   /'
 *
 * Selectric ϟ v1.9.6 (Mar 28 2016) - http://lcdsantos.github.io/jQuery-Selectric/
 *
 * Copyright (c) 2016 Leonardo Santos; MIT License
 *
 */

(function(factory) {
    /* global define */
    /* istanbul ignore next */
    if ( typeof define === 'function' && define.amd ) {
        define(['jquery'], factory);
    } else if ( typeof module === 'object' && module.exports ) {
        // Node/CommonJS
        module.exports = function( root, jQuery ) {
            if ( jQuery === undefined ) {
                if ( typeof window !== 'undefined' ) {
                    jQuery = require('jquery');
                } else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {
    'use strict';

    var $doc = $(document);
    var $win = $(window);

    var pluginName = 'selectric';
    var classList = 'Input Items Open Disabled TempShow HideSelect Wrapper Hover Responsive Above Scroll Group GroupLabel';
    var bindSufix = '.sl';

    var chars = ['a', 'e', 'i', 'o', 'u', 'n', 'c', 'y'];
    var diacritics = [
        /[\xE0-\xE5]/g, // a
        /[\xE8-\xEB]/g, // e
        /[\xEC-\xEF]/g, // i
        /[\xF2-\xF6]/g, // o
        /[\xF9-\xFC]/g, // u
        /[\xF1]/g,      // n
        /[\xE7]/g,      // c
        /[\xFD-\xFF]/g  // y
    ];

    /**
     * Create an instance of Selectric
     *
     * @constructor
     * @param {Node} element - The &lt;select&gt; element
     * @param {object}  opts - Options
     */
    var Selectric = function(element, opts) {
        var _this = this;

        _this.element = element;
        _this.$element = $(element);

        _this.state = {
            enabled     : false,
            opened      : false,
            currValue   : -1,
            selectedIdx : -1
        };

        _this.eventTriggers = {
            open    : _this.open,
            close   : _this.close,
            destroy : _this.destroy,
            refresh : _this.refresh,
            init    : _this.init
        };

        _this.init(opts);
    };

    Selectric.prototype = {
        utils: {
            /**
             * Detect mobile browser
             *
             * @return {boolean}
             */
            isMobile: function() {
                return /android|ip(hone|od|ad)/i.test(navigator.userAgent);
            },

            /**
             * Replace diacritics
             *
             * @param  {string} str - The string to replace the diacritics.
             * @return {string}       The string with diacritics replaced with ascii characters.
             */
            replaceDiacritics: function(str) {
                var k = diacritics.length;

                while (k--) {
                    str = str.toLowerCase().replace(diacritics[k], chars[k]);
                }

                return str;
            },

            /**
             * Format string
             * https://gist.github.com/atesgoral/984375
             *
             * @param  {string} f - String to be formated
             * @return {string}     String formated
             */
            format: function (f) {
                var a = arguments; // store outer arguments
                return ('' + f) // force format specifier to String
                    .replace( // replace tokens in format specifier
                        /\{(?:(\d+)|(\w+))\}/g, // match {token} references
                        function (
                            s, // the matched string (ignored)
                            i, // an argument index
                            p // a property name
                        ) {
                            return p && a[1] // if property name and first argument exist
                                ? a[1][p] // return property from first argument
                                : a[i]; // assume argument index and return i-th argument
                        });
            },

            /**
             * Get the next enabled item in the options list.
             *
             * @param  {object} selectItems - The options object.
             * @param  {number}    selected - Index of the currently selected option.
             * @return {object}               The next enabled item.
             */
            nextEnabledItem: function(selectItems, selected) {
                while ( selectItems[ selected = (selected + 1) % selectItems.length ].disabled ) {
                    // empty
                }
                return selected;
            },

            /**
             * Get the previous enabled item in the options list.
             *
             * @param  {object} selectItems - The options object.
             * @param  {number}    selected - Index of the currently selected option.
             * @return {object}               The previous enabled item.
             */
            previousEnabledItem: function(selectItems, selected) {
                while ( selectItems[ selected = (selected > 0 ? selected : selectItems.length) - 1 ].disabled ) {
                    // empty
                }
                return selected;
            },

            /**
             * Transform camelCase string to dash-case.
             *
             * @param  {string} str - The camelCased string.
             * @return {string}       The string transformed to dash-case.
             */
            toDash: function(str) {
                return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
            },

            /**
             * Calls the events and hooks registered with function name.
             *
             * @param {string}    fn - The name of the function.
             * @param {number} scope - Scope that should be set on the function.
             */
            triggerCallback: function(fn, scope) {
                var elm = scope.element;
                var func = scope.options['on' + fn];

                if ( $.isFunction(func) ) {
                    func.call(elm, elm, scope);
                }

                if ( $.fn[pluginName].hooks[fn] ) {
                    $.each($.fn[pluginName].hooks[fn], function() {
                        this.call(elm, elm, scope);
                    });
                }

                $(elm).trigger(pluginName + '-' + this.toDash(fn), scope);
            }
        },

        /** Initializes */
        init: function(opts) {
            var _this = this;

            // Set options
            _this.options = $.extend(true, {}, $.fn[pluginName].defaults, _this.options, opts);

            _this.utils.triggerCallback('BeforeInit', _this);

            // Preserve data
            _this.destroy(true);

            // Disable on mobile browsers
            if ( _this.options.disableOnMobile && _this.utils.isMobile() ) {
                _this.disableOnMobile = true;
                return;
            }

            // Get classes
            _this.classes = _this.getClassNames();

            // Create elements
            var input        = $('<input/>', { 'class': _this.classes.input, 'readonly': _this.utils.isMobile() });
            var items        = $('<div/>',   { 'class': _this.classes.items, 'tabindex': -1 });
            var itemsScroll  = $('<div/>',   { 'class': _this.classes.scroll });
            var wrapper      = $('<div/>',   { 'class': _this.classes.prefix, 'html': _this.options.arrowButtonMarkup });
            var label        = $('<p/>',     { 'class': 'label' });
            var outerWrapper = _this.$element.wrap('<div/>').parent().append(wrapper.prepend(label), items, input);

            _this.elements = {
                input        : input,
                items        : items,
                itemsScroll  : itemsScroll,
                wrapper      : wrapper,
                label        : label,
                outerWrapper : outerWrapper
            };

            _this.$element
                .on(_this.eventTriggers)
                .wrap('<div class="' + _this.classes.hideselect + '"/>');

            _this.originalTabindex = _this.$element.prop('tabindex');
            _this.$element.prop('tabindex', false);

            _this.populate();
            _this.activate();

            _this.utils.triggerCallback('Init', _this);
        },

        /** Activates the plugin */
        activate: function() {
            var _this = this;
            var originalWidth = _this.$element.width();

            _this.utils.triggerCallback('BeforeActivate', _this);

            _this.elements.outerWrapper.prop('class', [
                _this.classes.wrapper,
                _this.$element.prop('class').replace(/\S+/g, _this.classes.prefix + '-$&'),
                _this.options.responsive ? _this.classes.responsive : ''
            ].join(' '));

            if ( _this.options.inheritOriginalWidth && originalWidth > 0 ) {
                _this.elements.outerWrapper.width(originalWidth);
            }

            if ( !_this.$element.prop('disabled') ) {
                _this.state.enabled = true;

                // Not disabled, so... Removing disabled class
                _this.elements.outerWrapper.removeClass(_this.classes.disabled);

                // Remove styles from items box
                // Fix incorrect height when refreshed is triggered with fewer options
                _this.$li = _this.elements.items.removeAttr('style').find('li');

                _this.bindEvents();
            } else {
                _this.elements.outerWrapper.addClass(_this.classes.disabled);
                _this.elements.input.prop('disabled', true);
            }

            _this.utils.triggerCallback('Activate', _this);
        },

        /**
         * Generate classNames for elements
         *
         * @return {object} Classes object
         */
        getClassNames: function() {
            var _this = this;
            var customClass = _this.options.customClass;
            var classesObj  = {};

            $.each(classList.split(' '), function(i, currClass) {
                var c = customClass.prefix + currClass;
                classesObj[currClass.toLowerCase()] = customClass.camelCase ? c : _this.utils.toDash(c);
            });

            classesObj.prefix = customClass.prefix;

            return classesObj;
        },

        /** Set the label text */
        setLabel: function() {
            var _this = this;
            var labelBuilder = _this.options.labelBuilder;
            var currItem = _this.lookupItems[_this.state.currValue];

            _this.elements.label.html(
                $.isFunction(labelBuilder)
                    ? labelBuilder(currItem)
                    : _this.utils.format(labelBuilder, currItem)
            );
        },

        /** Get and save the available options */
        populate: function() {
            var _this = this;
            var $options = _this.$element.children();
            var $justOptions = _this.$element.find('option');
            var selectedIndex = $justOptions.index($justOptions.filter(':selected'));
            var currIndex = 0;

            _this.state.currValue = (_this.state.selected = ~selectedIndex ? selectedIndex : 0);
            _this.state.selectedIdx = _this.state.currValue;
            _this.items = [];
            _this.lookupItems = [];

            if ( $options.length ) {
                // Build options markup
                $options.each(function(i) {
                    var $elm = $(this);

                    if ( $elm.is('optgroup') ) {

                        var optionsGroup = {
                            element       : $elm,
                            label         : $elm.prop('label'),
                            groupDisabled : $elm.prop('disabled'),
                            items         : []
                        };

                        $elm.children().each(function(i) {
                            var $elm = $(this);
                            var optionText = $elm.html();

                            optionsGroup.items[i] = {
                                index    : currIndex,
                                element  : $elm,
                                value    : $elm.val(),
                                text     : optionText,
                                slug     : _this.utils.replaceDiacritics(optionText),
                                disabled : optionsGroup.groupDisabled
                            };

                            _this.lookupItems[currIndex] = optionsGroup.items[i];

                            currIndex++;
                        });

                        _this.items[i] = optionsGroup;

                    } else {

                        var optionText = $elm.html();

                        _this.items[i] = {
                            index    : currIndex,
                            element  : $elm,
                            value    : $elm.val(),
                            text     : optionText,
                            slug     : _this.utils.replaceDiacritics(optionText),
                            disabled : $elm.prop('disabled')
                        };

                        _this.lookupItems[currIndex] = _this.items[i];

                        currIndex++;

                    }
                });

                _this.setLabel();
                _this.elements.items.append( _this.elements.itemsScroll.html( _this.getItemsMarkup(_this.items) ) );
            }
        },

        /**
         * Generate options markup
         *
         * @param  {object} items - Object containing all available options
         * @return {string}         HTML for the options box
         */
        getItemsMarkup: function(items) {
            var _this = this;
            var markup = '<ul>';

            $.each(items, function(i, elm) {
                if ( elm.label !== undefined ) {

                    markup += _this.utils.format('<ul class="{1}"><li class="{2}">{3}</li>',
                        $.trim([_this.classes.group, elm.groupDisabled ? 'disabled' : '', elm.element.prop('class')].join(' ')),
                        _this.classes.grouplabel,
                        elm.element.prop('label')
                    );

                    $.each(elm.items, function(i, elm) {
                        markup += _this.getItemMarkup(elm.index, elm);
                    });

                    markup += '</ul>';

                } else {

                    markup += _this.getItemMarkup(elm.index, elm);

                }
            });

            return markup + '</ul>';
        },

        /**
         * Generate every option markup
         *
         * @param  {number} i   - Index of current item
         * @param  {object} elm - Current item
         * @return {string}       HTML for the option
         */
        getItemMarkup: function(i, elm) {
            var _this = this;
            var itemBuilder = _this.options.optionsItemBuilder;

            return _this.utils.format('<li data-index="{1}" class="{2}">{3}</li>',
                i,
                $.trim([
                    i === _this.state.currValue  ? 'selected' : '',
                    i === _this.items.length - 1 ? 'last'     : '',
                    elm.disabled                 ? 'disabled' : ''
                ].join(' ')),
                $.isFunction(itemBuilder) ? itemBuilder(elm, elm.element, i) : _this.utils.format(itemBuilder, elm)
            );
        },

        /** Bind events on the elements */
        bindEvents: function() {
            var _this = this;

            _this.elements.wrapper
                .add(_this.$element)
                .add(_this.elements.outerWrapper)
                .add(_this.elements.input)
                .off(bindSufix);

            _this.elements.outerWrapper.on('mouseenter' + bindSufix + ' mouseleave' + bindSufix, function(e) {
                $(this).toggleClass(_this.classes.hover, e.type === 'mouseenter');

                // Delay close effect when openOnHover is true
                if ( _this.options.openOnHover ) {
                    clearTimeout(_this.closeTimer);

                    if ( e.type === 'mouseleave' ) {
                        _this.closeTimer = setTimeout($.proxy(_this.close, _this), _this.options.hoverIntentTimeout);
                    } else {
                        _this.open();
                    }
                }
            });

            // Toggle open/close
            _this.elements.wrapper.on('click' + bindSufix, function(e) {
                _this.state.opened ? _this.close() : _this.open(e);
            });

            _this.elements.input
                .prop({ tabindex: _this.originalTabindex, disabled: false })
                .on('keypress' + bindSufix, _this.handleSystemKeys)
                .on('keydown' + bindSufix, function(e) {
                    _this.handleSystemKeys(e);

                    // Clear search
                    clearTimeout(_this.resetStr);
                    _this.resetStr = setTimeout(function() {
                        _this.elements.input.val('');
                    }, _this.options.keySearchTimeout);

                    var key = e.keyCode || e.which;

                    // If it's a directional key
                    // 37 => Left
                    // 38 => Up
                    // 39 => Right
                    // 40 => Down
                    if ( key > 36 && key < 41 ) {
                        if ( !_this.options.allowWrap ) {
                            if ( (key < 39 && _this.state.selectedIdx === 0) || (key > 38 && (_this.state.selectedIdx + 1) === _this.items.length) ) {
                                return;
                            }
                        }

                        _this.select(_this.utils[(key < 39 ? 'previous' : 'next') + 'EnabledItem'](_this.items, _this.state.selectedIdx));
                    }
                })
                .on('focusin' + bindSufix, function(e) {
                    _this.state.opened || _this.open(e);
                })
                .on('oninput' in _this.elements.input[0] ? 'input' : 'keyup', function() {
                    if ( _this.elements.input.val().length ) {
                        // Search in select options
                        $.each(_this.items, function(i, elm) {
                            if ( RegExp('^' + _this.elements.input.val(), 'i').test(elm.slug) && !elm.disabled ) {
                                _this.select(i);
                                return false;
                            }
                        });
                    }
                });

            _this.$li.on({
                // Prevent <input> blur on Chrome
                mousedown: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                },
                click: function() {
                    // The second parameter is to close the box after click
                    _this.select($(this).data('index'), true);

                    // Chrome doesn't close options box if select is wrapped with a label
                    // We need to 'return false' to avoid that
                    return false;
                }
            });
        },

        /**
         * Behavior when system keys is pressed
         *
         * @param {object} e - Event object
         */
        handleSystemKeys: function(e) {
            var _this = this;
            var key = e.keyCode || e.which;

            if ( key == 13 ) {
                e.preventDefault();
            }

            // Tab / Enter / ESC
            if ( /^(9|13|27)$/.test(key) ) {
                e.stopPropagation();
                _this.select(_this.state.selectedIdx, true);
            }
        },

        /** Update the items object */
        refresh: function() {
            var _this = this;

            _this.populate();
            _this.activate();
            _this.utils.triggerCallback('Refresh', _this);
        },

        /** Set options box width/height */
        setOptionsDimensions: function() {
            var _this = this;

            // Calculate options box height
            // Set a temporary class on the hidden parent of the element
            var hiddenChildren = _this.elements.items.closest(':visible').children(':hidden').addClass(_this.classes.tempshow);
            var maxHeight = _this.options.maxHeight;
            var itemsWidth = _this.elements.items.outerWidth();
            var wrapperWidth = _this.elements.wrapper.outerWidth() - (itemsWidth - _this.elements.items.width());

            // Set the dimensions, minimum is wrapper width, expand for long items if option is true
            if ( !_this.options.expandToItemText || wrapperWidth > itemsWidth ) {
                _this.finalWidth = wrapperWidth;
            } else {
                // Make sure the scrollbar width is included
                _this.elements.items.css('overflow', 'scroll');

                // Set a really long width for _this.elements.outerWrapper
                _this.elements.outerWrapper.width(9e4);
                _this.finalWidth = _this.elements.items.width();
                // Set scroll bar to auto
                _this.elements.items.css('overflow', '');
                _this.elements.outerWrapper.width('');
            }

            _this.elements.items.width(_this.finalWidth).height() > maxHeight && _this.elements.items.height(maxHeight);

            // Remove the temporary class
            hiddenChildren.removeClass(_this.classes.tempshow);
        },

        /** Detect if the options box is inside the window */
        isInViewport: function() {
            var _this = this;
            var scrollTop = $win.scrollTop();
            var winHeight = $win.height();
            var uiPosX = _this.elements.outerWrapper.offset().top;
            var uiHeight = _this.elements.outerWrapper.outerHeight();

            var fitsDown = (uiPosX + uiHeight + _this.itemsHeight) <= (scrollTop + winHeight);
            var fitsAbove = (uiPosX - _this.itemsHeight) > scrollTop;

            // If it does not fit below, only render it
            // above it fit's there.
            // It's acceptable that the user needs to
            // scroll the viewport to see the cut off UI
            var renderAbove = !fitsDown && fitsAbove;

            _this.elements.outerWrapper.toggleClass(_this.classes.above, renderAbove);
        },

        /**
         * Detect if currently selected option is visible and scroll the options box to show it
         *
         * @param {number} index - Index of the selected items
         */
        detectItemVisibility: function(index) {
            var _this = this;
            var liHeight = _this.$li.eq(index).outerHeight();
            var liTop = _this.$li[index].offsetTop;
            var itemsScrollTop = _this.elements.itemsScroll.scrollTop();
            var scrollT = liTop + liHeight * 2;

            _this.elements.itemsScroll.scrollTop(
                scrollT > itemsScrollTop + _this.itemsHeight ? scrollT - _this.itemsHeight :
                    liTop - liHeight < itemsScrollTop ? liTop - liHeight :
                        itemsScrollTop
            );
        },

        /**
         * Open the select options box
         *
         * @param {event} e - Event
         */
        open: function(e) {
            var _this = this;

            _this.utils.triggerCallback('BeforeOpen', _this);

            if ( e ) {
                e.preventDefault();
                e.stopPropagation();
            }

            if ( _this.state.enabled ) {
                _this.setOptionsDimensions();

                // Find any other opened instances of select and close it
                $('.' + _this.classes.hideselect, '.' + _this.classes.open).children()[pluginName]('close');

                _this.state.opened = true;
                _this.itemsHeight = _this.elements.items.outerHeight();
                _this.itemsInnerHeight = _this.elements.items.height();

                // Toggle options box visibility
                _this.elements.outerWrapper.addClass(_this.classes.open);

                // Give dummy input focus
                _this.elements.input.val('');
                if ( e && e.type !== 'focusin' ) {
                    _this.elements.input.focus();
                }

                $doc
                    .on('click' + bindSufix, $.proxy(_this.close, _this))
                    .on('scroll' + bindSufix, $.proxy(_this.isInViewport, _this));
                _this.isInViewport();

                // Prevent window scroll when using mouse wheel inside items box
                if ( _this.options.preventWindowScroll ) {
                    /* istanbul ignore next */
                    $doc.on('mousewheel' + bindSufix + ' DOMMouseScroll' + bindSufix, '.' + _this.classes.scroll, function(e) {
                        var orgEvent = e.originalEvent;
                        var scrollTop = $(this).scrollTop();
                        var deltaY = 0;

                        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1; }
                        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;  }
                        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY; }
                        if ( 'deltaY'      in orgEvent ) { deltaY = orgEvent.deltaY * -1; }

                        if ( scrollTop === (this.scrollHeight - _this.itemsInnerHeight) && deltaY < 0 || scrollTop === 0 && deltaY > 0 ) {
                            e.preventDefault();
                        }
                    });
                }

                _this.detectItemVisibility(_this.state.selectedIdx);

                _this.utils.triggerCallback('Open', _this);
            }
        },

        /** Close the select options box */
        close: function() {
            var _this = this;

            _this.utils.triggerCallback('BeforeClose', _this);

            _this.change();

            // Remove custom events on document
            $doc.off(bindSufix);

            // Remove visible class to hide options box
            _this.elements.outerWrapper.removeClass(_this.classes.open);

            _this.state.opened = false;

            _this.utils.triggerCallback('Close', _this);
        },

        /** Select current option and change the label */
        change: function() {
            var _this = this;

            _this.utils.triggerCallback('BeforeChange', _this);

            if ( _this.state.currValue !== _this.state.selectedIdx ) {
                // Apply changed value to original select
                _this.$element
                    .prop('selectedIndex', _this.state.currValue = _this.state.selectedIdx)
                    .data('value', _this.lookupItems[_this.state.selectedIdx].text);

                // Change label text
                _this.setLabel();
            }

            _this.utils.triggerCallback('Change', _this);
        },

        /**
         * Select option
         *
         * @param {number}  index - Index of the option that will be selected
         * @param {boolean} close - Close the options box after selecting
         */
        select: function(index, close) {
            var _this = this;

            // Parameter index is required
            if ( index === undefined ) {
                return;
            }

            // If element is disabled, can't select it
            if ( !_this.lookupItems[index].disabled ) {
                _this.$li.filter('[data-index]')
                    .removeClass('selected')
                    .eq(_this.state.selectedIdx = index)
                    .addClass('selected');

                _this.detectItemVisibility(index);

                // If 'close' is false (default), the options box won't close after
                // each selected item, this is necessary for keyboard navigation
                if ( close ) {
                    _this.close();
                }
            }
        },

        /**
         * Unbind and remove
         *
         * @param {boolean} preserveData - Check if the data on the element should be removed too
         */
        destroy: function(preserveData) {
            var _this = this;

            if ( _this.state && _this.state.enabled ) {
                _this.elements.items.add(_this.elements.wrapper).add(_this.elements.input).remove();

                if ( !preserveData ) {
                    _this.$element.removeData(pluginName).removeData('value');
                }

                _this.$element.prop('tabindex', _this.originalTabindex).off(bindSufix).off(_this.eventTriggers).unwrap().unwrap();

                _this.state.enabled = false;
            }
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function(args) {
        return this.each(function() {
            var data = $.data(this, pluginName);

            if ( data && !data.disableOnMobile ) {
                (typeof args === 'string' && data[args]) ? data[args]() : data.init(args);
            } else {
                $.data(this, pluginName, new Selectric(this, args));
            }
        });
    };

    /**
     * Hooks for the callbacks
     *
     * @type {object}
     */
    $.fn[pluginName].hooks = {
        /**
         * @param {string} callbackName - The callback name.
         * @param {string}     hookName - The name of the hook to be attached.
         * @param {function}         fn - Callback function.
         */
        add: function(callbackName, hookName, fn) {
            if ( !this[callbackName] ) {
                this[callbackName] = {};
            }

            this[callbackName][hookName] = fn;
        },

        /**
         * @param {string} callbackName - The callback name.
         * @param {string}     hookName - The name of the hook that will be removed.
         */
        remove: function(callbackName, hookName) {
            delete this[callbackName][hookName];
        }
    };

    /**
     * Default plugin options
     *
     * @type {object}
     */
    $.fn[pluginName].defaults = {
        onChange: function(elm) { $(elm).change(); },
        maxHeight: 300,
        keySearchTimeout: 500,
        arrowButtonMarkup: '<b class="button">&#x25be;</b>',
        disableOnMobile: true,
        openOnHover: false,
        hoverIntentTimeout: 500,
        expandToItemText: false,
        responsive: false,
        preventWindowScroll: true,
        inheritOriginalWidth: false,
        allowWrap: true,
        customClass: {
            prefix: pluginName,
            camelCase: false
        },
        optionsItemBuilder: '{text}', // function(itemData, element, index)
        labelBuilder: '{text}' // function(currItem)
    };
}));

/*!
 * Pikaday
 *
 * Copyright © 2014 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory)
{
    'use strict';

    var moment;
    if (typeof exports === 'object') {
        // CommonJS module
        // Load moment.js as an optional dependency
        try { moment = require('moment'); } catch (e) {}
        module.exports = factory(moment);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function (req)
        {
            // Load moment.js as an optional dependency
            var id = 'moment';
            try { moment = req(id); } catch (e) {}
            return factory(moment);
        });
    } else {
        root.Pikaday = factory(root.moment);
    }
}(this, function (moment)
{
    'use strict';

    /**
     * feature detection and helper functions
     */
    var hasMoment = typeof moment === 'function',

        hasEventListeners = !!window.addEventListener,

        document = window.document,

        sto = window.setTimeout,

        addEvent = function(el, e, callback, capture)
        {
            if (hasEventListeners) {
                el.addEventListener(e, callback, !!capture);
            } else {
                el.attachEvent('on' + e, callback);
            }
        },

        removeEvent = function(el, e, callback, capture)
        {
            if (hasEventListeners) {
                el.removeEventListener(e, callback, !!capture);
            } else {
                el.detachEvent('on' + e, callback);
            }
        },

        fireEvent = function(el, eventName, data)
        {
            var ev;

            if (document.createEvent) {
                ev = document.createEvent('HTMLEvents');
                ev.initEvent(eventName, true, false);
                ev = extend(ev, data);
                el.dispatchEvent(ev);
            } else if (document.createEventObject) {
                ev = document.createEventObject();
                ev = extend(ev, data);
                el.fireEvent('on' + eventName, ev);
            }
        },

        trim = function(str)
        {
            return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
        },

        hasClass = function(el, cn)
        {
            return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
        },

        addClass = function(el, cn)
        {
            if (!hasClass(el, cn)) {
                el.className = (el.className === '') ? cn : el.className + ' ' + cn;
            }
        },

        removeClass = function(el, cn)
        {
            el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
        },

        isArray = function(obj)
        {
            return (/Array/).test(Object.prototype.toString.call(obj));
        },

        isDate = function(obj)
        {
            return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
        },

        isWeekend = function(date)
        {
            var day = date.getDay();
            return day === 0 || day === 6;
        },

        isLeapYear = function(year)
        {
            // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
            return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
        },

        getDaysInMonth = function(year, month)
        {
            return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },

        setToStartOfDay = function(date)
        {
            if (isDate(date)) date.setHours(0,0,0,0);
        },

        compareDates = function(a,b)
        {
            // weak date comparison (use setToStartOfDay(date) to ensure correct result)
            return a.getTime() === b.getTime();
        },

        extend = function(to, from, overwrite)
        {
            var prop, hasProp;
            for (prop in from) {
                hasProp = to[prop] !== undefined;
                if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
                    if (isDate(from[prop])) {
                        if (overwrite) {
                            to[prop] = new Date(from[prop].getTime());
                        }
                    }
                    else if (isArray(from[prop])) {
                        if (overwrite) {
                            to[prop] = from[prop].slice(0);
                        }
                    } else {
                        to[prop] = extend({}, from[prop], overwrite);
                    }
                } else if (overwrite || !hasProp) {
                    to[prop] = from[prop];
                }
            }
            return to;
        },

        adjustCalendar = function(calendar) {
            if (calendar.month < 0) {
                calendar.year -= Math.ceil(Math.abs(calendar.month)/12);
                calendar.month += 12;
            }
            if (calendar.month > 11) {
                calendar.year += Math.floor(Math.abs(calendar.month)/12);
                calendar.month -= 12;
            }
            return calendar;
        },

        /**
         * defaults and localisation
         */
        defaults = {

            // bind the picker to a form field
            field: null,

            // automatically show/hide the picker on `field` focus (default `true` if `field` is set)
            bound: undefined,

            // position of the datepicker, relative to the field (default to bottom & left)
            // ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
            position: 'bottom left',

            // automatically fit in the viewport even if it means repositioning from the position option
            reposition: true,

            // the default output format for `.toString()` and `field` value
            format: 'YYYY-MM-DD',

            // the initial date to view when first opened
            defaultDate: null,

            // make the `defaultDate` the initial selected value
            setDefaultDate: false,

            // first day of week (0: Sunday, 1: Monday etc)
            firstDay: 0,

            // the default flag for moment's strict date parsing
            formatStrict: false,

            // the minimum/earliest date that can be selected
            minDate: null,
            // the maximum/latest date that can be selected
            maxDate: null,

            // number of years either side, or array of upper/lower range
            yearRange: 10,

            // show week numbers at head of row
            showWeekNumber: false,

            // used internally (don't config outside)
            minYear: 0,
            maxYear: 9999,
            minMonth: undefined,
            maxMonth: undefined,

            startRange: null,
            endRange: null,

            isRTL: false,

            // Additional text to append to the year in the calendar title
            yearSuffix: '',

            // Render the month after year in the calendar title
            showMonthAfterYear: false,

            // Render days of the calendar grid that fall in the next or previous month
            showDaysInNextAndPreviousMonths: false,

            // how many months are visible
            numberOfMonths: 1,

            // when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
            // only used for the first display or when a selected date is not visible
            mainCalendar: 'left',

            // Specify a DOM element to render the calendar in
            container: undefined,

            // internationalization
            i18n: {
                previousMonth : 'Previous Month',
                nextMonth     : 'Next Month',
                months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
                weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
            },

            // Theme Classname
            theme: null,

            // callback function
            onSelect: null,
            onOpen: null,
            onClose: null,
            onDraw: null
        },


        /**
         * templating functions to abstract HTML rendering
         */
        renderDayName = function(opts, day, abbr)
        {
            day += opts.firstDay;
            while (day >= 7) {
                day -= 7;
            }
            return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
        },

        renderDay = function(opts)
        {
            var arr = [];
            if (opts.isEmpty) {
                if (opts.showDaysInNextAndPreviousMonths) {
                    arr.push('is-outside-current-month');
                } else {
                    return '<td class="is-empty"></td>';
                }
            }
            if (opts.isDisabled) {
                arr.push('is-disabled');
            }
            if (opts.isToday) {
                arr.push('is-today');
            }
            if (opts.isSelected) {
                arr.push('is-selected');
            }
            if (opts.isInRange) {
                arr.push('is-inrange');
            }
            if (opts.isStartRange) {
                arr.push('is-startrange');
            }
            if (opts.isEndRange) {
                arr.push('is-endrange');
            }
            return '<td data-day="' + opts.day + '" class="' + arr.join(' ') + '">' +
                '<button class="pika-button pika-day" type="button" ' +
                'data-pika-year="' + opts.year + '" data-pika-month="' + opts.month + '" data-pika-day="' + opts.day + '">' +
                opts.day +
                '</button>' +
                '</td>';
        },

        renderWeek = function (d, m, y) {
            // Lifted from http://javascript.about.com/library/blweekyear.htm, lightly modified.
            var onejan = new Date(y, 0, 1),
                weekNum = Math.ceil((((new Date(y, m, d) - onejan) / 86400000) + onejan.getDay()+1)/7);
            return '<td class="pika-week">' + weekNum + '</td>';
        },

        renderRow = function(days, isRTL)
        {
            return '<tr>' + (isRTL ? days.reverse() : days).join('') + '</tr>';
        },

        renderBody = function(rows)
        {
            return '<tbody>' + rows.join('') + '</tbody>';
        },

        renderHead = function(opts)
        {
            var i, arr = [];
            if (opts.showWeekNumber) {
                arr.push('<th></th>');
            }
            for (i = 0; i < 7; i++) {
                arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
            }
            return '<thead><tr>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tr></thead>';
        },

        renderTitle = function(instance, c, year, month, refYear)
        {
            var i, j, arr,
                opts = instance._o,
                isMinYear = year === opts.minYear,
                isMaxYear = year === opts.maxYear,
                html = '<div class="pika-title">',
                monthHtml,
                yearHtml,
                prev = true,
                next = true;

            for (arr = [], i = 0; i < 12; i++) {
                arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
                    (i === month ? ' selected="selected"': '') +
                    ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled="disabled"' : '') + '>' +
                    opts.i18n.months[i] + '</option>');
            }
            monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month" tabindex="-1">' + arr.join('') + '</select></div>';

            if (isArray(opts.yearRange)) {
                i = opts.yearRange[0];
                j = opts.yearRange[1] + 1;
            } else {
                i = year - opts.yearRange;
                j = 1 + year + opts.yearRange;
            }

            for (arr = []; i < j && i <= opts.maxYear; i++) {
                if (i >= opts.minYear) {
                    arr.push('<option value="' + i + '"' + (i === year ? ' selected="selected"': '') + '>' + (i) + '</option>');
                }
            }
            yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year" tabindex="-1">' + arr.join('') + '</select></div>';

            if (opts.showMonthAfterYear) {
                html += yearHtml + monthHtml;
            } else {
                html += monthHtml + yearHtml;
            }

            if (isMinYear && (month === 0 || opts.minMonth >= month)) {
                prev = false;
            }

            if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
                next = false;
            }

            if (c === 0) {
                html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
            }
            if (c === (instance._o.numberOfMonths - 1) ) {
                html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';
            }

            return html += '</div>';
        },

        renderTable = function(opts, data)
        {
            return '<table cellpadding="0" cellspacing="0" class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
        },


        /**
         * Pikaday constructor
         */
        Pikaday = function(options)
        {
            var self = this,
                opts = self.config(options);

            self._onMouseDown = function(e)
            {
                if (!self._v) {
                    return;
                }
                e = e || window.event;
                var target = e.target || e.srcElement;
                if (!target) {
                    return;
                }

                if (!hasClass(target, 'is-disabled')) {
                    if (hasClass(target, 'pika-button') && !hasClass(target, 'is-empty') && !hasClass(target.parentNode, 'is-disabled')) {
                        self.setDate(new Date(target.getAttribute('data-pika-year'), target.getAttribute('data-pika-month'), target.getAttribute('data-pika-day')));
                        if (opts.bound) {
                            sto(function() {
                                self.hide();
                                if (opts.field) {
                                    opts.field.blur();
                                }
                            }, 100);
                        }
                    }
                    else if (hasClass(target, 'pika-prev')) {
                        self.prevMonth();
                    }
                    else if (hasClass(target, 'pika-next')) {
                        self.nextMonth();
                    }
                }
                if (!hasClass(target, 'pika-select')) {
                    // if this is touch event prevent mouse events emulation
                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;
                        return false;
                    }
                } else {
                    self._c = true;
                }
            };

            self._onChange = function(e)
            {
                e = e || window.event;
                var target = e.target || e.srcElement;
                if (!target) {
                    return;
                }
                if (hasClass(target, 'pika-select-month')) {
                    self.gotoMonth(target.value);
                }
                else if (hasClass(target, 'pika-select-year')) {
                    self.gotoYear(target.value);
                }
            };

            self._onInputChange = function(e)
            {
                var date;

                if (e.firedBy === self) {
                    return;
                }
                if (hasMoment) {
                    date = moment(opts.field.value, opts.format, opts.formatStrict);
                    date = (date && date.isValid()) ? date.toDate() : null;
                }
                else {
                    date = new Date(Date.parse(opts.field.value));
                }
                if (isDate(date)) {
                    self.setDate(date);
                }
                if (!self._v) {
                    self.show();
                }
            };

            self._onInputFocus = function()
            {
                self.show();
            };

            self._onInputClick = function()
            {
                self.show();
            };

            self._onInputBlur = function()
            {
                // IE allows pika div to gain focus; catch blur the input field
                var pEl = document.activeElement;
                do {
                    if (hasClass(pEl, 'pika-single')) {
                        return;
                    }
                }
                while ((pEl = pEl.parentNode));

                if (!self._c) {
                    self._b = sto(function() {
                        self.hide();
                    }, 50);
                }
                self._c = false;
            };

            self._onClick = function(e)
            {
                e = e || window.event;
                var target = e.target || e.srcElement,
                    pEl = target;
                if (!target) {
                    return;
                }
                if (!hasEventListeners && hasClass(target, 'pika-select')) {
                    if (!target.onchange) {
                        target.setAttribute('onchange', 'return;');
                        addEvent(target, 'change', self._onChange);
                    }
                }
                do {
                    if (hasClass(pEl, 'pika-single') || pEl === opts.trigger) {
                        return;
                    }
                }
                while ((pEl = pEl.parentNode));
                if (self._v && target !== opts.trigger && pEl !== opts.trigger) {
                    self.hide();
                }
            };

            self.el = document.createElement('div');
            self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '') + (opts.theme ? ' ' + opts.theme : '');

            addEvent(self.el, 'mousedown', self._onMouseDown, true);
            addEvent(self.el, 'touchend', self._onMouseDown, true);
            addEvent(self.el, 'change', self._onChange);

            if (opts.field) {
                if (opts.container) {
                    opts.container.appendChild(self.el);
                } else if (opts.bound) {
                    document.body.appendChild(self.el);
                } else {
                    opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
                }
                addEvent(opts.field, 'change', self._onInputChange);

                if (!opts.defaultDate) {
                    if (hasMoment && opts.field.value) {
                        opts.defaultDate = moment(opts.field.value, opts.format).toDate();
                    } else {
                        opts.defaultDate = new Date(Date.parse(opts.field.value));
                    }
                    opts.setDefaultDate = true;
                }
            }

            var defDate = opts.defaultDate;

            if (isDate(defDate)) {
                if (opts.setDefaultDate) {
                    self.setDate(defDate, true);
                } else {
                    self.gotoDate(defDate);
                }
            } else {
                self.gotoDate(new Date());
            }

            if (opts.bound) {
                this.hide();
                self.el.className += ' is-bound';
                addEvent(opts.trigger, 'click', self._onInputClick);
                addEvent(opts.trigger, 'focus', self._onInputFocus);
                addEvent(opts.trigger, 'blur', self._onInputBlur);
            } else {
                this.show();
            }
        };


    /**
     * public Pikaday API
     */
    Pikaday.prototype = {


        /**
         * configure functionality
         */
        config: function(options)
        {
            if (!this._o) {
                this._o = extend({}, defaults, true);
            }

            var opts = extend(this._o, options, true);

            opts.isRTL = !!opts.isRTL;

            opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

            opts.theme = (typeof opts.theme) === 'string' && opts.theme ? opts.theme : null;

            opts.bound = !!(opts.bound !== undefined ? opts.field && opts.bound : opts.field);

            opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

            opts.disableWeekends = !!opts.disableWeekends;

            opts.disableDayFn = (typeof opts.disableDayFn) === 'function' ? opts.disableDayFn : null;

            var nom = parseInt(opts.numberOfMonths, 10) || 1;
            opts.numberOfMonths = nom > 4 ? 4 : nom;

            if (!isDate(opts.minDate)) {
                opts.minDate = false;
            }
            if (!isDate(opts.maxDate)) {
                opts.maxDate = false;
            }
            if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
                opts.maxDate = opts.minDate = false;
            }
            if (opts.minDate) {
                this.setMinDate(opts.minDate);
            }
            if (opts.maxDate) {
                this.setMaxDate(opts.maxDate);
            }

            if (isArray(opts.yearRange)) {
                var fallback = new Date().getFullYear() - 10;
                opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
                opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
            } else {
                opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
                if (opts.yearRange > 100) {
                    opts.yearRange = 100;
                }
            }

            return opts;
        },

        /**
         * return a formatted string of the current selection (using Moment.js if available)
         */
        toString: function(format)
        {
            return !isDate(this._d) ? '' : hasMoment ? moment(this._d).format(format || this._o.format) : this._d.toDateString();
        },

        /**
         * return a Moment.js object of the current selection (if available)
         */
        getMoment: function()
        {
            return hasMoment ? moment(this._d) : null;
        },

        /**
         * set the current selection from a Moment.js object (if available)
         */
        setMoment: function(date, preventOnSelect)
        {
            if (hasMoment && moment.isMoment(date)) {
                this.setDate(date.toDate(), preventOnSelect);
            }
        },

        /**
         * return a Date object of the current selection
         */
        getDate: function()
        {
            return isDate(this._d) ? new Date(this._d.getTime()) : null;
        },

        /**
         * set the current selection
         */
        setDate: function(date, preventOnSelect)
        {
            if (!date) {
                this._d = null;

                if (this._o.field) {
                    this._o.field.value = '';
                    fireEvent(this._o.field, 'change', { firedBy: this });
                }

                return this.draw();
            }
            if (typeof date === 'string') {
                date = new Date(Date.parse(date));
            }
            if (!isDate(date)) {
                return;
            }

            var min = this._o.minDate,
                max = this._o.maxDate;

            if (isDate(min) && date < min) {
                date = min;
            } else if (isDate(max) && date > max) {
                date = max;
            }

            this._d = new Date(date.getTime());
            setToStartOfDay(this._d);
            this.gotoDate(this._d);

            if (this._o.field) {
                this._o.field.value = this.toString();
                fireEvent(this._o.field, 'change', { firedBy: this });
            }
            if (!preventOnSelect && typeof this._o.onSelect === 'function') {
                this._o.onSelect.call(this, this.getDate());
            }
        },

        /**
         * change view to a specific date
         */
        gotoDate: function(date)
        {
            var newCalendar = true;

            if (!isDate(date)) {
                return;
            }

            if (this.calendars) {
                var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
                    lastVisibleDate = new Date(this.calendars[this.calendars.length-1].year, this.calendars[this.calendars.length-1].month, 1),
                    visibleDate = date.getTime();
                // get the end of the month
                lastVisibleDate.setMonth(lastVisibleDate.getMonth()+1);
                lastVisibleDate.setDate(lastVisibleDate.getDate()-1);
                newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
            }

            if (newCalendar) {
                this.calendars = [{
                    month: date.getMonth(),
                    year: date.getFullYear()
                }];
                if (this._o.mainCalendar === 'right') {
                    this.calendars[0].month += 1 - this._o.numberOfMonths;
                }
            }

            this.adjustCalendars();
        },

        adjustCalendars: function() {
            this.calendars[0] = adjustCalendar(this.calendars[0]);
            for (var c = 1; c < this._o.numberOfMonths; c++) {
                this.calendars[c] = adjustCalendar({
                    month: this.calendars[0].month + c,
                    year: this.calendars[0].year
                });
            }
            this.draw();
        },

        gotoToday: function()
        {
            this.gotoDate(new Date());
        },

        /**
         * change view to a specific month (zero-index, e.g. 0: January)
         */
        gotoMonth: function(month)
        {
            if (!isNaN(month)) {
                this.calendars[0].month = parseInt(month, 10);
                this.adjustCalendars();
            }
        },

        nextMonth: function()
        {
            this.calendars[0].month++;
            this.adjustCalendars();
        },

        prevMonth: function()
        {
            this.calendars[0].month--;
            this.adjustCalendars();
        },

        /**
         * change view to a specific full year (e.g. "2012")
         */
        gotoYear: function(year)
        {
            if (!isNaN(year)) {
                this.calendars[0].year = parseInt(year, 10);
                this.adjustCalendars();
            }
        },

        /**
         * change the minDate
         */
        setMinDate: function(value)
        {
            if(value instanceof Date) {
                setToStartOfDay(value);
                this._o.minDate = value;
                this._o.minYear  = value.getFullYear();
                this._o.minMonth = value.getMonth();
            } else {
                this._o.minDate = defaults.minDate;
                this._o.minYear  = defaults.minYear;
                this._o.minMonth = defaults.minMonth;
                this._o.startRange = defaults.startRange;
            }

            this.draw();
        },

        /**
         * change the maxDate
         */
        setMaxDate: function(value)
        {
            if(value instanceof Date) {
                setToStartOfDay(value);
                this._o.maxDate = value;
                this._o.maxYear = value.getFullYear();
                this._o.maxMonth = value.getMonth();
            } else {
                this._o.maxDate = defaults.maxDate;
                this._o.maxYear = defaults.maxYear;
                this._o.maxMonth = defaults.maxMonth;
                this._o.endRange = defaults.endRange;
            }

            this.draw();
        },

        setStartRange: function(value)
        {
            this._o.startRange = value;
        },

        setEndRange: function(value)
        {
            this._o.endRange = value;
        },

        /**
         * refresh the HTML
         */
        draw: function(force)
        {
            if (!this._v && !force) {
                return;
            }
            var opts = this._o,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth,
                html = '';

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            for (var c = 0; c < opts.numberOfMonths; c++) {
                html += '<div class="pika-lendar">' + renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year) + this.render(this.calendars[c].year, this.calendars[c].month) + '</div>';
            }

            this.el.innerHTML = html;

            if (opts.bound) {
                if(opts.field.type !== 'hidden') {
                    sto(function() {
                        opts.trigger.focus();
                    }, 1);
                }
            }

            if (typeof this._o.onDraw === 'function') {
                this._o.onDraw(this);
            }
        },

        adjustPosition: function()
        {
            var field, pEl, width, height, viewportWidth, viewportHeight, scrollTop, left, top, clientRect;

            if (this._o.container) return;

            this.el.style.position = 'absolute';

            field = this._o.trigger;
            pEl = field;
            width = this.el.offsetWidth;
            height = this.el.offsetHeight;
            viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

            if (typeof field.getBoundingClientRect === 'function') {
                clientRect = field.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top  = pEl.offsetTop + pEl.offsetHeight;
                while((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top  += pEl.offsetTop;
                }
            }

            // default position is bottom & left
            if ((this._o.reposition && left + width > viewportWidth) ||
                (
                    this._o.position.indexOf('right') > -1 &&
                    left - width + field.offsetWidth > 0
                )
            ) {
                left = left - width + field.offsetWidth;
            }
            if ((this._o.reposition && top + height > viewportHeight + scrollTop) ||
                (
                    this._o.position.indexOf('top') > -1 &&
                    top - height - field.offsetHeight > 0
                )
            ) {
                top = top - height - field.offsetHeight;
            }

            this.el.style.left = left + 'px';
            this.el.style.top = top + 'px';
        },

        /**
         * render HTML for a particular month
         */
        render: function(year, month)
        {
            var opts   = this._o,
                now    = new Date(),
                days   = getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data   = [],
                row    = [];
            setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }
            var previousMonth = month === 0 ? 11 : month - 1,
                nextMonth = month === 11 ? 0 : month + 1,
                yearOfPreviousMonth = month === 0 ? year - 1 : year,
                yearOfNextMonth = month === 11 ? year + 1 : year,
                daysInPreviousMonth = getDaysInMonth(yearOfPreviousMonth, previousMonth);
            var cells = days + before,
                after = cells;
            while(after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            for (var i = 0, r = 0; i < cells; i++)
            {
                var day = new Date(year, month, 1 + (i - before)),
                    isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
                    isToday = compareDates(day, now),
                    isEmpty = i < before || i >= (days + before),
                    dayNumber = 1 + (i - before),
                    monthNumber = month,
                    yearNumber = year,
                    isStartRange = opts.startRange && compareDates(opts.startRange, day),
                    isEndRange = opts.endRange && compareDates(opts.endRange, day),
                    isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
                    isDisabled = (opts.minDate && day < opts.minDate) ||
                        (opts.maxDate && day > opts.maxDate) ||
                        (opts.disableWeekends && isWeekend(day)) ||
                        (opts.disableDayFn && opts.disableDayFn(day));

                if (isEmpty) {
                    if (i < before) {
                        dayNumber = daysInPreviousMonth + dayNumber;
                        monthNumber = previousMonth;
                        yearNumber = yearOfPreviousMonth;
                    } else {
                        dayNumber = dayNumber - days;
                        monthNumber = nextMonth;
                        yearNumber = yearOfNextMonth;
                    }
                }

                var dayConfig = {
                    day: dayNumber,
                    month: monthNumber,
                    year: yearNumber,
                    isSelected: isSelected,
                    isToday: isToday,
                    isDisabled: isDisabled,
                    isEmpty: isEmpty,
                    isStartRange: isStartRange,
                    isEndRange: isEndRange,
                    isInRange: isInRange,
                    showDaysInNextAndPreviousMonths: opts.showDaysInNextAndPreviousMonths
                };

                row.push(renderDay(dayConfig));

                if (++r === 7) {
                    if (opts.showWeekNumber) {
                        row.unshift(renderWeek(i - before, month, year));
                    }
                    data.push(renderRow(row, opts.isRTL));
                    row = [];
                    r = 0;
                }
            }
            return renderTable(opts, data);
        },

        isVisible: function()
        {
            return this._v;
        },

        show: function()
        {
            if (!this._v) {
                removeClass(this.el, 'is-hidden');
                this._v = true;
                this.draw();
                if (this._o.bound) {
                    addEvent(document, 'click', this._onClick);
                    this.adjustPosition();
                }
                if (typeof this._o.onOpen === 'function') {
                    this._o.onOpen.call(this);
                }
            }
        },

        hide: function()
        {
            var v = this._v;
            if (v !== false) {
                if (this._o.bound) {
                    removeEvent(document, 'click', this._onClick);
                }
                this.el.style.position = 'static'; // reset
                this.el.style.left = 'auto';
                this.el.style.top = 'auto';
                addClass(this.el, 'is-hidden');
                this._v = false;
                if (v !== undefined && typeof this._o.onClose === 'function') {
                    this._o.onClose.call(this);
                }
            }
        },

        /**
         * GAME OVER
         */
        destroy: function()
        {
            this.hide();
            removeEvent(this.el, 'mousedown', this._onMouseDown, true);
            removeEvent(this.el, 'touchend', this._onMouseDown, true);
            removeEvent(this.el, 'change', this._onChange);
            if (this._o.field) {
                removeEvent(this._o.field, 'change', this._onInputChange);
                if (this._o.bound) {
                    removeEvent(this._o.trigger, 'click', this._onInputClick);
                    removeEvent(this._o.trigger, 'focus', this._onInputFocus);
                    removeEvent(this._o.trigger, 'blur', this._onInputBlur);
                }
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

    };

    return Pikaday;

}));

