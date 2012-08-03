var Core = require('Core');
var Element = Core.Element;
var Elements = Core.Elements;

var DynamicMatcher = require('DynamicMatcher');

var UI = module.exports = new DynamicMatcher;

UI.BackButton = require('./Elements/BackButton');
UI.ActionButton = require('./Elements/ActionButton');
UI.Title = require('./Elements/Title');

var Handlebars = require('Handlebars');

var locked = false;
var isVisible = false;

var preventDefault = function(event) {
  event.preventDefault();
};

Object.append(UI, {

  render: function(name, data) {
    if (!data) data = '';
    return Handlebars.templates[name](typeof data == 'string' ? {content: data} : data);
  },

  transition: function(container, previous, current, options) {
    var isImmediate = options && options.immediate;
    var direction = (options && options.direction) || 'right';
    var oppositeDirection = (direction == 'right' ? 'left' : 'right');
    var onTransitionEnd = options && options.onTransitionEnd;

    if (current) {
      if (!isImmediate) current.addClass(direction);
      container.adopt(current);

      current.transition({immediate: isImmediate}, function() {
        if (onTransitionEnd) onTransitionEnd();
      });
    }

    if (previous) {
      if (isImmediate) previous.dispose();
      else previous.transition(function() {
        this.dispose();
      });
    }

    (function() {
      if (previous) previous.addClass(oppositeDirection);
      if (current) current.removeClass(direction);
    }).delay(50, this); // Use a higher delay to account for DOM insertion delays

    this.update(container);
  },

  highlight: function(element) {
    element = document.id(element);
    if (!element || this.isHighlighted(element)) return;

    element.addClass('selected');
    var parent = element.getParent('li');
    if (!parent) return;

    var lists = parent.getSiblings().getElements('a.selected');
    Elements.removeClass(lists.flatten(), 'selected');
  },

  unhighlight: function(element) {
    element = document.id(element);
    if (element && this.isHighlighted(element)) element.removeClass('selected');
  },

  isHighlighted: function(element) {
    return document.id(element).hasClass('selected'); // oh no, state management!
  },

  disable: function(container, exception) {
    if (!container) container = document.body;

    container.addEvent('touchmove', preventDefault)
      .addClass('disable-events');

    if (exception) exception.addClass('enable-events');
  },

  enable: function(container, exception) {
    if (!container) container = document.body;

    container.removeEvent('touchmove', preventDefault)
      .removeClass('disable-events');

    if (exception) exception.removeClass('enable-events');
  },

  showChrome: function(options) {
    if (isVisible) return;
    isVisible = true;

    var main = document.id('ui');
    var login = document.id('login');
    var splash = document.id('splash');

    main.show();
    login.transition(options);
    splash.transition(options, function() {
      document.body.removeClass('chrome-invisible').addClass('chrome-visible');
      login.hide();
      splash.hide();
    });

    (function() {
      login.addClass('fade');
      splash.addClass('fade');
    }).delay(50);
  },

  hideChrome: function(options) {
    if (!isVisible) return;
    isVisible = false;

    var main = document.id('ui');
    var login = document.id('login');
    var splash = document.id('splash');

    login.show().transition(options);
    splash.show().transition(options, function() {
      document.body.removeClass('chrome-visible').addClass('chrome-invisible');
      document.getElements('footer a.selected').removeClass('selected');
      main.hide();
    });

    (function() {
      login.removeClass('fade');
      splash.removeClass('fade');
    }).delay(50);
  }

});
